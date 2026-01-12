-- =====================================================
-- SENEPANDA - ACTIVER REALTIME POUR PANDA COINS
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor
-- pour activer les notifications en temps réel
-- =====================================================

-- 1. Activer la réplication pour loyalty_points
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;

-- 2. Activer la réplication pour points_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;

-- Vérifier que les tables sont dans la publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Message de confirmation
SELECT '✅ Realtime activé pour loyalty_points et points_transactions' as status;
