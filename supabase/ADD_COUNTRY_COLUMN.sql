-- ========================================
-- AJOUTER LA COLONNE COUNTRY À PROFILES
-- ========================================

-- Ajouter la colonne country si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Vérification
SELECT 'Colonne country ajoutée avec succès! ✅' as status;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
