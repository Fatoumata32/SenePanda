-- =============================================
-- 🧪 COMMANDES SQL POUR TESTER LE SYSTÈME
-- =============================================
-- Instructions: Copiez-collez ces commandes une par une
-- dans le SQL Editor de Supabase pour tester le workflow
-- =============================================

-- =============================================
-- ÉTAPE 0: VÉRIFIER QUE TOUT EST BIEN CONFIGURÉ
-- =============================================

-- Vérifier que toutes les colonnes existent dans profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE 'subscription%'
ORDER BY column_name;

-- Résultat attendu: 7 colonnes
-- subscription_billing_period
-- subscription_expires_at
-- subscription_plan
-- subscription_requested_at
-- subscription_requested_plan
-- subscription_starts_at
-- subscription_status

-- =============================================

-- Vérifier que Realtime est activé sur profiles
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'profiles';

-- Résultat attendu: profiles
-- Si vide → Aller dans Database > Replication et activer profiles

-- =============================================

-- Vérifier que les fonctions existent
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%subscription%'
ORDER BY routine_name;

-- Résultat attendu:
-- approve_subscription_request
-- reject_subscription_request
-- request_subscription

-- =============================================
-- ÉTAPE 1: VOIR LES DEMANDES EN ATTENTE
-- =============================================

-- Lister toutes les demandes d'abonnement en attente
SELECT
  id,
  user_id,
  full_name,
  shop_name,
  phone,
  email,
  plan_type,
  billing_period,
  requested_at,
  plan_name,
  amount_due
FROM pending_subscription_requests
ORDER BY requested_at DESC;

-- Si aucune demande, créez-en une dans l'app mobile d'abord!

-- =============================================
-- ÉTAPE 2: RÉCUPÉRER L'ID DE LA DERNIÈRE DEMANDE
-- =============================================

-- Récupérer la demande la plus récente
SELECT
  id AS request_id,
  user_id,
  full_name,
  plan_type,
  billing_period,
  requested_at
FROM pending_subscription_requests
ORDER BY requested_at DESC
LIMIT 1;

-- ⚠️ COPIEZ les valeurs de 'request_id' et 'user_id' pour l'étape suivante

-- =============================================
-- ÉTAPE 3: APPROUVER LA DEMANDE
-- =============================================

-- Remplacez les valeurs entre < > par les vraies valeurs copiées ci-dessus
-- Exemple:
-- SELECT approve_subscription_request(
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- request_id
--   'user123-abc-def-456',                    -- admin_id (votre user_id)
--   'Paiement Orange Money vérifié - 15000 FCFA reçus'
-- );

