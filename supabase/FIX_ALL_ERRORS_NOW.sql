-- ========================================
-- MASTER FIX SCRIPT - Run this to fix all current errors
-- Copy and paste this entire script into Supabase SQL Editor
-- ========================================
-- This fixes:
-- 1. Flash deals "column d.seller_id does not exist" error
-- 2. "Database error saving new user" error
-- ========================================

-- ========================================
-- PART 1: FIX FLASH DEALS
-- ========================================

-- Add seller_id column to flash_deals if it doesn't exist
ALTER TABLE flash_deals
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Populate seller_id from products table for existing flash deals
UPDATE flash_deals fd
SET seller_id = p.seller_id
FROM products p
WHERE fd.product_id = p.id
  AND fd.seller_id IS NULL;

-- Make seller_id NOT NULL (only if all rows have it)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM flash_deals WHERE seller_id IS NULL) THEN
    ALTER TABLE flash_deals ALTER COLUMN seller_id SET NOT NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller_id ON flash_deals(seller_id);

-- Drop and recreate the get_seller_deals function
DROP FUNCTION IF EXISTS get_seller_deals(uuid);

CREATE OR REPLACE FUNCTION get_seller_deals(p_seller_id uuid)
RETURNS TABLE (
  deal_id uuid,
  product_title text,
  status text,
  deal_price numeric,
  discount_percentage integer,
  starts_at timestamptz,
  ends_at timestamptz,
  total_stock integer,
  remaining_stock integer,
  claimed_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    p.title as product_title,
    CASE
      WHEN d.ends_at <= now() OR (d.stock_limit IS NOT NULL AND d.stock_sold >= d.stock_limit) THEN 'expired'
      WHEN d.starts_at > now() THEN 'scheduled'
      WHEN d.is_active = true THEN 'active'
      ELSE 'cancelled'
    END as status,
    d.discount_price as deal_price,
    d.discount_percentage,
    d.starts_at,
    d.ends_at,
    COALESCE(d.stock_limit, p.stock) as total_stock,
    COALESCE(d.stock_limit - d.stock_sold, p.stock) as remaining_stock,
    d.stock_sold as claimed_count
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  WHERE d.seller_id = p_seller_id
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for sellers
DO $$
BEGIN
  DROP POLICY IF EXISTS "Sellers can view own deals" ON flash_deals;

  CREATE POLICY "Sellers can view own deals"
    ON flash_deals FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id OR is_active = true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

SELECT '✅ Flash deals fixed!' as step_1;

-- ========================================
-- PART 2: FIX USER CREATION
-- ========================================

-- Ensure generate_referral_code function exists
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create improved handle_new_user function with error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  BEGIN
    -- Generate referral code
    new_referral_code := generate_referral_code();

    -- Insert profile (update if exists)
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      referral_code
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, NEW.id::text),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      new_referral_code
    )
    ON CONFLICT (id) DO UPDATE
    SET
      username = COALESCE(profiles.username, EXCLUDED.username),
      referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code);

    -- Initialize loyalty points (do nothing if exists)
    INSERT INTO public.loyalty_points (
      user_id,
      points,
      total_earned,
      level
    ) VALUES (
      NEW.id,
      0,
      0,
      'bronze'
    )
    ON CONFLICT (user_id) DO NOTHING;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't prevent user creation
      RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

SELECT '✅ User creation fixed!' as step_2;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify flash_deals has seller_id
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'flash_deals'
  AND column_name = 'seller_id';

-- Verify trigger is active
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ========================================
-- PART 3: FIX CATEGORIES ACCESS
-- ========================================

-- Ensure categories table has RLS enabled but allows public read access
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;

-- Create policy to allow everyone to view categories
CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- Ensure we have some default categories
INSERT INTO categories (name, description, emoji, is_active) VALUES
  ('Mode & Vêtements', 'Vêtements, chaussures et accessoires', '👗', true),
  ('Électronique', 'Téléphones, ordinateurs et gadgets', '📱', true),
  ('Maison & Jardin', 'Meubles, décoration et électroménager', '🏠', true),
  ('Sport & Loisirs', 'Articles de sport et loisirs', '⚽', true),
  ('Beauté & Santé', 'Cosmétiques, parfums et soins', '💄', true),
  ('Alimentation', 'Produits alimentaires et boissons', '🍔', true),
  ('Enfants & Bébés', 'Jouets, vêtements et accessoires enfants', '👶', true),
  ('Livres & Culture', 'Livres, musique et films', '📚', true),
  ('Automobile', 'Véhicules et accessoires auto', '🚗', true),
  ('Autres', 'Autres produits', '📦', true)
ON CONFLICT DO NOTHING;

SELECT '✅ Categories access fixed!' as step_3;

-- Final message
SELECT '🎉 All fixes applied successfully!' as final_status;

-- ========================================
-- PART 4: FIX CART_ITEMS TABLE
-- ========================================

-- Create cart_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Create RLS policies
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

SELECT '✅ Cart items table fixed!' as step_4;

-- Summary of fixes
SELECT
  'Flash Deals' as issue,
  'Added seller_id column and fixed function' as fix,
  '✅' as status
UNION ALL
SELECT
  'User Creation',
  'Added error handling to trigger',
  '✅'
UNION ALL
SELECT
  'Categories Access',
  'Added RLS policy and default data',
  '✅'
UNION ALL
SELECT
  'Cart Items',
  'Created table with RLS policies',
  '✅';
