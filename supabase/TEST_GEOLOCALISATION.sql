-- =============================================
-- 🧪 TESTS DU SYSTÈME DE GÉOLOCALISATION
-- =============================================
-- Instructions: Exécutez ces tests après avoir installé le système
-- =============================================

-- =============================================
-- TEST 1: Vérifier que les colonnes ont été ajoutées
-- =============================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('latitude', 'longitude', 'location_updated_at')
ORDER BY column_name;

-- Résultat attendu: 3 lignes
-- latitude | double precision
-- longitude | double precision
-- location_updated_at | timestamp with time zone

-- =============================================
-- TEST 2: Vérifier que les fonctions ont été créées
-- =============================================

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%location%'
  OR routine_name LIKE '%distance%'
  OR routine_name LIKE '%nearby%'
ORDER BY routine_name;

-- Résultat attendu: 4 fonctions
-- calculate_distance
-- find_nearby_products
-- find_nearby_sellers
-- update_user_location

-- =============================================
-- TEST 3: Tester la fonction calculate_distance
-- =============================================

-- Test 1: Distance Dakar → Yoff
SELECT calculate_distance(
  14.6928, -17.4467,  -- Dakar
  14.7646, -17.3673   -- Yoff
) AS distance_km;

-- Résultat attendu: ~12.5 km

-- Test 2: Distance nulle (même point)
SELECT calculate_distance(
  14.6928, -17.4467,
  14.6928, -17.4467
) AS distance_km;

-- Résultat attendu: 0 km

-- Test 3: Coordonnées NULL
SELECT calculate_distance(
  NULL, -17.4467,
  14.6928, -17.4467
) AS distance_km;

-- Résultat attendu: NULL

-- =============================================
-- TEST 4: Ajouter des données de test
-- =============================================

-- Créer quelques vendeurs de test avec localisation
-- (Remplacez les IDs par des IDs réels de votre base)

-- Exemple pour un vendeur existant:
/*
UPDATE profiles
SET
  latitude = 14.6928,
  longitude = -17.4467,
  location_updated_at = NOW()
WHERE id = 'VOTRE_USER_ID_ICI'
  AND is_seller = TRUE;
*/

-- Ajouter plusieurs vendeurs de test avec différents plans:
-- (Utilisez vos propres IDs)

-- Vendeur Premium à Dakar centre
/*
UPDATE profiles
SET
  latitude = 14.6928,
  longitude = -17.4467,
  subscription_plan = 'premium',
  location_updated_at = NOW()
WHERE id = 'VENDEUR_PREMIUM_ID';
*/

-- Vendeur Pro à Yoff
/*
UPDATE profiles
SET
  latitude = 14.7646,
  longitude = -17.3673,
  subscription_plan = 'pro',
  location_updated_at = NOW()
WHERE id = 'VENDEUR_PRO_ID';
*/

-- Vendeur Starter à Ouakam
/*
UPDATE profiles
SET
  latitude = 14.7169,
  longitude = -17.4907,
  subscription_plan = 'starter',
  location_updated_at = NOW()
WHERE id = 'VENDEUR_STARTER_ID';
*/

-- Vendeur Free à Plateau (très proche)
/*
UPDATE profiles
SET
  latitude = 14.6937,
  longitude = -17.4441,
  subscription_plan = NULL,
  location_updated_at = NOW()
WHERE id = 'VENDEUR_FREE_ID';
*/

-- =============================================
-- TEST 5: Vérifier les vendeurs avec localisation
-- =============================================

SELECT
  id,
  full_name,
  shop_name,
  subscription_plan,
  latitude,
  longitude,
  location_updated_at
FROM profiles
WHERE is_seller = TRUE
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
ORDER BY
  CASE
    WHEN subscription_plan = 'premium' THEN 1
    WHEN subscription_plan = 'pro' THEN 2
    WHEN subscription_plan = 'starter' THEN 3
    ELSE 4
  END ASC;

-- Résultat: Vendeurs triés par priorité premium

-- =============================================
-- TEST 6: Tester find_nearby_sellers
-- =============================================

