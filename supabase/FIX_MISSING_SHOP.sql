-- ========================================
-- DIAGNOSTIC ET CORRECTION DES BOUTIQUES MANQUANTES
-- ========================================

-- ÉTAPE 1: Voir tous les profils et leur statut
SELECT
  id,
  username,
  full_name,
  is_seller,
  shop_name,
  shop_description,
  shop_logo_url,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ÉTAPE 2: Identifier les problèmes
SELECT
  CASE
    WHEN is_seller = true AND shop_name IS NOT NULL THEN '✅ Boutique OK'
    WHEN is_seller = true AND shop_name IS NULL THEN '❌ is_seller=true mais pas de shop_name'
    WHEN is_seller = false AND shop_name IS NOT NULL THEN '⚠️ shop_name existe mais is_seller=false'
    ELSE '✅ Client normal'
  END as statut,
  id,
  username,
  is_seller,
  shop_name
FROM profiles
ORDER BY created_at DESC;

-- ÉTAPE 3: Compter les boutiques
SELECT
  'Total profils' as type,
  COUNT(*) as nombre
FROM profiles
UNION ALL
SELECT
  'Vendeurs (is_seller=true)' as type,
  COUNT(*) as nombre
FROM profiles
WHERE is_seller = true
UNION ALL
SELECT
  'Boutiques avec nom' as type,
  COUNT(*) as nombre
FROM profiles
WHERE shop_name IS NOT NULL;

-- ========================================
-- CORRECTION MANUELLE (si besoin)
-- ========================================

-- Si vous avez créé une boutique mais elle n'apparaît pas,
-- trouvez votre ID utilisateur ci-dessus et exécutez:
-- (Remplacez 'VOTRE-USER-ID' par votre vrai ID)

-- UPDATE profiles
-- SET
--   is_seller = true,
--   shop_name = 'Ma Boutique',
--   shop_description = 'Description de ma boutique'
-- WHERE id = 'VOTRE-USER-ID';

-- Vérifier le résultat:
-- SELECT * FROM profiles WHERE id = 'VOTRE-USER-ID';
