-- ============================================
-- SCRIPT DE VÉRIFICATION DES MIGRATIONS
-- À exécuter après avoir appliqué toutes les migrations
-- ============================================

\echo '🔍 VÉRIFICATION DES MIGRATIONS...'
\echo ''

-- ============================================
-- 1. VÉRIFICATION DES TABLES
-- ============================================
\echo '📋 1. VÉRIFICATION DES TABLES'
\echo '=============================='

SELECT
  '✅ Tables existantes' as status,
  COUNT(*) as nombre_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

\echo ''
\echo 'Liste des tables:'
SELECT
  table_name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo 'Tables attendues (devrait afficher 18+):'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ profiles'
    ELSE '❌ profiles MANQUANT'
  END as profiles,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
    THEN '✅ products'
    ELSE '❌ products MANQUANT'
  END as products,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories')
    THEN '✅ categories'
    ELSE '❌ categories MANQUANT'
  END as categories,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
    THEN '✅ orders'
    ELSE '❌ orders MANQUANT'
  END as orders,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items')
    THEN '✅ order_items'
    ELSE '❌ order_items MANQUANT'
  END as order_items,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart_items')
    THEN '✅ cart_items'
    ELSE '❌ cart_items MANQUANT'
  END as cart_items;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites')
    THEN '✅ favorites'
    ELSE '❌ favorites MANQUANT'
  END as favorites,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews')
    THEN '✅ reviews'
    ELSE '❌ reviews MANQUANT'
  END as reviews,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations')
    THEN '✅ conversations'
    ELSE '❌ conversations MANQUANT'
  END as conversations,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
    THEN '✅ messages'
    ELSE '❌ messages MANQUANT'
  END as messages,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
    THEN '✅ notifications'
    ELSE '❌ notifications MANQUANT'
  END as notifications,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flash_deals')
    THEN '✅ flash_deals'
    ELSE '❌ flash_deals MANQUANT'
  END as flash_deals;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards')
    THEN '✅ rewards'
    ELSE '❌ rewards MANQUANT'
  END as rewards,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claimed_rewards')
    THEN '✅ claimed_rewards'
    ELSE '❌ claimed_rewards MANQUANT'
  END as claimed_rewards,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_rewards')
    THEN '✅ referral_rewards'
    ELSE '❌ referral_rewards MANQUANT'
  END as referral_rewards,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'followers')
    THEN '✅ followers'
    ELSE '❌ followers MANQUANT'
  END as followers,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocked_users')
    THEN '✅ blocked_users'
    ELSE '❌ blocked_users MANQUANT'
  END as blocked_users,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_subscription_plans')
    THEN '✅ seller_subscription_plans'
    ELSE '❌ seller_subscription_plans MANQUANT'
  END as seller_subscription_plans;

-- ============================================
-- 2. VÉRIFICATION DES COLONNES IMPORTANTES
-- ============================================
\echo ''
\echo '🔧 2. VÉRIFICATION DES COLONNES'
\echo '================================'

\echo 'Colonnes profiles:'
SELECT
  column_name,
  data_type,
  '✅' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

\echo ''
\echo 'Colonnes products (vérifier seller_id):'
SELECT
  column_name,
  data_type,
  CASE WHEN column_name = 'seller_id' THEN '✅ CRITIQUE' ELSE '✅' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

\echo ''
\echo 'Colonnes orders:'
SELECT
  column_name,
  data_type,
  '✅' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- ============================================
-- 3. VÉRIFICATION DES FONCTIONS
-- ============================================
\echo ''
\echo '⚙️ 3. VÉRIFICATION DES FONCTIONS'
\echo '================================='

SELECT
  '✅ Fonctions existantes' as status,
  COUNT(*) as nombre_fonctions
FROM information_schema.routines
WHERE routine_schema = 'public';

\echo ''
\echo 'Liste des fonctions:'
SELECT
  routine_name,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================
