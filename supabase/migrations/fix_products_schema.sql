-- Fix products table schema - ensure all required columns exist

-- Add currency column if it doesn't exist (with XOF as default for Senegal)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'currency') THEN
    ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'XOF';
  END IF;
END $$;

-- Add average_rating column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'average_rating') THEN
    ALTER TABLE products ADD COLUMN average_rating NUMERIC DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5);
  END IF;
END $$;

-- Add total_reviews column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'products' AND column_name = 'total_reviews') THEN
    ALTER TABLE products ADD COLUMN total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_currency ON products(currency);
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Add comments
COMMENT ON COLUMN products.currency IS 'Currency code (XOF for West African CFA franc)';
COMMENT ON COLUMN products.average_rating IS 'Average rating of the product (0-5)';
COMMENT ON COLUMN products.total_reviews IS 'Total number of reviews for this product';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
