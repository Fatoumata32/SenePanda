-- ========================================================
-- FIX: Synchronisation en Temps Réel des Produits
-- ========================================================
-- Ce script active la synchronisation automatique entre:
-- 1. Page Boutique (shop/[id].tsx)
-- 2. Page Explorer (explore.tsx)
--
-- Quand un produit est modifié, toutes les pages se mettent
-- à jour automatiquement en temps réel.
-- ========================================================

-- ÉTAPE 1: Activer Realtime sur la table products
-- ========================================================

-- Vérifier si realtime est activé
SELECT schemaname, tablename,
       CASE
         WHEN tablename = ANY(
           SELECT tablename
           FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
         )
         THEN '✅ Realtime activé'
         ELSE '❌ Realtime désactivé'
       END as status
FROM pg_tables
WHERE tablename = 'products' AND schemaname = 'public';

-- Activer realtime si pas encore fait
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- ÉTAPE 2: Vérifier que les RLS permettent la lecture
-- ========================================================

-- Voir les policies actuelles
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- Créer une policy pour lire TOUS les produits actifs (si elle manque)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

CREATE POLICY "Anyone can view active products"
ON products
FOR SELECT
USING (is_active = true);

-- ÉTAPE 3: Test de vérification
-- ========================================================

-- Compter les produits visibles
SELECT COUNT(*) as total_products_visible
FROM products
WHERE is_active = true;

-- Voir quelques exemples
SELECT
  id,
  title,
  price,
  seller_id,
  is_active,
  updated_at
FROM products
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 5;

-- ========================================================
-- RÉSULTAT ATTENDU
-- ========================================================

/*
Après ce script:

1. ✅ Realtime activé sur la table products
2. ✅ Policy permet à tous de voir les produits actifs
3. ✅ Modifications détectées automatiquement

COMMENT TESTER:

1. Ouvrez l'app sur deux écrans:
   - Écran A: Page Explorer
   - Écran B: Page Boutique d'un vendeur

2. Sur un 3ème appareil (ou navigateur):
   - Connectez-vous comme vendeur
   - Éditez un produit (changez le titre, prix, etc.)
   - Sauvegardez

3. RÉSULTAT:
   - Écran A (Explorer) se met à jour AUTOMATIQUEMENT
   - Écran B (Boutique) se met à jour AUTOMATIQUEMENT
   - Aucun besoin de rafraîchir manuellement

LOGS À VÉRIFIER:
- Console devrait afficher: "Product changed in explorer:"
- Console devrait afficher: "Product changed:"
*/

-- ========================================================
-- Date: 2026-01-12
-- Problème: Modifications produits ne se synchronisent pas
-- Solution: Supabase Realtime + Auto-update des états React
-- ========================================================
