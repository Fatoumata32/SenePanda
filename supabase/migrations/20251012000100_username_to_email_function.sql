-- Function to get email from username
CREATE OR REPLACE FUNCTION get_email_from_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT au.email INTO user_email
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.username = username_input;

  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_email_from_username(text) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_email_from_username IS 'Returns email address for a given username';
