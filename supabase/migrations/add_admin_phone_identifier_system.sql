-- ================================================
-- SYSTÈME D'IDENTIFIANT ADMIN PAR NUMÉRO DE TÉLÉPHONE
-- ================================================
-- Les admins se connectent avec leur numéro de téléphone au format: +221781234567
-- et un code PIN à 4 chiffres

-- ================================================
-- ÉTAPE 1: AJOUTER COLONNES POUR IDENTIFIANT TÉLÉPHONE
-- ================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_pin_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS admin_enabled BOOLEAN DEFAULT false;

-- Index pour performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_admin_phone ON profiles(admin_phone) WHERE admin_phone IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN profiles.admin_phone IS 'Numéro de téléphone pour connexion admin (format: +221781234567)';
COMMENT ON COLUMN profiles.admin_pin_hash IS 'Code PIN haché (6 chiffres exactement)';
COMMENT ON COLUMN profiles.admin_enabled IS 'Si true, peut se connecter en tant qu''admin';

-- ================================================
-- ÉTAPE 2: TABLE POUR LOGGER LES TENTATIVES DE CONNEXION
-- ================================================

CREATE TABLE IF NOT EXISTS admin_phone_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_admin_phone_login_attempts_phone ON admin_phone_login_attempts(phone);
CREATE INDEX IF NOT EXISTS idx_admin_phone_login_attempts_date ON admin_phone_login_attempts(attempted_at DESC);

-- ================================================
-- ÉTAPE 3: FONCTION POUR CRÉER UN ADMIN AVEC TÉLÉPHONE
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
  -- Nettoyer le numéro de téléphone (enlever espaces, tirets)
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  -- Valider le format du téléphone (+221 suivi de 9 chiffres)
  IF v_clean_phone !~ '^\+221[0-9]{9}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Format du téléphone invalide. Format attendu: +221781234567'
    );
  END IF;

  -- Valider le PIN (exactement 6 chiffres)
  IF LENGTH(p_pin) != 6 OR p_pin !~ '^[0-9]{6}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Le PIN doit contenir exactement 6 chiffres'
    );
  END IF;

  -- Chercher l'utilisateur par email
  SELECT id INTO v_admin_id FROM auth.users WHERE email = p_email;

  IF v_admin_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun utilisateur trouvé avec cet email. Créez d''abord un compte.'
    );
  END IF;

  -- Vérifier si le téléphone n'est pas déjà utilisé
  IF EXISTS (SELECT 1 FROM profiles WHERE admin_phone = v_clean_phone AND id != v_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce numéro de téléphone est déjà utilisé par un autre admin'
    );
  END IF;

  -- Hacher le PIN
  v_pin_hash := crypt(p_pin, gen_salt('bf'));

  -- Mettre à jour le profil
  UPDATE profiles
  SET
    role = 'admin',
    admin_phone = v_clean_phone,
    admin_pin_hash = v_pin_hash,
    admin_enabled = true,
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(v_clean_phone, phone)
  WHERE id = v_admin_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Admin créé avec succès',
    'phone', v_clean_phone,
    'admin_id', v_admin_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 4: FONCTION POUR VÉRIFIER LE LOGIN ADMIN
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
  v_pin_valid BOOLEAN := false;
BEGIN
  -- Nettoyer le numéro de téléphone
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  -- Chercher l'admin par téléphone
  SELECT
    p.id,
    p.admin_phone,
    p.admin_pin_hash,
    p.admin_enabled,
    p.role,
    p.full_name,
    au.email
  INTO v_record
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.admin_phone = v_clean_phone;

  -- Logger la tentative
  INSERT INTO admin_phone_login_attempts (phone, success, ip_address, user_agent)
  VALUES (v_clean_phone, false, p_ip_address, p_user_agent);

  -- Vérifications
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Numéro de téléphone invalide'
    );
  END IF;

  IF v_record.role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce compte n''est pas un compte administrateur'
    );
  END IF;

  IF NOT v_record.admin_enabled THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce compte admin est désactivé'
    );
  END IF;

  -- Vérifier le PIN
  v_pin_valid := (v_record.admin_pin_hash = crypt(p_pin, v_record.admin_pin_hash));

  IF NOT v_pin_valid THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code PIN incorrect'
    );
  END IF;

  -- Succès - Mettre à jour le log
  UPDATE admin_phone_login_attempts
  SET success = true
  WHERE phone = v_clean_phone
    AND attempted_at = (SELECT MAX(attempted_at) FROM admin_phone_login_attempts WHERE phone = v_clean_phone);

  RETURN json_build_object(
    'success', true,
    'admin_id', v_record.id,
    'email', v_record.email,
    'full_name', v_record.full_name,
    'phone', v_record.admin_phone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 5: FONCTION POUR CHANGER LE PIN
-- ================================================

CREATE OR REPLACE FUNCTION change_admin_pin(
  p_phone VARCHAR,
  p_old_pin VARCHAR,
  p_new_pin VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_record RECORD;
  v_clean_phone VARCHAR(20);
  v_new_pin_hash VARCHAR(255);
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  -- Valider le nouveau PIN
  IF LENGTH(p_new_pin) != 6 OR p_new_pin !~ '^[0-9]{6}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Le nouveau PIN doit contenir exactement 6 chiffres'
    );
  END IF;

  -- Chercher l'admin
  SELECT id, admin_pin_hash INTO v_record
  FROM profiles
  WHERE admin_phone = v_clean_phone;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Numéro de téléphone invalide'
    );
  END IF;

  -- Vérifier l'ancien PIN
  IF v_record.admin_pin_hash != crypt(p_old_pin, v_record.admin_pin_hash) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ancien PIN incorrect'
    );
  END IF;

  -- Mettre à jour avec le nouveau PIN
  v_new_pin_hash := crypt(p_new_pin, gen_salt('bf'));

  UPDATE profiles
  SET admin_pin_hash = v_new_pin_hash
  WHERE id = v_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'PIN modifié avec succès'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 6: FONCTION POUR DÉSACTIVER UN ADMIN
