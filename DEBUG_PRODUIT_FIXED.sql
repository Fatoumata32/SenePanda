-- ============================================
-- Debug: Produit n'apparaît pas dans Explorer (CORRIGÉ)
-- ============================================

-- ÉTAPE 1: Vérifier les produits récents
-- =============================================
SELECT
  id,
  name,
  title,
  price,
  currency,
  stock,
  category_id,
  seller_id,
  is_active,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 2: Vérifier le dernier produit ajouté (SANS JOIN)
-- =============================================
SELECT
  id,
  name,
  title,
  price,
  currency,
  is_active,
  category_id,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 1;

-- ÉTAPE 3: Compter les produits par statut
-- =============================================
SELECT
  is_active,
  COUNT(*) as nombre
FROM products
GROUP BY is_active;

-- ÉTAPE 4: Vérifier les catégories
-- =============================================
SELECT
  id,
  name,
  slug,
  is_active
FROM categories
ORDER BY name;

-- ÉTAPE 5: Vérifier le type de category_id
-- =============================================
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('category_id', 'id', 'seller_id');

-- ÉTAPE 6: Fix - Activer tous les produits récents
-- =============================================
UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ÉTAPE 7: Fix - S'assurer que name n'est pas NULL
-- =============================================
UPDATE products
SET name = title
WHERE name IS NULL AND title IS NOT NULL;

UPDATE products
SET name = 'Produit'
WHERE name IS NULL;

-- ÉTAPE 8: Forcer la mise à jour (invalider cache)
-- =============================================
UPDATE products
SET updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '1 day';

-- ÉTAPE 9: Vérification finale
-- =============================================
SELECT
  id,
  name,
  title,
  price,
  currency,
  is_active,
  category_id,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as date_ajout
FROM products
ORDER BY created_at DESC
LIMIT 5;

-- ÉTAPE 10: Résumé
-- =============================================
SELECT
  'Total produits: ' || COUNT(*)::text as info
FROM products

UNION ALL

SELECT
  'Produits actifs: ' || COUNT(*)::text
FROM products
WHERE is_active = true

UNION ALL

SELECT
  'Produits inactifs: ' || COUNT(*)::text
FROM products
WHERE is_active = false

UNION ALL

SELECT
  'Produits sans name: ' || COUNT(*)::text
FROM products
WHERE name IS NULL;
