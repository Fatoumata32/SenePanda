-- Ajouter la colonne theme_color à la table profiles
-- Cette colonne permet aux vendeurs de personnaliser la couleur de leur boutique

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT '#EF4444';

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN profiles.theme_color IS 'Couleur du thème de la boutique du vendeur (format hex)';
