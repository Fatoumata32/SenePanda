-- ========================================
-- CORRIGER subscription_plans (Version 2)
-- ========================================
-- Sans utiliser ON CONFLICT (plus compatible)
-- ========================================

-- 1. Ajouter les colonnes manquantes
DO $$
BEGIN
  -- price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'price'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN price DECIMAL(10, 2);
    RAISE NOTICE '✅ Colonne price ajoutée';
  END IF;

  -- currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'currency'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN currency TEXT DEFAULT 'FCFA';
    RAISE NOTICE '✅ Colonne currency ajoutée';
  END IF;

  -- duration_days
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN duration_days INTEGER DEFAULT 30;
    RAISE NOTICE '✅ Colonne duration_days ajoutée';
  END IF;

  -- max_products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'max_products'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN max_products INTEGER;
    RAISE NOTICE '✅ Colonne max_products ajoutée';
  END IF;

  -- max_shops
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'max_shops'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN max_shops INTEGER DEFAULT 1;
    RAISE NOTICE '✅ Colonne max_shops ajoutée';
  END IF;

  -- features
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'features'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne features ajoutée';
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Colonne is_active ajoutée';
  END IF;
END $$;

-- 2. Mettre à jour les plans existants ou les insérer
DO $$
BEGIN
  -- Plan Starter
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter') THEN
    UPDATE subscription_plans
    SET
      price = 5000.00,
      currency = 'FCFA',
      duration_days = 30,
      max_products = 10,
      max_shops = 1,
      features = '["Jusqu''à 10 produits", "1 boutique", "Support par email", "Statistiques basiques"]'::jsonb,
      is_active = true
    WHERE name = 'Starter';
    RAISE NOTICE '✅ Plan Starter mis à jour';
  ELSE
    INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
    VALUES (
      'Starter',
      'Plan de démarrage pour nouveaux vendeurs',
      5000.00,
      'FCFA',
      30,
      10,
      1,
      '["Jusqu''à 10 produits", "1 boutique", "Support par email", "Statistiques basiques"]'::jsonb,
      true
    );
    RAISE NOTICE '✅ Plan Starter créé';
  END IF;

  -- Plan Premium
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Premium') THEN
    UPDATE subscription_plans
    SET
      price = 15000.00,
      currency = 'FCFA',
      duration_days = 30,
      max_products = NULL,
      max_shops = 3,
      features = '["Produits illimités", "Jusqu''à 3 boutiques", "Support prioritaire", "Analytics avancés", "Badge vérifié"]'::jsonb,
      is_active = true
    WHERE name = 'Premium';
    RAISE NOTICE '✅ Plan Premium mis à jour';
  ELSE
    INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
    VALUES (
      'Premium',
      'Plan complet pour vendeurs actifs',
      15000.00,
      'FCFA',
      30,
      NULL,
      3,
      '["Produits illimités", "Jusqu''à 3 boutiques", "Support prioritaire", "Analytics avancés", "Badge vérifié"]'::jsonb,
      true
    );
    RAISE NOTICE '✅ Plan Premium créé';
  END IF;

  -- Plan Business
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Business') THEN
    UPDATE subscription_plans
    SET
      price = 50000.00,
      currency = 'FCFA',
      duration_days = 30,
      max_products = NULL,
      max_shops = 10,
      features = '["Tout Premium", "Jusqu''à 10 boutiques", "Support 24/7", "API Access", "Custom branding"]'::jsonb,
      is_active = true
    WHERE name = 'Business';
    RAISE NOTICE '✅ Plan Business mis à jour';
  ELSE
    INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
    VALUES (
      'Business',
      'Solution professionnelle pour grandes entreprises',
      50000.00,
      'FCFA',
      30,
      NULL,
      10,
      '["Tout Premium", "Jusqu''à 10 boutiques", "Support 24/7", "API Access", "Custom branding"]'::jsonb,
      true
    );
    RAISE NOTICE '✅ Plan Business créé';
  END IF;
END $$;

-- 3. Afficher les plans
SELECT
  name,
  COALESCE(price, 0) || ' ' || COALESCE(currency, 'FCFA') as prix,
  COALESCE(duration_days, 30) || ' jours' as duree,
  COALESCE(max_products, 0) as produits,
  COALESCE(max_shops, 1) as boutiques,
  COALESCE(is_active, true) as actif
FROM subscription_plans
ORDER BY COALESCE(price, 0);

-- 4. Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUBSCRIPTION_PLANS CORRIGÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes ajoutées et plans configurés';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape:';
  RAISE NOTICE '  → Exécuter FIX_USER_SUBSCRIPTIONS.sql';
  RAISE NOTICE '';
END $$;
