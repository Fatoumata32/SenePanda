-- ========================================
-- VÉRIFIER LE SCHÉMA ACTUEL
-- ========================================
--
-- Ce script vérifie quelles tables existent déjà
-- dans votre base de données pour adapter les scripts
--
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Lister TOUTES les tables existantes
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) THEN '✅ Existe'
    ELSE '❌ Manquant'
  END as status
FROM (
  VALUES
    ('profiles'),
    ('subscription_plans'),
    ('user_subscriptions'),
    ('products'),
    ('orders'),
    ('order_items'),
    ('product_reviews'),
    ('daily_login_streak'),
    ('referrals'),
    ('user_points'),
    ('point_transactions')
) AS expected_tables(table_name)
ORDER BY status DESC, table_name;

-- 2. Vérifier les colonnes de profiles
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier si subscription_plans existe
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans')
    THEN '✅ Table subscription_plans existe'
    ELSE '❌ Table subscription_plans manquante'
  END as subscription_plans_status;

-- 4. Vérifier si user_subscriptions existe
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions')
    THEN '✅ Table user_subscriptions existe'
    ELSE '❌ Table user_subscriptions manquante'
  END as user_subscriptions_status;

-- 5. Compter les plans d'abonnement existants (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    RAISE NOTICE 'Plans d''abonnement existants:';
    PERFORM * FROM subscription_plans;
  ELSE
    RAISE NOTICE '❌ Table subscription_plans n''existe pas encore';
  END IF;
END $$;

-- 6. Vérifier les fonctions existantes
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'record_daily_login',
    'generate_referral_code',
    'process_referral',
    'award_points'
  )
ORDER BY routine_name;

-- 7. Vérifier les policies existantes
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- RÉSUMÉ
-- ========================================

DO $$
DECLARE
  v_tables_count INTEGER;
  v_profiles_exists BOOLEAN;
  v_subscription_plans_exists BOOLEAN;
  v_user_subscriptions_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RAPPORT DE VÉRIFICATION DU SCHÉMA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Compter les tables
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  RAISE NOTICE 'Tables trouvées: %', v_tables_count;

  -- Vérifier profiles
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles'
  ) INTO v_profiles_exists;

  IF v_profiles_exists THEN
    RAISE NOTICE '✅ profiles existe';
  ELSE
    RAISE NOTICE '❌ profiles manquante';
  END IF;

  -- Vérifier subscription_plans
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans'
  ) INTO v_subscription_plans_exists;

  IF v_subscription_plans_exists THEN
    RAISE NOTICE '✅ subscription_plans existe';
  ELSE
    RAISE NOTICE '❌ subscription_plans manquante - DOIT ÊTRE CRÉÉE';
  END IF;

  -- Vérifier user_subscriptions
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions'
  ) INTO v_user_subscriptions_exists;

  IF v_user_subscriptions_exists THEN
    RAISE NOTICE '✅ user_subscriptions existe';
  ELSE
    RAISE NOTICE '❌ user_subscriptions manquante - DOIT ÊTRE CRÉÉE';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
