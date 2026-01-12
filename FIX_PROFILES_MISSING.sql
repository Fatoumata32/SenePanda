-- ================================================================
-- SENEPANDA - FIX PROFILS MANQUANTS
-- ================================================================
-- Ce script corrige le problème des utilisateurs authentifiés
-- qui n'ont pas de profil dans la table profiles
-- ================================================================

-- ÉTAPE 1: Créer la fonction pour auto-créer les profils
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, '') -- phone est obligatoire (NOT NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 2: Créer le trigger sur auth.users
-- ================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ÉTAPE 3: Créer les profils manquants pour les utilisateurs existants
-- ================================================================
INSERT INTO public.profiles (id, username, full_name, phone, created_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
  COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name,
  COALESCE(u.phone, '') as phone, -- phone est obligatoire (NOT NULL)
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ÉTAPE 4: Créer les enregistrements loyalty_points pour les nouveaux profils
-- ================================================================
INSERT INTO loyalty_points (user_id, points, available_points, total_earned, lifetime_points, level, total_spent)
SELECT
  p.id,
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  'bronze',
  0
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_points lp WHERE lp.user_id = p.id
)
ON CONFLICT (user_id) DO UPDATE SET
  points = COALESCE(loyalty_points.points, EXCLUDED.points),
  available_points = COALESCE(loyalty_points.available_points, EXCLUDED.available_points),
  total_spent = COALESCE(loyalty_points.total_spent, 0);

-- ÉTAPE 5: Vérification
-- ================================================================
DO $$
DECLARE
  users_count INTEGER;
  profiles_count INTEGER;
  missing_count INTEGER;
BEGIN
  -- Compter les utilisateurs
  SELECT COUNT(*) INTO users_count FROM auth.users;

  -- Compter les profils
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;

  -- Calculer le nombre de profils manquants
  missing_count := users_count - profiles_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION DES PROFILS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Utilisateurs auth.users: %', users_count;
  RAISE NOTICE 'Profils existants: %', profiles_count;

  IF missing_count = 0 THEN
    RAISE NOTICE '✅ TOUS les utilisateurs ont un profil!';
  ELSE
    RAISE WARNING '⚠️  % profil(s) manquant(s)!', missing_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🔄 Trigger créé: Les nouveaux utilisateurs auront';
  RAISE NOTICE '   automatiquement un profil créé.';
  RAISE NOTICE '';
END $$;
