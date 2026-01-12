-- ============================================
-- FIX RAPIDE: Produit invisible dans Explorer
-- ============================================

-- SOLUTION 1: Activer le dernier produit ajouté
-- =============================================
UPDATE products
SET is_active = true
WHERE id = (
  SELECT id FROM products
  ORDER BY created_at DESC
  LIMIT 1
);

-- SOLUTION 2: Activer tous les produits des dernières 24h
-- =============================================
UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- SOLUTION 3: S'assurer que name n'est pas NULL
-- =============================================
UPDATE products
SET name = title
WHERE name IS NULL AND title IS NOT NULL;

UPDATE products
SET name = 'Produit'
WHERE name IS NULL;

-- SOLUTION 4: Vérifier et afficher les résultats
-- =============================================
SELECT
  'Total produits actifs: ' || COUNT(*)::text as info
FROM products
WHERE is_active = true

UNION ALL

SELECT
  'Dernier produit ajouté: ' || COALESCE(name, title, 'Sans nom') || ' (Actif: ' ||
  CASE WHEN is_active THEN 'OUI' ELSE 'NON' END || ')'
FROM products
ORDER BY created_at DESC
LIMIT 1;

-- SOLUTION 5: Si problème de cache, forcer la mise à jour
-- =============================================
UPDATE products
SET updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '1 day';
