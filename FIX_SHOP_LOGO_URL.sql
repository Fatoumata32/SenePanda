-- ============================================
-- FIX: Ajouter colonne shop_logo_url manquante
-- ============================================
-- Cette colonne est utilisée partout dans le code
-- mais n'existe pas dans la base de données
-- ============================================

-- 1. Ajouter la colonne shop_logo_url à profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;

-- 2. Ajouter la colonne shop_banner_url (utilisée aussi)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;

-- 3. Vérification
SELECT
  '✅ Colonnes ajoutées' as status
UNION ALL
SELECT
  'Profils avec logo: ' || COUNT(*)::text
FROM profiles
WHERE shop_logo_url IS NOT NULL
UNION ALL
SELECT
  'Profils avec bannière: ' || COUNT(*)::text
FROM profiles
WHERE shop_banner_url IS NOT NULL;
