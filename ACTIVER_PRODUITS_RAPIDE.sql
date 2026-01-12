-- ============================================
-- ACTIVER LES PRODUITS - SCRIPT ULTRA RAPIDE
-- ============================================
-- Copier-coller dans Supabase SQL Editor
-- ============================================

-- 1. ACTIVER tous les produits des dernières 24h
UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. S'assurer que name n'est pas NULL
UPDATE products
SET name = COALESCE(name, title, 'Produit')
WHERE name IS NULL OR name = '';

-- 3. Mettre à jour le timestamp (invalider cache)
UPDATE products
SET updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '1 day';

-- 4. VÉRIFICATION: Afficher les 5 derniers produits
SELECT
  name,
  price,
  currency,
  is_active,
  category_id,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date_creation
FROM products
ORDER BY created_at DESC
LIMIT 5;

-- 5. RÉSUMÉ
SELECT
  CASE
    WHEN is_active THEN '✅ Actifs'
    ELSE '❌ Inactifs'
  END as statut,
  COUNT(*) as nombre
FROM products
GROUP BY is_active
ORDER BY is_active DESC;
