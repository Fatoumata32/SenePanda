-- ========================================
-- VÉRIFICATION DU SYSTÈME DE RÉCOMPENSES
-- Exécutez ce script pour vérifier que tout est bien configuré
-- ========================================

-- 1. Vérifier que les tables existent
SELECT 'Tables existantes:' as verification;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('rewards_catalog', 'user_rewards', 'loyalty_points', 'points_transactions')
ORDER BY table_name;

-- 2. Vérifier que les fonctions existent
SELECT 'Fonctions existantes:' as verification;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('redeem_reward', 'convert_points_to_discount', 'apply_discount_reward', 'get_user_active_rewards', 'register_referral')
ORDER BY routine_name;

-- 3. Compter les récompenses dans le catalogue
SELECT 'Nombre de récompenses:' as verification;
SELECT category, COUNT(*) as nombre
FROM rewards_catalog
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 4. Afficher toutes les récompenses disponibles
SELECT 'Récompenses disponibles:' as verification;
SELECT
  title,
  category,
  points_cost,
  value,
  duration_days,
  stock,
  icon
FROM rewards_catalog
WHERE is_active = true
ORDER BY points_cost;

-- 5. Vérifier un utilisateur test (remplacez par votre user_id)
-- SELECT 'Points utilisateur test:' as verification;
-- SELECT points, total_earned, level
-- FROM loyalty_points
-- WHERE user_id = 'VOTRE-USER-ID-ICI';

-- 6. Tester la fonction redeem_reward (sans l'exécuter réellement)
SELECT 'Test de la fonction redeem_reward:' as verification;
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'redeem_reward'
LIMIT 1;
