-- =============================================================
-- CREER LES TABLES DE NOTIFICATIONS
-- =============================================================
-- Ce script crée les tables nécessaires pour le système de notifications
-- Exécutez ce script dans Supabase SQL Editor
-- =============================================================

-- 1. TABLE NOTIFICATIONS (principale)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'promo',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 2. TABLE DEAL_NOTIFICATIONS (promotions et offres)
CREATE TABLE IF NOT EXISTS deal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  description TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  deal_id UUID,
  product_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_deal_notifications_user_id ON deal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_is_read ON deal_notifications(user_id, is_read);

-- 3. RLS POLICIES (Row Level Security)

-- Activer RLS sur les tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Policies pour deal_notifications
DROP POLICY IF EXISTS "Users can view own deal notifications" ON deal_notifications;
CREATE POLICY "Users can view own deal notifications" ON deal_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deal notifications" ON deal_notifications;
CREATE POLICY "Users can update own deal notifications" ON deal_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own deal notifications" ON deal_notifications;
CREATE POLICY "Users can delete own deal notifications" ON deal_notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert deal notifications" ON deal_notifications;
CREATE POLICY "System can insert deal notifications" ON deal_notifications
  FOR INSERT WITH CHECK (true);

-- 4. ACTIVER REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE deal_notifications;

-- 5. FONCTION POUR CREER UNE NOTIFICATION
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_action_url VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- 6. FONCTION POUR MARQUER TOUTES LES NOTIFICATIONS COMME LUES
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Marquer notifications
  UPDATE notifications
  SET is_read = TRUE, read = TRUE
  WHERE user_id = p_user_id AND (is_read = FALSE OR read = FALSE);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Marquer deal_notifications
  UPDATE deal_notifications
  SET is_read = TRUE
  WHERE user_id = p_user_id AND is_read = FALSE;

  RETURN v_count;
END;
$$;

-- 7. FONCTION POUR COMPTER LES NOTIFICATIONS NON LUES
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notif_count INTEGER;
  v_deal_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = FALSE;

  SELECT COUNT(*) INTO v_deal_count
  FROM deal_notifications
  WHERE user_id = p_user_id AND is_read = FALSE;

  RETURN COALESCE(v_notif_count, 0) + COALESCE(v_deal_count, 0);
END;
$$;

-- =============================================================
-- VERIFICATION
-- =============================================================
SELECT 'Tables créées avec succès!' AS status;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('notifications', 'deal_notifications')
ORDER BY table_name, ordinal_position;
