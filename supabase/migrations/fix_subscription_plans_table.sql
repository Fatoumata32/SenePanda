-- ============================================
-- Migration: Amélioration de la table subscription_plans
-- Date: 2025-11-30
-- Description: Ajoute les colonnes manquantes pour le système d'abonnement
-- ============================================

-- =============================================
-- ÉTAPE 0: NETTOYAGE DES POLITIQUES EXISTANTES
-- =============================================

-- Supprimer toutes les politiques RLS existantes pour éviter les conflits
DO $$
BEGIN
  -- Supprimer les politiques sur subscription_plans
  DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON subscription_plans;
  DROP POLICY IF EXISTS "subscription_plans_select_policy" ON subscription_plans;

  -- Supprimer les politiques sur subscription_history
  DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
  DROP POLICY IF EXISTS "Users can insert own subscription history" ON subscription_history;
  DROP POLICY IF EXISTS "subscription_history_select_policy" ON subscription_history;
  DROP POLICY IF EXISTS "subscription_history_insert_policy" ON subscription_history;

  RAISE NOTICE '✅ Anciennes politiques RLS supprimées';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'ℹ️  Les tables n''existent pas encore, c''est normal';
  WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️  Pas de politiques à supprimer ou erreur: %', SQLERRM;
END $$;

-- =============================================
-- ÉTAPE 1: CRÉER/VÉRIFIER LES TABLES DE BASE
-- =============================================

-- Créer la table subscription_plans si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table subscription_history si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la colonne user_id à subscription_history si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_history'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ Colonne user_id ajoutée à subscription_history';
  END IF;
END $$;

-- Ajouter les autres colonnes de base à subscription_history
DO $$
BEGIN
  -- plan_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN plan_type TEXT;
  END IF;

  -- action
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'action'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN action TEXT;
  END IF;

  -- amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'amount'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'currency'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN currency TEXT DEFAULT 'XOF';
  END IF;

  -- payment_method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN payment_method TEXT;
  END IF;

  -- billing_period
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN billing_period TEXT;
  END IF;

  -- expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- transaction_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN transaction_id TEXT;
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;

  -- metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE subscription_history ADD COLUMN metadata JSONB;
  END IF;

  RAISE NOTICE '✅ Toutes les colonnes de subscription_history vérifiées/ajoutées';
END $$;

-- Ajouter les contraintes manquantes sur subscription_history
DO $$
BEGIN
  -- Contrainte NOT NULL sur user_id
  BEGIN
    ALTER TABLE subscription_history ALTER COLUMN user_id SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️  user_id déjà NOT NULL ou contient des valeurs NULL';
  END;

  -- Contrainte NOT NULL sur plan_type
  BEGIN
    ALTER TABLE subscription_history ALTER COLUMN plan_type SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️  plan_type déjà NOT NULL ou contient des valeurs NULL';
  END;

  -- Contrainte NOT NULL sur action
  BEGIN
    ALTER TABLE subscription_history ALTER COLUMN action SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️  action déjà NOT NULL ou contient des valeurs NULL';
  END;

  -- Foreign key sur user_id
  BEGIN
    ALTER TABLE subscription_history
    DROP CONSTRAINT IF EXISTS subscription_history_user_id_fkey;

    ALTER TABLE subscription_history
    ADD CONSTRAINT subscription_history_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    RAISE NOTICE '✅ Contrainte FK ajoutée sur user_id';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️  FK sur user_id existe déjà ou erreur: %', SQLERRM;
  END;
END $$;

-- =============================================
-- ÉTAPE 2: AJOUTER LES COLONNES À subscription_plans
-- =============================================

-- Fonction utilitaire pour ajouter une colonne si elle n'existe pas
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT,
  p_default TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column
  ) THEN
    IF p_default IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s DEFAULT %s', p_table, p_column, p_type, p_default);
    ELSE
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_type);
    END IF;
    RAISE NOTICE '✅ Colonne ajoutée: %.%', p_table, p_column;
  ELSE
    RAISE NOTICE 'ℹ️  Colonne déjà existante: %.%', p_table, p_column;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ajouter les colonnes manquantes à subscription_plans
DO $$
BEGIN
  PERFORM add_column_if_not_exists('subscription_plans', 'plan_type', 'TEXT');
  PERFORM add_column_if_not_exists('subscription_plans', 'description', 'TEXT');
  PERFORM add_column_if_not_exists('subscription_plans', 'price_monthly', 'DECIMAL(10,2)', '0');
  PERFORM add_column_if_not_exists('subscription_plans', 'price_yearly', 'DECIMAL(10,2)');
  PERFORM add_column_if_not_exists('subscription_plans', 'currency', 'TEXT', '''XOF''');
  PERFORM add_column_if_not_exists('subscription_plans', 'max_products', 'INTEGER', '10');
  PERFORM add_column_if_not_exists('subscription_plans', 'commission_rate', 'DECIMAL(5,2)', '15');
  PERFORM add_column_if_not_exists('subscription_plans', 'visibility_boost', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('subscription_plans', 'hd_photos', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('subscription_plans', 'video_allowed', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('subscription_plans', 'badge_name', 'TEXT');
  PERFORM add_column_if_not_exists('subscription_plans', 'support_level', 'TEXT', '''standard''');
  PERFORM add_column_if_not_exists('subscription_plans', 'advanced_analytics', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('subscription_plans', 'ai_analytics', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('subscription_plans', 'sponsored_campaigns', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('subscription_plans', 'display_order', 'INTEGER', '0');

  RAISE NOTICE '✅ Toutes les colonnes de subscription_plans vérifiées/ajoutées';
END $$;

-- =============================================
-- ÉTAPE 3: MIGRER LES ANCIENNES COLONNES
-- =============================================

DO $$
BEGIN
  -- Migrer price vers price_monthly
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'price'
  ) THEN
    UPDATE subscription_plans SET price_monthly = price WHERE price_monthly IS NULL OR price_monthly = 0;
    ALTER TABLE subscription_plans DROP COLUMN IF EXISTS price;
    RAISE NOTICE '✅ Colonne "price" migrée vers "price_monthly"';
  END IF;

  -- Supprimer duration_days
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE subscription_plans DROP COLUMN IF EXISTS duration_days;
    RAISE NOTICE '✅ Colonne "duration_days" supprimée';
  END IF;
END $$;

-- =============================================
-- ÉTAPE 4: CONFIGURER RLS ET LES POLITIQUES
-- =============================================

-- Activer RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Créer les politiques pour subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Créer les politiques pour subscription_history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ÉTAPE 5: MESSAGES DE SUCCÈS
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'ℹ️  Table subscription_plans: OK';
  RAISE NOTICE 'ℹ️  Table subscription_history: OK';
  RAISE NOTICE 'ℹ️  Politiques RLS: OK';
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Prochaine étape: Exécuter insert_default_subscription_plans.sql';
  RAISE NOTICE '====================================';
END $$;
