-- Add rating fields to products table if they don't exist

ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0);

-- Add index for better performance on ratings
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating DESC);

-- Add comments
COMMENT ON COLUMN products.average_rating IS 'Average rating of the product (0-5)';
COMMENT ON COLUMN products.total_reviews IS 'Total number of reviews for this product';
