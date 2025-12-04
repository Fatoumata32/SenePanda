-- ================================================
-- SYSTÈME D'IDENTIFIANT SPÉCIAL ADMIN
-- ================================================
-- Permet aux admins de se connecter avec un identifiant unique
-- au lieu d'un email classique

-- ================================================
-- ÉTAPE 1: AJOUTER COLONNES POUR IDENTIFIANT ADMIN
-- ================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_identifier VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_pin VARCHAR(255);

-- Index pour performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_admin_identifier ON profiles(admin_identifier) WHERE admin_identifier IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN profiles.admin_identifier IS 'Identifiant unique pour la connexion admin (ex: ADM001, ADMIN2025, etc.)';
COMMENT ON COLUMN profiles.admin_pin IS 'PIN haché pour la connexion admin (optionnel)';

-- ================================================
-- ÉTAPE 2: TABLE POUR STOCKER LES IDENTIFIANTS ADMIN
-- ================================================

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

-- Index
CREATE INDEX IF NOT EXISTS idx_admin_identifiers_admin_id ON admin_identifiers(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_identifiers_identifier ON admin_identifiers(identifier);

-- ================================================
-- ÉTAPE 3: FONCTION POUR CRÉER UN IDENTIFIANT ADMIN
-- ================================================

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
  -- Trouver l'admin par email
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = p_admin_email;

  IF v_admin_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Admin non trouvé avec cet email'
    );
  END IF;

  -- Vérifier que c'est bien un admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cet utilisateur n''est pas administrateur'
    );
  END IF;

  -- Vérifier que l'identifiant n'existe pas déjà
  IF EXISTS (SELECT 1 FROM admin_identifiers WHERE identifier = p_identifier) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cet identifiant existe déjà'
    );
  END IF;

  -- Hacher le PIN si fourni (utilisation simple de crypt)
  IF p_pin IS NOT NULL THEN
    v_pin_hash := crypt(p_pin, gen_salt('bf'));
  END IF;

  -- Créer l'identifiant
  INSERT INTO admin_identifiers (admin_id, identifier, pin_hash)
  VALUES (v_admin_id, p_identifier, v_pin_hash);

  -- Mettre à jour le profil
  UPDATE profiles
  SET admin_identifier = p_identifier,
      admin_pin = v_pin_hash
  WHERE id = v_admin_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Identifiant admin créé avec succès',
    'identifier', p_identifier,
    'admin_id', v_admin_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 4: FONCTION POUR VÉRIFIER L'IDENTIFIANT
-- ================================================

CREATE OR REPLACE FUNCTION verify_admin_identifier(
  p_identifier VARCHAR,
  p_pin VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_record RECORD;
  v_pin_valid BOOLEAN := false;
BEGIN
  -- Chercher l'identifiant
  SELECT
    ai.admin_id,
    ai.identifier,
    ai.pin_hash,
    ai.is_active,
    p.full_name,
    au.email
  INTO v_record
  FROM admin_identifiers ai
  JOIN profiles p ON p.id = ai.admin_id
  JOIN auth.users au ON au.id = ai.admin_id
  WHERE ai.identifier = p_identifier;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Identifiant invalide'
    );
  END IF;

  IF NOT v_record.is_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Identifiant désactivé'
    );
  END IF;

  -- Vérifier le PIN si fourni
  IF v_record.pin_hash IS NOT NULL THEN
    IF p_pin IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'PIN requis',
        'requires_pin', true
      );
    END IF;

    v_pin_valid := (v_record.pin_hash = crypt(p_pin, v_record.pin_hash));

    IF NOT v_pin_valid THEN
      RETURN json_build_object(
        'success', false,
        'error', 'PIN incorrect'
      );
    END IF;
  END IF;

  -- Mettre à jour la dernière utilisation
  UPDATE admin_identifiers
  SET last_used_at = NOW()
  WHERE identifier = p_identifier;

  RETURN json_build_object(
    'success', true,
    'admin_id', v_record.admin_id,
    'email', v_record.email,
    'full_name', v_record.full_name,
    'identifier', v_record.identifier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 5: FONCTION POUR GÉNÉRER UN IDENTIFIANT AUTO
-- ================================================

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

    -- Vérifier si l'identifiant existe
    IF NOT EXISTS (SELECT 1 FROM admin_identifiers WHERE identifier = v_identifier) THEN
      RETURN v_identifier;
    END IF;

    v_counter := v_counter + 1;

    -- Limite de sécurité
    IF v_counter > 9999 THEN
      RAISE EXCEPTION 'Impossible de générer un identifiant unique';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ÉTAPE 6: FONCTION POUR CRÉER UN ADMIN COMPLET
-- ================================================

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
  v_result JSON;
BEGIN
  -- Chercher si l'utilisateur existe
  SELECT id INTO v_admin_id FROM auth.users WHERE email = p_email;

  IF v_admin_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun utilisateur trouvé avec cet email. Créez d''abord un compte utilisateur.'
    );
  END IF;

  -- Promouvoir en admin
  UPDATE profiles
  SET role = 'admin',
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone)
  WHERE id = v_admin_id;

  -- Générer ou utiliser l'identifiant
  IF p_custom_identifier IS NOT NULL THEN
    v_identifier := p_custom_identifier;
  ELSE
    v_identifier := generate_admin_identifier();
  END IF;

  -- Créer l'identifiant
  SELECT create_admin_identifier(p_email, v_identifier, p_pin) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 7: FONCTION POUR DÉSACTIVER UN IDENTIFIANT
