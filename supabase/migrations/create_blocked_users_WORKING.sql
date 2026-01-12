-- =============================================================
-- CRÉATION DE LA TABLE BLOCKED_USERS (VERSION QUI FONCTIONNE)
-- =============================================================
-- Ce script crée la table et les fonctions pour bloquer des utilisateurs
-- Exécutez ce script dans Supabase SQL Editor
-- =============================================================

-- 0. Extension requise pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0.b Sécuriser le cas où une ancienne table blocked_users existe déjà avec un schéma incompatible
-- (sinon, les CREATE INDEX / CREATE POLICY peuvent échouer avec "column user_id does not exist")
DO $$
DECLARE
  v_has_blocker_id_uuid boolean;
  v_has_blocked_id_uuid boolean;
  v_has_user_id_uuid boolean;
  v_has_blocked_user_id_uuid boolean;
  v_legacy_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'blocked_users'
  ) THEN
    -- Cas attendu par l'app: blocker_id / blocked_id
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'blocked_users'
        AND column_name = 'blocker_id'
        AND udt_name = 'uuid'
    ) INTO v_has_blocker_id_uuid;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'blocked_users'
        AND column_name = 'blocked_id'
        AND udt_name = 'uuid'
    ) INTO v_has_blocked_id_uuid;

    IF v_has_blocker_id_uuid AND v_has_blocked_id_uuid THEN
      -- Table déjà au bon format
      RETURN;
    END IF;

    -- Ancien format possible: user_id / blocked_user_id (renommage in-place)
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'blocked_users'
        AND column_name = 'user_id'
        AND udt_name = 'uuid'
    ) INTO v_has_user_id_uuid;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'blocked_users'
        AND column_name = 'blocked_user_id'
        AND udt_name = 'uuid'
    ) INTO v_has_blocked_user_id_uuid;

    IF v_has_user_id_uuid AND v_has_blocked_user_id_uuid THEN
      EXECUTE 'ALTER TABLE public.blocked_users RENAME COLUMN user_id TO blocker_id';
      EXECUTE 'ALTER TABLE public.blocked_users RENAME COLUMN blocked_user_id TO blocked_id';
      RAISE NOTICE '✅ Colonnes renommées: user_id->blocker_id, blocked_user_id->blocked_id';
      RETURN;
    END IF;

    -- Autre schéma inconnu -> on renomme en legacy puis on recrée proprement
    v_legacy_name := 'blocked_users_legacy_' || to_char(now(), 'YYYYMMDDHH24MISS');
    EXECUTE format('ALTER TABLE public.blocked_users RENAME TO %I', v_legacy_name);
    RAISE NOTICE '⚠️ Ancienne table public.blocked_users renommée en %', v_legacy_name;
  END IF;
END $$;

-- 1. Créer la table blocked_users si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT blocked_users_unique UNIQUE(blocker_id, blocked_id)
);

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS (IMPORTANT: référence explicite à la table)

DROP POLICY IF EXISTS "select_own_blocks" ON public.blocked_users;
DROP POLICY IF EXISTS "insert_own_blocks" ON public.blocked_users;
DROP POLICY IF EXISTS "delete_own_blocks" ON public.blocked_users;

-- Politique: Les utilisateurs peuvent voir leurs propres blocages
CREATE POLICY "select_own_blocks"
  ON public.blocked_users
  FOR SELECT
  TO authenticated
  USING (public.blocked_users.blocker_id = auth.uid());

-- Politique: Les utilisateurs peuvent bloquer d'autres utilisateurs
CREATE POLICY "insert_own_blocks"
  ON public.blocked_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.blocked_users.blocker_id = auth.uid());

-- Politique: Les utilisateurs peuvent débloquer
CREATE POLICY "delete_own_blocks"
  ON public.blocked_users
  FOR DELETE
  TO authenticated
  USING (public.blocked_users.blocker_id = auth.uid());

-- =============================================================
-- FONCTIONS RPC POUR LE BLOCAGE
-- =============================================================

-- Fonction: Vérifier si un utilisateur est bloqué
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id uuid, p_blocked_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Tolérant: si p_user_id est vide ou différent, on utilise auth.uid() quand même
  IF p_user_id IS NOT NULL AND p_user_id <> v_user_id THEN
    RAISE NOTICE 'ℹ️ is_user_blocked: p_user_id ignoré (auth.uid utilisé)';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE blocker_id = v_user_id AND blocked_id = p_blocked_user_id
  );
END;
$$;

-- Fonction: Bloquer un utilisateur
CREATE OR REPLACE FUNCTION block_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Non authentifié');
  END IF;

  -- Tolérant: si p_user_id est différent, on ignore et on utilise auth.uid()
  IF p_user_id IS NOT NULL AND p_user_id <> v_user_id THEN
    RAISE NOTICE 'ℹ️ block_user: p_user_id ignoré (auth.uid utilisé)';
  END IF;

  -- Vérifier que l'utilisateur ne se bloque pas lui-même
  IF v_user_id = p_blocked_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Vous ne pouvez pas vous bloquer vous-même'
    );
  END IF;

  -- Insérer le blocage (ignore si déjà bloqué)
  INSERT INTO public.blocked_users (blocker_id, blocked_id)
  VALUES (v_user_id, p_blocked_user_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur bloqué avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Fonction: Débloquer un utilisateur
CREATE OR REPLACE FUNCTION unblock_user(p_user_id uuid, p_blocked_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows_deleted integer;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Non authentifié');
  END IF;

  -- Tolérant: si p_user_id est différent, on ignore et on utilise auth.uid()
  IF p_user_id IS NOT NULL AND p_user_id <> v_user_id THEN
    RAISE NOTICE 'ℹ️ unblock_user: p_user_id ignoré (auth.uid utilisé)';
  END IF;

  DELETE FROM public.blocked_users
  WHERE blocker_id = v_user_id AND blocked_id = p_blocked_user_id;

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

  IF v_rows_deleted > 0 THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Utilisateur débloqué avec succès'
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Utilisateur n''était pas bloqué'
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- =============================================================
-- VÉRIFICATION
-- =============================================================

DO $$
DECLARE
  v_table_exists boolean;
  v_func_count integer;
  v_policy_count integer;
BEGIN
  -- Vérifier la table
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'blocked_users'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✅ Table blocked_users créée avec succès';
  ELSE
    RAISE NOTICE '❌ Erreur: Table blocked_users non créée';
  END IF;

  -- Vérifier les fonctions
  SELECT COUNT(*) INTO v_func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('is_user_blocked', 'block_user', 'unblock_user');

  RAISE NOTICE '✅ % fonctions RPC créées (attendu: 3)', v_func_count;

  -- Vérifier les politiques
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'blocked_users';

  RAISE NOTICE '✅ % politiques RLS créées (attendu: 3)', v_policy_count;

  -- Résumé final
  IF v_table_exists AND v_func_count = 3 AND v_policy_count = 3 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCÈS TOTAL! Tout est configuré correctement:';
    RAISE NOTICE '   - Table blocked_users: ✅';
    RAISE NOTICE '   - Fonctions RPC (3): ✅';
    RAISE NOTICE '   - Politiques RLS (3): ✅';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Vous pouvez maintenant bloquer/débloquer des utilisateurs dans l''app!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Vérifiez les erreurs ci-dessus';
  END IF;
END $$;

-- Afficher les détails des politiques
SELECT
  policyname as "Politique",
  cmd as "Opération",
  '✅' as "Statut"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'blocked_users'
ORDER BY cmd;
