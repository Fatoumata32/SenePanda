-- Ajouter les colonnes pour le gradient personnalisé de la boutique
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gradient_primary TEXT DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS gradient_secondary TEXT DEFAULT '#DC2626',
ADD COLUMN IF NOT EXISTS gradient_angle INTEGER DEFAULT 135;

-- Commentaires
COMMENT ON COLUMN profiles.gradient_primary IS 'Couleur primaire du gradient de la boutique';
COMMENT ON COLUMN profiles.gradient_secondary IS 'Couleur secondaire du gradient de la boutique';
COMMENT ON COLUMN profiles.gradient_angle IS 'Angle du gradient (en degrés)';
