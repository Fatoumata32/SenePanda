-- ================================================
-- AUTO-FIX ADMIN - Diagnostic + Correction Automatique
-- ================================================
-- Ce script détecte et corrige automatiquement le problème
-- Exécutez-le dans Supabase SQL Editor

-- ================================================
-- PARTIE 1: DIAGNOSTIC
-- ================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_admin_exists BOOLEAN;
  v_role_value VARCHAR(20);
  v_admin_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNOSTIC ADMIN';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';

  -- Vérifier si la colonne role existe
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✓ Colonne role existe';
  ELSE
    RAISE NOTICE '❌ Colonne role MANQUANTE - sera créée';
  END IF;

  -- Vérifier si l'admin existe
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE admin_phone = '+221781234568'
  ) INTO v_admin_exists;

  IF v_admin_exists THEN
    RAISE NOTICE '✓ Admin trouvé avec le téléphone +221781234568';

    -- Récupérer le rôle actuel
    IF v_column_exists THEN
      SELECT role, id INTO v_role_value, v_admin_id
      FROM profiles
      WHERE admin_phone = '+221781234568';

      IF v_role_value IS NULL THEN
        RAISE NOTICE '❌ Role = NULL - sera défini à admin';
      ELSIF v_role_value != 'admin' THEN
        RAISE NOTICE '❌ Role = % (attendu: admin) - sera corrigé', v_role_value;
      ELSE
        RAISE NOTICE '✓ Role = admin (correct)';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '❌ AUCUN admin trouvé avec le téléphone +221781234568';
    RAISE NOTICE '   Vérifiez que create_admin_with_phone a été exécuté';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🔧 CORRECTION AUTOMATIQUE';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';

END $$;

-- ================================================
-- PARTIE 2: CORRECTION AUTOMATIQUE
-- ================================================

-- Étape 1: Créer la colonne role si elle n'existe pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin'));

-- Étape 2: Créer l'index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Étape 3: Mettre à jour l'admin
UPDATE profiles
SET
  role = 'admin',
  admin_enabled = true
WHERE admin_phone = '+221781234568';

-- Étape 4: S'assurer que le PIN est bien défini
UPDATE profiles
SET admin_pin_hash = crypt('123456', gen_salt('bf'))
WHERE admin_phone = '+221781234568'
  AND (admin_pin_hash IS NULL OR admin_pin_hash = '');

-- ================================================
-- PARTIE 3: VÉRIFICATION POST-CORRECTION
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ VÉRIFICATION POST-CORRECTION';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Afficher les données de l'admin
SELECT
  '✓ PROFIL ADMIN' as check_type,
  p.id,
  p.full_name,
  p.admin_phone,
  p.role,
  p.admin_enabled,
  p.admin_pin_hash IS NOT NULL as has_pin,
  au.email
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.admin_phone = '+221781234568';

-- ================================================
-- PARTIE 4: TEST DE LOGIN
-- ================================================

-- Tester la fonction de login
SELECT '✓ TEST LOGIN' as check_type, verify_admin_phone_login('+221781234568', '123456') as result;

-- ================================================
-- RÉSUMÉ FINAL
-- ================================================

DO $$
DECLARE
  v_login_result JSON;
  v_success BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';

  -- Tester le login
  SELECT verify_admin_phone_login('+221781234568', '123456') INTO v_login_result;
  v_success := (v_login_result->>'success')::BOOLEAN;

  IF v_success AND v_login_result->>'admin_id' IS NOT NULL THEN
    RAISE NOTICE '✅ TOUT FONCTIONNE PARFAITEMENT !';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Vous pouvez maintenant vous connecter:';
    RAISE NOTICE '   URL: http://localhost:3000/admin/login';
    RAISE NOTICE '   Téléphone: +221781234568';
    RAISE NOTICE '   PIN: 123456';
    RAISE NOTICE '';
    RAISE NOTICE 'Résultat du login:';
    RAISE NOTICE '  Admin ID: %', v_login_result->>'admin_id';
    RAISE NOTICE '  Email: %', v_login_result->>'email';
    RAISE NOTICE '  Nom: %', v_login_result->>'full_name';
    RAISE NOTICE '  Téléphone: %', v_login_result->>'phone';
  ELSE
    RAISE NOTICE '❌ PROBLÈME DÉTECTÉ';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Résultat du login: %', v_login_result;
    RAISE NOTICE '';
    RAISE NOTICE '🆘 Actions recommandées:';
    RAISE NOTICE '1. Vérifiez que le compte adminqqqq@senepanda.com existe dans auth.users';
    RAISE NOTICE '2. Exécutez: SELECT * FROM auth.users WHERE email = ''adminqqqq@senepanda.com'';';
    RAISE NOTICE '3. Si le compte n''existe pas, créez-le via l''app ou Supabase Dashboard';
    RAISE NOTICE '4. Puis réexécutez: SELECT create_admin_with_phone(''adminqqqq@senepanda.com'', ''+221781234568'', ''123456'', ''Admin Principal'');';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;
