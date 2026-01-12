-- ===================================================================
-- FIX: Policies RLS pour la table conversations
-- ===================================================================
-- Permet aux utilisateurs de créer et gérer leurs conversations
-- ===================================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Sellers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversation read status" ON conversations;

-- Activer RLS sur la table conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les acheteurs peuvent voir leurs conversations
CREATE POLICY "Buyers can view their conversations"
ON conversations
FOR SELECT
USING (auth.uid() = buyer_id);

-- Policy 2: Les vendeurs peuvent voir leurs conversations
CREATE POLICY "Sellers can view their conversations"
ON conversations
FOR SELECT
USING (auth.uid() = seller_id);

-- Policy 3: Les acheteurs peuvent créer des conversations
CREATE POLICY "Buyers can create conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Policy 4: Les utilisateurs peuvent mettre à jour le compteur de non-lus
CREATE POLICY "Users can update conversation read status"
ON conversations
FOR UPDATE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Policy 5: Les utilisateurs peuvent supprimer leurs conversations
CREATE POLICY "Users can delete their conversations"
ON conversations
FOR DELETE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- ===================================================================
-- Vérification: Afficher toutes les policies actives
-- ===================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS créées pour la table conversations';
  RAISE NOTICE '   - Buyers can view their conversations';
  RAISE NOTICE '   - Sellers can view their conversations';
  RAISE NOTICE '   - Buyers can create conversations';
  RAISE NOTICE '   - Users can update conversation read status';
  RAISE NOTICE '   - Users can delete their conversations';
END $$;
