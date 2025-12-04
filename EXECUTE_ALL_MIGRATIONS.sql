-- ================================================
-- EXÉCUTION COMPLÈTE DE TOUTES LES MIGRATIONS
-- ================================================
-- Ce script exécute toutes les migrations dans le bon ordre
-- pour éviter les conflits et erreurs

-- ================================================
-- ÉTAPE 1: NETTOYAGE DES CONFLITS
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'ÉTAPE 1: Nettoyage des conflits...';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- Supprimer toutes les versions de get_cart_total
DROP FUNCTION IF EXISTS get_cart_total(UUID);
DROP FUNCTION IF EXISTS get_cart_total(UUID, OUT INTEGER, OUT DECIMAL);

-- Recréer la fonction avec la bonne signature
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS TABLE (
  item_count INTEGER,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CAST(COUNT(*) AS INTEGER) as item_count,
    CAST(COALESCE(SUM(c.quantity * p.price), 0) AS DECIMAL) as total_amount
  FROM cart c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '✓ Conflits résolus';
END $$;

-- ================================================
-- ÉTAPE 2: SYSTÈME DE RÔLES ADMIN
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'ÉTAPE 2: Système de rôles admin...';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- Ajouter la colonne role si elle n'existe pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin'));

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Fonction pour promouvoir un utilisateur en admin
CREATE OR REPLACE FUNCTION make_user_admin(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non trouvé');
  END IF;

  UPDATE profiles SET role = 'admin' WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Utilisateur promu administrateur');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour promouvoir par email
CREATE OR REPLACE FUNCTION make_admin_by_email(p_email VARCHAR)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aucun utilisateur trouvé avec cet email');
  END IF;

  UPDATE profiles SET role = 'admin' WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'message', 'Utilisateur ' || p_email || ' promu administrateur', 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer les droits admin
CREATE OR REPLACE FUNCTION remove_admin_role(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  UPDATE profiles SET role = 'user' WHERE id = p_user_id;
  RETURN json_build_object('success', true, 'message', 'Droits administrateur retirés');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour lister les admins
CREATE OR REPLACE VIEW admin_users AS
SELECT
  p.id,
  p.full_name,
  p.phone,
  p.role,
  p.created_at,
  au.email,
  au.last_sign_in_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- Table pour logger les connexions admin
CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_login_logs_admin ON admin_login_logs(admin_id);

DO $$
BEGIN
  RAISE NOTICE '✓ Système de rôles admin créé';
END $$;

-- ================================================
-- ÉTAPE 3: SYSTÈME D'ABONNEMENTS
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'ÉTAPE 3: Système d''abonnements...';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- Colonnes pour le statut d'approbation
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'rejected', 'expired')),
  ADD COLUMN IF NOT EXISTS subscription_requested_plan VARCHAR(20),
  ADD COLUMN IF NOT EXISTS subscription_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_billing_period VARCHAR(10) CHECK (subscription_billing_period IN ('monthly', 'yearly'));

-- Table pour l'historique des demandes
CREATE TABLE IF NOT EXISTS subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL,
  billing_period VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);

-- Fonction pour demander un abonnement
CREATE OR REPLACE FUNCTION request_subscription(
  p_user_id UUID,
  p_plan_type VARCHAR,
  p_billing_period VARCHAR
)
RETURNS JSON AS $$
BEGIN
  INSERT INTO subscription_requests (user_id, plan_type, billing_period, status)
  VALUES (p_user_id, p_plan_type, p_billing_period, 'pending');

  UPDATE profiles
  SET subscription_status = 'pending',
      subscription_requested_plan = p_plan_type,
      subscription_requested_at = NOW(),
      subscription_billing_period = p_billing_period
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Demande d''abonnement envoyée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour approuver
CREATE OR REPLACE FUNCTION approve_subscription_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_request FROM subscription_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Demande non trouvée');
  END IF;

  IF v_request.billing_period = 'monthly' THEN
    v_end_date := NOW() + INTERVAL '1 month';
  ELSE
    v_end_date := NOW() + INTERVAL '1 year';
  END IF;

  UPDATE profiles
  SET subscription_plan = v_request.plan_type,
      subscription_status = 'active',
      subscription_start_date = NOW(),
      subscription_end_date = v_end_date,
      subscription_requested_plan = NULL,
      subscription_requested_at = NULL
  WHERE id = v_request.user_id;

  UPDATE subscription_requests
  SET status = 'approved',
      processed_at = NOW(),
      processed_by = p_admin_id,
      admin_notes = p_admin_notes
  WHERE id = p_request_id;

  RETURN json_build_object('success', true, 'message', 'Abonnement approuvé');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rejeter
