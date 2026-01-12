-- ========================================
-- INSPECTION DE LA TABLE subscription_plans
-- ========================================
-- Exécutez ce script d'abord pour voir la structure complète
-- ========================================

-- 1. Afficher toutes les colonnes avec leurs types
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 2. Afficher les contraintes NOT NULL
SELECT
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
  AND is_nullable = 'NO'
ORDER BY column_name;

-- 3. Afficher un exemple de données
SELECT *
FROM subscription_plans
LIMIT 1;

-- 4. Afficher la définition complète de la table
SELECT
  'CREATE TABLE subscription_plans (' ||
  string_agg(
    column_name || ' ' ||
    CASE
      WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
      WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
      ELSE UPPER(data_type)
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', ' ORDER BY ordinal_position
  ) || ');'
FROM information_schema.columns
WHERE table_name = 'subscription_plans';

-- ========================================
-- INSTRUCTIONS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '📋 INSPECTION TERMINÉE';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Regardez les résultats ci-dessus pour voir:';
  RAISE NOTICE '  1. Toutes les colonnes et leurs types';
  RAISE NOTICE '  2. Les colonnes avec NOT NULL';
  RAISE NOTICE '  3. Un exemple de données';
  RAISE NOTICE '  4. La définition SQL complète';
  RAISE NOTICE '';
  RAISE NOTICE 'Envoyez-moi ces résultats pour que je puisse';
  RAISE NOTICE 'créer un script global qui fonctionne !';
  RAISE NOTICE '';
END $$;
