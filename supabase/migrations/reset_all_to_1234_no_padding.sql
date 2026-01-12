-- ============================================
-- RÉINITIALISATION TOTALE - CODE PIN 4 CHIFFRES
-- ============================================
-- Ce script réinitialise TOUS les comptes avec le code PIN : 1234
-- SANS padding, SANS conversion, juste 4 chiffres
-- ============================================

-- ============================================
-- POLITIQUE SIMPLIFIÉE
-- ============================================
/*
✅ NOUVELLE RÈGLE - 4 CHIFFRES PARTOUT:

📱 UTILISATEUR (Application):
   - Saisit: 1234 (4 chiffres)
   - Reçoit: 1234 (4 chiffres)
   - Pas de conversion, pas de padding

🔐 SUPABASE (Dashboard):
   - Stocke: 1234 (4 chiffres)
   - Compare: 1234 (4 chiffres)
   - Pas de 001234, pas de padding

💻 CODE (Application):
   - Envoie: 1234 (4 chiffres)
   - Pas de padStart(), pas de conversion
   - Direct et simple

✅ TOUT LE MONDE ALIGNÉ:
   Utilisateur tape 1234 → App envoie 1234 → Supabase compare 1234 → ✓ OK
*/

-- ============================================
-- ÉTAPE 1: Lister tous les utilisateurs
-- ============================================

SELECT
  '📋 LISTE DES COMPTES À RÉINITIALISER' as info,
  COUNT(*) as total_comptes
FROM auth.users;

SELECT
  ROW_NUMBER() OVER (ORDER BY au.created_at) as "#",
  p.phone as "Téléphone",
  p.full_name as "Nom",
  au.email as "Email",
  CASE
    WHEN au.last_sign_in_at IS NOT NULL THEN '✓ Actif'
    ELSE '○ Jamais connecté'
  END as "Statut",
  au.created_at as "Créé le"
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- ÉTAPE 2: Confirmer tous les emails
-- ============================================
-- S'assurer qu'aucun compte n'est bloqué par email non confirmé

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Vérification
SELECT
  '✅ CONFIRMATION DES EMAILS' as info,
  COUNT(*) as total_confirmes
FROM auth.users
WHERE email_confirmed_at IS NOT NULL;

-- ============================================
-- ÉTAPE 3: Compléter tous les profils
-- ============================================
-- S'assurer que tous les profils ont les champs requis

UPDATE profiles
SET
  first_name = COALESCE(first_name, 'Utilisateur'),
  last_name = COALESCE(last_name, 'SenePanda'),
  full_name = COALESCE(full_name, CONCAT(
    COALESCE(first_name, 'Utilisateur'),
    ' ',
    COALESCE(last_name, 'SenePanda')
  )),
  username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8)),
  email = COALESCE(email, phone || '@senepanda.app'),
  updated_at = NOW()
WHERE first_name IS NULL
   OR last_name IS NULL
   OR full_name IS NULL
   OR username IS NULL
   OR email IS NULL;

-- Vérification
SELECT
  '✅ PROFILS COMPLÉTÉS' as info,
  COUNT(*) as total_complets
FROM profiles
WHERE first_name IS NOT NULL
  AND last_name IS NOT NULL
  AND full_name IS NOT NULL;

-- ============================================
-- ÉTAPE 4: INSTRUCTIONS DASHBOARD
-- ============================================
/*
⚠️ IMPORTANT - RÉINITIALISATION MANUELLE REQUISE:

Supabase ne permet pas de changer les mots de passe via SQL pour des raisons de sécurité.
Vous DEVEZ utiliser le Dashboard ou l'API Admin.

📋 MÉTHODE DASHBOARD (Recommandée):

Pour CHAQUE utilisateur listé à l'étape 1:

1. Aller dans: Authentication > Users
2. Chercher l'utilisateur par son email
3. Cliquer sur l'utilisateur
4. Cliquer sur le menu "..." (trois points)
5. Sélectionner "Reset Password" ou "Update User"
6. Dans le champ "Password", taper: 1234

   ✅ EXACTEMENT: 1234 (4 chiffres)
   ❌ PAS: 001234
   ❌ PAS: 12345
   ❌ PAS: 123

7. Cocher "Auto Confirm User" si disponible
8. Cliquer sur "Save" ou "Update user"
9. ✓ Marquer l'utilisateur comme traité

📋 VÉRIFICATION:
Après chaque réinitialisation, tester la connexion:
- Ouvrir l'app
- Numéro: [Le numéro de l'utilisateur]
- Code PIN: 1234
- Se connecter

Si ça fonctionne: ✅ Passer au suivant
Si ça ne fonctionne pas: ❌ Vérifier que le mot de passe est bien "1234" (4 chiffres)
*/

