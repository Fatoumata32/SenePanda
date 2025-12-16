-- Migration: Système de suivi (followers/following)
-- Description: Permet aux utilisateurs de suivre des vendeurs
-- Date: 2025-12-16

-- Créer la table user_follows
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte unique : un utilisateur ne peut suivre qu'une fois le même vendeur
  UNIQUE(follower_id, followed_id),

  -- Contrainte : un utilisateur ne peut pas se suivre lui-même
  CHECK (follower_id != followed_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON user_follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Users can view all follows"
  ON user_follows FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY IF NOT EXISTS "Users can unfollow"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Fonction pour obtenir le nombre de followers d'un utilisateur
CREATE OR REPLACE FUNCTION get_followers_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_follows
  WHERE followed_id = p_user_id;
$$;

-- Fonction pour obtenir le nombre de personnes suivies par un utilisateur
CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_follows
  WHERE follower_id = p_user_id;
$$;

-- Fonction pour vérifier si un utilisateur suit un autre
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_followed_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_follows
    WHERE follower_id = p_follower_id
      AND followed_id = p_followed_id
  );
$$;

-- Trigger pour mettre à jour le compteur de followers dans profiles
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.followed_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur
    UPDATE profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.followed_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_followers_count ON user_follows;
CREATE TRIGGER trigger_update_followers_count
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW
EXECUTE FUNCTION update_followers_count();

-- Commentaires pour la documentation
COMMENT ON TABLE user_follows IS 'Système de suivi entre utilisateurs (followers/following)';
COMMENT ON FUNCTION get_followers_count IS 'Retourne le nombre de followers d''un utilisateur';
COMMENT ON FUNCTION get_following_count IS 'Retourne le nombre de personnes suivies par un utilisateur';
COMMENT ON FUNCTION is_following IS 'Vérifie si un utilisateur en suit un autre';
