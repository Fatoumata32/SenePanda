-- =====================================================
-- ACTIVER REALTIME POUR LIVE_SESSIONS
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor

-- =====================================================
-- ÉTAPE 1: Activer le Realtime sur les tables
-- =====================================================

-- Activer le realtime pour live_sessions
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
        RAISE NOTICE '✅ Realtime activé pour live_sessions';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ live_sessions déjà dans supabase_realtime';
    END;
END $$;

-- Activer également pour live_chat_messages (si pas déjà fait)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;
        RAISE NOTICE '✅ Realtime activé pour live_chat_messages';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ live_chat_messages déjà dans supabase_realtime';
    END;
END $$;

-- Activer pour live_viewers (si pas déjà fait)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_viewers;
        RAISE NOTICE '✅ Realtime activé pour live_viewers';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ live_viewers déjà dans supabase_realtime';
    END;
END $$;

-- Vérifier les tables dans la publication realtime
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- =====================================================
-- ÉTAPE 2: Activer RLS et créer les Policies
-- =====================================================
-- IMPORTANT: Le Realtime Supabase respecte les RLS policies !
-- Sans policy SELECT, les utilisateurs ne reçoivent pas les updates.

-- Activer RLS sur live_sessions (si pas déjà fait)
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut LIRE les sessions live/scheduled (pour le realtime)
DROP POLICY IF EXISTS "live_sessions_select_public" ON live_sessions;
CREATE POLICY "live_sessions_select_public" ON live_sessions
    FOR SELECT
    USING (status IN ('live', 'scheduled', 'ended'));

-- Policy: Le vendeur peut tout faire sur ses propres sessions
DROP POLICY IF EXISTS "live_sessions_seller_all" ON live_sessions;
CREATE POLICY "live_sessions_seller_all" ON live_sessions
    FOR ALL
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- =====================================================
-- Policies pour live_chat_messages
-- =====================================================
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut LIRE les messages (pour le realtime du chat)
DROP POLICY IF EXISTS "live_chat_messages_select_public" ON live_chat_messages;
CREATE POLICY "live_chat_messages_select_public" ON live_chat_messages
    FOR SELECT
    USING (true);

-- Les utilisateurs authentifiés peuvent envoyer des messages
DROP POLICY IF EXISTS "live_chat_messages_insert_auth" ON live_chat_messages;
CREATE POLICY "live_chat_messages_insert_auth" ON live_chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres messages
DROP POLICY IF EXISTS "live_chat_messages_delete_own" ON live_chat_messages;
CREATE POLICY "live_chat_messages_delete_own" ON live_chat_messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- Policies pour live_viewers
-- =====================================================
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour compter les viewers)
DROP POLICY IF EXISTS "live_viewers_select_public" ON live_viewers;
CREATE POLICY "live_viewers_select_public" ON live_viewers
    FOR SELECT
    USING (true);

-- Insertion pour utilisateurs authentifiés
DROP POLICY IF EXISTS "live_viewers_insert_auth" ON live_viewers;
CREATE POLICY "live_viewers_insert_auth" ON live_viewers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Mise à jour et suppression pour son propre enregistrement
DROP POLICY IF EXISTS "live_viewers_update_own" ON live_viewers;
CREATE POLICY "live_viewers_update_own" ON live_viewers
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "live_viewers_delete_own" ON live_viewers;
CREATE POLICY "live_viewers_delete_own" ON live_viewers
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- Policies pour live_reactions (si la table existe)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'live_reactions') THEN
        ALTER TABLE live_reactions ENABLE ROW LEVEL SECURITY;
        
        -- Lecture publique
        DROP POLICY IF EXISTS "live_reactions_select_public" ON live_reactions;
        CREATE POLICY "live_reactions_select_public" ON live_reactions
            FOR SELECT USING (true);
        
        -- Insertion pour utilisateurs authentifiés
        DROP POLICY IF EXISTS "live_reactions_insert_auth" ON live_reactions;
        CREATE POLICY "live_reactions_insert_auth" ON live_reactions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        RAISE NOTICE '✅ Policies créées pour live_reactions';
    END IF;
END $$;

-- =====================================================
-- Policies pour live_featured_products (si la table existe)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'live_featured_products') THEN
        ALTER TABLE live_featured_products ENABLE ROW LEVEL SECURITY;
        
        -- Lecture publique
        DROP POLICY IF EXISTS "live_featured_products_select_public" ON live_featured_products;
        CREATE POLICY "live_featured_products_select_public" ON live_featured_products
            FOR SELECT USING (true);
        
        -- Le vendeur peut gérer ses produits mis en avant
        DROP POLICY IF EXISTS "live_featured_products_seller_all" ON live_featured_products;
        CREATE POLICY "live_featured_products_seller_all" ON live_featured_products
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM live_sessions ls 
                    WHERE ls.id = live_featured_products.live_session_id 
                    AND ls.seller_id = auth.uid()
                )
            );
            
        RAISE NOTICE '✅ Policies créées pour live_featured_products';
    END IF;
END $$;

-- =====================================================
-- Vérification des policies
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('live_sessions', 'live_chat_messages', 'live_viewers', 'live_reactions', 'live_featured_products')
ORDER BY tablename, policyname;

-- =====================================================
-- Si le realtime ne fonctionne toujours pas, essayez:
-- =====================================================

-- 1. Allez dans Supabase Dashboard > Database > Replication
-- 2. Activez "Realtime" pour la table "live_sessions"
-- 3. Ou exécutez manuellement:

-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime FOR TABLE live_sessions, profiles, live_chat_messages, live_viewers;

SELECT '🎯 Script terminé - Vérifiez les policies ci-dessus' as status;
