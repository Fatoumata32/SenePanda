-- ============================================
-- DIAGNOSTIC: Système Panda Coins
-- ============================================

-- ÉTAPE 1: Vérifier les tables
-- ============================================

-- Vérifier si loyalty_points existe
SELECT
  table_name,
  'loyalty_points' as table_checked,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points') as exists
FROM information_schema.tables WHERE table_name = 'loyalty_points'
UNION ALL
SELECT
  table_name,
  'points_transactions' as table_checked,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'points_transactions') as exists
FROM information_schema.tables WHERE table_name = 'points_transactions'
UNION ALL
SELECT
  table_name,
  'rewards' as table_checked,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') as exists
FROM information_schema.tables WHERE table_name = 'rewards'
UNION ALL
SELECT
  table_name,
  'claimed_rewards' as table_checked,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'claimed_rewards') as exists
FROM information_schema.tables WHERE table_name = 'claimed_rewards';


-- ÉTAPE 2: Si les tables existent, voir les données
-- ============================================

-- Compter les utilisateurs avec des coins
SELECT COUNT(*) as users_with_coins
FROM loyalty_points
WHERE points > 0;

-- Voir quelques utilisateurs avec leurs coins
SELECT
  lp.user_id,
  p.email,
  p.full_name,
  lp.points,
  lp.total_earned,
  lp.total_spent,
  lp.level,
  lp.created_at
FROM loyalty_points lp
LEFT JOIN profiles p ON p.id = lp.user_id
ORDER BY lp.points DESC
LIMIT 10;

-- Compter les transactions
SELECT
  type,
  COUNT(*) as count,
  SUM(points) as total_points
FROM points_transactions
GROUP BY type
ORDER BY count DESC;

-- Voir les dernières transactions
SELECT
  pt.id,
  p.full_name,
  pt.points,
  pt.type,
  pt.description,
  pt.created_at
FROM points_transactions pt
LEFT JOIN profiles p ON p.id = pt.user_id
ORDER BY pt.created_at DESC
LIMIT 10;

-- Compter les récompenses disponibles
SELECT COUNT(*) as total_rewards
FROM rewards
WHERE is_active = true;

-- Voir les récompenses
SELECT
  id,
  title,
  points_cost,
  reward_type,
  stock,
  is_active
FROM rewards
ORDER BY points_cost
LIMIT 10;


-- ÉTAPE 3: Vérifier les fonctions
-- ============================================

-- Liste des fonctions coins
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%coin%' OR routine_name LIKE '%point%'
ORDER BY routine_name;


-- ============================================
-- RÉSUMÉ ATTENDU
-- ============================================

/*
Si tout fonctionne, vous devriez voir:

1. Tables existantes:
   ✅ loyalty_points
   ✅ points_transactions
   ✅ rewards
   ✅ claimed_rewards

2. Utilisateurs avec coins: > 0
3. Transactions enregistrées
4. Récompenses disponibles
5. Fonctions: update_loyalty_points, etc.

Si une table manque → Exécuter SETUP_COINS_SYSTEM_FINAL.sql
*/
