-- =============================================
-- AJOUT DES COLONNES DE PERSONNALISATION BOUTIQUE
-- =============================================

-- Ajouter les colonnes pour la personnalisation de la boutique
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS gradient_colors TEXT[] DEFAULT ARRAY['#FF6B6B', '#FFE66D', '#FF9F1C'],
  ADD COLUMN IF NOT EXISTS theme_style VARCHAR(20) DEFAULT 'modern' CHECK (theme_style IN ('modern', 'elegant', 'vibrant', 'minimal')),
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN profiles.banner_url IS 'URL de l''image de bannière de la boutique (16:9)';
COMMENT ON COLUMN profiles.logo_url IS 'URL du logo de la boutique (carré)';
COMMENT ON COLUMN profiles.gradient_colors IS 'Couleurs du gradient pour le thème (array de hex colors)';
COMMENT ON COLUMN profiles.theme_style IS 'Style de thème de la boutique: modern, elegant, vibrant, minimal';
COMMENT ON COLUMN profiles.location IS 'Localisation de la boutique (ville, pays)';

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme_style);
CREATE INDEX IF NOT EXISTS idx_profiles_is_seller ON profiles(is_seller) WHERE is_seller = true;

-- =============================================
-- VALIDATION ET CONTRAINTES
-- =============================================

-- Fonction pour valider les couleurs hexadécimales
CREATE OR REPLACE FUNCTION validate_hex_color(color TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN color ~ '^#[0-9A-Fa-f]{6}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ajouter une contrainte pour valider le gradient_colors
-- (chaque couleur doit être au format hex valide)
-- Note: Cette contrainte est informative, la validation sera principalement faite côté app
COMMENT ON COLUMN profiles.gradient_colors IS
  'Couleurs du gradient (format hex: #RRGGBB). Minimum 2 couleurs, maximum 5.';

-- =============================================
-- DONNÉES PAR DÉFAUT POUR LES BOUTIQUES EXISTANTES
-- =============================================

-- Mettre à jour les profils vendeurs existants avec un gradient par défaut
UPDATE profiles
SET
  gradient_colors = ARRAY['#FF6B6B', '#FFE66D', '#FF9F1C'],
  theme_style = 'modern'
WHERE
  is_seller = true
  AND (gradient_colors IS NULL OR theme_style IS NULL);

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue pour obtenir les statistiques de personnalisation
CREATE OR REPLACE VIEW shop_customization_stats AS
SELECT
  COUNT(*) as total_shops,
  COUNT(banner_url) as shops_with_banner,
  COUNT(logo_url) as shops_with_logo,
  theme_style,
  COUNT(*) as count_by_theme
FROM profiles
WHERE is_seller = true
GROUP BY theme_style;

COMMENT ON VIEW shop_customization_stats IS 'Statistiques de personnalisation des boutiques vendeurs';

-- =============================================
-- FONCTION HELPER POUR GÉNÉRER DES GRADIENTS ALÉATOIRES
-- =============================================

CREATE OR REPLACE FUNCTION generate_random_gradient()
RETURNS TEXT[] AS $$
DECLARE
  gradients TEXT[][] := ARRAY[
    ARRAY['#FF6B6B', '#FFE66D', '#FF9F1C'],  -- sunset
    ARRAY['#667eea', '#764ba2', '#4facfe'],  -- ocean
    ARRAY['#11998e', '#38ef7d', '#06beb6'],  -- forest
    ARRAY['#8E2DE2', '#4A00E0', '#DA22FF'],  -- royal
    ARRAY['#f12711', '#f5af19', '#ff6b35'],  -- fire
    ARRAY['#00d2ff', '#3a7bd5', '#00d2ff']   -- sky
  ];
  random_index INTEGER;
BEGIN
  random_index := floor(random() * array_length(gradients, 1) + 1);
  RETURN gradients[random_index];
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_random_gradient IS
  'Génère un gradient aléatoire parmi les presets disponibles';

-- =============================================
-- EXEMPLE D'UTILISATION
-- =============================================

-- Pour attribuer un gradient aléatoire à une boutique :
-- UPDATE profiles
-- SET gradient_colors = generate_random_gradient()
-- WHERE id = 'votre-id' AND is_seller = true;

-- Pour vérifier les gradients :
-- SELECT id, shop_name, gradient_colors, theme_style, location
-- FROM profiles
-- WHERE is_seller = true;
