-- ================================================
-- SOLUTION COMPLÈTE - FIX ADMIN DÉFINITIF
-- ================================================
-- Exécutez ce script pour résoudre tous les problèmes

-- ================================================
-- ÉTAPE 1: S'assurer que la colonne role existe
-- ================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ================================================
-- ÉTAPE 2: Mettre à jour l'admin existant
-- ================================================

-- Mettre à jour le profil admin
UPDATE profiles
SET role = 'admin'
WHERE admin_phone = '+221781234568';

-- ================================================
-- ÉTAPE 3: Vérification complète
-- ================================================

-- Voir les données de l'admin
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
WHERE p.admin_phone = '+221781234568';

-- Ce que vous devez voir:
-- | id   | full_name       | admin_phone   | role  | admin_enabled | has_pin | email                   | email_confirmed_at |
-- |------|-----------------|---------------|-------|---------------|---------|-------------------------|-------------------|
-- | uuid | Admin Principal | +221781234568 | admin | true          | true    | adminqqqq@senepanda.com | 2025-11-30        |

-- ================================================
-- ÉTAPE 4: Tester le login
-- ================================================

SELECT verify_admin_phone_login('+221781234568', '123456');

-- Résultat attendu:
-- {
--   "success": true,
--   "admin_id": "uuid...",
--   "email": "adminqqqq@senepanda.com",
--   "full_name": "Admin Principal",
--   "phone": "+221781234568"
-- }

-- ================================================
-- SI LE PROBLÈME PERSISTE
-- ================================================

-- Option A: Recréer le PIN
UPDATE profiles
SET admin_pin_hash = crypt('123456', gen_salt('bf'))
WHERE admin_phone = '+221781234568';

-- Option B: Tout réinitialiser
UPDATE profiles
SET
  role = 'admin',
  admin_enabled = true,
  admin_pin_hash = crypt('123456', gen_salt('bf'))
WHERE admin_phone = '+221781234568';

-- Puis retester:
SELECT verify_admin_phone_login('+221781234568', '123456');

-- ================================================
-- VÉRIFICATION FINALE
-- ================================================

-- Liste de tous les admins
SELECT * FROM admin_phones_list;

-- Dernières tentatives de connexion
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
-- RÉSUMÉ DES ACTIONS
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS !';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Actions effectuées:';
  RAISE NOTICE '  ✓ Colonne role ajoutée (si manquante)';
  RAISE NOTICE '  ✓ Index créé sur role';
  RAISE NOTICE '  ✓ Admin mis à jour avec role = admin';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Identifiants de connexion:';
  RAISE NOTICE '  Téléphone: +221781234568';
  RAISE NOTICE '  PIN: 123456';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 URL de connexion:';
  RAISE NOTICE '  http://localhost:3000/admin/login';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;