CREATE OR REPLACE FUNCTION reject_subscription_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM subscription_requests WHERE id = p_request_id;

  UPDATE profiles
  SET subscription_status = 'active',
      subscription_requested_plan = NULL,
      subscription_requested_at = NULL,
      subscription_billing_period = NULL
  WHERE id = v_user_id;

  UPDATE subscription_requests
  SET status = 'rejected',
      processed_at = NOW(),
      processed_by = p_admin_id,
      admin_notes = p_admin_notes
  WHERE id = p_request_id;

  RETURN json_build_object('success', true, 'message', 'Demande rejetée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '✓ Système d''abonnements créé';
END $$;

-- ================================================
-- ÉTAPE 4: POLITIQUES RLS
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'ÉTAPE 4: Politiques de sécurité RLS...';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- Les admins peuvent gérer les subscription_requests
DROP POLICY IF EXISTS "Admins can manage subscription requests" ON subscription_requests;
CREATE POLICY "Admins can manage subscription requests"
ON subscription_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Les admins peuvent voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DO $$
BEGIN
  RAISE NOTICE '✓ Politiques RLS configurées';
END $$;

-- ================================================
-- ÉTAPE 5: SYSTÈME D'IDENTIFIANTS ADMIN SPÉCIAUX
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'ÉTAPE 5: Identifiants admin spéciaux...';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- Ajouter colonnes pour identifiant admin
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_identifier VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_pin VARCHAR(255);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_admin_identifier ON profiles(admin_identifier) WHERE admin_identifier IS NOT NULL;

-- Table pour stocker les identifiants
CREATE TABLE IF NOT EXISTS admin_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier VARCHAR(50) NOT NULL UNIQUE,
  pin_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_admin_identifier UNIQUE(identifier)
);

CREATE INDEX IF NOT EXISTS idx_admin_identifiers_admin_id ON admin_identifiers(admin_id);

