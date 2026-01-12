-- ============================================
-- FIX RAPIDE: Page Explorer ne fonctionne pas
-- ============================================
-- Ajoute toutes les colonnes manquantes pour Explorer
-- ============================================

-- 1. Ajouter views_count
ALTER TABLE products
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Ajouter average_rating
ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

-- 3. Ajouter discount_percentage
ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- 4. Ajouter has_discount
ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;

-- 5. Ajouter original_price
ALTER TABLE products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- 6. S'assurer que is_active est bien défini
UPDATE products
SET is_active = true
WHERE is_active IS NULL;

-- 7. S'assurer que name est rempli
UPDATE products
SET name = COALESCE(name, title, 'Produit')
WHERE name IS NULL OR name = '';

-- 8. Mettre à jour les produits avec réduction
UPDATE products
SET has_discount = true
WHERE discount_percentage > 0 AND original_price IS NOT NULL;

-- 9. Forcer la mise à jour pour invalider le cache
UPDATE products
SET updated_at = NOW();

-- 10. Vérification finale
SELECT
  '✅ Colonnes ajoutées' as status
UNION ALL
SELECT
  'Total produits: ' || COUNT(*)::text
FROM products
UNION ALL
SELECT
  'Produits actifs: ' || COUNT(*)::text
FROM products
WHERE is_active = true
UNION ALL
SELECT
  'Produits avec name: ' || COUNT(*)::text
FROM products
WHERE name IS NOT NULL AND name != '';
