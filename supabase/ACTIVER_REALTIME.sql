-- =============================================================
-- ACTIVER LE REALTIME SUR LES TABLES NECESSAIRES
-- =============================================================
-- Ce script active le Realtime pour les tables qui en ont besoin
-- Exécutez ce script dans Supabase SQL Editor
-- =============================================================

-- 1. ACTIVER REALTIME SUR LA TABLE PROFILES
-- (nécessaire pour les notifications d'abonnement)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 2. ACTIVER REALTIME SUR USER_SUBSCRIPTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;

-- 3. ACTIVER REALTIME SUR MESSAGES (pour le chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 4. ACTIVER REALTIME SUR CONVERSATIONS (pour le chat)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 5. ACTIVER REALTIME SUR NOTIFICATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Vérification : lister les tables avec Realtime activé
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- =============================================================
-- NOTE IMPORTANTE:
-- =============================================================
-- Si vous obtenez une erreur comme:
-- "relation already exists in publication"
-- C'est que le Realtime est déjà activé - ignorez cette erreur.
--
-- Après avoir exécuté ce script, les notifications en temps réel
-- devraient fonctionner correctement dans l'application.
-- =============================================================
