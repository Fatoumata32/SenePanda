-- ========================================
-- ACTIVER REALTIME POUR SYNCHRONISATION AUTOMATIQUE
-- ========================================
--
-- Ce script active Supabase Realtime sur la table user_subscriptions
-- pour permettre la synchronisation en temps réel des validations d'abonnements.
--
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Vérifier si Realtime est déjà activé
DO $$
BEGIN
  RAISE NOTICE '🔍 Vérification de la configuration Realtime...';
END $$;

-- Afficher l'état actuel
SELECT
  schemaname,
  tablename,
  CASE
    WHEN tablename IN (
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
    ) THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as realtime_status
FROM pg_tables
WHERE tablename = 'user_subscriptions'
AND schemaname = 'public';

-- 2. Activer Realtime sur user_subscriptions
DO $$
BEGIN
  -- Vérifier si la publication existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Créer la publication si elle n'existe pas
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
    RAISE NOTICE '✅ Publication supabase_realtime créée';
  END IF;

  -- Ajouter la table à la publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;
    RAISE NOTICE '✅ Realtime activé sur user_subscriptions';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️  user_subscriptions déjà dans la publication';
  END;
END $$;

-- 3. Vérifier que ça fonctionne
SELECT
  '✅ Configuration Realtime vérifiée' as status,
  COUNT(*) as tables_with_realtime
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_subscriptions';

-- 4. Créer un index pour améliorer les performances des requêtes Realtime
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_status
ON user_subscriptions(user_id, status)
WHERE status IN ('pending', 'active');

COMMENT ON INDEX idx_user_subscriptions_user_id_status IS
'Index pour optimiser les requêtes Realtime filtrées par user_id et status';

-- 5. Vérifier les permissions RLS pour Realtime
DO $$
BEGIN
  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'user_subscriptions'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur user_subscriptions';
  ELSE
    RAISE NOTICE '✅ RLS déjà activé';
  END IF;
END $$;

-- 6. Créer/Vérifier les policies nécessaires pour Realtime
DO $$
BEGIN
  -- Policy pour SELECT (nécessaire pour Realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions"
    ON user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

    RAISE NOTICE '✅ Policy SELECT créée';
  ELSE
    RAISE NOTICE '✅ Policy SELECT existe déjà';
  END IF;
END $$;

-- 7. Tester la configuration avec un exemple
DO $$
DECLARE
  v_test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ REALTIME CONFIGURÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Configuration terminée :';
  RAISE NOTICE '  ✓ Publication Realtime : Activée';
  RAISE NOTICE '  ✓ Table user_subscriptions : Ajoutée';
  RAISE NOTICE '  ✓ Index de performance : Créé';
  RAISE NOTICE '  ✓ RLS : Activé';
  RAISE NOTICE '  ✓ Policies : Configurées';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes :';
  RAISE NOTICE '  1. Redémarrer l''application React Native';
  RAISE NOTICE '  2. Tester la synchronisation (voir TEST_SYNC_ABONNEMENT.md)';
  RAISE NOTICE '  3. Vérifier les logs de connexion Realtime';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- 8. Afficher les statistiques finales
SELECT
  'user_subscriptions' as table_name,
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE is_approved = true) as approved_count
FROM user_subscriptions;

-- 9. Commande pour vérifier manuellement plus tard
COMMENT ON TABLE user_subscriptions IS
'Table avec Realtime activé pour synchronisation automatique des validations d''abonnements.
Pour vérifier : SELECT * FROM pg_publication_tables WHERE pubname = ''supabase_realtime'' AND tablename = ''user_subscriptions'';';

-- ========================================
-- FIN DU SCRIPT
-- ========================================
