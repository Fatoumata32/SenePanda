-- ========================================
-- CORRECTION COMPLÈTE: Toutes les fonctions RPC manquantes
-- Exécutez ce script dans l'éditeur SQL Supabase
-- ========================================

-- =====================================
-- NETTOYAGE: Supprimer les anciennes fonctions
-- =====================================
DROP FUNCTION IF EXISTS get_active_deals();
DROP FUNCTION IF EXISTS increment(text, text, uuid, integer);
DROP FUNCTION IF EXISTS award_welcome_bonus(uuid);
DROP FUNCTION IF EXISTS record_daily_login(uuid);
DROP FUNCTION IF EXISTS redeem_reward(uuid, uuid);
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS update_user_presence(uuid, text);
DROP FUNCTION IF EXISTS is_user_blocked(uuid, uuid);
DROP FUNCTION IF EXISTS block_user(uuid, uuid);
DROP FUNCTION IF EXISTS unblock_user(uuid, uuid);
DROP FUNCTION IF EXISTS request_subscription(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS approve_subscription_request(uuid);
DROP FUNCTION IF EXISTS reject_subscription_request(uuid, text);
DROP FUNCTION IF EXISTS update_user_location(uuid, double precision, double precision, text);
DROP FUNCTION IF EXISTS find_nearby_sellers(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS find_nearby_products(double precision, double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_recommended_products(uuid, integer);
DROP FUNCTION IF EXISTS record_product_interaction(uuid, uuid, text);
DROP FUNCTION IF EXISTS increment_view_count(uuid);
DROP FUNCTION IF EXISTS increment_purchase_count(uuid);
DROP FUNCTION IF EXISTS increment_promo_usage(uuid);
DROP FUNCTION IF EXISTS get_email_from_username(text);
DROP FUNCTION IF EXISTS delete_user_account();
DROP FUNCTION IF EXISTS update_daily_streak(uuid);
DROP FUNCTION IF EXISTS submit_survey_response(uuid, uuid, json);
DROP FUNCTION IF EXISTS donate_points_to_charity(uuid, uuid, integer);
DROP FUNCTION IF EXISTS order_merchandise(uuid, uuid, integer);

-- =====================================
-- 1. FONCTION: get_active_deals (Flash Deals)
-- =====================================
CREATE OR REPLACE FUNCTION get_active_deals()
RETURNS TABLE (
  deal_id uuid,
  product_id uuid,
  product_title text,
  product_image text,
  seller_name text,
  original_price numeric,
  deal_price numeric,
  discount_percentage integer,
  ends_at timestamptz,
  time_remaining text,
  total_stock integer,
  remaining_stock integer,
  is_featured boolean,
  badge_text text,
  badge_color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    p.id as product_id,
    p.title as product_title,
    COALESCE(p.image_url, 'https://via.placeholder.com/200') as product_image,
    COALESCE(prof.full_name, prof.username, 'Vendeur') as seller_name,
    p.price as original_price,
    d.discount_price as deal_price,
    d.discount_percentage,
    d.ends_at,
    CASE
      WHEN d.ends_at <= now() THEN 'Terminé'
      WHEN EXTRACT(EPOCH FROM (d.ends_at - now())) / 3600 >= 24 THEN
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) / 86400) || ' jours'
      WHEN EXTRACT(EPOCH FROM (d.ends_at - now())) / 3600 >= 1 THEN
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) / 3600) || 'h ' ||
        ROUND((EXTRACT(EPOCH FROM (d.ends_at - now())) % 3600) / 60) || 'm'
      ELSE
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) / 60) || 'm ' ||
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) % 60) || 's'
    END as time_remaining,
    COALESCE(d.stock_limit, p.stock) as total_stock,
    GREATEST(0, COALESCE(d.stock_limit, p.stock) - COALESCE(d.stock_sold, 0)) as remaining_stock,
    COALESCE(d.is_featured, false) as is_featured,
    CASE
      WHEN d.discount_percentage >= 50 THEN 'MEGA PROMO'
      WHEN d.discount_percentage >= 30 THEN 'HOT DEAL'
      ELSE 'PROMO'
    END as badge_text,
    CASE
      WHEN d.discount_percentage >= 50 THEN '#DC2626'
      WHEN d.discount_percentage >= 30 THEN '#F59E0B'
      ELSE '#10B981'
    END as badge_color
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  LEFT JOIN profiles prof ON prof.id = p.seller_id
  WHERE d.is_active = true
    AND d.starts_at <= now()
    AND d.ends_at > now()
    AND COALESCE(d.stock_limit - d.stock_sold, p.stock) > 0
    AND p.is_published = true
  ORDER BY
    d.is_featured DESC,
    d.discount_percentage DESC,
    d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 2. FONCTION: increment (Compteurs génériques)
