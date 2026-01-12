-- =============================================
-- 🔧 FIX : Création automatique du profil lors de l'inscription
-- =============================================
-- Date: 2025-12-02
-- Description: Corrige le problème de "Database error saving new user"
--              en améliorant le trigger de création de profil
-- =============================================

-- =============================================
-- 1. SUPPRIMER L'ANCIEN TRIGGER (si existe)
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================
-- 2. CRÉER LA FONCTION DE GESTION DES NOUVEAUX UTILISATEURS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_phone TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Extraire les métadonnées
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';

  -- Log pour debug
  RAISE NOTICE 'Création profil pour user: % avec phone: %', NEW.id, user_phone;

  -- Créer le profil
  INSERT INTO public.profiles (
    id,
    phone,
    first_name,
    last_name,
    full_name,
    username,
    email,
    is_seller,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(user_phone, ''),
    COALESCE(user_first_name, ''),
    COALESCE(user_last_name, ''),
    COALESCE(user_first_name || ' ' || user_last_name, 'Utilisateur'),
    'user_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
    NEW.email,
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();

  RAISE NOTICE 'Profil créé avec succès pour: %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas faire échouer la création du compte auth
    RAISE WARNING 'Erreur création profil pour %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW; -- Important : retourner NEW pour que le compte auth soit quand même créé
END;
$$;

-- =============================================
-- 3. CRÉER LE TRIGGER
-- =============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. DONNER LES PERMISSIONS
-- =============================================

-- La fonction doit pouvoir être exécutée avec les permissions appropriées
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- =============================================
-- 5. VÉRIFIER QUE LA TABLE PROFILES EST CORRECTE
-- =============================================

-- S'assurer que toutes les colonnes nécessaires existent
DO $$
BEGIN
  -- Vérifier la colonne phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Colonne phone ajoutée';
  END IF;

  -- Vérifier la colonne first_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
    RAISE NOTICE '✅ Colonne first_name ajoutée';
  END IF;

  -- Vérifier la colonne last_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
    RAISE NOTICE '✅ Colonne last_name ajoutée';
  END IF;

  -- Vérifier la colonne full_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
    RAISE NOTICE '✅ Colonne full_name ajoutée';
  END IF;

  -- Vérifier la colonne username
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
    RAISE NOTICE '✅ Colonne username ajoutée';
  END IF;

  -- Vérifier la colonne email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE '✅ Colonne email ajoutée';
  END IF;

  -- Vérifier la colonne is_seller
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'is_seller'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_seller BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Colonne is_seller ajoutée';
  END IF;
END $$;

-- =============================================
-- 6. VÉRIFICATION FINALE
-- =============================================

DO $$
BEGIN
  -- Vérifier que le trigger existe
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created créé avec succès';
  ELSE
    RAISE EXCEPTION '❌ Trigger on_auth_user_created non créé';
  END IF;

  -- Vérifier que la fonction existe
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Fonction handle_new_user créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Fonction handle_new_user non créée';
  END IF;
END $$;

-- =============================================
-- 7. MESSAGE FINAL
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ FIX APPLIQUÉ AVEC SUCCÈS';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Le trigger de création de profil a été corrigé.';
  RAISE NOTICE 'Les nouveaux utilisateurs auront automatiquement:';
  RAISE NOTICE '  - Un profil créé dans la table profiles';
  RAISE NOTICE '  - Un username généré automatiquement';
  RAISE NOTICE '  - Leurs informations extraites des métadonnées';
  RAISE NOTICE '';
  RAISE NOTICE 'En cas d''erreur lors de la création du profil:';
  RAISE NOTICE '  - Le compte auth sera quand même créé';
  RAISE NOTICE '  - L''app créera le profil manuellement';
  RAISE NOTICE '  - Un warning sera loggé pour investigation';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;
