-- ============================================
-- SCRIPT DE RÉINITIALISATION DU MOT DE PASSE
-- ============================================
-- Ce script permet de réinitialiser le mot de passe d'un utilisateur
-- Exécutez ce script dans le SQL Editor de Supabase Dashboard

-- IMPORTANT: Remplacer les valeurs suivantes:
-- 1. Le numéro de téléphone (sans espaces)
-- 2. Le nouveau mot de passe (code PIN à 4 chiffres minimum)

-- ============================================
-- ÉTAPE 1: Trouver l'utilisateur
-- ============================================
-- Rechercher l'utilisateur par son numéro de téléphone
SELECT
  id,
  email,
  phone,
  full_name
FROM profiles
WHERE phone = '+221785423833';

-- ============================================
-- ÉTAPE 2: Réinitialiser le mot de passe
-- ============================================
-- NOTE: Cette méthode nécessite d'avoir accès à l'API Admin de Supabase
-- Pour un environnement de production, utilisez plutôt l'interface Supabase
-- ou une Edge Function sécurisée

-- SOLUTION ALTERNATIVE SIMPLE:
-- 1. Aller dans Authentication > Users dans le Dashboard Supabase
-- 2. Chercher l'utilisateur avec l'email: +221785423833@senepanda.app
-- 3. Cliquer sur l'utilisateur
-- 4. Cliquer sur "Reset Password"
-- 5. Définir le nouveau mot de passe (par exemple: 1234)

-- ============================================
-- SOLUTION TEMPORAIRE POUR LE DÉVELOPPEMENT
-- ============================================
-- Si vous avez besoin d'une solution rapide pour le développement,
-- demandez à l'utilisateur de:
-- 1. Créer un nouveau compte avec un autre numéro
-- 2. Ou contacter le support pour réinitialiser manuellement

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après réinitialisation, vérifier que l'utilisateur peut se connecter
SELECT
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = '+221785423833@senepanda.app';

-- ============================================
-- INSTRUCTIONS POUR L'UTILISATEUR
-- ============================================
/*
Pour l'utilisateur +221785423833:

1. Ouvrir l'application SenePanda
2. Cliquer sur "Code PIN oublié ?" sur l'écran de connexion
3. Entrer le numéro: +221 78 542 38 33
4. Entrer un nouveau code PIN (4 chiffres, par exemple: 1234)
5. Confirmer la réinitialisation
6. Se connecter avec le nouveau code PIN

Note: En attendant que la fonctionnalité SMS soit implémentée,
la réinitialisation est simulée et nécessite une confirmation manuelle.
*/

-- ============================================
-- POUR LES ADMINISTRATEURS
-- ============================================
-- Si vous êtes administrateur et devez réinitialiser manuellement:

-- 1. Identifier l'ID de l'utilisateur
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM profiles
  WHERE phone = '+221785423833';

  RAISE NOTICE 'User ID: %', user_id;
END $$;

-- 2. Ensuite, dans le Dashboard Supabase:
--    - Aller dans Authentication > Users
--    - Rechercher l'utilisateur par ID ou email
--    - Cliquer sur "Reset Password"
--    - Définir le nouveau mot de passe: 1234 (ou autre code à 4 chiffres)