-- ================================================

CREATE OR REPLACE FUNCTION deactivate_admin_identifier(p_identifier VARCHAR)
RETURNS JSON AS $$
BEGIN
  UPDATE admin_identifiers
  SET is_active = false
  WHERE identifier = p_identifier;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Identifiant non trouvé');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Identifiant désactivé');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 8: VUE POUR LISTER LES IDENTIFIANTS ADMIN
-- ================================================

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
  CASE
    WHEN ai.pin_hash IS NOT NULL THEN true
    ELSE false
  END as has_pin
FROM admin_identifiers ai
JOIN profiles p ON p.id = ai.admin_id
JOIN auth.users au ON au.id = ai.admin_id
ORDER BY ai.created_at DESC;

-- ================================================
-- ÉTAPE 9: POLITIQUES RLS
-- ================================================

-- Activer RLS sur admin_identifiers
ALTER TABLE admin_identifiers ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les identifiants
CREATE POLICY "Only admins can view identifiers"
ON admin_identifiers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Seuls les admins peuvent créer des identifiants
CREATE POLICY "Only admins can create identifiers"
ON admin_identifiers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ================================================

COMMENT ON TABLE admin_identifiers IS 'Table des identifiants spéciaux pour la connexion admin';
COMMENT ON FUNCTION create_admin_identifier IS 'Créer un identifiant spécial pour un admin existant';
COMMENT ON FUNCTION verify_admin_identifier IS 'Vérifier un identifiant admin et son PIN';
COMMENT ON FUNCTION generate_admin_identifier IS 'Générer automatiquement un identifiant unique (format: ADM20250001)';
COMMENT ON FUNCTION create_admin_with_identifier IS 'Créer un admin complet avec identifiant';
COMMENT ON FUNCTION deactivate_admin_identifier IS 'Désactiver un identifiant admin';

-- ================================================
-- EXEMPLES D'UTILISATION
-- ================================================

/*
-- 1. CRÉER UN ADMIN AVEC IDENTIFIANT AUTO-GÉNÉRÉ
SELECT create_admin_with_identifier(
  'admin@senepanda.com',        -- Email
  'Admin Principal',             -- Nom complet
  '+221 77 123 4567',           -- Téléphone
  NULL,                          -- Identifiant auto (ADM20250001)
  '1234'                         -- PIN (4 chiffres)
);

-- 2. CRÉER UN ADMIN AVEC IDENTIFIANT PERSONNALISÉ
SELECT create_admin_with_identifier(
  'admin2@senepanda.com',
  'Admin Secondaire',
  '+221 77 987 6543',
  'ADMIN2025',                   -- Identifiant custom
  '5678'
);

-- 3. AJOUTER UN IDENTIFIANT À UN ADMIN EXISTANT
SELECT create_admin_identifier(
  'admin@senepanda.com',
  'ADM001',
  '9999'
);

-- 4. VÉRIFIER UN IDENTIFIANT
SELECT verify_admin_identifier('ADM20250001', '1234');

-- Résultat:
-- {
--   "success": true,
--   "admin_id": "uuid...",
--   "email": "admin@senepanda.com",
--   "full_name": "Admin Principal",
--   "identifier": "ADM20250001"
-- }

-- 5. LISTER TOUS LES IDENTIFIANTS ADMIN
SELECT * FROM admin_identifiers_list;

-- 6. DÉSACTIVER UN IDENTIFIANT
SELECT deactivate_admin_identifier('ADM20250001');
*/
