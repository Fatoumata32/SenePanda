-- =============================================================
-- ENFORCEMENT BLOCAGE (2 SENS) SUR LE CHAT
-- =============================================================
-- Objectif: empêcher l'envoi de messages si l'un des 2 utilisateurs
-- a bloqué l'autre (blocage bidirectionnel).
--
-- Ce script:
-- 1) Ajoute une fonction utilitaire is_blocked_between(a, b)
-- 2) Patch la RPC send_message(...) pour refuser l'envoi en cas de blocage
--
-- NOTE: la signature de send_message est alignée sur l'app (p_image_url, p_voice_url...).

-- Fonction utilitaire: vrai si A bloque B OU si B bloque A
CREATE OR REPLACE FUNCTION public.is_blocked_between(p_user_a uuid, p_user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Si la table n'existe pas (environnements partiels), ne bloque pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'blocked_users'
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.blocked_users bu
    WHERE (bu.blocker_id = p_user_a AND bu.blocked_id = p_user_b)
       OR (bu.blocker_id = p_user_b AND bu.blocked_id = p_user_a)
  );
END;
$$;

-- Patch de send_message avec vérification du blocage
CREATE OR REPLACE FUNCTION public.send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_image_url TEXT DEFAULT NULL,
    p_voice_url TEXT DEFAULT NULL,
    p_voice_duration INTEGER DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_offer_price DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_message_id UUID;
    v_conversation RECORD;
    v_other_user_id UUID;
BEGIN
    -- Anti-usurpation
    IF auth.uid() IS NULL OR p_sender_id <> auth.uid() THEN
        RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;

    -- Get conversation details
    SELECT * INTO v_conversation
    FROM public.conversations
    WHERE id = p_conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conversation not found';
    END IF;

    -- Identifier l'autre participant (schéma seller/buyer)
    IF p_sender_id = v_conversation.seller_id THEN
        v_other_user_id := v_conversation.buyer_id;
    ELSIF p_sender_id = v_conversation.buyer_id THEN
        v_other_user_id := v_conversation.seller_id;
    ELSE
        RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;

    -- Blocage bidirectionnel: si l'un bloque l'autre => refuser
    IF public.is_blocked_between(p_sender_id, v_other_user_id) THEN
        RAISE EXCEPTION 'Vous ne pouvez pas envoyer de message à cet utilisateur (blocage).' USING ERRCODE = '42501';
    END IF;

    -- Insert message
    INSERT INTO public.messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        image_url,
        voice_url,
        voice_duration,
        product_id,
        offer_price,
        is_read,
        created_at
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_content,
        p_message_type,
        p_image_url,
        p_voice_url,
        p_voice_duration,
        p_product_id,
        p_offer_price,
        FALSE,
        NOW()
    ) RETURNING id INTO v_message_id;

    -- Update conversation
    UPDATE public.conversations SET
        last_message = LEFT(COALESCE(p_content, ''), 100),
        last_message_time = NOW(),
        last_message_preview = CASE
            WHEN p_message_type = 'text' THEN LEFT(p_content, 100)
            WHEN p_message_type = 'image' THEN 'Image'
            WHEN p_message_type = 'voice' THEN 'Message vocal'
            WHEN p_message_type = 'product' THEN 'Produit'
            ELSE p_content
        END,
        last_message_at = NOW(),
        updated_at = NOW(),
        -- Update unread count for the other user
        buyer_unread_count = CASE
            WHEN p_sender_id = v_conversation.seller_id THEN COALESCE(buyer_unread_count, 0) + 1
            ELSE buyer_unread_count
        END,
        seller_unread_count = CASE
            WHEN p_sender_id = v_conversation.buyer_id THEN COALESCE(seller_unread_count, 0) + 1
            ELSE seller_unread_count
        END
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$;
