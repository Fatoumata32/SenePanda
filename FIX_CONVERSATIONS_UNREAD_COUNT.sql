-- ============================================
-- FIX: Ajouter colonnes unread_count à conversations
-- ============================================

-- Ajouter buyer_unread_count
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS buyer_unread_count INTEGER DEFAULT 0;

-- Ajouter seller_unread_count
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS seller_unread_count INTEGER DEFAULT 0;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_conversations_unread
ON conversations(buyer_unread_count, seller_unread_count);

-- Fonction pour mettre à jour automatiquement les compteurs
CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le message est du vendeur, incrémenter buyer_unread_count
  IF NEW.sender_id = (SELECT seller_id FROM conversations WHERE id = NEW.conversation_id) THEN
    UPDATE conversations
    SET buyer_unread_count = buyer_unread_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
  -- Sinon, incrémenter seller_unread_count
  ELSE
    UPDATE conversations
    SET seller_unread_count = seller_unread_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le compteur lors d'un nouveau message
DROP TRIGGER IF EXISTS trig_update_conversation_unread ON messages;
CREATE TRIGGER trig_update_conversation_unread
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_unread_count();

-- Fonction pour réinitialiser le compteur quand l'utilisateur lit les messages
CREATE OR REPLACE FUNCTION reset_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_buyer_id UUID;
BEGIN
  -- Récupérer le buyer_id de la conversation
  SELECT buyer_id INTO v_buyer_id
  FROM conversations
  WHERE id = p_conversation_id;

  -- Si l'utilisateur est l'acheteur, réinitialiser buyer_unread_count
  IF p_user_id = v_buyer_id THEN
    UPDATE conversations
    SET buyer_unread_count = 0
    WHERE id = p_conversation_id;
  -- Sinon, réinitialiser seller_unread_count
  ELSE
    UPDATE conversations
    SET seller_unread_count = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Vérification
SELECT
  '✅ Colonnes unread_count ajoutées à conversations' as status;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('buyer_unread_count', 'seller_unread_count')
ORDER BY column_name;
