-- ===================================================================
-- FIX: Policies RLS pour la table messages
-- ===================================================================
-- Permet aux utilisateurs d'envoyer et recevoir des messages
-- ===================================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Activer RLS sur la table messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "Users can view messages in their conversations"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Policy 2: Les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "Users can send messages in their conversations"
ON messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
  AND auth.uid() = sender_id
);

-- Policy 3: Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Policy 4: Les utilisateurs peuvent mettre à jour leurs propres messages (pour édition)
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- ===================================================================
-- Vérification: Afficher toutes les policies actives
-- ===================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS créées pour la table messages';
  RAISE NOTICE '   - Users can view messages in their conversations';
  RAISE NOTICE '   - Users can send messages in their conversations';
  RAISE NOTICE '   - Users can delete their own messages';
  RAISE NOTICE '   - Users can update their own messages';
END $$;
