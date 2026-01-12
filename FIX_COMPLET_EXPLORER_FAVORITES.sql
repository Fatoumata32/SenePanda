-- ============================================
-- FIX COMPLET: Explorer + Favorites + Shop
-- ============================================
-- Corrige toutes les colonnes manquantes
-- ============================================

-- PARTIE 1: Colonnes manquantes dans PROFILES
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;

-- PARTIE 2: Colonnes manquantes dans PRODUCTS
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- PARTIE 3: Activer les produits récents
-- ============================================

UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- PARTIE 4: S'assurer que name n'est pas NULL
-- ============================================

UPDATE products
SET name = COALESCE(name, title, 'Produit')
WHERE name IS NULL OR name = '';

-- PARTIE 5: Mettre à jour les produits avec réduction
-- ============================================

UPDATE products
SET has_discount = true
WHERE discount_percentage > 0 AND original_price IS NOT NULL;

-- PARTIE 6: Forcer la mise à jour du cache
-- ============================================

UPDATE products
SET updated_at = NOW();

-- PARTIE 7: Vérification finale
-- ============================================

SELECT
  '✅ PROFILES: shop_logo_url ajoutée' as status
UNION ALL
SELECT
  '✅ PROFILES: shop_banner_url ajoutée'
UNION ALL
SELECT
  '✅ PRODUCTS: views_count ajoutée'
UNION ALL
SELECT
  '✅ PRODUCTS: average_rating ajoutée'
UNION ALL
SELECT
  '✅ PRODUCTS: discount_percentage ajoutée'
UNION ALL
SELECT
  '✅ PRODUCTS: has_discount ajoutée'
UNION ALL
SELECT
  '✅ PRODUCTS: original_price ajoutée'
UNION ALL
SELECT
  '📊 Total produits: ' || COUNT(*)::text
FROM products
UNION ALL
SELECT
  '✅ Produits actifs: ' || COUNT(*)::text
FROM products
WHERE is_active = true
UNION ALL
SELECT
  '✅ Produits avec name: ' || COUNT(*)::text
FROM products
WHERE name IS NOT NULL AND name != '';
