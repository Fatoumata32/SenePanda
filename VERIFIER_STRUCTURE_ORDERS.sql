-- ============================================
-- Vérifier la structure complète de la table orders
-- ============================================

-- Voir toutes les colonnes disponibles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Voir un exemple de données pour comprendre la structure
SELECT *
FROM orders
LIMIT 3;

-- Colonnes possibles pour l'adresse:
-- - address
-- - delivery_address
-- - shipping_address
-- - location
-- Ou peut-être dans la table profiles?

-- Vérifier si l'adresse est dans profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%address%'
ORDER BY ordinal_position;
