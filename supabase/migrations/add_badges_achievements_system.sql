-- Migration: Système de badges et achievements
-- Description: Gamification avec badges débloquables et progression
-- Date: 2025-01-30

-- =====================================================
-- TABLE: achievement_definitions
-- Définitions des achievements disponibles
-- =====================================================
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL, -- Identifiant unique (ex: 'first_purchase', 'live_fan')

  -- Informations
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'shopping', 'live', 'social', 'points'

  -- Apparence
  icon VARCHAR(100) NOT NULL, -- Emoji ou nom d'icône
  color VARCHAR(20) NOT NULL DEFAULT '#FF6B6B',
  rarity VARCHAR(20) NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'

  -- Conditions
  requirement_type VARCHAR(50) NOT NULL, -- 'count', 'threshold', 'streak', 'special'
  requirement_value INTEGER NOT NULL DEFAULT 1,
  requirement_description TEXT,

  -- Récompenses
  points_reward INTEGER NOT NULL DEFAULT 0,

  -- Métadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_active ON achievement_definitions(is_active) WHERE is_active = TRUE;

-- =====================================================
-- TABLE: user_achievements
-- Achievements débloqués par les utilisateurs
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,

  -- Progression
  current_progress INTEGER NOT NULL DEFAULT 0,
  required_progress INTEGER NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,

  -- Métadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  UNIQUE(user_id, achievement_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(user_id, is_unlocked);

-- =====================================================
-- SEED DATA: Achievements par défaut
-- =====================================================
INSERT INTO achievement_definitions (code, name, description, category, icon, color, rarity, requirement_type, requirement_value, points_reward, display_order) VALUES
-- Shopping
('first_purchase', 'Premier Achat', 'Effectuez votre premier achat sur SenePanda', 'shopping', '🛒', '#10B981', 'common', 'count', 1, 100, 1),
('shopping_spree', 'Acheteur Régulier', 'Effectuez 10 achats', 'shopping', '🎁', '#3B82F6', 'rare', 'count', 10, 500, 2),
('big_spender', 'Gros Dépensier', 'Dépensez plus de 100,000 FCFA', 'shopping', '💰', '#8B5CF6', 'epic', 'threshold', 100000, 1000, 3),
('cart_master', 'Maître du Panier', 'Effectuez 50 achats', 'shopping', '🏆', '#F59E0B', 'legendary', 'count', 50, 2500, 4),

-- Live Shopping
('first_live_viewer', 'Premier Live', 'Regardez votre premier live shopping', 'live', '📺', '#FF6B6B', 'common', 'count', 1, 50, 10),
('live_fan', 'Fan de Live', 'Regardez 10 lives complets', 'live', '🎬', '#EC4899', 'rare', 'count', 10, 300, 11),
('live_addict', 'Accro au Live', 'Regardez 50 lives complets', 'live', '⭐', '#8B5CF6', 'epic', 'count', 50, 1500, 12),
('live_vip', 'VIP Live Shopping', 'Regardez 100 lives complets', 'live', '👑', '#F59E0B', 'legendary', 'count', 100, 5000, 13),
('early_bird', 'Lève-tôt', 'Soyez parmi les 10 premiers spectateurs d\'un live', 'live', '🐦', '#3B82F6', 'rare', 'special', 1, 200, 14),
('live_buyer', 'Acheteur Live', 'Effectuez 5 achats pendant un live', 'live', '🎯', '#10B981', 'epic', 'count', 5, 1000, 15),
('chat_master', 'Maître du Chat', 'Envoyez 100 messages pendant les lives', 'live', '💬', '#6366F1', 'rare', 'count', 100, 400, 16),

-- Social
('first_referral', 'Premier Filleul', 'Parrainez votre premier ami', 'social', '👥', '#10B981', 'common', 'count', 1, 200, 20),
('influencer', 'Influenceur', 'Parrainez 5 amis', 'social', '🌟', '#8B5CF6', 'epic', 'count', 5, 1500, 21),
('ambassador', 'Ambassadeur', 'Parrainez 20 amis', 'social', '🎖️', '#F59E0B', 'legendary', 'count', 20, 5000, 22),
('review_master', 'Expert Avis', 'Laissez 10 avis produits', 'social', '⭐', '#3B82F6', 'rare', 'count', 10, 300, 23),

-- Points & Streak
('first_login', 'Bienvenue !', 'Connectez-vous pour la première fois', 'points', '👋', '#10B981', 'common', 'count', 1, 50, 30),
('week_streak', 'Assidu', 'Connectez-vous 7 jours d\'affilée', 'points', '🔥', '#F97316', 'rare', 'streak', 7, 500, 31),
('month_streak', 'Fidèle', 'Connectez-vous 30 jours d\'affilée', 'points', '💎', '#8B5CF6', 'epic', 'streak', 30, 2000, 32),
('points_collector', 'Collectionneur', 'Accumulez 10,000 points', 'points', '💰', '#F59E0B', 'epic', 'threshold', 10000, 1000, 33),
('points_king', 'Roi des Points', 'Accumulez 50,000 points', 'points', '👑', '#F59E0B', 'legendary', 'threshold', 50000, 5000, 34)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- FONCTION: initialize_user_achievements
-- Crée les entrées d'achievements pour un nouvel utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id, current_progress, required_progress)
  SELECT
    p_user_id,
    id,
    0,
    requirement_value
  FROM achievement_definitions
  WHERE is_active = TRUE
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: update_achievement_progress
-- Met à jour la progression d'un achievement
-- =====================================================
CREATE OR REPLACE FUNCTION update_achievement_progress(
  p_user_id UUID,
  p_achievement_code VARCHAR(100),
  p_increment INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_achievement RECORD;
  v_user_achievement RECORD;
  v_new_progress INTEGER;
  v_newly_unlocked BOOLEAN := FALSE;
BEGIN
  -- Récupérer l'achievement
  SELECT * INTO v_achievement
  FROM achievement_definitions
  WHERE code = p_achievement_code
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Achievement not found');
  END IF;

  -- Récupérer ou créer l'achievement utilisateur
  SELECT * INTO v_user_achievement
  FROM user_achievements
  WHERE user_id = p_user_id
    AND achievement_id = v_achievement.id;

  IF NOT FOUND THEN
    INSERT INTO user_achievements (
      user_id,
      achievement_id,
      current_progress,
      required_progress
    ) VALUES (
      p_user_id,
      v_achievement.id,
      0,
      v_achievement.requirement_value
    )
    RETURNING * INTO v_user_achievement;
  END IF;

  -- Si déjà débloqué, ne rien faire
  IF v_user_achievement.is_unlocked THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'already_unlocked', TRUE,
      'achievement_code', p_achievement_code
    );
  END IF;

  -- Calculer nouvelle progression
  v_new_progress := v_user_achievement.current_progress + p_increment;

  -- Mettre à jour la progression
  IF v_new_progress >= v_user_achievement.required_progress THEN
    -- Débloquer l'achievement
    UPDATE user_achievements
    SET
      current_progress = v_user_achievement.required_progress,
      is_unlocked = TRUE,
      unlocked_at = NOW(),
      updated_at = NOW()
    WHERE id = v_user_achievement.id;

    -- Attribuer les points de récompense
    IF v_achievement.points_reward > 0 THEN
      UPDATE profiles
      SET
        points = points + v_achievement.points_reward,
        total_points = total_points + v_achievement.points_reward,
        updated_at = NOW()
      WHERE id = p_user_id;

      -- Enregistrer transaction
      INSERT INTO points_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        reference_id
      ) VALUES (
        p_user_id,
        v_achievement.points_reward,
        'achievement',
        format('Badge débloqué: %s', v_achievement.name),
        v_achievement.id
      );
    END IF;

    v_newly_unlocked := TRUE;
    v_new_progress := v_user_achievement.required_progress;
  ELSE
    -- Juste mettre à jour la progression
    UPDATE user_achievements
    SET
      current_progress = v_new_progress,
      updated_at = NOW()
    WHERE id = v_user_achievement.id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'achievement_code', p_achievement_code,
    'achievement_name', v_achievement.name,
    'newly_unlocked', v_newly_unlocked,
    'current_progress', v_new_progress,
    'required_progress', v_user_achievement.required_progress,
    'points_reward', CASE WHEN v_newly_unlocked THEN v_achievement.points_reward ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: get_user_achievements_summary