-- Test depuis Dakar (14.6928, -17.4467)
-- Rayon de 10 km
SELECT
  seller_id,
  shop_name,
  subscription_plan,
  distance_km,
  average_rating,
  total_reviews
FROM find_nearby_sellers(14.6928, -17.4467, 10, 20)
LIMIT 10;

-- Résultat attendu:
-- Les vendeurs PREMIUM apparaissent EN PREMIER
-- Puis les vendeurs PRO
-- Puis les vendeurs STARTER
-- Puis les vendeurs FREE (en dernier)

-- Test avec rayon plus large (50 km)
SELECT
  seller_id,
  shop_name,
  subscription_plan,
  distance_km
FROM find_nearby_sellers(14.6928, -17.4467, 50, 20);

-- =============================================
-- TEST 7: Tester update_user_location
-- =============================================

-- Test avec un utilisateur existant
-- (Remplacez par votre user_id)

/*
SELECT update_user_location(
  'VOTRE_USER_ID',
  14.6928,
  -17.4467,
  'Rue de la République, Dakar',
  'Dakar'
);
*/

-- Résultat attendu:
-- {
--   "success": true,
--   "message": "Localisation mise à jour avec succès",
--   "latitude": 14.6928,
--   "longitude": -17.4467,
--   "updated_at": "2025-11-30T..."
-- }

-- Test avec coordonnées invalides (latitude > 90)
/*
SELECT update_user_location(
  'VOTRE_USER_ID',
  95,
  -17.4467,
  'Adresse',
  'Ville'
);
*/

-- Résultat attendu:
-- {
--   "success": false,
--   "error": "Latitude invalide (doit être entre -90 et 90)"
-- }

-- =============================================
-- TEST 8: Tester find_nearby_products
-- =============================================

-- Trouver des produits dans un rayon de 20 km
SELECT
  product_id,
  title,
  price,
  shop_name,
  subscription_plan,
  distance_km
FROM find_nearby_products(14.6928, -17.4467, 20, NULL, 20)
LIMIT 10;

-- Résultat attendu:
-- Produits des vendeurs PREMIUM en premier
-- Puis des vendeurs PRO
-- Etc.

-- Trouver des produits d'une catégorie spécifique
/*
SELECT
  product_id,
  title,
  price,
  shop_name,
  subscription_plan,
  distance_km
FROM find_nearby_products(
  14.6928,
  -17.4467,
  30,
  'CATEGORY_ID_ICI',
  20
);
*/

-- =============================================
-- TEST 9: Vérifier la vue sellers_with_location
-- =============================================

SELECT
  id,
  shop_name,
  subscription_plan,
  latitude,
  longitude,
  average_rating
FROM sellers_with_location
LIMIT 10;

-- Résultat: Vendeurs pré-triés par priorité premium

-- =============================================
-- TEST 10: Test de performance
-- =============================================

-- Mesurer le temps d'exécution de find_nearby_sellers
EXPLAIN ANALYZE
SELECT * FROM find_nearby_sellers(14.6928, -17.4467, 50, 100);

-- Vérifier que les index sont utilisés

-- =============================================
-- TEST 11: Vérifier les index
-- =============================================

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE '%location%'
ORDER BY indexname;

-- Résultat attendu: 4 index
-- idx_profiles_location
-- idx_profiles_seller_location
-- idx_profiles_seller_premium_location
-- idx_profiles_subscription_plan

-- =============================================
-- TEST 12: Statistiques
-- =============================================

-- Nombre total de vendeurs
SELECT COUNT(*) AS total_sellers
FROM profiles
WHERE is_seller = TRUE;

-- Vendeurs avec localisation
SELECT COUNT(*) AS sellers_with_location
FROM profiles
WHERE is_seller = TRUE
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

-- Vendeurs par plan d'abonnement
SELECT
  COALESCE(subscription_plan, 'free') AS plan,
  COUNT(*) AS count
