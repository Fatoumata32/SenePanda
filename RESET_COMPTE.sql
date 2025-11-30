-- ============================================
-- 🔧 Réinitialisation Compte +221785423833
-- ============================================
-- Système: Code PIN 4 chiffres + Padding (001234)
-- À exécuter dans: Supabase Dashboard > SQL Editor
-- ============================================

-- Confirmer l'email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '+221785423833@senepanda.app'
  AND email_confirmed_at IS NULL;

-- Compléter le profil
UPDATE profiles
SET
  first_name = COALESCE(first_name, 'Utilisateur'),
  last_name = COALESCE(last_name, 'SenePanda'),
  full_name = COALESCE(full_name, 'Utilisateur SenePanda'),
  username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8)),
  email = COALESCE(email, phone || '@senepanda.app'),
  updated_at = NOW()
WHERE phone = '+221785423833'
  AND (first_name IS NULL OR last_name IS NULL);

-- Vérification
SELECT
  '✅ COMPTE VÉRIFIÉ' as info,
  p.phone,
  p.full_name,
  au.email,
  CASE
    WHEN au.email_confirmed_at IS NOT NULL THEN '✓ Email confirmé'
    ELSE '✗ Email non confirmé'
  END as statut_email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.phone = '+221785423833';

-- ============================================
-- 🎯 PROCHAINE ÉTAPE
-- ============================================
/*
Dashboard > Authentication > Users:
1. Chercher: +221785423833@senepanda.app
2. Menu ... > Reset Password
3. Taper: 001234 (6 caractères avec padding)
4. Save

Puis dans l'app:
- Numéro: +221 78 542 38 33
- PIN: 1234 (4 chiffres)
- L'app ajoute automatiquement le padding → 001234
- Connexion OK ✅
*/
