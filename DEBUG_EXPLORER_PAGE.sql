-- ============================================
-- Debug: Page Explorer ne fonctionne pas
-- ============================================

-- ÉTAPE 1: Vérifier la structure de products
-- =============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- ÉTAPE 2: Vérifier si views_count existe
-- =============================================
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'views_count'
) as views_count_existe;

-- ÉTAPE 3: Tester la requête de la page Explorer
-- =============================================
-- Cette requête simule ce que fait la page Explorer
SELECT
  p.id,
  p.name,
  p.title,
  p.price,
  p.currency,
  p.is_active,
  p.category_id,
  p.image_url,
  p.created_at,
  prof.id as seller_id,
  prof.shop_name,
  prof.shop_logo_url
FROM products p
LEFT JOIN profiles prof ON prof.id = p.seller_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 5;

-- ÉTAPE 4: Vérifier les produits actifs
-- =============================================
SELECT
  COUNT(*) as total_produits,
  COUNT(CASE WHEN is_active THEN 1 END) as produits_actifs,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as produits_inactifs
FROM products;

-- ÉTAPE 5: Vérifier les catégories
-- =============================================
SELECT
  id,
  name,
  slug,
  is_active,
  created_at
FROM categories
WHERE is_active = true
ORDER BY name;

-- ÉTAPE 6: Ajouter views_count si manquant
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'views_count'
  ) THEN
    ALTER TABLE products ADD COLUMN views_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne views_count ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne views_count existe déjà';
  END IF;
END $$;

-- ÉTAPE 7: Ajouter average_rating si manquant
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE products ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
    RAISE NOTICE '✅ Colonne average_rating ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne average_rating existe déjà';
  END IF;
END $$;

-- ÉTAPE 8: Ajouter discount_percentage si manquant
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE products ADD COLUMN discount_percentage INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne discount_percentage ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne discount_percentage existe déjà';
  END IF;
END $$;

-- ÉTAPE 9: Vérification finale
-- =============================================
SELECT
  'Colonnes critiques:' as info
UNION ALL
SELECT
  '  - views_count: ' || CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'views_count'
  ) THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  '  - average_rating: ' || CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'average_rating'
  ) THEN '✅' ELSE '❌' END
UNION ALL
SELECT
  '  - discount_percentage: ' || CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'discount_percentage'
  ) THEN '✅' ELSE '❌' END;
