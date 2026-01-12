-- ================================================================
-- SENEPANDA - SCRIPT DE CORRECTION FINAL ET COMPLET
-- ================================================================
-- Ce script corrige TOUTES les erreurs de base de données
-- et force le rafraîchissement du cache PostgREST
-- ================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_role TEXT CHECK (preferred_role IN ('buyer', 'seller'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'none';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Correction: Ajouter la colonne subscription_expires_at si manquante
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ÉTAPE 2: Corriger products - GARDER la colonne stock (ne pas renommer)
-- ================================================================
-- La colonne doit s'appeler 'stock' pour être cohérente avec le code TypeScript
-- Si la colonne s'appelle 'stock_quantity', la renommer en 'stock'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products RENAME COLUMN stock_quantity TO stock;
  END IF;
END $$;

-- S'assurer que stock existe
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Ajouter la colonne title
ALTER TABLE products
ADD COLUMN IF NOT EXISTS title TEXT;

-- Copier name vers title si title est NULL
UPDATE products SET title = name WHERE title IS NULL OR title = '';

-- ÉTAPE 3: Corriger loyalty_points - ajouter total_spent
-- ================================================================
ALTER TABLE loyalty_points
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Mettre à jour les valeurs NULL
UPDATE loyalty_points SET total_spent = 0 WHERE total_spent IS NULL;


-- Correction: Créer la table subscription_plans si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'XOF',
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Correction: Renommer la colonne started_at en starts_at si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE user_subscriptions RENAME COLUMN started_at TO starts_at;
  END IF;
END $$;

-- Correction: Ajouter la colonne plan_id et la contrainte de clé étrangère si manquantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN plan_id UUID;
  END IF;
  BEGIN
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT IF NOT EXISTS user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
  EXCEPTION WHEN duplicate_object THEN
    -- La contrainte existe déjà
    NULL;
  END;
END $$;

-- Index pour user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- ÉTAPE 5: Corriger les foreign keys de live_sessions
-- ================================================================
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'live_sessions_seller_id_fkey'
    AND table_name = 'live_sessions'
  ) THEN
    ALTER TABLE live_sessions DROP CONSTRAINT live_sessions_seller_id_fkey;
  END IF;

  -- Recréer la contrainte avec CASCADE
  ALTER TABLE live_sessions
  ADD CONSTRAINT live_sessions_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- ÉTAPE 6: Créer les enregistrements loyalty_points manquants
-- ================================================================
INSERT INTO loyalty_points (user_id, points, available_points, total_earned, lifetime_points, level, total_spent)
SELECT
  p.id,
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  'bronze',
  0
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_points lp WHERE lp.user_id = p.id
)
ON CONFLICT (user_id) DO UPDATE SET
  points = COALESCE(loyalty_points.points, EXCLUDED.points),
  available_points = COALESCE(loyalty_points.available_points, EXCLUDED.available_points),
  total_spent = COALESCE(loyalty_points.total_spent, 0);

-- ÉTAPE 7: Activer RLS sur toutes les tables
-- ================================================================
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 8: Policies pour loyalty_points
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON loyalty_points;
CREATE POLICY "Users can view their own loyalty points"
  ON loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own loyalty points" ON loyalty_points;
CREATE POLICY "Users can insert their own loyalty points"
  ON loyalty_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own loyalty points" ON loyalty_points;
CREATE POLICY "Users can update their own loyalty points"
  ON loyalty_points FOR UPDATE
  USING (auth.uid() = user_id);

-- ÉTAPE 9: Policies pour user_subscriptions
-- ================================================================
DROP POLICY IF EXISTS "Users can view their subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ÉTAPE 10: Policies pour live_featured_products
-- ================================================================
DROP POLICY IF EXISTS "Public can view featured products" ON live_featured_products;
CREATE POLICY "Public can view featured products"
  ON live_featured_products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sellers can manage their featured products" ON live_featured_products;
CREATE POLICY "Sellers can manage their featured products"
  ON live_featured_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      WHERE ls.id = live_featured_products.live_session_id
      AND ls.seller_id = auth.uid()
    )
  );

-- ÉTAPE 11: Policies pour live_viewers
-- ================================================================
DROP POLICY IF EXISTS "Public can view live viewers" ON live_viewers;
CREATE POLICY "Public can view live viewers"
  ON live_viewers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join live sessions" ON live_viewers;
