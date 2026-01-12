-- ============================================
-- Debug: Produit n'apparaît pas dans Explorer
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
  created_at,
  image_url,
  images
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 2: Vérifier les produits non actifs
-- =============================================
SELECT
  id,
  name,
  title,
  is_active,
  created_at
FROM products
WHERE is_active = false
ORDER BY created_at DESC
LIMIT 5;

-- ÉTAPE 3: Vérifier le dernier produit ajouté
-- =============================================
SELECT
  p.id,
  p.name,
  p.title,
  p.price,
  p.currency,
  p.is_active,
  p.category_id,
  c.name as category_name,
  prof.shop_name as seller_name,
  p.created_at
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN profiles prof ON prof.id = p.seller_id
ORDER BY p.created_at DESC
LIMIT 1;

-- ÉTAPE 4: Compter les produits par statut
-- =============================================
SELECT
  is_active,
  COUNT(*) as nombre
FROM products
GROUP BY is_active;

-- ÉTAPE 5: Vérifier les catégories
-- =============================================
SELECT
  id,
  name,
  slug,
  is_active
FROM categories
ORDER BY name;

-- ÉTAPE 6: Si le produit n'est pas actif, l'activer
-- =============================================
-- Remplacez PRODUCT_ID par l'ID du produit que vous venez d'ajouter
/*
UPDATE products
SET is_active = true
WHERE id = 'PRODUCT_ID';
*/

-- ÉTAPE 7: Activer TOUS les produits récents (dernières 24h)
-- =============================================
-- Décommentez cette requête si vous voulez activer tous les produits récents
/*
UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND is_active = false;
*/

-- ÉTAPE 8: Vérifier les RLS (Row Level Security) sur products
-- =============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'products';

-- ÉTAPE 9: Vérifier qu'il n'y a pas de produits avec name NULL
-- =============================================
SELECT
  id,
  title,
  name,
  is_active,
  created_at
FROM products
WHERE name IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- ÉTAPE 10: Fix rapide - Activer tous les produits
-- =============================================
-- Si vous voulez simplement activer tous vos produits d'un coup:
/*
UPDATE products
SET is_active = true;

SELECT 'Total produits activés: ' || COUNT(*)::text
FROM products
WHERE is_active = true;
*/
