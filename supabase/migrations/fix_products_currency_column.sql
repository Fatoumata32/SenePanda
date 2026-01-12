-- ============================================
-- Fix: Ajouter la colonne 'currency' à la table products
-- ============================================
-- Cette migration corrige l'erreur:
-- "Could not find the 'currency' column of 'products' in the schema cache"

-- Ajouter la colonne currency si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la colonne existe déjà
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'currency'
  ) THEN
    -- Ajouter la colonne currency avec valeur par défaut 'FCFA'
    ALTER TABLE products
    ADD COLUMN currency TEXT DEFAULT 'FCFA' NOT NULL;

    RAISE NOTICE '✅ Colonne currency ajoutée à la table products';
  ELSE
    RAISE NOTICE 'ℹ️  La colonne currency existe déjà dans la table products';
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'currency'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Migration réussie!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'La colonne currency existe maintenant dans products';
    RAISE NOTICE 'Valeur par défaut: FCFA';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaine étape:';
    RAISE NOTICE '1. Redémarrez votre application mobile';
    RAISE NOTICE '2. Essayez à nouveau d''ajouter un produit';
  ELSE
    RAISE NOTICE '❌ Erreur: La colonne currency n''a pas été créée';
  END IF;
END $$;

-- Mettre à jour les produits existants qui auraient currency NULL
UPDATE products
SET currency = 'FCFA'
WHERE currency IS NULL;