-- Récupère le résumé des achievements d'un utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_achievements_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_count INTEGER;
  v_unlocked_count INTEGER;
  v_total_points INTEGER;
  v_achievements JSONB;
BEGIN
  -- Compter les achievements
  SELECT COUNT(*) INTO v_total_count
  FROM achievement_definitions
  WHERE is_active = TRUE;

  SELECT COUNT(*) INTO v_unlocked_count
  FROM user_achievements
  WHERE user_id = p_user_id
    AND is_unlocked = TRUE;

  -- Calculer total points gagnés
  SELECT COALESCE(SUM(ad.points_reward), 0) INTO v_total_points
  FROM user_achievements ua
  JOIN achievement_definitions ad ON ad.id = ua.achievement_id
  WHERE ua.user_id = p_user_id
    AND ua.is_unlocked = TRUE;

  -- Récupérer tous les achievements avec progression
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ad.id,
      'code', ad.code,
      'name', ad.name,
      'description', ad.description,
      'category', ad.category,
      'icon', ad.icon,
      'color', ad.color,
      'rarity', ad.rarity,
      'points_reward', ad.points_reward,
      'current_progress', COALESCE(ua.current_progress, 0),
      'required_progress', ad.requirement_value,
      'is_unlocked', COALESCE(ua.is_unlocked, FALSE),
      'unlocked_at', ua.unlocked_at,
      'percentage', ROUND((COALESCE(ua.current_progress, 0)::NUMERIC / ad.requirement_value::NUMERIC) * 100, 1)
    )
    ORDER BY ad.display_order
  ) INTO v_achievements
  FROM achievement_definitions ad
  LEFT JOIN user_achievements ua ON ua.achievement_id = ad.id AND ua.user_id = p_user_id
  WHERE ad.is_active = TRUE;

  RETURN jsonb_build_object(
    'total_achievements', v_total_count,
    'unlocked_achievements', v_unlocked_count,
    'total_points_earned', v_total_points,
    'completion_percentage', ROUND((v_unlocked_count::NUMERIC / v_total_count::NUMERIC) * 100, 1),
    'achievements', v_achievements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Initialiser achievements pour nouveau user
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_initialize_user_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_user_achievements(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_initialize_achievements
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_user_achievements();

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les définitions d'achievements
CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions
  FOR SELECT
  USING (is_active = TRUE);

-- Les utilisateurs peuvent voir leurs propres achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs achievements (via fonctions uniquement)
CREATE POLICY "Users can update own achievements"
  ON user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- Triggers
-- =====================================================
CREATE TRIGGER update_achievement_definitions_updated_at
  BEFORE UPDATE ON achievement_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE achievement_definitions IS 'Définitions des badges et achievements disponibles dans l\'application';
COMMENT ON TABLE user_achievements IS 'Progression et déblocage des achievements par utilisateur';
COMMENT ON FUNCTION initialize_user_achievements IS 'Crée les entrées d\'achievements pour un nouvel utilisateur';
COMMENT ON FUNCTION update_achievement_progress IS 'Met à jour la progression d\'un achievement et le débloque si atteint';
COMMENT ON FUNCTION get_user_achievements_summary IS 'Récupère le résumé complet des achievements d\'un utilisateur avec progression';
