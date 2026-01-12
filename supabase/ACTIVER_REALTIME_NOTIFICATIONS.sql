-- =====================================================
-- SCRIPT POUR ACTIVER LES NOTIFICATIONS EN TEMPS RÉEL
-- =====================================================
--
-- EXÉCUTEZ CE SCRIPT DANS: Supabase Dashboard > SQL Editor
--
-- Ce script active la fonctionnalité Realtime pour que
-- les vendeurs reçoivent une notification quand leur
-- abonnement est validé par l'admin.
-- =====================================================

-- 1. Activer Realtime pour la table profiles
-- (REPLICA IDENTITY FULL est nécessaire pour recevoir les anciennes valeurs)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 2. Ajouter la table à la publication realtime
DO $$
BEGIN
    -- Vérifier si la publication existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE profiles;
    ELSE
        -- Ajouter la table à la publication existante (ignore si déjà présente)
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Table profiles déjà dans supabase_realtime';
        END;
    END IF;
END $$;

-- 3. Activer aussi pour subscription_requests si elle existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_requests') THEN
        ALTER TABLE public.subscription_requests REPLICA IDENTITY FULL;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE subscription_requests;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 4. Vérification
SELECT
    'Tables avec Realtime activé:' as info,
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- 5. Message de succès
SELECT '✅ Realtime activé! Les notifications fonctionneront maintenant.' as resultat;
