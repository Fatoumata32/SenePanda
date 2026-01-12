r- ============================================
-- FIX: Ajouter colonnes rating à profiles
-- ============================================

-- Ajouter average_rating
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

-- Ajouter total_reviews
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Vérification
SELECT
  '✅ Colonnes ajoutées à profiles' as status;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('average_rating', 'total_reviews');
