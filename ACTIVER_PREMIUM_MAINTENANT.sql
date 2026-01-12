-- ============================================
-- Script d'activation immédiate Premium
-- ============================================
-- Ce script active l'abonnement Premium pour votre compte
-- avec tous les champs nécessaires pour débloquer le Live Shopping

-- ÉTAPE 1: Lister vos utilisateurs pour trouver votre ID
SELECT
  id,
  full_name,
  phone,
  subscription_plan,
  subscription_status,
  subscription_expires_at,
  is_seller
FROM profiles
WHERE is_seller = true
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 2: Activer Premium pour UN utilisateur spécifique
-- ⚠️ IMPORTANT: Remplacez 'VOTRE_USER_ID' par votre vrai ID de la requête ci-dessus
-- Exemple: UPDATE profiles SET ... WHERE id = '123e4567-e89b-12d3-a456-426614174000';

UPDATE profiles
SET
  subscription_plan = 'premium',
  subscription_status = 'active',  -- ⚡ ESSENTIEL pour débloquer le Live
  subscription_expires_at = NOW() + INTERVAL '30 days',  -- Expire dans 30 jours
  updated_at = NOW()
WHERE id = 'VOTRE_USER_ID'  -- ⚠️ REMPLACEZ ICI
  AND is_seller = true;

-- ÉTAPE 3: Vérifier que l'activation a fonctionné
SELECT
  full_name,
  phone,
  subscription_plan,
  subscription_status,
  subscription_expires_at,
  subscription_expires_at > NOW() as abonnement_valide,
  EXTRACT(DAY FROM (subscription_expires_at - NOW())) as jours_restants
FROM profiles
WHERE id = 'VOTRE_USER_ID';  -- ⚠️ REMPLACEZ ICI

-- RÉSULTAT ATTENDU:
-- subscription_plan: "premium"
-- subscription_status: "active"
-- abonnement_valide: true
-- jours_restants: 30

-- ============================================
-- ALTERNATIVE: Activer pour TOUS les vendeurs
-- ============================================
-- ⚠️ À UTILISER AVEC PRÉCAUTION!
-- Ceci active Premium pour TOUS les comptes vendeurs

/*
UPDATE profiles
SET
  subscription_plan = 'premium',
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE is_seller = true;

-- Vérifier combien d'utilisateurs ont été mis à jour
SELECT COUNT(*) as nb_vendeurs_premium
FROM profiles
WHERE subscription_plan = 'premium'
  AND subscription_status = 'active'
  AND is_seller = true;
*/

-- ============================================
-- DEBUG: Si le Live Shopping ne se débloque toujours pas
-- ============================================

-- 1. Vérifier tous les champs de votre profil
SELECT *
FROM profiles
WHERE id = 'VOTRE_USER_ID';  -- ⚠️ REMPLACEZ ICI

-- 2. Vérifier que la table subscription_plans existe et contient le plan premium
SELECT *
FROM subscription_plans
WHERE plan_type = 'premium';

-- Si cette requête échoue, exécutez d'abord:
-- setup_complete_abonnements.sql

-- 3. Forcer la synchronisation (si nécessaire)
UPDATE profiles
SET updated_at = NOW()
WHERE id = 'VOTRE_USER_ID';  -- ⚠️ REMPLACEZ ICI
