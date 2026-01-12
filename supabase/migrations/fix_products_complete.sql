-- ============================================
-- Fix Complet: Structure complète de products
-- ============================================
-- Ajoute toutes les colonnes manquantes à la table products
-- ============================================

-- ÉTAPE 1: Ajouter toutes les colonnes manquantes
-- =============================================

-- Colonne name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'name'
  ) THEN
    ALTER TABLE products ADD COLUMN name TEXT;
    RAISE NOTICE '✅ Colonne name ajoutée';
  END IF;
END $$;

-- Colonne currency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'FCFA' NOT NULL;
    RAISE NOTICE '✅ Colonne currency ajoutée';
  END IF;
END $$;

-- Colonne description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description TEXT;
    RAISE NOTICE '✅ Colonne description ajoutée';
  END IF;
END $$;

-- Colonne condition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'condition'
  ) THEN
    ALTER TABLE products ADD COLUMN condition TEXT DEFAULT 'new';
    RAISE NOTICE '✅ Colonne condition ajoutée';
  END IF;
END $$;

-- Colonne brand
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand TEXT;
    RAISE NOTICE '✅ Colonne brand ajoutée';
  END IF;
END $$;

-- Colonne video_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE products ADD COLUMN video_url TEXT;
    RAISE NOTICE '✅ Colonne video_url ajoutée';
  END IF;
END $$;


-- ÉTAPE 2: Mettre à jour les valeurs par défaut
-- =============================================

-- Mettre currency à FCFA pour les produits existants
UPDATE products
SET currency = 'FCFA'
WHERE currency IS NULL;

-- Copier title vers name si name est NULL (migration)
UPDATE products
SET name = title
WHERE name IS NULL AND title IS NOT NULL;

-- Si name et title sont NULL, mettre une valeur par défaut
UPDATE products
SET name = 'Produit sans nom'
WHERE name IS NULL;


-- ÉTAPE 3: Ajouter les contraintes NOT NULL
-- =============================================

-- name doit être NOT NULL
DO $$
BEGIN
  ALTER TABLE products ALTER COLUMN name SET NOT NULL;
  RAISE NOTICE '✅ Contrainte NOT NULL ajoutée sur name';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '⚠️  Impossible d''ajouter NOT NULL sur name (valeurs NULL présentes?)';
END $$;


-- ÉTAPE 4: Vérification de la structure
-- =============================================

DO $$
DECLARE
  col_record RECORD;
  col_count INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '📋 Structure de la table products:';
  RAISE NOTICE '====================================';

  FOR col_record IN
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
    ORDER BY ordinal_position
  LOOP
    col_count := col_count + 1;
    RAISE NOTICE '  % - % (%) %',
      col_record.column_name,
      col_record.data_type,
      CASE WHEN col_record.is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END,
      COALESCE('DEFAULT: ' || col_record.column_default, '');
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Total: % colonnes', col_count;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes importantes présentes:';

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
    RAISE NOTICE '  ✅ name';
  ELSE
    RAISE NOTICE '  ❌ name (MANQUANTE!)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'currency') THEN
    RAISE NOTICE '  ✅ currency';
  ELSE
    RAISE NOTICE '  ❌ currency (MANQUANTE!)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title') THEN
    RAISE NOTICE '  ✅ title';
  ELSE
    RAISE NOTICE '  ❌ title (MANQUANTE!)';
  END IF;

  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Migration terminée!';
  RAISE NOTICE 'Redémarrez votre application.';
  RAISE NOTICE '====================================';
END $$;