-- ================================================

CREATE OR REPLACE FUNCTION disable_admin_phone(p_phone VARCHAR)
RETURNS JSON AS $$
DECLARE
  v_clean_phone VARCHAR(20);
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  UPDATE profiles
  SET admin_enabled = false
  WHERE admin_phone = v_clean_phone;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Numéro de téléphone non trouvé'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Admin désactivé'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réactiver
CREATE OR REPLACE FUNCTION enable_admin_phone(p_phone VARCHAR)
RETURNS JSON AS $$
DECLARE
  v_clean_phone VARCHAR(20);
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^+0-9]', '', 'g');

  UPDATE profiles
  SET admin_enabled = true
  WHERE admin_phone = v_clean_phone;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Numéro non trouvé');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Admin réactivé');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 7: VUE POUR LISTER LES ADMINS PAR TÉLÉPHONE
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
  (
    SELECT COUNT(*)
    FROM admin_phone_login_attempts apla
    WHERE apla.phone = p.admin_phone AND apla.success = true
  ) as total_logins,
  (
    SELECT MAX(attempted_at)
    FROM admin_phone_login_attempts apla
    WHERE apla.phone = p.admin_phone AND apla.success = true
  ) as last_login_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.admin_phone IS NOT NULL
ORDER BY p.created_at DESC;

-- ================================================
-- ÉTAPE 8: POLITIQUES RLS
-- ================================================

-- Activer RLS sur la table de logs
ALTER TABLE admin_phone_login_attempts ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les logs
CREATE POLICY "Only admins can view login attempts"
ON admin_phone_login_attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- COMMENTAIRES
-- ================================================

COMMENT ON FUNCTION create_admin_with_phone IS 'Créer un admin avec numéro de téléphone et PIN (format: +221781234567)';
COMMENT ON FUNCTION verify_admin_phone_login IS 'Vérifier le login admin par téléphone + PIN';
COMMENT ON FUNCTION change_admin_pin IS 'Changer le PIN d''un admin';
COMMENT ON FUNCTION disable_admin_phone IS 'Désactiver un admin';
COMMENT ON FUNCTION enable_admin_phone IS 'Réactiver un admin';
COMMENT ON TABLE admin_phone_login_attempts IS 'Historique des tentatives de connexion admin par téléphone';

-- ================================================
-- EXEMPLES D'UTILISATION
-- ================================================

/*
-- 1. CRÉER UN ADMIN AVEC SON TÉLÉPHONE
SELECT create_admin_with_phone(
  'admin@senepanda.com',        -- Email du compte existant
  '+221781234567',               -- Numéro de téléphone
  '123456',                      -- Code PIN (exactement 6 chiffres)
  'Admin Principal'              -- Nom complet (optionnel)
);

-- Résultat attendu:
-- {
--   "success": true,
--   "message": "Admin créé avec succès",
--   "phone": "+221781234567",
--   "admin_id": "uuid..."
-- }


-- 2. VÉRIFIER LE LOGIN (appelé par l'interface)
SELECT verify_admin_phone_login(
  '+221 78 123 45 67',    -- Format avec espaces accepté
  '123456'                 -- PIN (6 chiffres)
);

-- Résultat si correct:
-- {
--   "success": true,
--   "admin_id": "uuid...",
--   "email": "admin@senepanda.com",
--   "full_name": "Admin Principal",
--   "phone": "+221781234567"
-- }


-- 3. LISTER TOUS LES ADMINS
SELECT * FROM admin_phones_list;


-- 4. CHANGER LE PIN
SELECT change_admin_pin(
  '+221781234567',    -- Téléphone
  '123456',           -- Ancien PIN
  '654321'            -- Nouveau PIN
);


-- 5. DÉSACTIVER UN ADMIN
SELECT disable_admin_phone('+221781234567');


-- 6. RÉACTIVER UN ADMIN
SELECT enable_admin_phone('+221781234567');


-- 7. STATISTIQUES DES CONNEXIONS
SELECT
  phone,
  COUNT(*) as total_tentatives,
  COUNT(*) FILTER (WHERE success = true) as reussies,
  COUNT(*) FILTER (WHERE success = false) as echouees,
  MAX(attempted_at) FILTER (WHERE success = true) as derniere_connexion
FROM admin_phone_login_attempts
GROUP BY phone
ORDER BY derniere_connexion DESC;


-- 8. TENTATIVES ÉCHOUÉES RÉCENTES (sécurité)
SELECT
  phone,
  attempted_at,
  ip_address
FROM admin_phone_login_attempts
WHERE success = false
  AND attempted_at > NOW() - INTERVAL '1 hour'
ORDER BY attempted_at DESC;
*/
