-- ========================================
-- SETUP INTELLIGENT DES ABONNEMENTS
-- ========================================
--
-- Ce script s'adapte automatiquement à votre schéma existant
-- Il crée uniquement ce qui manque, sans rien casser
--
-- SAFE TO RUN MULTIPLE TIMES
--
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 SETUP INTELLIGENT DES ABONNEMENTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ========================================
-- ÉTAPE 1 : CRÉER subscription_plans
-- ========================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  max_products INTEGER,
  max_shops INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    RAISE NOTICE '✅ Table subscription_plans prête';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 2 : CRÉER user_subscriptions
-- ========================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  payment_proof_url TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  is_approved BOOLEAN DEFAULT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    RAISE NOTICE '✅ Table user_subscriptions prête';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 3 : CRÉER LES INDEX
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id
ON user_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
ON user_subscriptions(user_id, status)
WHERE status IN ('pending', 'active');

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_approved
ON user_subscriptions(is_approved)
WHERE is_approved IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- ========================================
-- ÉTAPE 4 : ACTIVER RLS
-- ========================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN RAISE NOTICE '✅ RLS activé'; END $$;

-- ========================================
-- ÉTAPE 5 : CRÉER LES POLICIES (avec vérification)
-- ========================================

-- Policy 1 : Tout le monde peut voir les plans actifs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_plans'
    AND policyname = 'Anyone can view active subscription plans'
  ) THEN
    CREATE POLICY "Anyone can view active subscription plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);
    RAISE NOTICE '✅ Policy: Anyone can view active subscription plans';
  ELSE
    RAISE NOTICE '⚠️  Policy déjà existe: Anyone can view active subscription plans';
  END IF;
END $$;

-- Policy 2 : Les utilisateurs voient leurs propres abonnements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can view their own subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Policy: Users can view their own subscriptions';
  ELSE
    RAISE NOTICE '⚠️  Policy déjà existe: Users can view their own subscriptions';
  END IF;
END $$;

-- Policy 3 : Les utilisateurs peuvent créer leurs abonnements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can create their own subscriptions'
  ) THEN
    CREATE POLICY "Users can create their own subscriptions"
    ON user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE '✅ Policy: Users can create their own subscriptions';
  ELSE
    RAISE NOTICE '⚠️  Policy déjà existe: Users can create their own subscriptions';
  END IF;
END $$;

-- Policy 4 : Les utilisateurs peuvent mettre à jour leurs abonnements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can update their own subscriptions'
  ) THEN
    CREATE POLICY "Users can update their own subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE '✅ Policy: Users can update their own subscriptions';
  ELSE
    RAISE NOTICE '⚠️  Policy déjà existe: Users can update their own subscriptions';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 6 : INSÉRER LES PLANS PAR DÉFAUT
-- ========================================

-- Plan Starter
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  duration_days,
  max_products,
  max_shops,
  features
)
SELECT
  'Starter',
  'Plan de démarrage pour nouveaux vendeurs',
  5000.00,
  'FCFA',
  30,
  10,
  1,
  jsonb_build_array(
    'Jusqu''à 10 produits',
    '1 boutique',
    'Support par email',
    'Statistiques basiques'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE name = 'Starter'
);

-- Plan Premium
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  duration_days,
  max_products,
  max_shops,
  features
)
SELECT
  'Premium',
  'Plan complet pour vendeurs actifs',
  15000.00,
  'FCFA',
  30,
  NULL, -- illimité
  3,
  jsonb_build_array(
    'Produits illimités',
    'Jusqu''à 3 boutiques',
    'Support prioritaire',
    'Analytics avancés',
    'Badge vérifié',
    'Promotion sur la page d''accueil'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE name = 'Premium'
);

-- Plan Business
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  duration_days,
  max_products,
  max_shops,
  features
)
SELECT
  'Business',
  'Solution professionnelle pour grandes entreprises',
  50000.00,
  'FCFA',
  30,
  NULL, -- illimité
  10,
  jsonb_build_array(
    'Tout du plan Premium',
    'Jusqu''à 10 boutiques',
    'Support 24/7',
    'API Access',
    'Custom branding',
    'Gestionnaire de compte dédié',
    'Rapports personnalisés'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE name = 'Business'
);

DO $$
DECLARE
  v_plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plan_count FROM subscription_plans;
  RAISE NOTICE '✅ Plans d''abonnement: % plan(s) disponible(s)', v_plan_count;
END $$;

-- ========================================
-- ÉTAPE 7 : CRÉER FONCTION update_updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE '✅ Fonction update_updated_at_column créée'; END $$;

-- ========================================
-- ÉTAPE 8 : CRÉER LES TRIGGERS
-- ========================================

-- Trigger pour subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour user_subscriptions
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN RAISE NOTICE '✅ Triggers created'; END $$;

-- ========================================
-- ÉTAPE 9 : FONCTION POUR VÉRIFIER L'ABONNEMENT ACTIF
-- ========================================

CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND is_approved = true
      AND (ends_at IS NULL OR ends_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ Fonction has_active_subscription créée'; END $$;

-- ========================================
-- ÉTAPE 10 : FONCTION POUR OBTENIR L'ABONNEMENT ACTUEL
-- ========================================

CREATE OR REPLACE FUNCTION get_current_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  plan_price DECIMAL,
  status TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_approved BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    sp.name,
    sp.price,
    us.status,
    us.starts_at,
    us.ends_at,
    us.is_approved,
    CASE
      WHEN us.ends_at IS NOT NULL
      THEN EXTRACT(DAY FROM us.ends_at - NOW())::INTEGER
      ELSE NULL
    END
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'pending')
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ Fonction get_current_subscription créée'; END $$;

-- ========================================
-- RÉSUMÉ FINAL
-- ========================================

DO $$
DECLARE
  v_plans_count INTEGER;
  v_subs_count INTEGER;
  v_policies_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP TERMINÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Compter les plans
  SELECT COUNT(*) INTO v_plans_count FROM subscription_plans;
  RAISE NOTICE 'Plans d''abonnement: %', v_plans_count;

  -- Compter les abonnements
  SELECT COUNT(*) INTO v_subs_count FROM user_subscriptions;
  RAISE NOTICE 'Abonnements utilisateurs: %', v_subs_count;

  -- Compter les policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE tablename IN ('subscription_plans', 'user_subscriptions');
  RAISE NOTICE 'Policies de sécurité: %', v_policies_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  ✓ subscription_plans';
  RAISE NOTICE '  ✓ user_subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions créées:';
  RAISE NOTICE '  ✓ update_updated_at_column()';
  RAISE NOTICE '  ✓ has_active_subscription(user_id)';
  RAISE NOTICE '  ✓ get_current_subscription(user_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape:';
  RAISE NOTICE '  → Exécuter ENABLE_REALTIME_SUBSCRIPTIONS.sql';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- Afficher les plans disponibles
SELECT
  name,
  price || ' ' || currency as prix,
  duration_days || ' jours' as duree,
  max_products,
  max_shops as boutiques,
  is_active as actif
FROM subscription_plans
ORDER BY price;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
