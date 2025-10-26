-- Add image fields to profiles table for shop customization
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_logo_url TEXT,
ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.shop_logo_url IS 'URL of the shop logo/profile image';
COMMENT ON COLUMN profiles.shop_banner_url IS 'URL of the shop banner/cover image';
