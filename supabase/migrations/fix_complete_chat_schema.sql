-- Complete fix for chat system schema
-- This migration adds missing columns and fixes all functions

-- 1. Add missing columns to conversations table if they don't exist
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_preview text;

-- 2. Add missing columns to messages table if they don't exist
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system'));

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Drop ALL versions of send_message function
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

-- 4. Create send_message function with full support
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
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

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

  IF p_message_type = 'image' OR p_image_url IS NOT NULL THEN
    v_message_preview := '📷 Photo';
  ELSIF p_offer_price IS NOT NULL THEN
    v_message_preview := '💰 Offre de prix';
  ELSE
    v_message_preview := LEFT(COALESCE(p_content, ''), 100);
  END IF;

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

GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;