FROM profiles
WHERE is_seller = TRUE
GROUP BY subscription_plan
ORDER BY
  CASE
    WHEN subscription_plan = 'premium' THEN 1
    WHEN subscription_plan = 'pro' THEN 2
    WHEN subscription_plan = 'starter' THEN 3
    ELSE 4
  END;

-- =============================================
-- TEST 13: Vérifier la priorité de tri
-- =============================================

-- Ce test vérifie que les vendeurs PREMIUM sont bien en premier
-- même s'ils sont plus loin

WITH test_sellers AS (
  SELECT * FROM find_nearby_sellers(14.6928, -17.4467, 50, 100)
)
SELECT
  ROW_NUMBER() OVER () AS position,
  shop_name,
  subscription_plan,
  distance_km,
  CASE
    WHEN subscription_plan = 'premium' THEN '1-PREMIUM ⭐'
    WHEN subscription_plan = 'pro' THEN '2-PRO 💜'
    WHEN subscription_plan = 'starter' THEN '3-STARTER 💙'
    ELSE '4-FREE ⚪'
  END AS priority_group
FROM test_sellers
ORDER BY position
LIMIT 20;

-- Résultat attendu:
-- Les positions 1, 2, 3... contiennent d'abord les PREMIUM
-- Puis les PRO
-- Puis les STARTER
-- Puis les FREE (en dernier)

-- =============================================
-- RÉSUMÉ DES TESTS
-- =============================================

DO $$
DECLARE
  v_total_sellers INTEGER;
  v_sellers_with_location INTEGER;
  v_premium_sellers INTEGER;
  v_functions_count INTEGER;
  v_indexes_count INTEGER;
BEGIN
  -- Compter les vendeurs
  SELECT COUNT(*) INTO v_total_sellers
    FROM profiles WHERE is_seller = TRUE;

  SELECT COUNT(*) INTO v_sellers_with_location
    FROM profiles
    WHERE is_seller = TRUE
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL;

  SELECT COUNT(*) INTO v_premium_sellers
    FROM profiles
    WHERE is_seller = TRUE
      AND subscription_plan IN ('premium', 'pro', 'starter');

  -- Compter les fonctions
  SELECT COUNT(*) INTO v_functions_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND (routine_name LIKE '%location%'
        OR routine_name LIKE '%distance%'
        OR routine_name LIKE '%nearby%');

  -- Compter les index
  SELECT COUNT(*) INTO v_indexes_count
    FROM pg_indexes
    WHERE tablename = 'profiles'
      AND indexname LIKE '%location%';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '📊 RÉSUMÉ DES TESTS DE GÉOLOCALISATION';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions SQL créées: %', v_functions_count;
  RAISE NOTICE '✅ Index de performance: %', v_indexes_count;
  RAISE NOTICE '✅ Total vendeurs: %', v_total_sellers;
  RAISE NOTICE '✅ Vendeurs avec localisation: %', v_sellers_with_location;
  RAISE NOTICE '✅ Vendeurs premium/pro/starter: %', v_premium_sellers;
  RAISE NOTICE '';

  IF v_functions_count >= 4 THEN
    RAISE NOTICE '✅ Toutes les fonctions sont créées';
  ELSE
    RAISE NOTICE '⚠️  Certaines fonctions sont manquantes';
  END IF;

  IF v_indexes_count >= 4 THEN
    RAISE NOTICE '✅ Tous les index sont créés';
  ELSE
    RAISE NOTICE '⚠️  Certains index sont manquants';
  END IF;

  IF v_sellers_with_location > 0 THEN
    RAISE NOTICE '✅ Des vendeurs ont une localisation';
  ELSE
    RAISE NOTICE '⚠️  Aucun vendeur n''a de localisation (ajoutez-en pour tester)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Ajouter des localisations aux vendeurs de test';
  RAISE NOTICE '  2. Tester find_nearby_sellers() avec différents rayons';
  RAISE NOTICE '  3. Vérifier que les vendeurs PREMIUM sont bien en premier';
  RAISE NOTICE '  4. Tester l''app mobile avec le composant NearbySellersGrid';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;
