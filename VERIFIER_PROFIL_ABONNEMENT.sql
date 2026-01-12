-- ============================================
-- Vérifier le profil et l'abonnement d'un utilisateur
-- ============================================

-- 1. Vérifier votre profil actuel
SELECT
  id,
  email,
  full_name,
  is_seller,
  subscription_plan,
  subscription_status,
  subscription_end_date,
  shop_name,
  created_at
FROM profiles
WHERE email = 'VOTRE_EMAIL@exemple.com'  -- Remplacez par votre email
LIMIT 1;

-- 2. Vérifier tous les vendeurs avec abonnements
SELECT
  id,
  email,
  full_name,
  is_seller,
  subscription_plan,
  subscription_status,
  shop_name
FROM profiles
WHERE is_seller = true
ORDER BY created_at DESC
LIMIT 10;

-- 3. Si vous connaissez votre user_id, vérifier directement
-- SELECT * FROM profiles WHERE id = 'VOTRE_USER_ID';

-- ============================================
-- SOLUTIONS POSSIBLES
-- ============================================

-- Solution 1: Si is_seller = false, activer le statut vendeur
-- UPDATE profiles
-- SET is_seller = true
-- WHERE email = 'VOTRE_EMAIL@exemple.com';

-- Solution 2: Si subscription_plan est null, ajouter un abonnement
-- UPDATE profiles
-- SET
--   subscription_plan = 'free',  -- ou 'starter', 'pro', 'premium'
--   subscription_status = 'active',
--   subscription_end_date = NOW() + INTERVAL '7 days'  -- Pour plan gratuit 7 jours
-- WHERE email = 'VOTRE_EMAIL@exemple.com';

-- Solution 3: Si vous avez les deux problèmes
-- UPDATE profiles
-- SET
--   is_seller = true,
--   subscription_plan = 'free',
--   subscription_status = 'active',
--   subscription_end_date = NOW() + INTERVAL '7 days'
-- WHERE email = 'VOTRE_EMAIL@exemple.com';

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Après avoir appliqué une solution, vérifier à nouveau
-- SELECT
--   email,
--   is_seller,
--   subscription_plan,
--   subscription_status,
--   subscription_end_date
-- FROM profiles
-- WHERE email = 'VOTRE_EMAIL@exemple.com';
