-- =============================================
-- 📍 SYSTÈME DE GÉOLOCALISATION AVEC PRIORITÉ PREMIUM
-- =============================================
-- Date: 2025-11-30
-- Description: Ajoute la géolocalisation pour vendeurs et acheteurs
--              avec priorisation des vendeurs premium
-- =============================================

-- =============================================
-- 1. AJOUTER LES COLONNES DE GÉOLOCALISATION
-- =============================================

-- Ajouter latitude pour les profils
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude DOUBLE PRECISION;
    RAISE NOTICE '✅ Colonne latitude ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne latitude existe déjà';
  END IF;
END $$;

-- Ajouter longitude pour les profils
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude DOUBLE PRECISION;
    RAISE NOTICE '✅ Colonne longitude ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne longitude existe déjà';
  END IF;
END $$;

-- Ajouter location_updated_at pour suivre la fraîcheur de la localisation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'location_updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne location_updated_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne location_updated_at existe déjà';
  END IF;
END $$;

-- =============================================
-- 2. CRÉER L'EXTENSION POSTGIS (si disponible) ou utiliser la formule haversine
-- =============================================

-- Note: PostGIS est la meilleure option mais nécessite l'activation dans Supabase
-- On va créer notre propre fonction de calcul de distance

-- =============================================
-- 3. FONCTION: Calculer la distance entre deux points (formule Haversine)
-- =============================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  r DOUBLE PRECISION := 6371; -- Rayon de la Terre en km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Vérifier que les coordonnées sont valides
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convertir en radians
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);

  -- Formule de Haversine
  a := SIN(dlat/2) * SIN(dlat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon/2) * SIN(dlon/2);

  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  RETURN r * c; -- Distance en km
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux coordonnées GPS (formule Haversine)';

-- =============================================
-- 4. FONCTION: Rechercher les vendeurs proches avec priorité premium
-- =============================================

