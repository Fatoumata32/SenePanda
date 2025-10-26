-- Fix flash_deals table to add seller_id column
-- This fixes the error: column d.seller_id does not exist

-- Add seller_id column to flash_deals if it doesn't exist
ALTER TABLE flash_deals
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- If the column was just added, populate it from the products table
UPDATE flash_deals fd
SET seller_id = p.seller_id
FROM products p
WHERE fd.product_id = p.id
  AND fd.seller_id IS NULL;

-- Make seller_id NOT NULL after populating existing rows
ALTER TABLE flash_deals
ALTER COLUMN seller_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller_id ON flash_deals(seller_id);

-- Now recreate the get_seller_deals function to ensure it's up to date
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

-- Add RLS policy for seller access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flash_deals'
    AND policyname = 'Sellers can view own deals'
  ) THEN
    CREATE POLICY "Sellers can view own deals"
      ON flash_deals FOR SELECT
      TO authenticated
      USING (auth.uid() = seller_id OR is_active = true);
  END IF;
END $$;

SELECT 'Flash deals seller_id column added successfully! ✅' as status;
