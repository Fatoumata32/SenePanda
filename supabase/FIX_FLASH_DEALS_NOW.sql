-- ========================================
-- FIX IMMEDIATE: Flash Deals seller_id Error
-- Copy and paste this entire script into Supabase SQL Editor
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

-- Make seller_id NOT NULL
DO $$
BEGIN
  -- Only set NOT NULL if all rows have seller_id
  IF NOT EXISTS (SELECT 1 FROM flash_deals WHERE seller_id IS NULL) THEN
    ALTER TABLE flash_deals ALTER COLUMN seller_id SET NOT NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller_id ON flash_deals(seller_id);

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS get_seller_deals(uuid);

-- Recreate the function with correct column references
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
  -- Drop old policy if exists
  DROP POLICY IF EXISTS "Sellers can view own deals" ON flash_deals;

  -- Create new policy
  CREATE POLICY "Sellers can view own deals"
    ON flash_deals FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id OR is_active = true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Test the function
SELECT 'Flash deals fixed! Testing function...' as status;

-- This should now work without error
SELECT * FROM get_seller_deals(auth.uid()) LIMIT 1;

SELECT '✅ Flash deals seller_id error fixed successfully!' as result;