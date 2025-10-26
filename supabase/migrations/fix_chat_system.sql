-- Fix Chat System Migration
-- This script only creates missing elements

-- Drop and recreate the function to ensure it's up to date
DROP FUNCTION IF EXISTS get_conversations_with_details(uuid);

CREATE OR REPLACE FUNCTION get_conversations_with_details(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  is_seller boolean,
  product_id uuid,
  product_title text,
  product_image text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer,
  other_user_online boolean,
  other_user_last_seen timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END as other_user_id,
    COALESCE(p.full_name, p.username, 'Utilisateur') as other_user_name,
    p.avatar_url as other_user_avatar,
    (c.seller_id != p_user_id) as is_seller,
    c.product_id,
    prod.title as product_title,
    prod.image_url as product_image,
    c.last_message_preview as last_message,
    c.last_message_at,
    CASE WHEN c.buyer_id = p_user_id THEN c.buyer_unread_count ELSE c.seller_unread_count END as unread_count,
    COALESCE(up.is_online, false) as other_user_online,
    up.last_seen as other_user_last_seen
  FROM conversations c
  LEFT JOIN profiles p ON p.id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  LEFT JOIN products prod ON prod.id = c.product_id
  LEFT JOIN user_presence up ON up.user_id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate other essential functions
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Vérifier si la conversation existe déjà
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE buyer_id = p_buyer_id
    AND seller_id = p_seller_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL));

  -- Si elle n'existe pas, la créer
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, product_id)
    VALUES (p_buyer_id, p_seller_id, p_product_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

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
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message
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

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = COALESCE(
      CASE
        WHEN p_message_type = 'image' THEN '📷 Photo'
        WHEN p_offer_price IS NOT NULL THEN '💰 Offre de prix'
        ELSE LEFT(p_content, 100)
      END,
      ''
    ),
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

DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);

CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Marquer les messages non lus comme lus
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  -- Réinitialiser le compteur de messages non lus
  UPDATE conversations
  SET
    buyer_unread_count = CASE WHEN buyer_id = p_user_id THEN 0 ELSE buyer_unread_count END,
    seller_unread_count = CASE WHEN seller_id = p_user_id THEN 0 ELSE seller_unread_count END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_user_presence(uuid, boolean, text);

CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id uuid,
  p_is_online boolean,
  p_device_token text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, is_online, device_token, last_seen, updated_at)
  VALUES (p_user_id, p_is_online, p_device_token, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_online = p_is_online,
    device_token = COALESCE(p_device_token, user_presence.device_token),
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS cleanup_old_presence();

CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_conversations_with_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, boolean, text) TO authenticated;
