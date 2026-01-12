-- =============================================================
-- CRÉATION DE LA TABLE BLOCKED_USERS (VERSION CORRIGÉE)
-- =============================================================
-- Ce script crée la table et les fonctions pour bloquer des utilisateurs
-- Exécutez ce script dans Supabase SQL Editor
-- =============================================================

-- 1. Créer la table blocked_users si elle n'existe pas
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, blocked_user_id)
);

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;

-- 5. Créer les nouvelles politiques RLS (CORRIGÉES)

-- Politique: Les utilisateurs peuvent voir leurs propres blocages
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocked_users.user_id);

-- Politique: Les utilisateurs peuvent bloquer d'autres utilisateurs
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocked_users.user_id);

-- Politique: Les utilisateurs peuvent débloquer
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocked_users.user_id);

-- =============================================================
-- FONCTIONS RPC POUR LE BLOCAGE
-- =============================================================

-- Fonction: Vérifier si un utilisateur est bloqué
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id uuid, p_blocked_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = p_user_id AND blocked_user_id = p_blocked_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Bloquer un utilisateur
CREATE OR REPLACE FUNCTION block_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json AS $$
BEGIN
  -- Vérifier que l'utilisateur ne se bloque pas lui-même
  IF p_user_id = p_blocked_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Vous ne pouvez pas vous bloquer vous-même');
  END IF;

  -- Insérer le blocage (ignore si déjà bloqué)
  INSERT INTO blocked_users (user_id, blocked_user_id)
  VALUES (p_user_id, p_blocked_user_id)
  ON CONFLICT (user_id, blocked_user_id) DO NOTHING;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Débloquer un utilisateur
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

-- =============================================================
-- VÉRIFICATION
-- =============================================================

-- Vérifier que la table existe
SELECT
  'blocked_users' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'blocked_users'
  ) as exists;

-- Vérifier que les fonctions existent
SELECT
  routine_name,
  '✅ Fonction créée' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_user_blocked', 'block_user', 'unblock_user')
ORDER BY routine_name;

-- Vérifier les politiques RLS
SELECT
  tablename,
  policyname,
  '✅ Politique active' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'blocked_users';

-- =============================================================
-- RÉSULTAT ATTENDU
-- =============================================================
-- ✅ Table blocked_users créée
-- ✅ 3 fonctions RPC créées (is_user_blocked, block_user, unblock_user)
-- ✅ 3 politiques RLS actives
-- =============================================================
