-- Fix messages table and send_message function
-- This migration adds missing columns and updates the function

-- Step 1: Add missing columns to messages table if they don't exist
DO $$
BEGIN
  -- Add offer_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'offer_price'
  ) THEN
    ALTER TABLE messages ADD COLUMN offer_price numeric;
  END IF;

  -- Add offer_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'offer_status'
  ) THEN
    ALTER TABLE messages ADD COLUMN offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;

  -- Add message_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system'));
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;
END $$;

-- Step 2: Create index for faster queries on offer status
CREATE INDEX IF NOT EXISTS idx_messages_offer_status ON messages(offer_status) WHERE offer_status IS NOT NULL;

-- Step 3: Drop all existing versions of send_message function
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

-- Step 4: Create the complete send_message function
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
  v_message_preview text;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message avec toutes les colonnes
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Déterminer le preview du message
  IF p_message_type = 'image' THEN
    v_message_preview := '📷 Photo';
  ELSIF p_offer_price IS NOT NULL THEN
    v_message_preview := '💰 Offre de prix';
  ELSE
    v_message_preview := LEFT(COALESCE(p_content, ''), 100);
  END IF;

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = v_message_preview,
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;
