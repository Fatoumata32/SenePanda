-- Complete Chat System Setup
-- This script creates everything needed for the chat system

-- ============================================================================
-- STEP 1: Create Tables
-- ============================================================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  buyer_unread_count integer DEFAULT 0,
  seller_unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, seller_id, product_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  image_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  offer_price numeric,
  offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table pour tracking des utilisateurs en ligne
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  device_token text,
  updated_at timestamptz DEFAULT now()
);

-- Table pour les réponses rapides prédéfinies
CREATE TABLE IF NOT EXISTS quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STEP 2: Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online, last_seen DESC);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Drop existing policies (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Everyone can view user presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON user_presence;
DROP POLICY IF EXISTS "Sellers can manage own quick replies" ON quick_replies;

-- ============================================================================
-- STEP 5: Create RLS Policies
-- ============================================================================

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- User presence policies
CREATE POLICY "Everyone can view user presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quick replies policies
CREATE POLICY "Sellers can manage own quick replies"
  ON quick_replies FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- ============================================================================
-- STEP 6: Create Functions
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS get_conversations_with_details(uuid);
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS update_user_presence(uuid, boolean, text);
DROP FUNCTION IF EXISTS cleanup_old_presence();

-- Function to get conversations with details
CREATE FUNCTION get_conversations_with_details(p_user_id uuid)
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

-- Function to create or get conversation
CREATE FUNCTION get_or_create_conversation(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE buyer_id = p_buyer_id
    AND seller_id = p_seller_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL));

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, product_id)
    VALUES (p_buyer_id, p_seller_id, p_product_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send message
CREATE FUNCTION send_message(
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
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

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

-- Function to mark messages as read
CREATE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  UPDATE conversations
  SET
    buyer_unread_count = CASE WHEN buyer_id = p_user_id THEN 0 ELSE buyer_unread_count END,
    seller_unread_count = CASE WHEN seller_id = p_user_id THEN 0 ELSE seller_unread_count END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
CREATE FUNCTION update_user_presence(
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

-- Function to cleanup old presence
CREATE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Grant Permissions
-- ============================================================================

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON user_presence TO authenticated;
GRANT ALL ON quick_replies TO authenticated;

GRANT EXECUTE ON FUNCTION get_conversations_with_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_presence() TO authenticated;
