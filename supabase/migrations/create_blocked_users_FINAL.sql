-- =============================================================
-- CRÉATION DE LA TABLE BLOCKED_USERS (VERSION FINALE)
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

-- 5. Créer les nouvelles politiques RLS (VERSION FINALE - CORRIGÉE)

-- Politique: Les utilisateurs peuvent voir leurs propres blocages
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Politique: Les utilisateurs peuvent bloquer d'autres utilisateurs
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politique: Les utilisateurs peuvent débloquer
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================
-- FONCTIONS RPC POUR LE BLOCAGE
-- =============================================================

-- Fonction: Vérifier si un utilisateur est bloqué
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id uuid, p_blocked_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = p_user_id AND blocked_user_id = p_blocked_user_id
  );
END;
$$;

-- Fonction: Bloquer un utilisateur
CREATE OR REPLACE FUNCTION block_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur ne se bloque pas lui-même
  IF p_user_id = p_blocked_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Vous ne pouvez pas vous bloquer vous-même');
  END IF;

  -- Insérer le blocage (ignore si déjà bloqué)
  INSERT INTO blocked_users (user_id, blocked_user_id)
  VALUES (p_user_id, p_blocked_user_id)
  ON CONFLICT (user_id, blocked_user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Utilisateur bloqué avec succès');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Fonction: Débloquer un utilisateur
CREATE OR REPLACE FUNCTION unblock_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_deleted integer;
BEGIN
  DELETE FROM blocked_users
  WHERE user_id = p_user_id AND blocked_user_id = p_blocked_user_id;

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  IF rows_deleted > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Utilisateur débloqué avec succès');
  ELSE
    RETURN json_build_object('success', true, 'message', 'Utilisateur n''était pas bloqué');
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- =============================================================
-- VÉRIFICATION
-- =============================================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'blocked_users'
  ) THEN
    RAISE NOTICE '✅ Table blocked_users existe';
  ELSE
    RAISE NOTICE '❌ Table blocked_users n''existe pas';
  END IF;
END $$;

-- Vérifier que les fonctions existent
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'is_user_blocked'
  ) THEN
    RAISE NOTICE '✅ Fonction is_user_blocked créée';
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'block_user'
  ) THEN
    RAISE NOTICE '✅ Fonction block_user créée';
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'unblock_user'
  ) THEN
    RAISE NOTICE '✅ Fonction unblock_user créée';
  END IF;
END $$;

-- Afficher les politiques RLS
SELECT
  tablename,
  policyname,
  cmd as operation,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'blocked_users'
ORDER BY policyname;

-- =============================================================
-- RÉSULTAT ATTENDU
-- =============================================================
-- NOTICES:
-- ✅ Table blocked_users existe
-- ✅ Fonction is_user_blocked créée
-- ✅ Fonction block_user créée
-- ✅ Fonction unblock_user créée
--
-- POLITIQUES:
-- blocked_users | Users can block others   | INSERT | ✅
-- blocked_users | Users can unblock others | DELETE | ✅
-- blocked_users | Users can view their own blocks | SELECT | ✅
-- =============================================================