-- Fonction pour créer un identifiant admin
CREATE OR REPLACE FUNCTION create_admin_identifier(
  p_admin_email VARCHAR,
  p_identifier VARCHAR,
  p_pin VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_pin_hash VARCHAR(255);
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = p_admin_email;

  IF v_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin non trouvé');
  END IF;

  IF EXISTS (SELECT 1 FROM admin_identifiers WHERE identifier = p_identifier) THEN
    RETURN json_build_object('success', false, 'error', 'Identifiant existe déjà');
  END IF;

  IF p_pin IS NOT NULL THEN
    v_pin_hash := crypt(p_pin, gen_salt('bf'));
  END IF;

  INSERT INTO admin_identifiers (admin_id, identifier, pin_hash)
  VALUES (v_admin_id, p_identifier, v_pin_hash);

  UPDATE profiles SET admin_identifier = p_identifier, admin_pin = v_pin_hash WHERE id = v_admin_id;

  RETURN json_build_object('success', true, 'message', 'Identifiant créé', 'identifier', p_identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier un identifiant
CREATE OR REPLACE FUNCTION verify_admin_identifier(
  p_identifier VARCHAR,
  p_pin VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT ai.admin_id, ai.identifier, ai.pin_hash, ai.is_active, p.full_name, au.email
  INTO v_record
  FROM admin_identifiers ai
  JOIN profiles p ON p.id = ai.admin_id
  JOIN auth.users au ON au.id = ai.admin_id
  WHERE ai.identifier = p_identifier;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Identifiant invalide');
  END IF;

  IF NOT v_record.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Identifiant désactivé');
  END IF;

  IF v_record.pin_hash IS NOT NULL THEN
    IF p_pin IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'PIN requis', 'requires_pin', true);
    END IF;
    IF v_record.pin_hash != crypt(p_pin, v_record.pin_hash) THEN
      RETURN json_build_object('success', false, 'error', 'PIN incorrect');
    END IF;
  END IF;

  UPDATE admin_identifiers SET last_used_at = NOW() WHERE identifier = p_identifier;

  RETURN json_build_object('success', true, 'admin_id', v_record.admin_id, 'email', v_record.email, 'full_name', v_record.full_name, 'identifier', v_record.identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer un identifiant auto
CREATE OR REPLACE FUNCTION generate_admin_identifier()
RETURNS VARCHAR AS $$
DECLARE
  v_identifier VARCHAR(50);
  v_counter INTEGER := 1;
  v_year VARCHAR(4);
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::VARCHAR;

  LOOP
    v_identifier := 'ADM' || v_year || LPAD(v_counter::VARCHAR, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM admin_identifiers WHERE identifier = v_identifier) THEN
      RETURN v_identifier;
    END IF;
    v_counter := v_counter + 1;
    IF v_counter > 9999 THEN
      RAISE EXCEPTION 'Impossible de générer un identifiant unique';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer un admin complet avec identifiant
CREATE OR REPLACE FUNCTION create_admin_with_identifier(
  p_email VARCHAR,
  p_full_name VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_custom_identifier VARCHAR DEFAULT NULL,
  p_pin VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_identifier VARCHAR(50);
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = p_email;

  IF v_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Créez d''abord un compte utilisateur');
  END IF;

  UPDATE profiles SET role = 'admin', full_name = COALESCE(p_full_name, full_name), phone = COALESCE(p_phone, phone) WHERE id = v_admin_id;

  IF p_custom_identifier IS NOT NULL THEN
    v_identifier := p_custom_identifier;
  ELSE
    v_identifier := generate_admin_identifier();
  END IF;

  RETURN create_admin_identifier(p_email, v_identifier, p_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour lister les identifiants
CREATE OR REPLACE VIEW admin_identifiers_list AS
SELECT
  ai.id,
  ai.identifier,
  ai.is_active,
  ai.created_at,
  ai.last_used_at,
  p.full_name,
  p.phone,
  au.email,
  CASE WHEN ai.pin_hash IS NOT NULL THEN true ELSE false END as has_pin
FROM admin_identifiers ai
JOIN profiles p ON p.id = ai.admin_id
JOIN auth.users au ON au.id = ai.admin_id
ORDER BY ai.created_at DESC;

-- RLS
ALTER TABLE admin_identifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view identifiers"
ON admin_identifiers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DO $$
BEGIN
  RAISE NOTICE '✓ Système d''identifiants admin créé';
END $$;

-- ================================================
-- RÉSUMÉ FINAL
-- ================================================

DO $$
DECLARE
  total_admins INTEGER;
  total_requests INTEGER;
  total_identifiers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_admins FROM profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO total_requests FROM subscription_requests;
  SELECT COUNT(*) INTO total_identifiers FROM admin_identifiers WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION COMPLÈTE RÉUSSIE !';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques:';
  RAISE NOTICE '   • Admins: %', total_admins;
  RAISE NOTICE '   • Identifiants admin: %', total_identifiers;
  RAISE NOTICE '   • Demandes d''abonnement: %', total_requests;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes:';
  RAISE NOTICE '   1. Créer le premier admin avec identifiant:';
  RAISE NOTICE '';
  RAISE NOTICE '      SELECT create_admin_with_identifier(';
  RAISE NOTICE '        ''admin@senepanda.com'',';
  RAISE NOTICE '        ''Admin Principal'',';
  RAISE NOTICE '        ''+221 77 123 4567'',';
  RAISE NOTICE '        NULL,           -- Auto: ADM20250001';
  RAISE NOTICE '        ''1234''        -- PIN';
  RAISE NOTICE '      );';
  RAISE NOTICE '';
  RAISE NOTICE '   2. Notez l''identifiant retourné (ex: ADM20250001)';
  RAISE NOTICE '';
  RAISE NOTICE '   3. Connectez-vous sur /admin/login avec:';
  RAISE NOTICE '      • Identifiant: ADM20250001';
  RAISE NOTICE '      • PIN: 1234';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;
