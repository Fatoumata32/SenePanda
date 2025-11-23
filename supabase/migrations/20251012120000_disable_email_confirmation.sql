-- Disable email confirmation for development
-- This allows users to login immediately after registration without email verification

-- ==========================================
-- IMPORTANT: À FAIRE MANUELLEMENT
-- ==========================================
-- Cette configuration doit être faite via le Supabase Dashboard:
-- 1. Aller dans Authentication > Settings
-- 2. Trouver "Email Auth"
-- 3. Désactiver "Confirm email"
--
-- Note: On ne peut pas modifier auth.users ou auth.config via SQL
-- car ces tables sont gérées par Supabase et nécessitent des permissions owner.
-- ==========================================

/*
-- Cette commande échoue avec "must be owner of table users"
COMMENT ON TABLE auth.users IS 'Users table - Email confirmation should be disabled in development via Supabase Dashboard';
*/
