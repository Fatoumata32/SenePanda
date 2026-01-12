-- ============================================
-- FIX: Menu déroulant Commandes pour vendeurs
-- ============================================

-- ÉTAPE 1: Diagnostiquer le problème
-- ============================================

-- Vérifier tous les profils vendeurs
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
LIMIT 20;

-- Si aucun résultat → Aucun vendeur dans la base
-- Si résultats → Vérifier la colonne is_seller


-- ÉTAPE 2: Vérifier un utilisateur spécifique
-- ============================================

-- Remplacez 'VOTRE_EMAIL' par l'email du vendeur concerné
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
WHERE email = 'VOTRE_EMAIL@exemple.com';

-- Attendu:
-- is_seller = true
-- subscription_plan = 'free', 'starter', 'pro', ou 'premium'


-- ÉTAPE 3: SOLUTIONS
-- ============================================

-- Solution A: Activer le statut vendeur
-- (Si is_seller = false ou NULL)
UPDATE profiles
SET is_seller = true
WHERE email = 'VOTRE_EMAIL@exemple.com';

-- Solution B: Ajouter un abonnement gratuit
-- (Si subscription_plan = NULL)
UPDATE profiles
SET
  subscription_plan = 'free',
  subscription_status = 'active',
  subscription_end_date = NOW() + INTERVAL '7 days'
WHERE email = 'VOTRE_EMAIL@exemple.com';

-- Solution C: Tout configurer d'un coup (RECOMMANDÉ)
-- Active le vendeur + abonnement gratuit 7 jours
UPDATE profiles
SET
  is_seller = true,
  subscription_plan = 'free',
  subscription_status = 'active',
  subscription_end_date = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE email = 'VOTRE_EMAIL@exemple.com';


-- ÉTAPE 4: Vérification finale
-- ============================================

-- Vérifier que tout est correct
SELECT
  email,
  is_seller,
  subscription_plan,
  subscription_status,
  subscription_end_date,
  shop_name
FROM profiles
WHERE email = 'VOTRE_EMAIL@exemple.com';

-- Résultat attendu:
-- is_seller: true ✅
-- subscription_plan: free (ou autre) ✅
-- subscription_status: active ✅


-- ÉTAPE 5: Activer TOUS les vendeurs (si nécessaire)
-- ============================================

-- Si vous avez plusieurs vendeurs à corriger
UPDATE profiles
SET
  is_seller = true,
  subscription_plan = COALESCE(subscription_plan, 'free'),
  subscription_status = 'active',
  subscription_end_date = CASE
    WHEN subscription_end_date IS NULL THEN NOW() + INTERVAL '7 days'
    ELSE subscription_end_date
  END
WHERE shop_name IS NOT NULL  -- Assume qu'un vendeur a configuré sa boutique
  OR is_seller = true;


-- ============================================
-- NOTES IMPORTANTES
-- ============================================

/*
Le menu déroulant "Commandes" s'affiche SI ET SEULEMENT SI:
1. profile.is_seller = true ✅

Le menu contient 2 options:
- "Mes Ventes" → /seller/orders (nécessite un abonnement)
- "Mes Achats" → /orders

Si is_seller = false:
- Affiche uniquement "Mes Commandes" (bouton simple, pas déroulant)
- Route directe vers /orders
*/

-- ============================================
-- DÉPANNAGE
-- ============================================

-- Problème: Le menu ne se déplie pas après avoir cliqué
-- Cause: Peut-être un problème d'état React
-- Solution: Redémarrer complètement l'application

-- Problème: "Mes Ventes" redirige mais affiche une alerte
-- Cause: Manque subscription_plan
-- Solution: Utiliser Solution B ou C ci-dessus

-- Problème: Le menu "Commandes" n'apparaît pas du tout
-- Cause: is_seller = false
-- Solution: Utiliser Solution A ou C ci-dessus
