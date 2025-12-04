-- ============================================
-- UPDATE: Mise à jour des prix d'abonnement
-- Date: 2025-12-03
-- Description: Met à jour les prix mensuels et annuels
-- Nouveaux prix: 3000, 7000, 15000 FCFA
-- ============================================

-- Mise à jour du plan Starter
UPDATE subscription_plans
SET
  price_monthly = 3000,
  price_yearly = 30000
WHERE plan_type = 'starter';

-- Mise à jour du plan Pro
UPDATE subscription_plans
SET
  price_monthly = 7000,
  price_yearly = 70000
WHERE plan_type = 'pro';

-- Mise à jour du plan Premium
UPDATE subscription_plans
SET
  price_monthly = 15000,
  price_yearly = 150000
WHERE plan_type = 'premium';

-- Vérifier les mises à jour
DO $$
DECLARE
  plan_record RECORD;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Prix des abonnements mis à jour!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  FOR plan_record IN
    SELECT plan_type, name, price_monthly, price_yearly
    FROM subscription_plans
    WHERE plan_type IN ('starter', 'pro', 'premium')
    ORDER BY display_order
  LOOP
    RAISE NOTICE '📦 % (%)', plan_record.name, plan_record.plan_type;
    RAISE NOTICE '   Prix mensuel: % FCFA', plan_record.price_monthly;
    RAISE NOTICE '   Prix annuel: % FCFA', plan_record.price_yearly;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '💰 Nouveaux prix appliqués avec succès!';
  RAISE NOTICE '====================================';
END $$;
