-- ========================================
-- VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ========================================

-- Vérifier quelles tables existent
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Vérifier les colonnes de la table categories
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table products
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table rewards
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rewards'
ORDER BY ordinal_position;
