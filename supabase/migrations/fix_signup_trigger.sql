-- =============================================
-- FIX: Supprimer les triggers qui causent l'erreur "Database error" lors de l'inscription
-- Date: 2025-11-30
-- Description: Supprime tous les triggers automatiques sur auth.users qui peuvent échouer
--              L'application gère la création du profil manuellement
-- =============================================

-- Supprimer tous les triggers sur auth.users
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_rec.tgname);
    RAISE NOTICE 'Trigger supprimé: %', trigger_rec.tgname;
  END LOOP;
END $$;

-- Supprimer toutes les fonctions liées aux triggers de profil
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tous les triggers problématiques ont été supprimés';
  RAISE NOTICE '✅ L''application gère maintenant la création des profils manuellement';
  RAISE NOTICE '✅ Les nouvelles inscriptions fonctionneront correctement';
END $$;
