-- ============================================
-- Migration: Insertion des plans d'abonnement par défaut
-- Date: 2025-11-30
-- Description: Crée les 4 plans (Free + 3 payants: Starter, Pro, Premium)
-- Le plan Free est pour les nouveaux utilisateurs mais n'est pas affiché à la vente
-- ============================================

-- Supprimer les anciens plans (pour éviter les doublons)
TRUNCATE TABLE subscription_plans CASCADE;

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

-- Vérifier l'insertion et afficher les résultats
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
  RAISE NOTICE '🎉 Système d''abonnement prêt!';
  RAISE NOTICE '====================================';
END $$;
