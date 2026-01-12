-- Migration: Système de points gagnés pendant les lives
-- Description: Points pour spectateurs pendant le visionnage et interactions
-- Date: 2025-01-30

-- =====================================================
-- TABLE: live_viewing_sessions
-- Tracking des sessions de visionnage avec points
-- =====================================================
CREATE TABLE IF NOT EXISTS live_viewing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tracking temps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  total_watch_time_seconds INTEGER DEFAULT 0,

  -- Points gagnés
  points_earned INTEGER DEFAULT 0,
  points_from_watching INTEGER DEFAULT 0,
  points_from_messages INTEGER DEFAULT 0,
  points_from_reactions INTEGER DEFAULT 0,
  points_from_purchase INTEGER DEFAULT 0,

  -- Stats interaction
  messages_sent INTEGER DEFAULT 0,
  reactions_sent INTEGER DEFAULT 0,
  purchased BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index et contraintes
  UNIQUE(live_session_id, viewer_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_live_viewing_sessions_viewer ON live_viewing_sessions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_live_viewing_sessions_live ON live_viewing_sessions(live_session_id);
CREATE INDEX IF NOT EXISTS idx_live_viewing_sessions_active ON live_viewing_sessions(left_at) WHERE left_at IS NULL;

-- =====================================================
-- FONCTION: record_live_view_session
-- Enregistre ou met à jour une session de visionnage
-- =====================================================
CREATE OR REPLACE FUNCTION record_live_view_session(
  p_live_session_id UUID,
  p_viewer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_watch_time INTEGER;
  v_points_earned INTEGER := 0;
  v_base_points_per_minute INTEGER := 2; -- 2 points par minute
  v_new_session BOOLEAN := FALSE;
BEGIN
  -- Vérifier si session existe
  SELECT id, total_watch_time_seconds
  INTO v_session_id, v_watch_time
  FROM live_viewing_sessions
  WHERE live_session_id = p_live_session_id
    AND viewer_id = p_viewer_id;

  IF v_session_id IS NULL THEN
    -- Créer nouvelle session
    INSERT INTO live_viewing_sessions (
      live_session_id,
      viewer_id,
      joined_at
    ) VALUES (
      p_live_session_id,
      p_viewer_id,
      NOW()
    )
    RETURNING id INTO v_session_id;

    v_new_session := TRUE;
    v_watch_time := 0;
  ELSE
    -- Mettre à jour last seen
    UPDATE live_viewing_sessions
    SET updated_at = NOW()
    WHERE id = v_session_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'session_id', v_session_id,
    'new_session', v_new_session,
    'watch_time', v_watch_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: update_live_watch_time
-- Met à jour le temps de visionnage et calcule les points
-- =====================================================
CREATE OR REPLACE FUNCTION update_live_watch_time(
  p_live_session_id UUID,
  p_viewer_id UUID,
  p_seconds_watched INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_old_watch_time INTEGER;
  v_new_watch_time INTEGER;
  v_old_points INTEGER;
  v_new_points INTEGER;
  v_points_earned INTEGER;
  v_base_points_per_minute INTEGER := 2;
BEGIN
  -- Récupérer session
  SELECT id, total_watch_time_seconds, points_from_watching
  INTO v_session_id, v_old_watch_time, v_old_points
  FROM live_viewing_sessions
  WHERE live_session_id = p_live_session_id
    AND viewer_id = p_viewer_id;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Calculer nouveau temps et points
  v_new_watch_time := v_old_watch_time + p_seconds_watched;
  v_new_points := (v_new_watch_time / 60) * v_base_points_per_minute;
  v_points_earned := v_new_points - v_old_points;

  -- Mettre à jour session
  UPDATE live_viewing_sessions
  SET
    total_watch_time_seconds = v_new_watch_time,
    points_from_watching = v_new_points,
    points_earned = points_earned + v_points_earned,
    updated_at = NOW()
  WHERE id = v_session_id;

  -- Ajouter points au profil utilisateur
  IF v_points_earned > 0 THEN
    UPDATE profiles
    SET
      points = points + v_points_earned,
      total_points = total_points + v_points_earned,
      updated_at = NOW()
    WHERE id = p_viewer_id;

    -- Enregistrer transaction
    INSERT INTO points_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      reference_id
    ) VALUES (
      p_viewer_id,
      v_points_earned,
      'live_watching',
      format('Points gagnés en regardant un live (+%s min)', (p_seconds_watched / 60)),
      p_live_session_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'watch_time', v_new_watch_time,
    'points_earned', v_points_earned,
    'total_points', v_new_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: award_live_interaction_points
-- Attribue points pour interactions (messages, réactions)
-- =====================================================
CREATE OR REPLACE FUNCTION award_live_interaction_points(
  p_live_session_id UUID,
  p_viewer_id UUID,
  p_interaction_type TEXT -- 'message', 'reaction', 'purchase'
) RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_points_to_award INTEGER := 0;
  v_field_name TEXT;
  v_counter_field TEXT;
BEGIN
  -- Déterminer points selon type
  CASE p_interaction_type
    WHEN 'message' THEN
      v_points_to_award := 1;
      v_field_name := 'points_from_messages';
      v_counter_field := 'messages_sent';
    WHEN 'reaction' THEN
      v_points_to_award := 1;
      v_field_name := 'points_from_reactions';
      v_counter_field := 'reactions_sent';
    WHEN 'purchase' THEN
      v_points_to_award := 50; -- Bonus achat pendant live
      v_field_name := 'points_from_purchase';
      v_counter_field := NULL;
    ELSE
      RAISE EXCEPTION 'Invalid interaction type';
  END CASE;

  -- Récupérer session
  SELECT id INTO v_session_id
  FROM live_viewing_sessions
  WHERE live_session_id = p_live_session_id
    AND viewer_id = p_viewer_id;

  IF v_session_id IS NULL THEN
    -- Créer session si n'existe pas
    INSERT INTO live_viewing_sessions (
      live_session_id,
      viewer_id,
      joined_at
    ) VALUES (
      p_live_session_id,
      p_viewer_id,
      NOW()
    )
    RETURNING id INTO v_session_id;
  END IF;

  -- Mettre à jour session
  IF v_counter_field IS NOT NULL THEN
    EXECUTE format(
      'UPDATE live_viewing_sessions
       SET %I = %I + 1,
           %I = %I + $1,
           points_earned = points_earned + $1,
           updated_at = NOW()
       WHERE id = $2',
      v_counter_field, v_counter_field,
      v_field_name, v_field_name
    ) USING v_points_to_award, v_session_id;
  ELSE
    EXECUTE format(
      'UPDATE live_viewing_sessions
       SET %I = %I + $1,
           points_earned = points_earned + $1,
           purchased = TRUE,
           updated_at = NOW()
       WHERE id = $2',
      v_field_name, v_field_name
    ) USING v_points_to_award, v_session_id;
  END IF;

  -- Ajouter points au profil
  UPDATE profiles
  SET
    points = points + v_points_to_award,
    total_points = total_points + v_points_to_award,
    updated_at = NOW()
  WHERE id = p_viewer_id;

  -- Enregistrer transaction
  INSERT INTO points_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id
  ) VALUES (
    p_viewer_id,
    v_points_to_award,
    'live_interaction',
    format('Points gagnés pour %s pendant un live', p_interaction_type),
    p_live_session_id
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'points_earned', v_points_to_award,
    'interaction_type', p_interaction_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: end_live_viewing_session
-- Termine une session de visionnage
-- =====================================================
CREATE OR REPLACE FUNCTION end_live_viewing_session(
  p_live_session_id UUID,
  p_viewer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Récupérer et terminer session
  UPDATE live_viewing_sessions
  SET
    left_at = NOW(),
    updated_at = NOW()
  WHERE live_session_id = p_live_session_id
    AND viewer_id = p_viewer_id
    AND left_at IS NULL
  RETURNING * INTO v_session;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Session not found or already ended'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'total_points_earned', v_session.points_earned,
    'watch_time', v_session.total_watch_time_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE live_viewing_sessions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view own viewing sessions"
  ON live_viewing_sessions
  FOR SELECT
  USING (auth.uid() = viewer_id);

-- Les utilisateurs peuvent créer leurs sessions
CREATE POLICY "Users can create own viewing sessions"
  ON live_viewing_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Les utilisateurs peuvent mettre à jour leurs sessions
CREATE POLICY "Users can update own viewing sessions"
  ON live_viewing_sessions
  FOR UPDATE
  USING (auth.uid() = viewer_id);

-- Les vendeurs peuvent voir les sessions de leurs lives
CREATE POLICY "Sellers can view their live sessions"
  ON live_viewing_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE id = live_viewing_sessions.live_session_id
        AND seller_id = auth.uid()
    )
  );

-- =====================================================
-- Trigger pour updated_at
-- =====================================================
CREATE TRIGGER update_live_viewing_sessions_updated_at
  BEFORE UPDATE ON live_viewing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE live_viewing_sessions IS 'Tracking des sessions de visionnage de lives avec attribution de points';
COMMENT ON FUNCTION record_live_view_session IS 'Enregistre ou récupère une session de visionnage';
COMMENT ON FUNCTION update_live_watch_time IS 'Met à jour le temps de visionnage et calcule les points (2 pts/min)';
COMMENT ON FUNCTION award_live_interaction_points IS 'Attribue points pour interactions: message (1pt), réaction (1pt), achat (50pts)';
COMMENT ON FUNCTION end_live_viewing_session IS 'Termine une session de visionnage et retourne les stats finales';
