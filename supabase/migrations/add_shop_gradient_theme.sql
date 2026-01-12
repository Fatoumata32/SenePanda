-- Ajout des champs de thème de boutique personnalisés
-- Ces colonnes permettent de sauvegarder le gradient personnalisé de chaque boutique

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS gradient_primary text DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS gradient_secondary text DEFAULT '#DC2626',
ADD COLUMN IF NOT EXISTS gradient_angle integer DEFAULT 135,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS location text;

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.theme_color IS 'Couleur de thème principale de la boutique (legacy)';
COMMENT ON COLUMN profiles.gradient_primary IS 'Couleur primaire du gradient de la boutique';
COMMENT ON COLUMN profiles.gradient_secondary IS 'Couleur secondaire du gradient de la boutique';
COMMENT ON COLUMN profiles.gradient_angle IS 'Angle du gradient en degrés (0-360)';
COMMENT ON COLUMN profiles.logo_url IS 'URL du logo de la boutique';
COMMENT ON COLUMN profiles.location IS 'Localisation de la boutique';