-- 4. VÉRIFICATION DES TRIGGERS
-- ============================================
\echo ''
\echo '🔔 4. VÉRIFICATION DES TRIGGERS'
\echo '================================'

SELECT
  trigger_name,
  event_object_table as table_name,
  '✅' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 5. VÉRIFICATION DES POLITIQUES RLS
-- ============================================
\echo ''
\echo '🔒 5. VÉRIFICATION DES POLITIQUES RLS'
\echo '======================================'

SELECT
  tablename,
  COUNT(*) as nombre_politiques,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo 'Détail des politiques par table:'
SELECT
  tablename,
  policyname,
  CASE
    WHEN cmd = 'SELECT' THEN '👁️ SELECT'
    WHEN cmd = 'INSERT' THEN '➕ INSERT'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    ELSE cmd
  END as operation,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 6. VÉRIFICATION DU STOCKAGE
-- ============================================
\echo ''
\echo '📦 6. VÉRIFICATION DU STOCKAGE'
\echo '=============================='

SELECT
  name as bucket_name,
  public,
  '✅' as status
FROM storage.buckets
ORDER BY name;

\echo ''
\echo 'Buckets attendus:'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'products')
    THEN '✅ products'
    ELSE '❌ products MANQUANT'
  END as products_bucket,
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars')
    THEN '✅ avatars'
    ELSE '❌ avatars MANQUANT'
  END as avatars_bucket,
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'shop-images')
    THEN '✅ shop-images'
    ELSE '❌ shop-images MANQUANT'
  END as shop_images_bucket,
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'chat-media')
    THEN '✅ chat-media'
    ELSE '❌ chat-media MANQUANT'
  END as chat_media_bucket;

-- ============================================
-- 7. VÉRIFICATION DES EXTENSIONS
-- ============================================
\echo ''
\echo '🧩 7. VÉRIFICATION DES EXTENSIONS'
\echo '=================================='

SELECT
  extname as extension_name,
  extversion as version,
  '✅' as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt')
ORDER BY extname;

-- ============================================
-- 8. STATISTIQUES DES DONNÉES
-- ============================================
\echo ''
\echo '📊 8. STATISTIQUES DES DONNÉES'
\echo '==============================='

DO $$
DECLARE
  profiles_count INT;
  products_count INT;
  categories_count INT;
  orders_count INT;
  reviews_count INT;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  SELECT COUNT(*) INTO products_count FROM products;
  SELECT COUNT(*) INTO categories_count FROM categories;
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO reviews_count FROM reviews;

  RAISE NOTICE '👤 Profils: %', profiles_count;
  RAISE NOTICE '📦 Produits: %', products_count;
  RAISE NOTICE '🏷️ Catégories: %', categories_count;
  RAISE NOTICE '🛒 Commandes: %', orders_count;
  RAISE NOTICE '⭐ Avis: %', reviews_count;
END $$;

-- ============================================
-- 9. VÉRIFICATION DES CONTRAINTES
-- ============================================
\echo ''
\echo '🔗 9. VÉRIFICATION DES CONTRAINTES'
\echo '==================================='

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  '✅' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 10. RÉSUMÉ FINAL
-- ============================================
\echo ''
\echo '📝 10. RÉSUMÉ FINAL'
\echo '==================='

SELECT
  '🎉 VÉRIFICATION TERMINÉE !' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as fonctions,
  (SELECT COUNT(*) FROM storage.buckets) as buckets_storage,
  (SELECT COUNT(*) FROM profiles) as profils,
  (SELECT COUNT(*) FROM products) as produits,
  NOW() as verified_at;

\echo ''
\echo '✅ Si tous les statuts sont ✅, votre base de données est correctement configurée !'
\echo '❌ Si vous voyez des ❌, revérifiez les migrations correspondantes.'
\echo ''
\echo '🚀 Votre marketplace est prête à fonctionner !'
