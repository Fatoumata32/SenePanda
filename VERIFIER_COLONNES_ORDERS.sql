-- ============================================
-- Vérifier les colonnes de la table orders
-- ============================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- ============================================
-- Voir un exemple de données
-- ============================================

SELECT *
FROM orders
LIMIT 1;
