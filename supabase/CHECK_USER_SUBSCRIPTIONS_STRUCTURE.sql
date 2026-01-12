-- =============================================
-- 🔍 VÉRIFIER LA STRUCTURE DE user_subscriptions
-- =============================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;
