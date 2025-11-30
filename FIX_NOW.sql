-- ============================================
-- 🚀 FIX RAPIDE - Compte +221785423833
-- ============================================
-- Copier-coller ce script dans Supabase Dashboard > SQL Editor
-- Puis cliquer sur RUN
-- ============================================

-- ÉTAPE 1: Confirmer l'email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '+221785423833@senepanda.app'
  AND email_confirmed_at IS NULL;

-- ÉTAPE 2: Compléter le profil
UPDATE profiles
SET
  first_name = COALESCE(first_name, 'Utilisateur'),
  last_name = COALESCE(last_name, 'SenePanda'),
  full_name = COALESCE(full_name, 'Utilisateur SenePanda'),
  username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8)),
  email = COALESCE(email, phone || '@senepanda.app'),
  updated_at = NOW()
WHERE phone = '+221785423833'
  AND (first_name IS NULL OR last_name IS NULL OR full_name IS NULL);

-- ÉTAPE 3: Vérification
SELECT
  '✅ VÉRIFICATION DU COMPTE' as info,
  p.phone as "Téléphone",
  p.full_name as "Nom",
  p.email as "Email Profil",
  au.email as "Email Auth",
  CASE
    WHEN au.email_confirmed_at IS NOT NULL THEN '✓ Confirmé'
    ELSE '✗ Non confirmé'
  END as "Statut Email",
  CASE
    WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL
    THEN '✓ Complet'
    ELSE '✗ Incomplet'
  END as "Statut Profil"
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.phone = '+221785423833';

-- ============================================
-- 🎯 PROCHAINE ÉTAPE (IMPORTANTE!)
-- ============================================
/*
Après avoir exécuté ce script avec succès:

1. Aller dans: Dashboard > Authentication > Users
2. Chercher: +221785423833@senepanda.app
3. Cliquer sur l'utilisateur
4. Menu "..." > Reset Password
5. Taper EXACTEMENT: 1234 (4 chiffres, PAS 001234)
6. Cliquer Save

Puis tester dans l'app:
- Numéro: +221 78 542 38 33
- Code PIN: 1234
- Se connecter

✅ Si ça marche: Parfait!
❌ Si ça bloque: Vérifier que le mot de passe est bien "1234" (4 chiffres)
*/
