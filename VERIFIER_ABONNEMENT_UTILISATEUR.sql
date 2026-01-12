-- ============================================
-- Vérifier l'abonnement d'un utilisateur
-- ============================================

-- 1. LISTER TOUS LES UTILISATEURS ET LEUR PLAN
SELECT
  id,
  full_name,
  phone,
  subscription_plan,
  subscription_status,
  subscription_expires_at,
  is_seller,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 2. ACTIVER L'ABONNEMENT PREMIUM POUR UN UTILISATEUR
-- Remplacez 'VOTRE_USER_ID' par votre vrai ID utilisateur
-- Vous pouvez le trouver dans la requête ci-dessus

/*
UPDATE profiles
SET
  subscription_plan = 'premium',
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days',  -- Expire dans 30 jours
  updated_at = NOW()
WHERE id = 'VOTRE_USER_ID';
*/

-- 3. VÉRIFIER QUE LA MISE À JOUR A FONCTIONNÉ
/*
SELECT
  full_name,
  subscription_plan,
  subscription_status,
  subscription_expires_at,
  subscription_expires_at > NOW() as is_not_expired
FROM profiles
WHERE id = 'VOTRE_USER_ID';
*/

-- 4. SI VOUS VOULEZ ACTIVER PREMIUM POUR TOUS LES VENDEURS (À UTILISER AVEC PRÉCAUTION!)
/*
UPDATE profiles
SET
  subscription_plan = 'premium',
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE is_seller = true;
*/
