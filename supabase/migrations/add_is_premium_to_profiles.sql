-- Add is_premium column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Add a comment to the column
COMMENT ON COLUMN profiles.is_premium IS 'Indicates if the user has a premium membership';
