-- ============================================
-- FIX URGENT - Réinitialisation du compte +221785423833
-- ============================================
-- Ce script réinitialise le mot de passe avec le bon format (001234)
-- Exécutez-le dans le SQL Editor de Supabase Dashboard
-- ============================================

-- ÉTAPE 1: Vérifier que l'utilisateur existe
SELECT
  'Vérification du compte' as etape,
  p.id,
  p.phone,
  p.full_name,
  p.email,
  au.email as auth_email,
  au.created_at,
  au.last_sign_in_at,
  CASE
    WHEN au.id IS NULL THEN '❌ Compte Auth manquant'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    ELSE '✓ Compte actif'
  END as statut
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.phone = '+221785423833';

-- ============================================
-- ÉTAPE 2: Confirmer l'email automatiquement (si nécessaire)
-- ============================================
-- Cette étape est importante car Supabase peut bloquer les connexions
-- si l'email n'est pas confirmé

UPDATE auth.users
SET
  email_confirmed_at = NOW()
WHERE email = '+221785423833@senepanda.app'
  AND email_confirmed_at IS NULL;

-- Vérification
SELECT
  'Après confirmation email' as etape,
  email,
  email_confirmed_at,
  confirmed_at,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN '✓ Email confirmé'
    ELSE '❌ Email non confirmé'
  END as statut
FROM auth.users
WHERE email = '+221785423833@senepanda.app';

-- ============================================
-- ÉTAPE 3: Instructions pour réinitialiser via Dashboard
-- ============================================
/*
IMPORTANT: Le mot de passe dans Supabase doit être 001234 (avec padding)

MÉTHODE DASHBOARD:

1. Aller dans: Authentication > Users
2. Chercher l'email: +221785423833@senepanda.app
3. Cliquer sur l'utilisateur
4. Cliquer sur "Update user" ou le menu "..." puis "Reset Password"
5. Dans le champ "Password", entrer EXACTEMENT: 001234
   ⚠️ ATTENTION: Pas 1234, mais 001234 (avec les deux zéros)
6. Cliquer sur "Update user"

VÉRIFICATION:
- L'utilisateur doit taper: 1234 (4 chiffres)
- Le système convertit automatiquement: 1234 → 001234
- La connexion devrait fonctionner
*/

-- ============================================
-- ÉTAPE 4: Vérification des métadonnées
-- ============================================
-- Vérifier que le profil est complet

SELECT
  'Vérification du profil' as etape,
  id,
  phone,
  first_name,
  last_name,
  full_name,
  username,
  email,
  CASE
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN '✓ Profil complet'
    ELSE '⚠️ Profil incomplet'
  END as statut_profil
FROM profiles
WHERE phone = '+221785423833';

-- ============================================
-- ÉTAPE 5: Compléter le profil si nécessaire
-- ============================================
-- Si le profil est incomplet, le compléter avec des valeurs par défaut

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

-- Vérification après mise à jour
SELECT
  'Après mise à jour du profil' as etape,
  phone,
  first_name,
  last_name,
  full_name,
  username,
  email
FROM profiles
WHERE phone = '+221785423833';

-- ============================================
-- ÉTAPE 6: Résumé Final
-- ============================================

DO $$
DECLARE
  profile_rec RECORD;
  auth_rec RECORD;
BEGIN
  -- Récupérer les infos du profil
  SELECT * INTO profile_rec
  FROM profiles
  WHERE phone = '+221785423833';

  -- Récupérer les infos auth
  SELECT * INTO auth_rec
  FROM auth.users
  WHERE id = profile_rec.id;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'RÉSUMÉ - Compte +221785423833';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PROFIL:';
  RAISE NOTICE '  Téléphone: %', profile_rec.phone;
  RAISE NOTICE '  Nom: %', profile_rec.full_name;
  RAISE NOTICE '  Username: %', profile_rec.username;
  RAISE NOTICE '  Email: %', profile_rec.email;
  RAISE NOTICE '';
  RAISE NOTICE 'AUTHENTIFICATION:';
  RAISE NOTICE '  Email Auth: %', auth_rec.email;
  RAISE NOTICE '  Email confirmé: %', CASE WHEN auth_rec.email_confirmed_at IS NOT NULL THEN 'Oui' ELSE 'Non' END;
  RAISE NOTICE '  Dernière connexion: %', COALESCE(auth_rec.last_sign_in_at::text, 'Jamais');
  RAISE NOTICE '';
  RAISE NOTICE 'ACTION REQUISE:';
  RAISE NOTICE '  1. Dashboard > Authentication > Users';
  RAISE NOTICE '  2. Chercher: %', auth_rec.email;
  RAISE NOTICE '  3. Update user > Password: 001234';
  RAISE NOTICE '  4. Tester connexion avec PIN: 1234';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- ÉTAPE 7: Test de connexion (Instructions)
-- ============================================
/*
APRÈS avoir réinitialisé le mot de passe dans le Dashboard:

1. Ouvrir l'application SenePanda
2. Sur l'écran de connexion:
   - Numéro: +221 78 542 38 33
   - Code PIN: 1234 (exactement 4 chiffres)
3. Cliquer sur "Se connecter"

SI ÇA NE FONCTIONNE PAS:
- Vérifier que le mot de passe dans Supabase est bien: 001234
- Vérifier que l'email est confirmé (voir ÉTAPE 2)
- Vérifier qu'il n'y a pas d'erreur dans les logs Supabase
- Essayer de se déconnecter complètement de l'app et recommencer

ALTERNATIVE - Créer un nouveau compte:
Si le problème persiste, vous pouvez créer un nouveau compte:
1. Supprimer l'ancien compte (Authentication > Users > Delete)
2. Supprimer le profil: DELETE FROM profiles WHERE phone = '+221785423833';
3. Créer un nouveau compte via l'app avec:
   - Numéro: +221 78 542 38 33
   - Prénom: Votre prénom
   - Nom: Votre nom
   - Code PIN: 1234
*/

-- ============================================
-- LOGS & DEBUGGING
-- ============================================

-- Voir tous les utilisateurs avec ce numéro
SELECT
  'Recherche de doublons' as info,
  COUNT(*) as nombre_de_comptes,
  ARRAY_AGG(email) as emails
FROM profiles
WHERE phone LIKE '%785423833%';

-- Voir l'historique de connexion
SELECT
  'Historique de connexion' as info,
  au.email,
  au.created_at as compte_cree_le,
  au.last_sign_in_at as derniere_connexion,
  au.email_confirmed_at as email_confirme_le
FROM auth.users au
WHERE au.email LIKE '%785423833%';
