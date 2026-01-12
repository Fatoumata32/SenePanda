-- =============================================================
-- ACTIVER LE REALTIME SUR LES TABLES NECESSAIRES (VERSION SAFE)
-- =============================================================
-- Ce script active le Realtime uniquement sur les tables qui ne l'ont pas encore
-- Exécutez ce script dans Supabase SQL Editor
-- =============================================================

DO $$
BEGIN
  -- 1. ACTIVER REALTIME SUR LA TABLE PROFILES (si pas déjà activé)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    RAISE NOTICE '✅ Realtime activé sur profiles';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur profiles';
  END IF;

  -- 2. ACTIVER REALTIME SUR USER_SUBSCRIPTIONS (si pas déjà activé)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'user_subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;
    RAISE NOTICE '✅ Realtime activé sur user_subscriptions';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur user_subscriptions';
  END IF;

  -- 3. ACTIVER REALTIME SUR MESSAGES (pour le chat)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE '✅ Realtime activé sur messages';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur messages';
  END IF;

  -- 4. ACTIVER REALTIME SUR CONVERSATIONS (pour le chat)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    RAISE NOTICE '✅ Realtime activé sur conversations';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur conversations';
  END IF;

  -- 5. ACTIVER REALTIME SUR NOTIFICATIONS
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Realtime activé sur notifications';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur notifications';
  END IF;

  -- 6. ACTIVER REALTIME SUR PRODUCTS (pour les mises à jour de prix en live)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
    RAISE NOTICE '✅ Realtime activé sur products';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur products';
  END IF;

  -- 7. ACTIVER REALTIME SUR LIVE_SESSIONS (pour les sessions live)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'live_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
    RAISE NOTICE '✅ Realtime activé sur live_sessions';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur live_sessions';
  END IF;

  -- 8. ACTIVER REALTIME SUR LIVE_CHAT_MESSAGES (pour le chat live)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'live_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;
    RAISE NOTICE '✅ Realtime activé sur live_chat_messages';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur live_chat_messages';
  END IF;

  -- 9. ACTIVER REALTIME SUR ORDERS (pour les notifications de commande)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    RAISE NOTICE '✅ Realtime activé sur orders';
  ELSE
    RAISE NOTICE '⚠️  Realtime déjà activé sur orders';
  END IF;

END $$;

-- =============================================================
-- VÉRIFICATION FINALE
-- =============================================================
-- Lister toutes les tables avec Realtime activé
SELECT
  schemaname,
  tablename,
  '✅ Realtime activé' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- =============================================================
-- RÉSULTAT ATTENDU
-- =============================================================
-- Vous devriez voir au minimum ces tables:
-- - conversations
-- - live_chat_messages
-- - live_sessions
-- - messages
-- - notifications
-- - orders
-- - products
-- - profiles
-- - user_subscriptions
-- =============================================================
