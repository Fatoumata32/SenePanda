-- ================================================
-- CONFIGURATION RAPIDE ADMIN - TOUT EN UN
-- ================================================
-- Ce script fait tout en une seule exécution:
-- 1. Ajoute les colonnes nécessaires
-- 2. Crée les fonctions
-- 3. Crée un admin de test

-- ================================================
-- ÉTAPE 1: AJOUTER COLONNES
-- ================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_pin_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS admin_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin'));

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_admin_phone ON profiles(admin_phone) WHERE admin_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ================================================
-- ÉTAPE 2: TABLE DE LOGS
-- ================================================

CREATE TABLE IF NOT EXISTS admin_phone_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_phone_login_attempts_phone ON admin_phone_login_attempts(phone);
CREATE INDEX IF NOT EXISTS idx_admin_phone_login_attempts_date ON admin_phone_login_attempts(attempted_at DESC);

-- ================================================
-- ÉTAPE 3: FONCTION CRÉER ADMIN
-- ================================================

CREATE OR REPLACE FUNCTION create_admin_with_phone(
  p_email VARCHAR,
  p_phone VARCHAR,
  p_pin VARCHAR,
  p_full_name VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_pin_hash VARCHAR(255);
  v_clean_phone VARCHAR(20);
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  IF v_clean_phone !~ '^\+221[0-9]{9}$' THEN
    RETURN json_build_object('success', false, 'error', 'Format du téléphone invalide. Format attendu: +221781234567');
  END IF;

  IF LENGTH(p_pin) != 6 OR p_pin !~ '^[0-9]{6}$' THEN
    RETURN json_build_object('success', false, 'error', 'Le PIN doit contenir exactement 6 chiffres');
  END IF;

  SELECT id INTO v_admin_id FROM auth.users WHERE email = p_email;

  IF v_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aucun utilisateur trouvé avec cet email. Créez d''abord un compte.');
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE admin_phone = v_clean_phone AND id != v_admin_id) THEN
    RETURN json_build_object('success', false, 'error', 'Ce numéro de téléphone est déjà utilisé par un autre admin');
  END IF;

  v_pin_hash := crypt(p_pin, gen_salt('bf'));

  UPDATE profiles
  SET
    role = 'admin',
    admin_phone = v_clean_phone,
    admin_pin_hash = v_pin_hash,
    admin_enabled = true,
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(v_clean_phone, phone)
  WHERE id = v_admin_id;

  RETURN json_build_object('success', true, 'message', 'Admin créé avec succès', 'phone', v_clean_phone, 'admin_id', v_admin_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 4: FONCTION VÉRIFIER LOGIN
-- ================================================

CREATE OR REPLACE FUNCTION verify_admin_phone_login(
  p_phone VARCHAR,
  p_pin VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_record RECORD;
  v_clean_phone VARCHAR(20);
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  SELECT p.id, p.admin_phone, p.admin_pin_hash, p.admin_enabled, p.role, p.full_name, au.email
  INTO v_record
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.admin_phone = v_clean_phone;

  INSERT INTO admin_phone_login_attempts (phone, success, ip_address, user_agent)
  VALUES (v_clean_phone, false, p_ip_address, p_user_agent);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Numéro de téléphone invalide');
  END IF;

  IF v_record.role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Ce compte n''est pas un compte administrateur');
  END IF;

  IF NOT v_record.admin_enabled THEN
    RETURN json_build_object('success', false, 'error', 'Ce compte admin est désactivé');
  END IF;

  IF v_record.admin_pin_hash != crypt(p_pin, v_record.admin_pin_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Code PIN incorrect');
  END IF;

  UPDATE admin_phone_login_attempts
  SET success = true
  WHERE phone = v_clean_phone AND attempted_at = (SELECT MAX(attempted_at) FROM admin_phone_login_attempts WHERE phone = v_clean_phone);

  RETURN json_build_object('success', true, 'admin_id', v_record.id, 'email', v_record.email, 'full_name', v_record.full_name, 'phone', v_record.admin_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 5: VUE LISTE ADMINS
-- ================================================

CREATE OR REPLACE VIEW admin_phones_list AS
SELECT
  p.id,
  p.admin_phone,
  p.full_name,
  p.role,
  p.admin_enabled,
  au.email,
  p.created_at,
  au.last_sign_in_at,
  (SELECT COUNT(*) FROM admin_phone_login_attempts apla WHERE apla.phone = p.admin_phone AND apla.success = true) as total_logins,
  (SELECT MAX(attempted_at) FROM admin_phone_login_attempts apla WHERE apla.phone = p.admin_phone AND apla.success = true) as last_login_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.admin_phone IS NOT NULL
ORDER BY p.created_at DESC;

-- ================================================
-- ÉTAPE 6: POLITIQUES RLS
-- ================================================

ALTER TABLE admin_phone_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view login attempts" ON admin_phone_login_attempts;
CREATE POLICY "Only admins can view login attempts"
ON admin_phone_login_attempts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ================================================
-- RÉSUMÉ
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ CONFIGURATION ADMIN TERMINÉE !';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Créer un compte utilisateur via l''app web';
  RAISE NOTICE '   Email: admin@senepanda.com';
  RAISE NOTICE '   Password: VotreMotDePasse';
  RAISE NOTICE '';
  RAISE NOTICE '2. Promouvoir en admin:';
  RAISE NOTICE '   SELECT create_admin_with_phone(';
  RAISE NOTICE '     ''admin@senepanda.com'',';
  RAISE NOTICE '     ''+221781234567'',';
  RAISE NOTICE '     ''123456'',';
  RAISE NOTICE '     ''Admin Principal''';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '3. Se connecter sur /admin/login';
  RAISE NOTICE '   Téléphone: +221781234567';
  RAISE NOTICE '   PIN: 123456';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;
