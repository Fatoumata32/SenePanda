-- Confirm all existing unconfirmed emails
-- This is useful if you're switching from email confirmation ON to OFF
-- and want to allow existing users to login

UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL
  OR confirmed_at IS NULL;

-- Add a comment to explain
COMMENT ON TABLE auth.users IS 'All existing users have been confirmed. Future users will not require email confirmation if disabled in dashboard.';