SELECT approve_subscription_request(
  '<REQUEST_ID>',        -- Remplacez par l'ID de la demande (colonne 'request_id')
  '<ADMIN_USER_ID>',     -- Remplacez par votre ID utilisateur (simule l'admin)
  'Paiement vérifié'     -- Notes optionnelles
);

-- Résultat attendu:
-- {
--   "success": true,
--   "message": "Abonnement activé avec succès",
--   "user_id": "...",
--   "plan_type": "pro",
--   "expires_at": "2025-12-30 ..."
-- }

-- ⚠️ IMPORTANT: Dès que cette commande s'exécute,
-- l'utilisateur devrait recevoir la notification dans l'app!

-- =============================================
-- ÉTAPE 4: VÉRIFIER QUE L'ABONNEMENT EST ACTIVÉ
-- =============================================

-- Vérifier le profil de l'utilisateur (remplacez <USER_ID>)
SELECT
  id,
  full_name,
  subscription_plan,
  subscription_status,
  subscription_starts_at,
  subscription_expires_at,
  subscription_billing_period,
  is_seller
FROM profiles
WHERE id = '<USER_ID>';

-- Résultat attendu:
-- subscription_plan: "pro" (ou le plan choisi)
-- subscription_status: "active"
-- subscription_starts_at: maintenant
-- subscription_expires_at: dans 30 jours (ou 365 si yearly)
-- is_seller: true

-- =============================================
-- ÉTAPE 5: VÉRIFIER L'HISTORIQUE DES DEMANDES
-- =============================================

-- Voir toutes les demandes (approuvées, en attente, rejetées)
SELECT
  sr.id,
  sr.user_id,
  p.full_name,
  sr.plan_type,
  sr.billing_period,
  sr.status,
  sr.requested_at,
  sr.processed_at,
  sr.admin_notes
FROM subscription_requests sr
JOIN profiles p ON sr.user_id = p.id
ORDER BY sr.requested_at DESC
LIMIT 10;

-- =============================================
-- COMMANDES UTILES POUR DEBUGGING
-- =============================================

-- Voir tous les profils avec abonnement actif
SELECT
  id,
  full_name,
  shop_name,
  subscription_plan,
  subscription_status,
  subscription_expires_at,
  CASE
    WHEN subscription_expires_at > NOW() THEN
      EXTRACT(DAY FROM subscription_expires_at - NOW()) || ' jours restants'
    ELSE
      'Expiré'
  END AS days_remaining
FROM profiles
WHERE subscription_plan IS NOT NULL
  AND subscription_plan != 'free'
ORDER BY subscription_expires_at DESC;

-- =============================================

-- Réinitialiser un utilisateur (ATTENTION: use avec précaution!)
-- Utilise ceci si tu veux tester le workflow plusieurs fois avec le même utilisateur
/*
UPDATE profiles
SET
  subscription_plan = 'free',
  subscription_status = 'active',
  subscription_starts_at = NULL,
  subscription_expires_at = NULL,
  subscription_requested_plan = NULL,
  subscription_requested_at = NULL,
  subscription_billing_period = NULL,
  is_seller = FALSE
WHERE id = '<USER_ID>';

-- Supprimer les demandes de cet utilisateur
DELETE FROM subscription_requests
WHERE user_id = '<USER_ID>';
*/

-- =============================================

-- Marquer un abonnement comme expiré (pour tester l'expiration)
/*
UPDATE profiles
SET
  subscription_status = 'expired',
  subscription_expires_at = NOW() - INTERVAL '1 day'
WHERE id = '<USER_ID>';
*/

-- =============================================
-- REJETER UNE DEMANDE (au lieu de l'approuver)
-- =============================================

-- Si vous voulez rejeter une demande au lieu de l'approuver:
/*
SELECT reject_subscription_request(
  '<REQUEST_ID>',
  '<ADMIN_USER_ID>',
  'Paiement non reçu - Merci de nous contacter'
);
*/

-- =============================================
-- STATISTIQUES DU SYSTÈME
-- =============================================

-- Obtenir des statistiques sur les abonnements
SELECT
  'Total utilisateurs' AS metric,
  COUNT(*) AS value
FROM profiles
UNION ALL
SELECT
  'Abonnements actifs',
  COUNT(*)
FROM profiles
WHERE subscription_status = 'active' AND subscription_plan != 'free'
UNION ALL
SELECT
  'Demandes en attente',
  COUNT(*)
FROM subscription_requests
WHERE status = 'pending'
UNION ALL
SELECT
  'Abonnements expirés',
  COUNT(*)
FROM profiles
WHERE subscription_status = 'expired'
UNION ALL
SELECT
  'Vendeurs actifs',
  COUNT(*)
FROM profiles
WHERE is_seller = TRUE;

-- =============================================
-- FIN DES COMMANDES DE TEST
-- =============================================

-- ✅ Workflow de test complet:
-- 1. Vérifier configuration (ÉTAPE 0)
-- 2. Créer demande dans l'app mobile
-- 3. Voir les demandes (ÉTAPE 1)
-- 4. Récupérer l'ID (ÉTAPE 2)
-- 5. Approuver (ÉTAPE 3)
-- 6. Vérifier dans l'app → Notification automatique!
-- 7. Vérifier le profil (ÉTAPE 4)

-- 🎉 Bonne chance!
