-- ============================================
-- SCRIPT COMPLET : ACTIVER LES ABONNEMENTS
-- ============================================
-- Copiez et collez tout ce fichier dans le SQL Editor de Supabase
-- puis cliquez sur "Run" pour tout exécuter d'un coup
-- ============================================

-- ============================================
-- ÉTAPE 1 : Créer la table subscription_plans
-- ============================================

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Créer la nouvelle table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  max_products INTEGER NOT NULL DEFAULT 10,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  visibility_boost INTEGER NOT NULL DEFAULT 0,
  hd_photos BOOLEAN NOT NULL DEFAULT false,
  video_allowed BOOLEAN NOT NULL DEFAULT false,
  badge_name TEXT,
  support_level TEXT NOT NULL DEFAULT 'standard',
  advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  ai_analytics BOOLEAN NOT NULL DEFAULT false,
  sponsored_campaigns BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_order ON subscription_plans(display_order);

-- RLS (Row Level Security)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les plans actifs
CREATE POLICY "Public can view active plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Politique: Seuls les admins peuvent modifier
CREATE POLICY "Only admins can modify plans"
  ON subscription_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- ÉTAPE 2 : Insérer les 4 plans par défaut
-- ============================================

-- Insérer les 4 plans d'abonnement
INSERT INTO subscription_plans (
  plan_type,
  name,
  description,
  price_monthly,
  price_yearly,
  currency,
  max_products,
  commission_rate,
  visibility_boost,
  hd_photos,
  video_allowed,
  badge_name,
  support_level,
  advanced_analytics,
  ai_analytics,
  sponsored_campaigns,
  display_order,
  is_active
) VALUES
  -- Plan Gratuit
  (
    'free',
    'Gratuit',
    'Pour débuter votre activité',
    0,
    0,
    'XOF',
    10,
    15.00,
    0,
    false,
    false,
    null,
    'standard',
    false,
    false,
    false,
    1,
    true
  ),
  -- Plan Starter (2500 F CFA/mois)
  (
    'starter',
    'Starter',
    'Pour les vendeurs actifs',
    2500,
    25000,
    'XOF',
    50,
    12.00,
    20,
    true,
    false,
    'Starter',
    'priority',
    true,
    false,
    false,
    2,
    true
  ),
  -- Plan Pro (5000 F CFA/mois)
  (
    'pro',
    'Pro',
    'Pour les professionnels',
    5000,
    50000,
    'XOF',
    200,
    10.00,
    50,
    true,
    true,
    'Pro Seller',
    'vip',
    true,
    true,
    true,
    3,
    true
  ),
  -- Plan Premium (10000 F CFA/mois)
  (
    'premium',
    'Premium',
    'Pour dominer le marché',
    10000,
    100000,
    'XOF',
    999999,
    7.00,
    100,
    true,
    true,
    'Premium Seller',
    'concierge',
    true,
    true,
    true,
    4,
    true
  );

-- ============================================
-- ÉTAPE 3 : Créer la table subscription_history
-- ============================================

-- Supprimer si existe
DROP TABLE IF EXISTS subscription_history CASCADE;

-- Créer la table
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_status ON subscription_history(status);

-- RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history"
  ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription history"
  ON subscription_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 4 : Ajouter colonnes dans profiles
-- ============================================

-- Ajouter les colonnes manquantes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan);

-- ============================================
-- VÉRIFICATION : Afficher les résultats
-- ============================================

DO $$
DECLARE
  plan_record RECORD;
  plan_count INTEGER;
BEGIN
  -- Compter les plans
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ ABONNEMENTS ACTIVÉS AVEC SUCCÈS!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  Nombre de plans actifs: %', plan_count;
  RAISE NOTICE '';

  -- Afficher chaque plan
  FOR plan_record IN
    SELECT plan_type, name, price_monthly, price_yearly, max_products, commission_rate
    FROM subscription_plans
    ORDER BY display_order
  LOOP
    RAISE NOTICE '📦 % (%)', plan_record.name, UPPER(plan_record.plan_type);
    RAISE NOTICE '   💰 Prix mensuel: % XOF', plan_record.price_monthly;
    RAISE NOTICE '   💰 Prix annuel: % XOF', plan_record.price_yearly;
    RAISE NOTICE '   📦 Produits max: %', plan_record.max_products;
    RAISE NOTICE '   💳 Commission: %%%', plan_record.commission_rate;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser';
  RAISE NOTICE '   les abonnements dans l''app!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Afficher un aperçu des plans
SELECT
  plan_type as "Type",
  name as "Nom",
  price_monthly || ' XOF' as "Prix/mois",
  price_yearly || ' XOF' as "Prix/an",
  max_products as "Produits max",
  commission_rate || '%' as "Commission"
FROM subscription_plans
ORDER BY display_order;
