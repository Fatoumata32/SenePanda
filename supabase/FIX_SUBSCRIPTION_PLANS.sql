-- ========================================
-- CORRIGER LA STRUCTURE DE subscription_plans
-- ========================================
-- Ce script adapte la table existante
-- ========================================

-- 1. Vérifier la structure actuelle
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
  -- Ajouter price si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'price'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN price DECIMAL(10, 2);
    RAISE NOTICE '✅ Colonne price ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne price existe déjà';
  END IF;

  -- Ajouter currency si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN currency TEXT DEFAULT 'FCFA';
    RAISE NOTICE '✅ Colonne currency ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne currency existe déjà';
  END IF;

  -- Ajouter duration_days si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN duration_days INTEGER DEFAULT 30;
    RAISE NOTICE '✅ Colonne duration_days ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne duration_days existe déjà';
  END IF;

  -- Ajouter max_products si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_products'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN max_products INTEGER;
    RAISE NOTICE '✅ Colonne max_products ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne max_products existe déjà';
  END IF;

  -- Ajouter max_shops si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_shops'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN max_shops INTEGER DEFAULT 1;
    RAISE NOTICE '✅ Colonne max_shops ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne max_shops existe déjà';
  END IF;

  -- Ajouter features si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'features'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne features ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne features existe déjà';
  END IF;

  -- Ajouter is_active si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Colonne is_active ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne is_active existe déjà';
  END IF;
END $$;

-- 3. Mettre à jour ou insérer les plans
INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
VALUES
  (
    'Starter',
    'Plan de démarrage pour nouveaux vendeurs',
    5000.00,
    'FCFA',
    30,
    10,
    1,
    '["Jusqu''à 10 produits", "1 boutique", "Support par email", "Statistiques basiques"]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  max_products = EXCLUDED.max_products,
  max_shops = EXCLUDED.max_shops,
  features = EXCLUDED.features;

INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
VALUES
  (
    'Premium',
    'Plan complet pour vendeurs actifs',
    15000.00,
    'FCFA',
    30,
    NULL,
    3,
    '["Produits illimités", "Jusqu''à 3 boutiques", "Support prioritaire", "Analytics avancés", "Badge vérifié", "Promotion page d''accueil"]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  max_products = EXCLUDED.max_products,
  max_shops = EXCLUDED.max_shops,
  features = EXCLUDED.features;

INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
VALUES
  (
    'Business',
    'Solution professionnelle pour grandes entreprises',
    50000.00,
    'FCFA',
    30,
    NULL,
    10,
    '["Tout Premium", "Jusqu''à 10 boutiques", "Support 24/7", "API Access", "Custom branding", "Gestionnaire dédié", "Rapports personnalisés"]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  max_products = EXCLUDED.max_products,
  max_shops = EXCLUDED.max_shops,
  features = EXCLUDED.features;

-- 4. Vérifier le résultat
SELECT
  name,
  price,
  currency,
  duration_days,
  max_products,
  max_shops,
  is_active
FROM subscription_plans
ORDER BY price;

-- 5. Message de succès
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUBSCRIPTION_PLANS CORRIGÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape:';
  RAISE NOTICE '  → Exécuter ENABLE_REALTIME_SUBSCRIPTIONS.sql';
  RAISE NOTICE '';
END $$;
