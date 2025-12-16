-- Créer la table notifications si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour notifier les followers quand un live démarre
CREATE OR REPLACE FUNCTION notify_followers_of_live(p_seller_id UUID, p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INTEGER;
  v_seller_name TEXT;
  v_live_title TEXT;
BEGIN
  -- Récupérer les infos du vendeur et du live
  SELECT shop_name INTO v_seller_name
  FROM profiles
  WHERE id = p_seller_id;

  SELECT title INTO v_live_title
  FROM live_sessions
  WHERE id = p_session_id;

  -- Insérer une notification pour chaque follower (si la table user_follows existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_follows') THEN
    WITH inserted AS (
      INSERT INTO notifications (user_id, type, title, message, data, is_read)
      SELECT
        follower_id,
        'live_started',
        '🔴 Live en cours !',
        COALESCE(v_seller_name, 'Un vendeur') || ' est en direct : ' || COALESCE(v_live_title, 'Rejoignez maintenant !'),
        jsonb_build_object(
          'session_id', p_session_id,
          'seller_id', p_seller_id,
          'seller_name', v_seller_name,
          'live_title', v_live_title
        ),
        false
      FROM user_follows
      WHERE followed_id = p_seller_id
      RETURNING *
    )
    SELECT COUNT(*) INTO v_notification_count FROM inserted;
  ELSE
    v_notification_count := 0;
  END IF;

  RETURN v_notification_count;
END;
$$;

-- Fonction pour notifier quand un produit favori est en live
CREATE OR REPLACE FUNCTION notify_product_in_live(p_product_id UUID, p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INTEGER;
  v_product_title TEXT;
  v_seller_name TEXT;
  v_special_price NUMERIC;
BEGIN
  -- Récupérer les infos du produit et du vendeur
  SELECT p.title, pr.shop_name, lfp.special_price
  INTO v_product_title, v_seller_name, v_special_price
  FROM products p
  JOIN profiles pr ON p.seller_id = pr.id
  JOIN live_featured_products lfp ON lfp.product_id = p.id
  WHERE p.id = p_product_id
    AND lfp.live_session_id = p_session_id
  LIMIT 1;

  -- Notifier les utilisateurs qui ont ce produit en favori (si la table favorites existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
    WITH inserted AS (
      INSERT INTO notifications (user_id, type, title, message, data, is_read)
      SELECT DISTINCT
        f.user_id,
        'product_live',
        '🎁 Votre produit favori est en live !',
        CASE
          WHEN v_special_price IS NOT NULL THEN
            v_product_title || ' avec prix spécial chez ' || v_seller_name
          ELSE
            v_product_title || ' en live chez ' || v_seller_name
        END,
        jsonb_build_object(
          'session_id', p_session_id,
          'product_id', p_product_id,
          'product_title', v_product_title,
          'special_price', v_special_price
        ),
        false
      FROM favorites f
      WHERE f.product_id = p_product_id
        AND NOT EXISTS (
          -- Éviter les doublons si déjà notifié pour ce live
          SELECT 1 FROM notifications
          WHERE user_id = f.user_id
            AND type = 'product_live'
            AND data->>'session_id' = p_session_id::text
            AND created_at > NOW() - INTERVAL '1 hour'
        )
      RETURNING *
    )
    SELECT COUNT(*) INTO v_notification_count FROM inserted;
  ELSE
    v_notification_count := 0;
  END IF;

  RETURN v_notification_count;
END;
$$;

-- Fonction automatique : Notifier quand un live démarre
CREATE OR REPLACE FUNCTION trigger_notify_live_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'live', notifier les followers
  IF NEW.status = 'live' AND OLD.status != 'live' THEN
    PERFORM notify_followers_of_live(NEW.seller_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_live_session_start ON live_sessions;
CREATE TRIGGER on_live_session_start
AFTER UPDATE ON live_sessions
FOR EACH ROW
WHEN (NEW.status = 'live' AND OLD.status != 'live')
EXECUTE FUNCTION trigger_notify_live_start();

-- Fonction automatique : Notifier quand un produit est ajouté en vedette dans un live actif
CREATE OR REPLACE FUNCTION trigger_notify_featured_product()
RETURNS TRIGGER AS $$
DECLARE
  v_live_status TEXT;
BEGIN
  -- Vérifier si le live est actif
  SELECT status INTO v_live_status
  FROM live_sessions
  WHERE id = NEW.live_session_id;

  -- Si le live est actif et le produit est activé, notifier
  IF v_live_status = 'live' AND NEW.is_active = true THEN
    PERFORM notify_product_in_live(NEW.product_id, NEW.live_session_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_featured_product_added ON live_featured_products;
CREATE TRIGGER on_featured_product_added
AFTER INSERT OR UPDATE ON live_featured_products
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION trigger_notify_featured_product();

-- Fonction pour récupérer les notifications non lues d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.is_read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Fonction pour marquer les notifications comme lues
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID, p_notification_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND id = ANY(p_notification_ids)
    AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Index pour optimiser les requêtes de notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type_data
  ON notifications(type, (data->>'session_id'));

-- Commentaires pour la documentation
COMMENT ON FUNCTION notify_followers_of_live IS 'Notifie tous les followers quand un vendeur démarre un live';
COMMENT ON FUNCTION notify_product_in_live IS 'Notifie les utilisateurs ayant mis un produit en favori quand il apparaît dans un live';
COMMENT ON FUNCTION get_user_notifications IS 'Récupère les dernières notifications d''un utilisateur';
COMMENT ON FUNCTION mark_notifications_read IS 'Marque des notifications comme lues';
