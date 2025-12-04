-- ================================================
-- FIX: Ajouter la colonne ROLE si manquante
-- ================================================

-- Étape 1: Ajouter la colonne role
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin'));

-- Étape 2: Créer l'index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Étape 3: Mettre à jour les admins existants
UPDATE profiles
SET role = 'admin'
WHERE admin_phone IS NOT NULL AND admin_enabled = true;

-- ================================================
-- VÉRIFICATION
-- ================================================

-- Voir les admins
SELECT
  id,
  full_name,
  admin_phone,
  role,
  admin_enabled
FROM profiles
WHERE admin_phone = '+221781234568';

-- Si le résultat montre role = 'admin' et admin_enabled = true, c'est OK!

-- ================================================
-- TESTER À NOUVEAU
-- ================================================

-- Test 1: Vérifier que l'admin existe
SELECT
  p.id,
  p.admin_phone,
  p.full_name,
  p.role,
  p.admin_enabled,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.admin_phone = '+221781234568';

-- Résultat attendu:
-- | id   | admin_phone     | full_name       | role  | admin_enabled | email                   |
-- |------|-----------------|-----------------|-------|---------------|-------------------------|
-- | uuid | +221781234568   | Admin Principal | admin | true          | adminqqqq@senepanda.com |


-- Test 2: Tester le login
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

-- Vérifier le PIN
SELECT
  admin_phone,
  admin_pin_hash IS NOT NULL as has_pin,
  admin_enabled,
  role
FROM profiles
WHERE admin_phone = '+221781234568';

-- Si has_pin = false, recréer le PIN:
UPDATE profiles
SET admin_pin_hash = crypt('123456', gen_salt('bf'))
WHERE admin_phone = '+221781234568';

-- Puis retester:
SELECT verify_admin_phone_login('+221781234568', '123456');