-- ============================================
-- ÉTAPE 5: ALTERNATIVE - SCRIPT NODE.JS AUTOMATISÉ
-- ============================================
/*
Si vous avez beaucoup d'utilisateurs, utilisez le script automatisé:

📁 Fichier: scripts/reset-all-to-1234.js

Ce script utilise l'API Admin de Supabase pour réinitialiser automatiquement
tous les mots de passe à "1234" (4 chiffres).

Pour l'exécuter:
1. Configurer .env.local avec SUPABASE_SERVICE_ROLE_KEY
2. Lancer: node scripts/reset-all-to-1234.js
3. Confirmer l'opération
4. Vérifier les résultats

Le script va:
✅ Lister tous les utilisateurs
✅ Demander confirmation
✅ Réinitialiser chaque mot de passe à "1234"
✅ Afficher un rapport de succès/échecs
*/

-- ============================================
-- ÉTAPE 6: RÉSUMÉ FINAL
-- ============================================

DO $$
DECLARE
  total_users INTEGER;
  confirmed_users INTEGER;
  complete_profiles INTEGER;
BEGIN
  -- Compter les utilisateurs
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO confirmed_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  SELECT COUNT(*) INTO complete_profiles FROM profiles WHERE first_name IS NOT NULL;

  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 RÉSUMÉ DE LA PRÉPARATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Utilisateurs:';
  RAISE NOTICE '   Total: %', total_users;
  RAISE NOTICE '   Emails confirmés: %', confirmed_users;
  RAISE NOTICE '   Profils complets: %', complete_profiles;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Code PIN à définir: 1234 (4 chiffres exactement)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Dashboard > Authentication > Users';
  RAISE NOTICE '   2. Pour CHAQUE utilisateur:';
  RAISE NOTICE '      - Cliquer sur l''utilisateur';
  RAISE NOTICE '      - Menu ... > Reset Password';
  RAISE NOTICE '      - Password: 1234 (4 chiffres)';
  RAISE NOTICE '      - Save';
  RAISE NOTICE '   3. Tester la connexion';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  RAPPEL IMPORTANT:';
  RAISE NOTICE '   - Nouveau mot de passe: 1234 (pas 001234)';
  RAISE NOTICE '   - 4 chiffres exactement';
  RAISE NOTICE '   - Pas de padding, pas de conversion';
  RAISE NOTICE '   - Simple et direct';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- ÉTAPE 7: VÉRIFICATION POST-RÉINITIALISATION
-- ============================================
/*
Après avoir réinitialisé tous les comptes, exécutez cette requête:
*/

SELECT
  '🔍 VÉRIFICATION DES CONNEXIONS' as info,
  p.phone as "Téléphone",
  p.full_name as "Nom",
  au.email as "Email",
  au.email_confirmed_at as "Email confirmé",
  au.last_sign_in_at as "Dernière connexion",
  CASE
    WHEN au.last_sign_in_at > NOW() - INTERVAL '1 hour' THEN '✅ Connecté récemment'
    WHEN au.last_sign_in_at IS NOT NULL THEN '○ Ancienne connexion'
    ELSE '⏳ Jamais connecté'
  END as "Statut"
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.last_sign_in_at DESC NULLS LAST;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
/*
✅ AVANTAGES DE 4 CHIFFRES SANS PADDING:

1. 🎯 SIMPLICITÉ:
   - Plus de conversion
   - Plus de confusion
   - Code plus propre

2. 🔒 SÉCURITÉ:
   - Toujours 4 chiffres
   - Validation stricte
   - Pas d'ambiguïté

3. 🚀 PERFORMANCE:
   - Moins de traitement
   - Moins d'erreurs
   - Plus rapide

4. 👥 UX:
   - Simple à retenir
   - Rapide à saisir
   - Familier (comme les cartes bancaires)

⚠️ SÉCURITÉ EN PRODUCTION:

En production, ajoutez:
✅ Limitation à 3 tentatives
✅ Délai après échecs (30 secondes)
✅ Biométrie optionnelle
✅ Notification SMS des connexions
✅ Déconnexion automatique

📋 CHECKLIST FINALE:

[ ] Script SQL exécuté avec succès
[ ] Tous les emails confirmés
[ ] Tous les profils complétés
[ ] Tous les mots de passe réinitialisés à "1234"
[ ] Au moins un compte testé et fonctionnel
[ ] Documentation mise à jour
[ ] Utilisateurs informés du nouveau PIN

🎉 APRÈS RÉINITIALISATION:

Tous les utilisateurs peuvent se connecter avec:
- Leur numéro de téléphone
- Code PIN: 1234 (4 chiffres)

Encouragez-les à:
- Changer leur PIN après la première connexion
- Choisir un PIN unique (pas 0000, 1111, 1234)
- Activer la biométrie si disponible
*/

-- ============================================
-- FIN DU SCRIPT
-- ============================================
