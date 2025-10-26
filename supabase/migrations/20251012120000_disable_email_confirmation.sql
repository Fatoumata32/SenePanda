-- Disable email confirmation for development
-- This allows users to login immediately after registration without email verification

-- Note: This should be done through the Supabase Dashboard in production
-- Go to Authentication > Settings > Email Auth > Confirm email = OFF

-- For now, we'll update the auth config if possible
-- However, auth.config is typically managed through the dashboard or config.toml

-- Add a comment to remind developers
COMMENT ON TABLE auth.users IS 'Users table - Email confirmation should be disabled in development via Supabase Dashboard';
