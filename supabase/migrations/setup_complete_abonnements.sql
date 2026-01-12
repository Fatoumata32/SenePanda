-- ============================================
-- Migration COMPLÈTE: Configuration des abonnements
-- Date: 2026-01-11
-- Description: Crée la table subscription_plans avec toutes ses colonnes
--              et insère les 4 plans (Free + 3 payants)
-- ============================================

-- PARTIE 1: CRÉER/METTRE À JOUR LA TABLE
-- =============================================

-- Supprimer la table existante et tout recommencer proprement
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Créer la table subscription_plans avec TOUTES les colonnes
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2),
  currency TEXT DEFAULT 'FCFA',
  max_products INTEGER DEFAULT 10,
  commission_rate DECIMAL(5,2) DEFAULT 15,
  visibility_boost INTEGER DEFAULT 0,
  hd_photos BOOLEAN DEFAULT FALSE,
  video_allowed BOOLEAN DEFAULT FALSE,
  badge_name TEXT,
  support_level TEXT DEFAULT 'standard',
  advanced_analytics BOOLEAN DEFAULT FALSE,
  ai_analytics BOOLEAN DEFAULT FALSE,
  sponsored_campaigns BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurer RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut voir les plans actifs
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Index pour améliorer les performances
CREATE INDEX idx_subscription_plans_plan_type ON subscription_plans(plan_type);
CREATE INDEX idx_subscription_plans_display_order ON subscription_plans(display_order);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);

-- PARTIE 2: INSÉRER LES PLANS
-- =============================================

-- Insérer les 4 plans d'abonnement (1 gratuit + 3 payants)
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
  -- Plan Gratuit (pour les nouveaux utilisateurs, non affiché à la vente)
  (
    'free',
    'Gratuit',
    'Pour découvrir la plateforme',
    0,
    0,
    'FCFA',
    5,
    15.00,
    0,
    false,
    false,
    null,
    'standard',
    false,
    false,
    false,
    0,
    true
  ),
  -- Plan Starter
  (
    'starter',
    'Starter',
    'Pour les vendeurs actifs',
    3000,
    30000,
    'FCFA',
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
    1,
    true
  ),
  -- Plan Pro
  (
    'pro',
    'Pro',
    'Pour les professionnels',
    7000,
    70000,
    'FCFA',
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
    2,
    true
  ),
  -- Plan Premium
  (
    'premium',
    'Premium',
    'Pour dominer le marché',
    15000,
    150000,
    'FCFA',
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
    3,
    true
  );

-- PARTIE 3: VÉRIFICATION
-- =============================================

DO $$
DECLARE
  plan_record RECORD;
  plan_count INTEGER;
BEGIN
  -- Compter les plans
  SELECT COUNT(*) INTO plan_count FROM subscription_plans;

  -- Afficher les messages
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Plans d''abonnement créés avec succès!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'ℹ️  Nombre de plans: %', plan_count;
  RAISE NOTICE '';

  -- Afficher chaque plan
  FOR plan_record IN
    SELECT plan_type, name, price_monthly, price_yearly, max_products, commission_rate
    FROM subscription_plans
    ORDER BY display_order
  LOOP
    RAISE NOTICE '📦 % (%)', plan_record.name, plan_record.plan_type;
    RAISE NOTICE '   Prix mensuel: % FCFA', plan_record.price_monthly;
    RAISE NOTICE '   Prix annuel: % FCFA', plan_record.price_yearly;
    RAISE NOTICE '   Produits max: %', plan_record.max_products;
    RAISE NOTICE '   Commission: %%%', plan_record.commission_rate;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Système d''abonnement 100%% prêt!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé:';
  RAISE NOTICE '✅ Table subscription_plans créée';
  RAISE NOTICE '✅ 4 plans insérés (1 gratuit + 3 payants)';
  RAISE NOTICE '✅ Politiques RLS configurées';
  RAISE NOTICE '✅ Index créés';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape: Testez l''app mobile!';
  RAISE NOTICE '====================================';
END $$;
