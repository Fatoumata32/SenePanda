-- ============================================
-- FIX COMPLET: Boutiques Explorer - Modal de Recherche
-- ============================================
-- Ce script ajoute toutes les colonnes nécessaires pour afficher
-- et rechercher les boutiques via le modal dans la page Explorer

-- PARTIE 1: Colonnes PROFILES (Boutiques)
-- ============================================

-- Colonnes de base boutique
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;

-- Colonnes de localisation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sénégal';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Colonnes de notation/réputation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT false;

-- Colonnes de statut
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_is_active BOOLEAN DEFAULT true;

-- ============================================
-- PARTIE 2: Colonnes PRODUCTS (pour les produits)
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new';

-- ============================================
-- PARTIE 3: Index pour performances (IMPORTANT!)
-- ============================================

-- Index sur is_seller pour filtrer rapidement les vendeurs
CREATE INDEX IF NOT EXISTS idx_profiles_is_seller
ON profiles(is_seller)
WHERE is_seller = true;

-- Index sur shop_name pour la recherche
CREATE INDEX IF NOT EXISTS idx_profiles_shop_name
ON profiles(shop_name)
WHERE shop_name IS NOT NULL;

-- Index sur city pour la recherche par localisation
CREATE INDEX IF NOT EXISTS idx_profiles_city
ON profiles(city)
WHERE city IS NOT NULL;

-- Index composite pour la recherche de boutiques actives
CREATE INDEX IF NOT EXISTS idx_profiles_active_sellers
ON profiles(is_seller, shop_is_active, average_rating DESC)
WHERE is_seller = true AND shop_is_active = true;

-- ============================================
-- PARTIE 4: Fonction de recherche de texte (OPTIONNEL mais utile)
-- ============================================

-- Créer une colonne de recherche plein texte (tsvector)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_search_vector tsvector;

-- Créer un trigger pour mettre à jour automatiquement le vecteur de recherche
CREATE OR REPLACE FUNCTION update_shop_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.shop_search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.shop_name, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.shop_description, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trig_update_shop_search_vector ON profiles;
CREATE TRIGGER trig_update_shop_search_vector
BEFORE INSERT OR UPDATE OF shop_name, shop_description, city
ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_shop_search_vector();

-- Index GIN pour la recherche plein texte
CREATE INDEX IF NOT EXISTS idx_profiles_shop_search
ON profiles USING gin(shop_search_vector);

-- ============================================
-- PARTIE 5: Mise à jour des données existantes
-- ============================================

-- Mettre à jour le vecteur de recherche pour les boutiques existantes
UPDATE profiles
SET shop_search_vector =
  setweight(to_tsvector('french', COALESCE(shop_name, '')), 'A') ||
  setweight(to_tsvector('french', COALESCE(shop_description, '')), 'B') ||
  setweight(to_tsvector('french', COALESCE(city, '')), 'C')
WHERE is_seller = true AND shop_name IS NOT NULL;

-- Activer les boutiques qui ont un nom
UPDATE profiles
SET shop_is_active = true
WHERE is_seller = true AND shop_name IS NOT NULL AND shop_is_active IS NULL;

-- ============================================
-- PARTIE 6: Policies RLS (Row Level Security)
-- ============================================

-- Permettre à tous de lire les profils de vendeurs actifs
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- ============================================
-- PARTIE 7: Vérification et statistiques
-- ============================================

-- Compter les boutiques actives
SELECT
  'Boutiques actives' as type,
  COUNT(*) as total
FROM profiles
WHERE is_seller = true
  AND shop_name IS NOT NULL
  AND shop_is_active = true;

-- Compter les boutiques par ville
SELECT
  COALESCE(city, 'Non spécifiée') as ville,
  COUNT(*) as nombre_boutiques,
  ROUND(AVG(average_rating), 1) as note_moyenne
FROM profiles
WHERE is_seller = true AND shop_name IS NOT NULL
GROUP BY city
ORDER BY nombre_boutiques DESC
LIMIT 10;

-- Afficher les colonnes de la table profiles
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'shop_name', 'shop_description', 'shop_logo_url', 'shop_banner_url',
    'city', 'average_rating', 'total_reviews', 'is_seller', 'shop_is_active'
  )
ORDER BY column_name;

-- ============================================
-- SUCCÈS!
-- ============================================
SELECT '✅ SCRIPT TERMINÉ - Boutiques prêtes pour la recherche!' as status;