CREATE OR REPLACE FUNCTION find_nearby_sellers(
  p_user_latitude DOUBLE PRECISION,
  p_user_longitude DOUBLE PRECISION,
  p_max_distance_km DOUBLE PRECISION DEFAULT 50, -- Distance max en km
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  seller_id UUID,
  full_name TEXT,
  shop_name TEXT,
  shop_logo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  is_premium BOOLEAN,
  subscription_plan VARCHAR(20),
  average_rating DOUBLE PRECISION,
  total_reviews INTEGER,
  verified_seller BOOLEAN,
  seller_badge TEXT,
  phone TEXT,
  city TEXT,
  address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS seller_id,
    p.full_name,
    p.shop_name,
    p.shop_logo_url,
    p.latitude,
    p.longitude,
    calculate_distance(
      p_user_latitude,
      p_user_longitude,
      p.latitude,
      p.longitude
    ) AS distance_km,
    p.is_premium,
    p.subscription_plan,
    p.average_rating,
    p.total_reviews,
    p.verified_seller,
    p.seller_badge,
    p.phone,
    p.city,
    p.address
  FROM profiles p
  WHERE
    -- Seulement les vendeurs actifs
    p.is_seller = TRUE
    -- Avec coordonnées GPS valides
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    -- Dans le rayon de recherche
    AND calculate_distance(
      p_user_latitude,
      p_user_longitude,
      p.latitude,
      p.longitude
    ) <= p_max_distance_km
  ORDER BY
    -- PRIORITÉ 1: Abonnés Premium en premier
    CASE
      WHEN p.subscription_plan = 'premium' THEN 1
      WHEN p.subscription_plan = 'pro' THEN 2
      WHEN p.subscription_plan = 'starter' THEN 3
      ELSE 4
    END ASC,
    -- PRIORITÉ 2: Distance (plus proche en premier)
    calculate_distance(
      p_user_latitude,
      p_user_longitude,
      p.latitude,
      p.longitude
    ) ASC,
    -- PRIORITÉ 3: Note moyenne
    p.average_rating DESC,
    -- PRIORITÉ 4: Nombre d'avis
    p.total_reviews DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_nearby_sellers IS 'Trouve les vendeurs proches avec priorité aux abonnés premium';

-- =============================================
-- 5. FONCTION: Rechercher les produits proches avec priorité premium
-- =============================================

CREATE OR REPLACE FUNCTION find_nearby_products(
  p_user_latitude DOUBLE PRECISION,
  p_user_longitude DOUBLE PRECISION,
  p_max_distance_km DOUBLE PRECISION DEFAULT 50,
  p_category_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  product_id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  currency VARCHAR(3),
  image_url TEXT,
  images TEXT[],
  stock INTEGER,
  average_rating DOUBLE PRECISION,
  total_reviews INTEGER,
  seller_id UUID,
  seller_name TEXT,
  shop_name TEXT,
  shop_logo_url TEXT,
  seller_latitude DOUBLE PRECISION,
  seller_longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  is_premium BOOLEAN,
  subscription_plan VARCHAR(20),
  verified_seller BOOLEAN,
  seller_badge TEXT,
  category_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    prod.id AS product_id,
    prod.title,
    prod.description,
    prod.price,
    prod.currency,
    prod.image_url,
    prod.images,
    prod.stock,
    prod.average_rating,
    prod.total_reviews,
    p.id AS seller_id,
    p.full_name AS seller_name,
    p.shop_name,
    p.shop_logo_url,
    p.latitude AS seller_latitude,
    p.longitude AS seller_longitude,
    calculate_distance(
      p_user_latitude,
      p_user_longitude,
      p.latitude,
      p.longitude
    ) AS distance_km,
    p.is_premium,
    p.subscription_plan,
    p.verified_seller,
    p.seller_badge,
    prod.category_id
  FROM products prod
  JOIN profiles p ON prod.seller_id = p.id
  WHERE
    -- Produit actif
    prod.is_active = TRUE
    -- Stock disponible
    AND prod.stock > 0
    -- Vendeur actif
    AND p.is_seller = TRUE
    -- Coordonnées GPS valides
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    -- Filtrer par catégorie si spécifié
    AND (p_category_id IS NULL OR prod.category_id = p_category_id)
    -- Dans le rayon de recherche
    AND calculate_distance(
      p_user_latitude,
      p_user_longitude,
      p.latitude,
      p.longitude
    ) <= p_max_distance_km
  ORDER BY
    -- PRIORITÉ 1: Abonnés Premium en premier
    CASE
      WHEN p.subscription_plan = 'premium' THEN 1
      WHEN p.subscription_plan = 'pro' THEN 2
      WHEN p.subscription_plan = 'starter' THEN 3
      ELSE 4
    END ASC,
    -- PRIORITÉ 2: Distance (plus proche en premier)
    calculate_distance(
      p_user_latitude,
      p_user_longitude,
      p.latitude,
      p.longitude
    ) ASC,
    -- PRIORITÉ 3: Note du produit
    prod.average_rating DESC,
    -- PRIORITÉ 4: Nombre d'avis du produit
    prod.total_reviews DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_nearby_products IS 'Trouve les produits proches avec priorité aux vendeurs premium';

-- =============================================
-- 6. FONCTION: Mettre à jour la localisation d'un utilisateur
-- =============================================

CREATE OR REPLACE FUNCTION update_user_location(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Vérifier que les coordonnées sont valides
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Coordonnées GPS invalides'
    );
  END IF;

  -- Vérifier que la latitude est valide (-90 à 90)
  IF p_latitude < -90 OR p_latitude > 90 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Latitude invalide (doit être entre -90 et 90)'
    );
  END IF;

  -- Vérifier que la longitude est valide (-180 à 180)
  IF p_longitude < -180 OR p_longitude > 180 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Longitude invalide (doit être entre -180 et 180)'
    );
  END IF;

  -- Mettre à jour la localisation
  UPDATE profiles
  SET
    latitude = p_latitude,
    longitude = p_longitude,
    address = COALESCE(p_address, address),
    city = COALESCE(p_city, city),
    location_updated_at = NOW()
  WHERE id = p_user_id;

  -- Vérifier si la mise à jour a réussi
  IF FOUND THEN
    v_updated := TRUE;
  ELSE
    v_updated := FALSE;
  END IF;

  IF v_updated THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Localisation mise à jour avec succès',
      'latitude', p_latitude,
      'longitude', p_longitude,
      'updated_at', NOW()
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors de la mise à jour'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_location IS 'Met à jour la localisation GPS d''un utilisateur';

-- =============================================
-- 7. CRÉER DES INDEX POUR OPTIMISER LES REQUÊTES
-- =============================================