CREATE POLICY "Users can join live sessions"
  ON live_viewers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave live sessions" ON live_viewers;
CREATE POLICY "Users can leave live sessions"
  ON live_viewers FOR UPDATE
  USING (auth.uid() = user_id);

-- ÉTAPE 12: FORCER LE RAFRAÎCHISSEMENT DU CACHE (CRITIQUE!)
-- ================================================================
-- Cette commande force PostgREST à recharger le schéma
NOTIFY pgrst, 'reload schema';

-- ÉTAPE 13: Vérification finale avec output détaillé
-- ================================================================
DO $$
DECLARE
  v_profiles_preferred_role BOOLEAN;
  v_profiles_subscription_plan BOOLEAN;
  v_profiles_is_premium BOOLEAN;
  v_products_stock_quantity BOOLEAN;
  v_products_title BOOLEAN;
  v_loyalty_points_total_spent BOOLEAN;
  v_user_subscriptions_exists BOOLEAN;
  v_foreign_key_exists BOOLEAN;
  all_ok BOOLEAN := true;
BEGIN
  -- Vérifier profiles.preferred_role
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_role'
  ) INTO v_profiles_preferred_role;

  -- Vérifier profiles.subscription_plan
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) INTO v_profiles_subscription_plan;

  -- Vérifier profiles.is_premium
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) INTO v_profiles_is_premium;

  -- Vérifier products.stock
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock'
  ) INTO v_products_stock_quantity;

  -- Vérifier products.title
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'title'
  ) INTO v_products_title;

  -- Vérifier loyalty_points.total_spent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loyalty_points' AND column_name = 'total_spent'
  ) INTO v_loyalty_points_total_spent;

  -- Vérifier user_subscriptions
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_subscriptions'
  ) INTO v_user_subscriptions_exists;

  -- Vérifier foreign key
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'live_sessions_seller_id_fkey'
    AND table_name = 'live_sessions'
  ) INTO v_foreign_key_exists;

  -- Afficher les résultats
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION DE LA BASE DE DONNÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes profiles:';
  RAISE NOTICE '  - preferred_role: %', CASE WHEN v_profiles_preferred_role THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '  - subscription_plan: %', CASE WHEN v_profiles_subscription_plan THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '  - is_premium: %', CASE WHEN v_profiles_is_premium THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes products:';
  RAISE NOTICE '  - stock: %', CASE WHEN v_products_stock_quantity THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '  - title: %', CASE WHEN v_products_title THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes loyalty_points:';
  RAISE NOTICE '  - total_spent: %', CASE WHEN v_loyalty_points_total_spent THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Tables:';
  RAISE NOTICE '  - user_subscriptions: %', CASE WHEN v_user_subscriptions_exists THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Foreign Keys:';
  RAISE NOTICE '  - live_sessions → profiles: %', CASE WHEN v_foreign_key_exists THEN '✅ OK' ELSE '❌ MANQUANTE' END;
  RAISE NOTICE '';

  -- Déterminer si tout est OK
  all_ok := v_profiles_preferred_role AND v_profiles_subscription_plan AND v_profiles_is_premium AND
            v_products_stock_quantity AND v_products_title AND
            v_loyalty_points_total_spent AND v_user_subscriptions_exists AND
            v_foreign_key_exists;

  IF all_ok THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TOUTES LES CORRECTIONS SONT APPLIQUÉES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Le cache PostgREST a été rechargé.';
    RAISE NOTICE '';
    RAISE NOTICE '📱 PROCHAINES ÉTAPES:';
    RAISE NOTICE '   1. Attendez 30 secondes (le cache PostgREST se rafraîchit)';
    RAISE NOTICE '   2. Fermez complètement l''application sur votre téléphone';
    RAISE NOTICE '   3. Dans le terminal, faites: Ctrl+C puis: npx expo start --clear';
    RAISE NOTICE '   4. Relancez l''application';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '========================================';
    RAISE WARNING '⚠️  CERTAINES CORRECTIONS ONT ÉCHOUÉ';
    RAISE WARNING '========================================';
    RAISE WARNING '';
    RAISE WARNING 'Veuillez vérifier manuellement les éléments marqués ❌';
  END IF;
END $$;
