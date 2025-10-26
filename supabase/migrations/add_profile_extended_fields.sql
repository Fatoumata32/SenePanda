-- Add extended profile fields for better user information and seller social media

-- Add personal information fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add social media fields for sellers
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Add comments
COMMENT ON COLUMN profiles.first_name IS 'User first name';
COMMENT ON COLUMN profiles.last_name IS 'User last name';
COMMENT ON COLUMN profiles.city IS 'User city';
COMMENT ON COLUMN profiles.address IS 'User address for shipping';
COMMENT ON COLUMN profiles.postal_code IS 'User postal/zip code';
COMMENT ON COLUMN profiles.facebook_url IS 'Seller Facebook page URL';
COMMENT ON COLUMN profiles.instagram_url IS 'Seller Instagram profile URL';
COMMENT ON COLUMN profiles.twitter_url IS 'Seller Twitter profile URL';
COMMENT ON COLUMN profiles.whatsapp_number IS 'Seller WhatsApp contact number';
COMMENT ON COLUMN profiles.website_url IS 'Seller website URL';
