-- ============================================
-- FIX: Ajouter colonne total_reviews à products
-- ============================================

-- Ajouter total_reviews (optionnel)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Vérification
SELECT
  '✅ Colonne total_reviews ajoutée à products' as status;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'total_reviews';
