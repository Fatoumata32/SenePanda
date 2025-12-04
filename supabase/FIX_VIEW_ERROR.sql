-- =============================================
-- 🔧 CORRECTION RAPIDE DE L'ERREUR DE VUE
-- =============================================
-- Erreur: cannot change name of view column "plan_type" to "email"
-- Solution: Supprimer et recréer la vue
-- =============================================

-- Supprimer la vue existante qui cause le conflit
DROP VIEW IF EXISTS pending_subscription_requests CASCADE;

-- Recréer la vue avec la structure correcte
CREATE VIEW pending_subscription_requests AS
SELECT
  sr.id,
  sr.user_id,
  p.full_name,
  p.shop_name,
  p.phone,
  p.email,
  sr.plan_type,
  sr.billing_period,
  sr.requested_at,
  sp.name as plan_name,
  sp.price_monthly,
  sp.price_yearly,
  CASE
    WHEN sr.billing_period = 'yearly' THEN sp.price_yearly
    ELSE sp.price_monthly
  END as amount_due
FROM subscription_requests sr
JOIN profiles p ON sr.user_id = p.id
JOIN subscription_plans sp ON sr.plan_type = sp.plan_type
WHERE sr.status = 'pending'
ORDER BY sr.requested_at ASC;

COMMENT ON VIEW pending_subscription_requests IS 'Vue admin: demandes d''abonnement en attente de validation';

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Vue pending_subscription_requests recréée avec succès';
END $$;
