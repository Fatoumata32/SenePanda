-- ========================================
-- DIAGNOSTIC RAPIDE
-- ========================================
-- Exécutez ce script pour voir ce qui manque
-- ========================================

-- Vérifier si user_subscriptions existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'user_subscriptions'
      AND table_schema = 'public'
    )
    THEN '✅ user_subscriptions existe'
    ELSE '❌ user_subscriptions MANQUANTE - Exécuter SETUP_SUBSCRIPTIONS_SMART.sql'
  END as status;

-- Vérifier si subscription_plans existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'subscription_plans'
      AND table_schema = 'public'
    )
    THEN '✅ subscription_plans existe'
    ELSE '❌ subscription_plans MANQUANTE - Exécuter SETUP_SUBSCRIPTIONS_SMART.sql'
  END as status;

-- Lister TOUTES vos tables actuelles
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
