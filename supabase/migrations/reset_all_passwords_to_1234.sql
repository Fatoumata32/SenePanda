-- ============================================
-- RÉINITIALISATION DE TOUS LES MOTS DE PASSE À 1234
-- ============================================
-- Ce script réinitialise tous les comptes existants avec le code PIN 1234
-- ATTENTION: À exécuter uniquement en développement/test
-- ============================================

-- ============================================
-- INFORMATIONS IMPORTANTES SUR LE CODE PIN
-- ============================================
/*
📌 POLITIQUE DES CODES PIN:

✓ CODE PIN UTILISATEUR:
  - Longueur: 4 CHIFFRES EXACTEMENT
  - Format: Numérique uniquement (0-9)
  - Exemples valides: 1234, 5678, 0000, 9999
  - Exemples invalides: 12345 (trop long), 123 (trop court), abcd (non numérique)

✓ STOCKAGE DANS SUPABASE:
  - Format stocké: 6 caractères avec padding
  - Exemple: PIN 1234 → Stocké comme 001234
  - Raison: Supabase Auth exige minimum 6 caractères
  - Solution: Padding automatique dans l'application (fonction padPinCode)

✓ POUR L'UTILISATEUR:
  - Saisie: 4 chiffres uniquement
  - Affichage: •••• (masqué)
  - Maximum: 4 caractères
  - Message: "Code PIN (4 chiffres)"

✓ POUR L'ADMINISTRATEUR:
  - Dans Supabase Dashboard: Définir 001234 (avec padding)
  - L'utilisateur tapera: 1234 (sans padding)
  - La conversion est automatique dans l'app

⚠️ RAPPEL:
  - Ne PAS accepter de code PIN < 4 chiffres
  - Ne PAS accepter de code PIN > 4 chiffres
  - Validation stricte: exactement 4 chiffres numériques
*/

-- ============================================

-- ============================================
-- ÉTAPE 1: Lister tous les utilisateurs
-- ============================================
-- Voir tous les comptes qui seront affectés
SELECT
  p.id,
  p.phone,
  p.full_name,
  p.email,
  au.created_at,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- ÉTAPE 2: Instructions pour réinitialiser via Dashboard
-- ============================================
/*
MÉTHODE RECOMMANDÉE - Via le Dashboard Supabase:

Pour CHAQUE utilisateur listé ci-dessus:

1. Aller dans: Authentication > Users
2. Chercher l'utilisateur par son email (ex: +221785423833@senepanda.app)
3. Cliquer sur l'utilisateur
4. Cliquer sur le bouton "..." (trois points)
5. Sélectionner "Reset Password"
6. Entrer le nouveau mot de passe: 001234
   (correspond au PIN 1234 avec padding)
7. Confirmer

NOTE IMPORTANTE:
- Le code PIN saisi par l'utilisateur sera "1234" (4 CHIFFRES)
- Mais il faut définir "001234" dans Supabase (6 caractères avec padding)
- L'application limite strictement à 4 chiffres (maxLength=4)
- Tout code PIN doit faire EXACTEMENT 4 chiffres numériques
*/

-- ============================================
-- ÉTAPE 3: Vérification des comptes spécifiques
-- ============================================

-- Compte +221785423833
SELECT
  'Compte principal' as description,
  p.phone,
  p.full_name,
  p.email,
  au.email as auth_email,
  au.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.phone = '+221785423833';

-- Tous les comptes avec numéros sénégalais
SELECT
  'Comptes sénégalais' as description,
  p.phone,
  p.full_name,
  p.email,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.phone LIKE '+221%'
ORDER BY au.created_at DESC;

-- ============================================
-- ÉTAPE 4: Script de réinitialisation par API (Alternative)
-- ============================================
/*
Si vous avez accès à l'API Admin de Supabase via un service backend,
vous pouvez utiliser ce code TypeScript:

import { createClient } from '@supabase/supabase-js'

// Client Admin avec service_role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function resetAllPasswords() {
  // Récupérer tous les utilisateurs
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, email')

  if (!profiles) return

  // Code PIN avec padding
  const newPassword = '001234' // Correspond à PIN 1234

  for (const profile of profiles) {
    try {
      // Réinitialiser le mot de passe
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
      )

      if (error) {
        console.error(`Erreur pour ${profile.phone}:`, error.message)
      } else {
        console.log(`✓ Réinitialisé: ${profile.phone}`)
      }
    } catch (err) {
      console.error(`Erreur pour ${profile.phone}:`, err)
    }
  }

  console.log('Réinitialisation terminée!')
}

// Exécuter
resetAllPasswords()
*/

