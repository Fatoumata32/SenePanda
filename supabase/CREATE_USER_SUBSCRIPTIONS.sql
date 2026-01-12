-- ========================================
-- CRÉER TABLE USER_SUBSCRIPTIONS
-- ========================================
--
-- Ce script crée uniquement la table user_subscriptions
-- et ses dépendances si elles n'existent pas.
--
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Créer la table subscription_plans si elle n'existe pas
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

-- 2. Créer la table user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  payment_proof_url TEXT,
  is_approved BOOLEAN DEFAULT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_id, created_at)
);

-- 3. Créer les index pour performances
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_status
ON user_subscriptions(user_id, status)
WHERE status IN ('pending', 'active');

-- 4. Activer RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies (avec IF NOT EXISTS simulé via DO block)
DO $$
BEGIN
  -- Policy pour subscription_plans (lecture publique)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_plans'
    AND policyname = 'Anyone can view active plans'
  ) THEN
    CREATE POLICY "Anyone can view active plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);
  END IF;

  -- Policy pour user_subscriptions (lecture propre)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Policy pour user_subscriptions (insertion propre)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can create own subscriptions'
  ) THEN
    CREATE POLICY "Users can create own subscriptions"
    ON user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy pour user_subscriptions (mise à jour propre)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can update own subscriptions'
  ) THEN
    CREATE POLICY "Users can update own subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Insérer des plans par défaut si la table est vide
INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT
  'Starter',
  'Plan de démarrage pour nouveaux vendeurs',
  5000.00,
  30,
  '["Jusqu''à 10 produits", "Support par email", "1 boutique"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter');

INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT
  'Premium',
  'Plan complet pour vendeurs actifs',
  15000.00,
  30,
  '["Produits illimités", "Support prioritaire", "3 boutiques", "Analytics avancés"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Premium');

INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT
  'Business',
  'Plan professionnel pour grandes entreprises',
  50000.00,
  30,
  '["Tout Premium", "Support 24/7", "10 boutiques", "API access", "Custom branding"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Business');

-- 7. Vérifier la création
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLE USER_SUBSCRIPTIONS CRÉÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables créées :';
  RAISE NOTICE '  ✓ subscription_plans';
  RAISE NOTICE '  ✓ user_subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'Index créés :';
  RAISE NOTICE '  ✓ idx_user_subscriptions_user_id';
  RAISE NOTICE '  ✓ idx_user_subscriptions_status';
  RAISE NOTICE '  ✓ idx_user_subscriptions_user_id_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies créées :';
  RAISE NOTICE '  ✓ Anyone can view active plans';
  RAISE NOTICE '  ✓ Users can view own subscriptions';
  RAISE NOTICE '  ✓ Users can create own subscriptions';
  RAISE NOTICE '  ✓ Users can update own subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape :';
  RAISE NOTICE '  → Exécuter ENABLE_REALTIME_SUBSCRIPTIONS.sql';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- 8. Afficher le résumé
SELECT
  'subscription_plans' as table_name,
  COUNT(*) as plan_count
FROM subscription_plans
UNION ALL
SELECT
  'user_subscriptions' as table_name,
  COUNT(*) as subscription_count
FROM user_subscriptions;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