-- =====================================
CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id uuid, amount integer DEFAULT 1)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE id = $2', table_name, column_name, column_name)
  USING amount, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 3. FONCTIONS: Système de bonus et connexion quotidienne
-- =====================================
CREATE OR REPLACE FUNCTION award_welcome_bonus(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_points integer := 500;
  v_result json;
BEGIN
  -- Vérifier si le bonus a déjà été attribué
  IF EXISTS (SELECT 1 FROM user_points WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Bonus déjà attribué');
  END IF;

  -- Créer l'enregistrement de points
  INSERT INTO user_points (user_id, total_points, current_points)
  VALUES (p_user_id, v_points, v_points);

  -- Enregistrer la transaction
  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, v_points, 'welcome_bonus', 'Bonus de bienvenue');

  v_result := json_build_object(
    'success', true,
    'points', v_points,
    'message', 'Bonus de bienvenue attribué avec succès'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_daily_login(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_last_login date;
  v_current_streak integer;
  v_points integer := 10;
  v_bonus_points integer := 0;
  v_result json;
BEGIN
  -- Récupérer la dernière connexion et le streak actuel
  SELECT last_login_date, current_streak
  INTO v_last_login, v_current_streak
  FROM user_points
  WHERE user_id = p_user_id;

  -- Si pas de record, créer un nouveau
  IF v_last_login IS NULL THEN
    INSERT INTO user_points (user_id, last_login_date, current_streak, total_points, current_points)
    VALUES (p_user_id, CURRENT_DATE, 1, v_points, v_points);

    INSERT INTO point_transactions (user_id, points, transaction_type, description)
    VALUES (p_user_id, v_points, 'daily_login', 'Connexion quotidienne - Jour 1');

    v_current_streak := 1;
  ELSE
    -- Si déjà connecté aujourd'hui, ne rien faire
    IF v_last_login = CURRENT_DATE THEN
      RETURN json_build_object(
        'success', true,
        'already_logged', true,
        'current_streak', v_current_streak
      );
    END IF;

    -- Calculer le nouveau streak
    IF v_last_login = CURRENT_DATE - 1 THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      v_current_streak := 1;
    END IF;

    -- Bonus pour les streaks
    IF v_current_streak >= 7 THEN
      v_bonus_points := 50;
    ELSIF v_current_streak >= 3 THEN
      v_bonus_points := 20;
    END IF;

    -- Mettre à jour les points
    UPDATE user_points
    SET last_login_date = CURRENT_DATE,
        current_streak = v_current_streak,
        total_points = total_points + v_points + v_bonus_points,
        current_points = current_points + v_points + v_bonus_points
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction
    INSERT INTO point_transactions (user_id, points, transaction_type, description)
    VALUES (p_user_id, v_points + v_bonus_points, 'daily_login',
            'Connexion quotidienne - Jour ' || v_current_streak::text);
  END IF;

  v_result := json_build_object(
    'success', true,
    'points_earned', v_points + v_bonus_points,
    'current_streak', v_current_streak,
    'bonus_points', v_bonus_points
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 4. FONCTIONS: Système de récompenses
-- =====================================
CREATE OR REPLACE FUNCTION redeem_reward(p_user_id uuid, p_reward_id uuid)
RETURNS json AS $$
DECLARE
  v_reward_cost integer;
  v_user_points integer;
  v_result json;
BEGIN
  -- Récupérer le coût de la récompense
  SELECT points_required INTO v_reward_cost
  FROM rewards WHERE id = p_reward_id;

  -- Récupérer les points de l'utilisateur
  SELECT current_points INTO v_user_points
  FROM user_points WHERE user_id = p_user_id;

  -- Vérifier si l'utilisateur a assez de points
  IF v_user_points < v_reward_cost THEN
    RETURN json_build_object('success', false, 'message', 'Points insuffisants');
  END IF;

  -- Déduire les points
  UPDATE user_points
  SET current_points = current_points - v_reward_cost
  WHERE user_id = p_user_id;

  -- Créer l'enregistrement de réclamation
  INSERT INTO claimed_rewards (user_id, reward_id, points_spent)
  VALUES (p_user_id, p_reward_id, v_reward_cost);

  -- Enregistrer la transaction
  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, -v_reward_cost, 'reward_redemption', 'Échange de récompense');

  v_result := json_build_object(
    'success', true,
    'points_spent', v_reward_cost,
    'remaining_points', v_user_points - v_reward_cost
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 5. FONCTIONS: Système de chat
-- =====================================
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user1_id uuid, p_user2_id uuid)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Chercher une conversation existante
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (user1_id = p_user1_id AND user2_id = p_user2_id)
     OR (user1_id = p_user2_id AND user2_id = p_user1_id)
  LIMIT 1;

  -- Si pas trouvée, en créer une nouvelle
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (p_user1_id, p_user2_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_message_id uuid;
  v_result json;
BEGIN
  -- Insérer le message
  INSERT INTO messages (conversation_id, sender_id, content, message_type, media_url)
  VALUES (p_conversation_id, p_sender_id, p_content, p_message_type, p_media_url)
  RETURNING id INTO v_message_id;

  -- Mettre à jour le timestamp de la conversation
  UPDATE conversations
  SET last_message_at = now(),
      updated_at = now()
  WHERE id = p_conversation_id;

  v_result := json_build_object(
    'success', true,
    'message_id', v_message_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_presence(p_user_id uuid, p_status text)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET is_online = CASE WHEN p_status = 'online' THEN true ELSE false END,
      last_seen = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 6. FONCTIONS: Système de blocage d'utilisateurs
-- =====================================
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id uuid, p_blocked_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = p_user_id AND blocked_user_id = p_blocked_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION block_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json AS $$
BEGIN
  INSERT INTO blocked_users (user_id, blocked_user_id)
  VALUES (p_user_id, p_blocked_user_id)
  ON CONFLICT (user_id, blocked_user_id) DO NOTHING;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION unblock_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json AS $$
BEGIN
  DELETE FROM blocked_users
  WHERE user_id = p_user_id AND blocked_user_id = p_blocked_user_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 7. FONCTIONS: Système d'abonnements
-- =====================================
CREATE OR REPLACE FUNCTION request_subscription(
  p_user_id uuid,
  p_plan_id uuid,
  p_payment_method text,
  p_phone_number text,
  p_proof_url text
)
RETURNS json AS $$
DECLARE
  v_request_id uuid;
  v_result json;
BEGIN
  INSERT INTO subscription_requests (
    user_id, plan_id, payment_method, phone_number, proof_url, status
  )
  VALUES (
    p_user_id, p_plan_id, p_payment_method, p_phone_number, p_proof_url, 'pending'
  )
  RETURNING id INTO v_request_id;

  v_result := json_build_object(
    'success', true,
    'request_id', v_request_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_subscription_request(p_request_id uuid)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_plan_id uuid;
  v_duration_months integer;
  v_result json;
BEGIN
  -- Récupérer les infos de la demande
  SELECT user_id, plan_id INTO v_user_id, v_plan_id
  FROM subscription_requests WHERE id = p_request_id;

  -- Récupérer la durée du plan
  SELECT duration_months INTO v_duration_months
  FROM subscription_plans WHERE id = v_plan_id;

  -- Mettre à jour la demande
  UPDATE subscription_requests
  SET status = 'approved', approved_at = now()
  WHERE id = p_request_id;

  -- Créer ou mettre à jour l'abonnement
  INSERT INTO user_subscriptions (user_id, plan_id, starts_at, ends_at, status)
  VALUES (
    v_user_id,
    v_plan_id,
    now(),
    now() + (v_duration_months || ' months')::interval,
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET plan_id = EXCLUDED.plan_id,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      status = 'active';

  v_result := json_build_object('success', true);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_subscription_request(p_request_id uuid, p_reason text)
RETURNS json AS $$
BEGIN
  UPDATE subscription_requests
  SET status = 'rejected', rejected_at = now(), rejection_reason = p_reason
  WHERE id = p_request_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 8. FONCTIONS: Géolocalisation
-- =====================================
CREATE OR REPLACE FUNCTION update_user_location(
  p_user_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_address text DEFAULT NULL
)
RETURNS json AS $$
BEGIN
  UPDATE profiles
  SET latitude = p_latitude,
      longitude = p_longitude,
      address = COALESCE(p_address, address),
      location_updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION find_nearby_sellers(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision DEFAULT 10
)
RETURNS TABLE (
  seller_id uuid,
  seller_name text,
  distance_km double precision,
  product_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as seller_id,
    COALESCE(p.full_name, p.username) as seller_name,
    (6371 * acos(
      cos(radians(p_latitude)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) * sin(radians(p.latitude))
    )) as distance_km,
    COUNT(DISTINCT pr.id) as product_count
  FROM profiles p
  LEFT JOIN products pr ON pr.seller_id = p.id AND pr.is_published = true
  WHERE p.role = 'seller'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(p_latitude)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) * sin(radians(p.latitude))
    )) <= p_radius_km
  GROUP BY p.id, p.full_name, p.username, p.latitude, p.longitude
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION find_nearby_products(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision DEFAULT 10,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  product_id uuid,
  title text,
  price numeric,
  image_url text,
  seller_name text,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id as product_id,
    pr.title,
    pr.price,
    pr.image_url,
    COALESCE(p.full_name, p.username) as seller_name,
    (6371 * acos(
      cos(radians(p_latitude)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) * sin(radians(p.latitude))
    )) as distance_km
  FROM products pr
  JOIN profiles p ON p.id = pr.seller_id
  WHERE pr.is_published = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(p_latitude)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) * sin(radians(p.latitude))
    )) <= p_radius_km
  ORDER BY distance_km
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 9. FONCTIONS: Recommandations de produits
-- =====================================
CREATE OR REPLACE FUNCTION get_recommended_products(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE (
  product_id uuid,
  title text,
  price numeric,
  image_url text,
  seller_name text,
  recommendation_score double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.title,
    p.price,
    p.image_url,
    COALESCE(prof.full_name, prof.username) as seller_name,
    (COALESCE(p.view_count, 0) * 0.3 + COALESCE(p.purchase_count, 0) * 0.7)::double precision as recommendation_score
  FROM products p
  JOIN profiles prof ON prof.id = p.seller_id
  WHERE p.is_published = true
    AND p.seller_id != p_user_id
  ORDER BY recommendation_score DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_product_interaction(
  p_user_id uuid,
  p_product_id uuid,
  p_interaction_type text
)
RETURNS void AS $$
BEGIN
  INSERT INTO product_interactions (user_id, product_id, interaction_type)
  VALUES (p_user_id, p_product_id, p_interaction_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_view_count(p_product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_purchase_count(p_product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET purchase_count = COALESCE(purchase_count, 0) + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 10. FONCTIONS: Codes promo
-- =====================================
CREATE OR REPLACE FUNCTION increment_promo_usage(p_promo_code_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 11. FONCTIONS: Authentification
-- =====================================
CREATE OR REPLACE FUNCTION get_email_from_username(p_username text)
RETURNS text AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  SELECT id INTO v_user_id
  FROM profiles
  WHERE LOWER(username) = LOWER(p_username);

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 12. FONCTION: Suppression de compte
-- =====================================
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS json AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Supprimer toutes les données liées
  DELETE FROM messages WHERE sender_id = v_user_id;
  DELETE FROM conversations WHERE user1_id = v_user_id OR user2_id = v_user_id;
  DELETE FROM claimed_rewards WHERE user_id = v_user_id;
  DELETE FROM point_transactions WHERE user_id = v_user_id;
  DELETE FROM user_points WHERE user_id = v_user_id;
  DELETE FROM favorites WHERE user_id = v_user_id;
  DELETE FROM cart_items WHERE user_id = v_user_id;
  DELETE FROM orders WHERE user_id = v_user_id;
  DELETE FROM reviews WHERE user_id = v_user_id;
  DELETE FROM products WHERE seller_id = v_user_id;
  DELETE FROM profiles WHERE id = v_user_id;

  -- Supprimer l'utilisateur de auth
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 13. FONCTIONS: Bonus system avancé
-- =====================================
CREATE OR REPLACE FUNCTION update_daily_streak(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_last_login date;
  v_current_streak integer;
  v_bonus_points integer := 0;
BEGIN
  SELECT last_login_date, current_streak
  INTO v_last_login, v_current_streak
  FROM user_points
  WHERE user_id = p_user_id;

  IF v_last_login = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_login != CURRENT_DATE THEN
    v_current_streak := 1;
  END IF;

  -- Bonus pour streaks longs
  IF v_current_streak >= 30 THEN
    v_bonus_points := 200;
  ELSIF v_current_streak >= 14 THEN
    v_bonus_points := 100;
  ELSIF v_current_streak >= 7 THEN
    v_bonus_points := 50;
  END IF;

  UPDATE user_points
  SET current_streak = v_current_streak,
      last_login_date = CURRENT_DATE,
      current_points = current_points + v_bonus_points,
      total_points = total_points + v_bonus_points
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'streak', v_current_streak,
    'bonus_points', v_bonus_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_survey_response(
  p_user_id uuid,
  p_survey_id uuid,
  p_responses json
)
RETURNS json AS $$
DECLARE
  v_points integer := 50;
BEGIN
  INSERT INTO survey_responses (user_id, survey_id, responses)
  VALUES (p_user_id, p_survey_id, p_responses);

  UPDATE user_points
  SET current_points = current_points + v_points,
      total_points = total_points + v_points
  WHERE user_id = p_user_id;

  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, v_points, 'survey', 'Réponse au sondage');

  RETURN json_build_object('success', true, 'points_earned', v_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION donate_points_to_charity(
  p_user_id uuid,
  p_charity_id uuid,
  p_points integer
)
RETURNS json AS $$
DECLARE
  v_user_points integer;
BEGIN
  SELECT current_points INTO v_user_points
  FROM user_points WHERE user_id = p_user_id;

  IF v_user_points < p_points THEN
    RETURN json_build_object('success', false, 'message', 'Points insuffisants');
  END IF;

  UPDATE user_points
  SET current_points = current_points - p_points
  WHERE user_id = p_user_id;

  INSERT INTO charity_donations (user_id, charity_id, points_donated)
  VALUES (p_user_id, p_charity_id, p_points);

  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, -p_points, 'charity', 'Don à une œuvre de charité');

  RETURN json_build_object('success', true, 'points_donated', p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION order_merchandise(
  p_user_id uuid,
  p_item_id uuid,
  p_quantity integer
)
RETURNS json AS $$
DECLARE
  v_item_cost integer;
  v_total_cost integer;
  v_user_points integer;
BEGIN
  SELECT points_cost INTO v_item_cost
  FROM merchandise_items WHERE id = p_item_id;

  v_total_cost := v_item_cost * p_quantity;

  SELECT current_points INTO v_user_points
  FROM user_points WHERE user_id = p_user_id;

  IF v_user_points < v_total_cost THEN
    RETURN json_build_object('success', false, 'message', 'Points insuffisants');
  END IF;

  UPDATE user_points
  SET current_points = current_points - v_total_cost
  WHERE user_id = p_user_id;

  INSERT INTO merchandise_orders (user_id, item_id, quantity, points_spent)
  VALUES (p_user_id, p_item_id, p_quantity, v_total_cost);

  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, -v_total_cost, 'merchandise', 'Commande de marchandise');

  RETURN json_build_object('success', true, 'points_spent', v_total_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- FIN: Vérification et tests
-- =====================================
SELECT '✅ Toutes les fonctions RPC ont été créées avec succès!' as result;

-- Test rapide de quelques fonctions clés
SELECT 'Test get_active_deals...' as test;
SELECT COUNT(*) as active_deals_count FROM get_active_deals();

SELECT '✅ Script exécuté avec succès! Toutes les erreurs RPC devraient être corrigées.' as final_result;