-- Index sur latitude/longitude pour les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_profiles_location
  ON profiles(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index sur is_seller et coordonnées pour find_nearby_sellers
CREATE INDEX IF NOT EXISTS idx_profiles_seller_location
  ON profiles(is_seller, latitude, longitude)
  WHERE is_seller = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index sur subscription_plan pour priorisation
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
  ON profiles(subscription_plan)
  WHERE subscription_plan IS NOT NULL;

-- Index composite pour optimiser find_nearby_sellers
CREATE INDEX IF NOT EXISTS idx_profiles_seller_premium_location
  ON profiles(is_seller, subscription_plan, latitude, longitude)
  WHERE is_seller = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- =============================================
-- 8. CRÉER UNE VUE POUR LES VENDEURS AVEC LOCALISATION
-- =============================================

CREATE OR REPLACE VIEW sellers_with_location AS
SELECT
  p.id,
  p.full_name,
  p.shop_name,
  p.shop_description,
  p.shop_logo_url,
  p.shop_banner_url,
  p.phone,
  p.address,
  p.city,
  p.country,
  p.latitude,
  p.longitude,
  p.location_updated_at,
  p.is_premium,
  p.subscription_plan,
  p.subscription_status,
  p.average_rating,
  p.total_reviews,
  p.verified_seller,
  p.seller_badge,
  p.followers_count,
  p.created_at
FROM profiles p
WHERE
  p.is_seller = TRUE
  AND p.latitude IS NOT NULL
  AND p.longitude IS NOT NULL
ORDER BY
  CASE
    WHEN p.subscription_plan = 'premium' THEN 1
    WHEN p.subscription_plan = 'pro' THEN 2
    WHEN p.subscription_plan = 'starter' THEN 3
    ELSE 4
  END ASC,
  p.average_rating DESC;

COMMENT ON VIEW sellers_with_location IS 'Vue des vendeurs avec localisation, triés par priorité premium';

-- =============================================
-- 9. AFFICHER UN RÉSUMÉ
-- =============================================

DO $$
DECLARE
  v_total_sellers INTEGER;
  v_sellers_with_location INTEGER;
  v_premium_sellers INTEGER;
  v_products_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_sellers
    FROM profiles
    WHERE is_seller = TRUE;

  SELECT COUNT(*) INTO v_sellers_with_location
    FROM profiles
    WHERE is_seller = TRUE
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL;

  SELECT COUNT(*) INTO v_premium_sellers
    FROM profiles
    WHERE is_seller = TRUE
      AND subscription_plan IN ('premium', 'pro', 'starter');

  SELECT COUNT(*) INTO v_products_count
    FROM products
    WHERE is_active = TRUE;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ SYSTÈME DE GÉOLOCALISATION INSTALLÉ';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '  • Total vendeurs: %', v_total_sellers;
  RAISE NOTICE '  • Vendeurs avec localisation: %', v_sellers_with_location;
  RAISE NOTICE '  • Vendeurs premium/pro/starter: %', v_premium_sellers;
  RAISE NOTICE '  • Produits actifs: %', v_products_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colonnes ajoutées: latitude, longitude, location_updated_at';
  RAISE NOTICE '✅ Fonction calculate_distance() créée';
  RAISE NOTICE '✅ Fonction find_nearby_sellers() créée';
  RAISE NOTICE '✅ Fonction find_nearby_products() créée';
  RAISE NOTICE '✅ Fonction update_user_location() créée';
  RAISE NOTICE '✅ Index de performance créés';
  RAISE NOTICE '✅ Vue sellers_with_location créée';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 FONCTIONNALITÉS:';
  RAISE NOTICE '  • Recherche vendeurs par proximité avec priorité premium';
  RAISE NOTICE '  • Recherche produits par proximité avec priorité premium';
  RAISE NOTICE '  • Calcul de distance précis (formule Haversine)';
  RAISE NOTICE '  • Mise à jour de localisation sécurisée';
  RAISE NOTICE '';
  RAISE NOTICE '📝 EXEMPLES D''UTILISATION:';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Trouver les vendeurs dans un rayon de 10 km:';
  RAISE NOTICE '  SELECT * FROM find_nearby_sellers(14.6928, -17.4467, 10, 20);';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Trouver les produits dans un rayon de 5 km:';
  RAISE NOTICE '  SELECT * FROM find_nearby_products(14.6928, -17.4467, 5, NULL, 20);';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Mettre à jour sa localisation:';
  RAISE NOTICE '  SELECT update_user_location(''user-id'', 14.6928, -17.4467, ''Adresse'', ''Dakar'');';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;
