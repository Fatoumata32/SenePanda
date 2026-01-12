-- Création de la table blocked_users si elle n'existe pas
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, blocked_user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- RLS (Row Level Security)
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres blocages
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent bloquer d'autres utilisateurs
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent débloquer
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  USING (auth.uid() = user_id);

-- Fonctions RPC pour le blocage d'utilisateurs
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
  -- Vérifier que l'utilisateur ne se bloque pas lui-même
  IF p_user_id = p_blocked_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Vous ne pouvez pas vous bloquer vous-même');
  END IF;

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
