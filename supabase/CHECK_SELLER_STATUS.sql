-- ========================================
-- VÉRIFIER LE STATUT DE VENDEUR
-- ========================================

-- Voir tous les profils avec leur statut de vendeur
SELECT
  id,
  username,
  full_name,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Compter les vendeurs
SELECT
  CASE WHEN is_seller = true THEN 'Vendeurs' ELSE 'Clients' END as type,
  COUNT(*) as nombre
FROM profiles
GROUP BY is_seller;

-- Voir les boutiques créées
SELECT
  username,
  shop_name,
  is_seller,
  CASE
    WHEN is_seller = true AND shop_name IS NOT NULL THEN '✅ Boutique active'
    WHEN is_seller = true AND shop_name IS NULL THEN '⚠️ Vendeur sans boutique'
    ELSE '❌ Non vendeur'
  END as statut
FROM profiles
ORDER BY is_seller DESC, created_at DESC;
