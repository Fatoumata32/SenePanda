-- Confirm all existing unconfirmed emails
-- This is useful if you're switching from email confirmation ON to OFF
-- and want to allow existing users to login

-- ==========================================
-- IMPORTANT: À FAIRE MANUELLEMENT
-- ==========================================
-- Si vous avez déjà des utilisateurs non confirmés, vous devez:
-- 1. Les confirmer manuellement via le Dashboard Supabase
-- 2. OU les supprimer et les recréer
-- 3. OU demander à Supabase Support d'exécuter cette requête
--
-- La table auth.users nécessite des permissions owner que vous n'avez pas.
-- ==========================================

/*
-- Ces commandes échouent avec "must be owner of table users"
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL
  OR confirmed_at IS NULL;

COMMENT ON TABLE auth.users IS 'All existing users have been confirmed. Future users will not require email confirmation if disabled in dashboard.';
*/
