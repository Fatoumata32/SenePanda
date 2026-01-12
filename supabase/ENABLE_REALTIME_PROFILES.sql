-- ========================================
-- ACTIVER REALTIME SUR LA TABLE PROFILES
-- ========================================
--
-- IMPORTANT: Ce script doit être exécuté dans Supabase Dashboard → SQL Editor
-- pour permettre la synchronisation automatique des abonnements
--
-- ========================================

-- 1. Activer Realtime sur la table profiles
DO $$
BEGIN
  -- Vérifier si la publication existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
    RAISE NOTICE '✅ Publication supabase_realtime créée';
  END IF;

  -- Ajouter la table profiles à la publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    RAISE NOTICE '✅ Realtime activé sur profiles';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️ profiles déjà dans la publication realtime';
  END;
END $$;

-- 2. Vérifier l'activation
SELECT
  tablename,
  '✅ Realtime ACTIF' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'profiles';

-- 3. Créer un index pour optimiser les requêtes Realtime sur les abonnements
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_realtime
ON profiles(subscription_plan, subscription_status, subscription_expires_at)
WHERE subscription_status IN ('pending', 'active');

-- 4. Activer REPLICA IDENTITY FULL pour recevoir OLD et NEW dans les events
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ REALTIME ACTIVÉ SUR PROFILES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'La synchronisation automatique des abonnements';
  RAISE NOTICE 'est maintenant active. Quand un admin valide';
  RAISE NOTICE 'un abonnement, l''utilisateur recevra une';
  RAISE NOTICE 'notification instantanée !';
  RAISE NOTICE '';
END $$;
