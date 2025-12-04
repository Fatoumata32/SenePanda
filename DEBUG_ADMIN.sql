-- ================================================
-- SCRIPT DE DEBUG COMPLET
-- ================================================
-- Exécutez ce script pour voir exactement ce qui ne va pas

-- ================================================
-- 1. VÉRIFIER LA TABLE PROFILES
-- ================================================

-- Colonnes disponibles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('role', 'admin_phone', 'admin_pin_hash', 'admin_enabled')
ORDER BY column_name;

-- Résultat attendu: 4 colonnes
-- | column_name    | data_type         | is_nullable |
-- |----------------|-------------------|-------------|
-- | admin_enabled  | boolean           | YES         |
-- | admin_phone    | character varying | YES         |
-- | admin_pin_hash | character varying | YES         |
-- | role           | character varying | YES         |


-- ================================================
-- 2. VÉRIFIER L'ADMIN CRÉÉ
-- ================================================

-- Données complètes de l'admin
SELECT
  p.id,
  p.full_name,
  p.admin_phone,
  p.role,
  p.admin_enabled,
  p.admin_pin_hash IS NOT NULL as has_pin,
  au.email,
  au.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.admin_phone = '+221781234568'
   OR au.email = 'adminqqqq@senepanda.com';

-- Ce que vous devez voir:
-- | id   | full_name       | admin_phone   | role  | admin_enabled | has_pin | email                   | email_confirmed_at |
-- |------|-----------------|---------------|-------|---------------|---------|-------------------------|--------------------|
-- | uuid | Admin Principal | +221781234568 | admin | true          | true    | adminqqqq@senepanda.com | 2025-11-30         |


-- ================================================
-- 3. VÉRIFIER LES FONCTIONS
-- ================================================

-- Liste des fonctions admin
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%admin%phone%'
ORDER BY routine_name;

-- Résultat attendu:
-- | routine_name               | routine_type | data_type |
-- |----------------------------|--------------|-----------|
-- | change_admin_pin           | FUNCTION     | json      |
-- | create_admin_with_phone    | FUNCTION     | json      |
-- | disable_admin_phone        | FUNCTION     | json      |
-- | enable_admin_phone         | FUNCTION     | json      |
-- | verify_admin_phone_login   | FUNCTION     | json      |


-- ================================================
-- 4. TEST DÉTAILLÉ DU LOGIN
-- ================================================

-- Test étape par étape
DO $$
DECLARE
  v_phone VARCHAR(20) := '+221781234568';
  v_pin VARCHAR(6) := '123456';
  v_clean_phone VARCHAR(20);
  v_record RECORD;
  v_pin_valid BOOLEAN;
BEGIN
  -- Nettoyer le téléphone
  v_clean_phone := REGEXP_REPLACE(v_phone, '[^+0-9]', '', 'g');
  RAISE NOTICE 'Téléphone nettoyé: %', v_clean_phone;

  -- Chercher l'admin
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

  IF NOT FOUND THEN
    RAISE NOTICE '❌ ERREUR: Admin non trouvé avec le téléphone %', v_clean_phone;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Admin trouvé: %', v_record.full_name;
  RAISE NOTICE '  - ID: %', v_record.id;
  RAISE NOTICE '  - Email: %', v_record.email;
  RAISE NOTICE '  - Role: %', v_record.role;
  RAISE NOTICE '  - Enabled: %', v_record.admin_enabled;
  RAISE NOTICE '  - Has PIN: %', (v_record.admin_pin_hash IS NOT NULL);

  -- Vérifier le rôle
  IF v_record.role IS NULL THEN
    RAISE NOTICE '❌ PROBLÈME: La colonne role est NULL';
    RAISE NOTICE '   Solution: UPDATE profiles SET role = ''admin'' WHERE admin_phone = ''%'';', v_clean_phone;
    RETURN;
  END IF;

  IF v_record.role != 'admin' THEN
    RAISE NOTICE '❌ PROBLÈME: Role = ''%'' (attendu: ''admin'')', v_record.role;
    RAISE NOTICE '   Solution: UPDATE profiles SET role = ''admin'' WHERE admin_phone = ''%'';', v_clean_phone;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Role correct: admin';

  -- Vérifier enabled
  IF NOT v_record.admin_enabled THEN
    RAISE NOTICE '❌ PROBLÈME: Admin désactivé';
    RAISE NOTICE '   Solution: UPDATE profiles SET admin_enabled = true WHERE admin_phone = ''%'';', v_clean_phone;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Admin activé';

  -- Vérifier le PIN
  IF v_record.admin_pin_hash IS NULL THEN
    RAISE NOTICE '❌ PROBLÈME: Aucun PIN défini';
    RAISE NOTICE '   Solution: UPDATE profiles SET admin_pin_hash = crypt(''%'', gen_salt(''bf'')) WHERE admin_phone = ''%'';', v_pin, v_clean_phone;
    RETURN;
  END IF;

  v_pin_valid := (v_record.admin_pin_hash = crypt(v_pin, v_record.admin_pin_hash));

  IF NOT v_pin_valid THEN
    RAISE NOTICE '❌ PROBLÈME: PIN incorrect';
    RAISE NOTICE '   Solution: UPDATE profiles SET admin_pin_hash = crypt(''%'', gen_salt(''bf'')) WHERE admin_phone = ''%'';', v_pin, v_clean_phone;
    RETURN;
  END IF;

  RAISE NOTICE '✓ PIN valide';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ TOUT EST CORRECT !';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Vous devriez pouvoir vous connecter avec:';
  RAISE NOTICE '  Téléphone: %', v_phone;
  RAISE NOTICE '  PIN: %', v_pin;

END $$;


-- ================================================
-- 5. VOIR LES LOGS DE CONNEXION
-- ================================================

SELECT
  phone,
  success,
  attempted_at,
  ip_address
FROM admin_phone_login_attempts
WHERE phone = '+221781234568'
ORDER BY attempted_at DESC
LIMIT 5;


-- ================================================
-- 6. SOLUTION RAPIDE SI PROBLÈME
-- ================================================

/*
Si le debug montre un problème, utilisez cette commande pour tout corriger:

UPDATE profiles
SET
  role = 'admin',
  admin_enabled = true,
  admin_pin_hash = crypt('123456', gen_salt('bf'))
WHERE admin_phone = '+221781234568';

Puis retestez:
SELECT verify_admin_phone_login('+221781234568', '123456');
*/
