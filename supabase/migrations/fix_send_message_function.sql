-- Fix send_message function - simplified version without message_type and image_url columns
-- These columns don't exist in the actual database schema

-- Drop ALL possible versions of send_message function
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

-- Create the new simplified version
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
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

  -- Insérer le message (sans message_type et image_url)
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Déterminer le preview du message
  IF p_offer_price IS NOT NULL THEN
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
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, numeric) TO authenticated;
