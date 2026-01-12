-- ============================================
-- FIX: Menu Commandes pour +221785423833
-- ============================================

-- ÉTAPE 1: Vérifier le profil actuel
-- ============================================

SELECT
  id,
  email,
  full_name,
  phone,
  is_seller,
  subscription_plan,
  subscription_status,
  subscription_end_date,
  shop_name,
  created_at
FROM profiles
WHERE phone = '+221785423833'
   OR phone = '221785423833'
   OR phone = '785423833';

-- Si le profil existe, noter l'ID pour la suite


-- ÉTAPE 2: SOLUTION COMPLÈTE
-- ============================================

-- Activer le vendeur + abonnement gratuit 7 jours
UPDATE profiles
SET
  is_seller = true,
  subscription_plan = 'free',
  subscription_status = 'active',
  subscription_end_date = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE phone = '+221785423833'
   OR phone = '221785423833'
   OR phone = '785423833';


-- ÉTAPE 3: Vérification finale
-- ============================================

SELECT
  id,
  email,
  full_name,
  phone,
  is_seller,
  subscription_plan,
  subscription_status,
  subscription_end_date,
  shop_name
FROM profiles
WHERE phone = '+221785423833'
   OR phone = '221785423833'
   OR phone = '785423833';

-- Résultat attendu:
-- phone: +221785423833 ✅
-- is_seller: true ✅
-- subscription_plan: free ✅
-- subscription_status: active ✅
-- subscription_end_date: [date dans 7 jours] ✅


-- ÉTAPE 4: Si le numéro n'existe pas
-- ============================================

-- Vérifier tous les profils pour trouver le bon
SELECT
  id,
  email,
  full_name,
  phone,
  is_seller,
  subscription_plan
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- Puis utiliser l'email ou l'ID pour faire l'UPDATE


-- ============================================
-- INSTRUCTIONS APRÈS MISE À JOUR
-- ============================================

/*
1. Fermez COMPLÈTEMENT l'application (ne pas minimiser)
2. Redémarrez l'application
3. Connectez-vous avec le compte +221785423833
4. Allez dans "Profil"
5. Vous devriez maintenant voir:
   - Menu "Commandes" avec icône chevron 🔽
   - Clic → Menu se déplie
   - "Mes Ventes" accessible ✅
   - "Mes Achats" accessible ✅
*/
