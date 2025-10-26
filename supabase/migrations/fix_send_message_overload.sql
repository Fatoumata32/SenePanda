-- Fix send_message function overloading conflict
-- Drop the old version and keep only the new one with media support

-- Drop the old send_message function (without media parameters)
DROP FUNCTION IF EXISTS public.send_message(uuid, uuid, text, numeric);

-- Make sure we only have the new version with all parameters
-- This function should already exist from add_media_support_to_messages.sql
-- If it doesn't exist, create it

CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_voice_url text DEFAULT NULL,
  p_voice_duration integer DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
  v_buyer_id uuid;
  v_seller_id uuid;
  v_is_buyer boolean;
BEGIN
  -- Get conversation details
  SELECT buyer_id, seller_id
  INTO v_buyer_id, v_seller_id
  FROM conversations
  WHERE id = p_conversation_id;

  -- Check if sender is buyer or seller
  v_is_buyer := (p_sender_id = v_buyer_id);

  -- Insert the message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    voice_url,
    voice_duration,
    offer_price,
    created_at
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_voice_url,
    p_voice_duration,
    p_offer_price,
    NOW()
  )
  RETURNING id INTO v_message_id;

  -- Update conversation
  UPDATE conversations
  SET
    last_message_at = NOW(),
    last_message_preview = COALESCE(
      CASE
        WHEN p_message_type = 'text' THEN p_content
        WHEN p_message_type = 'image' THEN '📷 Photo'
        WHEN p_message_type = 'voice' THEN '🎤 Message vocal'
        ELSE 'Message'
      END,
      'Message'
    ),
    buyer_unread_count = CASE WHEN v_is_buyer THEN 0 ELSE buyer_unread_count + 1 END,
    seller_unread_count = CASE WHEN v_is_buyer THEN seller_unread_count + 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_message(uuid, uuid, text, text, text, text, integer, numeric) TO authenticated;
