-- ============================================
-- Migration: Mise à jour de la devise XOF vers FCFA
-- Date: 2025-11-30
-- Description: Remplace toutes les occurrences de 'XOF' par 'FCFA' dans la base de données
-- ============================================

-- Mettre à jour les plans d'abonnement (si la colonne currency existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'currency'
  ) THEN
    EXECUTE 'UPDATE subscription_plans SET currency = ''FCFA'' WHERE currency = ''XOF''';
    RAISE NOTICE 'Plans d''abonnement: devise mise à jour';
  ELSE
    RAISE NOTICE 'Table subscription_plans: colonne currency n''existe pas encore';
  END IF;
END $$;

-- Mettre à jour l'historique des abonnements (si la colonne currency existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'currency'
  ) THEN
    EXECUTE 'UPDATE subscription_history SET currency = ''FCFA'' WHERE currency = ''XOF''';
    RAISE NOTICE 'Historique abonnements: devise mise à jour';
  ELSE
    RAISE NOTICE 'Table subscription_history: colonne currency existe déjà (valeur par défaut: XOF)';
    -- Mettre à jour la valeur par défaut
    ALTER TABLE subscription_history ALTER COLUMN currency SET DEFAULT 'FCFA';
    -- Mettre à jour les enregistrements existants
    UPDATE subscription_history SET currency = 'FCFA' WHERE currency = 'XOF' OR currency IS NULL;
    RAISE NOTICE 'Valeur par défaut mise à jour: FCFA';
  END IF;
END $$;

-- Mettre à jour les produits (si la colonne currency existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'currency'
  ) THEN
    EXECUTE 'UPDATE products SET currency = ''FCFA'' WHERE currency = ''XOF''';
    RAISE NOTICE 'Produits: devise mise à jour';
  ELSE
    RAISE NOTICE 'Table products: colonne currency n''existe pas';
  END IF;
END $$;

-- Afficher le résultat
DO $$
DECLARE
  plans_count INTEGER := 0;
  history_count INTEGER := 0;
  products_count INTEGER := 0;
BEGIN
  -- Compter les mises à jour (si les colonnes existent)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'currency'
  ) THEN
    SELECT COUNT(*) INTO plans_count FROM subscription_plans WHERE currency = 'FCFA';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'currency'
  ) THEN
    SELECT COUNT(*) INTO history_count FROM subscription_history WHERE currency = 'FCFA';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'currency'
  ) THEN
    SELECT COUNT(*) INTO products_count FROM products WHERE currency = 'FCFA';
  END IF;

  -- Afficher les résultats
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Devise mise à jour: XOF → FCFA';
  RAISE NOTICE '====================================';
  IF plans_count > 0 THEN
    RAISE NOTICE 'Plans d''abonnement: % enregistrements en FCFA', plans_count;
  END IF;
  IF history_count > 0 THEN
    RAISE NOTICE 'Historique abonnements: % enregistrements en FCFA', history_count;
  ELSE
    RAISE NOTICE 'Historique abonnements: Valeur par défaut mise à jour vers FCFA';
  END IF;
  IF products_count > 0 THEN
    RAISE NOTICE 'Produits: % enregistrements en FCFA', products_count;
  END IF;
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Migration terminée avec succès!';
  RAISE NOTICE '====================================';
END $$;
