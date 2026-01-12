-- Système de Live Shopping pour vendeurs Premium

-- Table des sessions live
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  viewer_count INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  stream_key TEXT UNIQUE,
  rtmp_url TEXT,
  playback_url TEXT,
  chat_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des produits en vedette dans un live
CREATE TABLE IF NOT EXISTS live_featured_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  special_price NUMERIC,
  stock_limit INTEGER,
  sold_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_session_id, product_id)
);

-- Table des messages du chat live
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system', 'product_highlight')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réactions en temps réel
CREATE TABLE IF NOT EXISTS live_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'clap', 'star', 'cart')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des spectateurs actifs
CREATE TABLE IF NOT EXISTS live_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_watch_time INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(live_session_id, user_id)
);

-- Table des commandes passées pendant un live
CREATE TABLE IF NOT EXISTS live_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_live_sessions_seller ON live_sessions(seller_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON live_sessions(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_live_featured_products_session ON live_featured_products(live_session_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_session ON live_chat_messages(live_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_reactions_session ON live_reactions(live_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_viewers_session_active ON live_viewers(live_session_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_live_orders_session ON live_orders(live_session_id);

-- Fonction pour démarrer une session live
CREATE OR REPLACE FUNCTION start_live_session(session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE live_sessions
  SET
    status = 'live',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = session_id AND status = 'scheduled';
END;
$$;

-- Fonction pour terminer une session live
CREATE OR REPLACE FUNCTION end_live_session(session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE live_sessions
  SET
    status = 'ended',
    ended_at = NOW(),
    updated_at = NOW()
  WHERE id = session_id AND status = 'live';

  -- Désactiver tous les spectateurs
  UPDATE live_viewers
  SET is_active = false
  WHERE live_session_id = session_id;
END;
$$;

-- Fonction pour mettre à jour le nombre de spectateurs
CREATE OR REPLACE FUNCTION update_viewer_count(session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  peak_count INTEGER;
BEGIN
  -- Compter les spectateurs actifs
  SELECT COUNT(*) INTO current_count
  FROM live_viewers
  WHERE live_session_id = session_id
    AND is_active = true
    AND last_seen_at > NOW() - INTERVAL '30 seconds';

  -- Récupérer le pic actuel
  SELECT peak_viewer_count INTO peak_count
  FROM live_sessions
  WHERE id = session_id;

  -- Mettre à jour
  UPDATE live_sessions
  SET
    viewer_count = current_count,
    peak_viewer_count = GREATEST(COALESCE(peak_count, 0), current_count),
    updated_at = NOW()
  WHERE id = session_id;

  RETURN current_count;
END;
$$;

-- Fonction pour enregistrer une vue
CREATE OR REPLACE FUNCTION record_live_view(session_id UUID, viewer_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO live_viewers (live_session_id, user_id, joined_at, last_seen_at, is_active)
  VALUES (session_id, viewer_user_id, NOW(), NOW(), true)
  ON CONFLICT (live_session_id, user_id)
  DO UPDATE SET
    last_seen_at = NOW(),
    is_active = true;

  -- Incrémenter le total des vues si c'est une nouvelle visite
  UPDATE live_sessions
  SET total_views = total_views + 1
  WHERE id = session_id
    AND NOT EXISTS (
      SELECT 1 FROM live_viewers
      WHERE live_session_id = session_id
        AND user_id = viewer_user_id
        AND joined_at < NOW() - INTERVAL '1 minute'
    );
END;
$$;

-- Fonction pour obtenir les lives actifs
CREATE OR REPLACE FUNCTION get_active_live_sessions(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  seller_id UUID,
  seller_name TEXT,
  seller_avatar TEXT,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  viewer_count INTEGER,
  started_at TIMESTAMPTZ,
  playback_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.id,
    ls.seller_id,
    p.shop_name as seller_name,
    p.avatar_url as seller_avatar,
    ls.title,
    ls.description,
    ls.thumbnail_url,
    ls.viewer_count,
    ls.started_at,
    ls.playback_url
  FROM live_sessions ls
  JOIN profiles p ON ls.seller_id = p.id
  WHERE ls.status = 'live'
  ORDER BY ls.viewer_count DESC, ls.started_at DESC
  LIMIT limit_count;
END;
$$;

-- Fonction pour obtenir les statistiques d'un live
CREATE OR REPLACE FUNCTION get_live_stats(session_id UUID)
RETURNS TABLE(
  viewer_count INTEGER,
  peak_viewer_count INTEGER,
  total_views INTEGER,
  total_sales NUMERIC,
  total_orders INTEGER,
  chat_messages INTEGER,
  reactions_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.viewer_count,
    ls.peak_viewer_count,
    ls.total_views,
    ls.total_sales,
    ls.total_orders,
    (SELECT COUNT(*)::INTEGER FROM live_chat_messages WHERE live_session_id = session_id AND is_deleted = false) as chat_messages,
    (SELECT COUNT(*)::INTEGER FROM live_reactions WHERE live_session_id = session_id) as reactions_count
  FROM live_sessions ls
  WHERE ls.id = session_id;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_live_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_live_session_timestamp
BEFORE UPDATE ON live_sessions
FOR EACH ROW
EXECUTE FUNCTION update_live_session_timestamp();

-- RLS (Row Level Security)
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;

-- Policies pour live_sessions
CREATE POLICY "Tout le monde peut voir les lives publics"
  ON live_sessions FOR SELECT
  USING (true);

CREATE POLICY "Les vendeurs peuvent créer leurs lives"
  ON live_sessions FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Les vendeurs peuvent modifier leurs lives"
  ON live_sessions FOR UPDATE
  USING (auth.uid() = seller_id);

-- Policies pour live_chat_messages
CREATE POLICY "Tout le monde peut voir les messages"
  ON live_chat_messages FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
  ON live_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour live_reactions
CREATE POLICY "Tout le monde peut voir les réactions"
  ON live_reactions FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent réagir"
  ON live_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour live_viewers
CREATE POLICY "Les vendeurs peuvent voir leurs spectateurs"
  ON live_viewers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_viewers.live_session_id
      AND live_sessions.seller_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent s'enregistrer comme spectateurs"
  ON live_viewers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur statut"
  ON live_viewers FOR UPDATE
  USING (auth.uid() = user_id);