-- ============================================
-- ÉTAPE 5: Liste complète pour réinitialisation manuelle
-- ============================================
-- Générer une liste formatée pour faciliter la réinitialisation manuelle

SELECT
  ROW_NUMBER() OVER (ORDER BY au.created_at) as numero,
  '[ ] ' as checkbox,
  p.phone as telephone,
  COALESCE(p.full_name, 'Utilisateur') as nom,
  au.email as email_auth,
  'PIN: 1234 → Password: 001234' as nouveau_pin,
  CASE
    WHEN au.last_sign_in_at IS NOT NULL THEN '✓ Actif'
    ELSE '○ Jamais connecté'
  END as statut
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- ÉTAPE 6: Instructions détaillées par utilisateur
-- ============================================

DO $$
DECLARE
  user_record RECORD;
  counter INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'LISTE DES UTILISATEURS À RÉINITIALISER';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  FOR user_record IN
    SELECT
      p.phone,
      p.full_name,
      au.email,
      p.id
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    ORDER BY au.created_at DESC
  LOOP
    counter := counter + 1;
    RAISE NOTICE '% ----------------------------------------', counter;
    RAISE NOTICE 'Téléphone: %', user_record.phone;
    RAISE NOTICE 'Nom: %', COALESCE(user_record.full_name, 'Non renseigné');
    RAISE NOTICE 'Email: %', user_record.email;
    RAISE NOTICE 'ID: %', user_record.id;
    RAISE NOTICE '';
    RAISE NOTICE 'ACTIONS:';
    RAISE NOTICE '1. Dashboard > Authentication > Users';
    RAISE NOTICE '2. Chercher: %', user_record.email;
    RAISE NOTICE '3. Reset Password: 001234';
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TOTAL: % utilisateur(s) à traiter', counter;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'RAPPEL:';
  RAISE NOTICE '- Nouveau code PIN pour les utilisateurs: 1234 (4 chiffres EXACTEMENT)';
  RAISE NOTICE '- Mot de passe à définir dans Supabase: 001234 (avec padding)';
  RAISE NOTICE '- L''application limite automatiquement à 4 chiffres (maxLength=4)';
  RAISE NOTICE '- Le padding est automatique dans l''application';
  RAISE NOTICE '- IMPORTANT: Code PIN = 4 chiffres UNIQUEMENT';
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 7: Vérification après réinitialisation
-- ============================================
/*
Après avoir réinitialisé tous les comptes:

1. Demander à chaque utilisateur de se connecter avec:
   - Leur numéro de téléphone
   - Code PIN: 1234

2. Vérifier les connexions:
*/

SELECT
  p.phone as telephone,
  p.full_name as nom,
  au.last_sign_in_at as derniere_connexion,
  CASE
    WHEN au.last_sign_in_at > NOW() - INTERVAL '1 hour'
    THEN '✓ Connecté récemment'
    WHEN au.last_sign_in_at IS NOT NULL
    THEN '○ Ancienne connexion'
    ELSE '✗ Jamais connecté'
  END as statut_connexion
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.last_sign_in_at DESC NULLS LAST;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
/*
⚠️ SÉCURITÉ:
- Ce script est pour DÉVELOPPEMENT/TEST uniquement
- Ne JAMAIS utiliser en PRODUCTION avec un mot de passe unique
- En production, envoyer un email/SMS de réinitialisation à chaque utilisateur

✓ APRÈS RÉINITIALISATION:
- Tous les utilisateurs peuvent se connecter avec PIN: 1234 (4 chiffres)
- Encourager les utilisateurs à changer leur PIN après connexion
- Mettre en place une page de changement de mot de passe

📋 CHECKLIST:
[ ] Lister tous les utilisateurs (ÉTAPE 1)
[ ] Choisir la méthode (Dashboard ou API)
[ ] Réinitialiser chaque compte à 001234 (6 caractères avec padding)
[ ] Vérifier la connexion de test avec PIN 1234 (4 chiffres)
[ ] Informer les utilisateurs du nouveau PIN (1234 - 4 chiffres)
[ ] Demander de changer le PIN après première connexion
[ ] Rappeler: CODE PIN = 4 CHIFFRES UNIQUEMENT

📌 VALIDATION DU CODE PIN:
✓ Longueur: EXACTEMENT 4 chiffres
✓ Format: Numérique uniquement (0-9)
✓ Affichage: Masqué (••••)
✓ Limite stricte: maxLength=4 dans l'app
✗ Pas de lettres, pas de symboles
✗ Pas moins de 4, pas plus de 4
*/
