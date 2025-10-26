-- ========================================
-- RESET AND CREATE REVIEWS SYSTEM
-- Execute this if you get "already exists" errors
-- ========================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
DROP TRIGGER IF EXISTS trigger_update_seller_rating ON seller_reviews;
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_helpful_votes;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_product_rating();
DROP FUNCTION IF EXISTS update_seller_rating();
DROP FUNCTION IF EXISTS update_helpful_count();

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view product reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews for products they purchased" ON product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON product_reviews;

DROP POLICY IF EXISTS "Anyone can view seller reviews" ON seller_reviews;
DROP POLICY IF EXISTS "Users can create seller reviews for completed orders" ON seller_reviews;
DROP POLICY IF EXISTS "Users can update their own seller reviews" ON seller_reviews;
DROP POLICY IF EXISTS "Users can delete their own seller reviews" ON seller_reviews;

DROP POLICY IF EXISTS "Anyone can view helpful votes" ON review_helpful_votes;
DROP POLICY IF EXISTS "Users can add helpful votes" ON review_helpful_votes;
DROP POLICY IF EXISTS "Users can remove their helpful votes" ON review_helpful_votes;

-- Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS seller_reviews CASCADE;

-- ========================================
-- NOW CREATE EVERYTHING FRESH
-- ========================================

-- Create reviews table for products
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un utilisateur ne peut laisser qu'un avis par produit
  UNIQUE(user_id, product_id)
);

-- Create seller reviews table
CREATE TABLE seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  shipping_speed_rating INTEGER CHECK (shipping_speed_rating >= 1 AND shipping_speed_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un utilisateur ne peut laisser qu'un avis par vendeur par commande
  UNIQUE(user_id, seller_id, order_id)
);

-- Create helpful votes table
CREATE TABLE review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(review_id, user_id)
);

-- Add rating statistics columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Add rating statistics columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_badge TEXT;

-- Create indexes
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating DESC);
CREATE INDEX idx_product_reviews_created ON product_reviews(created_at DESC);

CREATE INDEX idx_seller_reviews_seller ON seller_reviews(seller_id);
CREATE INDEX idx_seller_reviews_user ON seller_reviews(user_id);
CREATE INDEX idx_seller_reviews_rating ON seller_reviews(rating DESC);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Policies for product_reviews
CREATE POLICY "Anyone can view product reviews"
  ON product_reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create reviews for products they purchased"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = auth.uid()
      AND oi.product_id = product_reviews.product_id
      AND o.status = 'delivered'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for seller_reviews
CREATE POLICY "Anyone can view seller reviews"
  ON seller_reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create seller reviews for completed orders"
  ON seller_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = seller_reviews.order_id
      AND o.user_id = auth.uid()
      AND o.status = 'delivered'
    )
  );

CREATE POLICY "Users can update their own seller reviews"
  ON seller_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seller reviews"
  ON seller_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for helpful votes
CREATE POLICY "Anyone can view helpful votes"
  ON review_helpful_votes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can add helpful votes"
  ON review_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their helpful votes"
  ON review_helpful_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update product average rating
CREATE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update seller average rating
CREATE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM seller_reviews
      WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM seller_reviews
      WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
    )
  WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update helpful count
CREATE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_reviews
  SET helpful_count = (
    SELECT COUNT(*)
    FROM review_helpful_votes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER trigger_update_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();

CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_helpful_count();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON product_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_reviews TO authenticated;
GRANT SELECT, INSERT, DELETE ON review_helpful_votes TO authenticated;
GRANT SELECT ON product_reviews TO anon;
GRANT SELECT ON seller_reviews TO anon;

-- Comments
COMMENT ON TABLE product_reviews IS 'Product reviews and ratings from customers';
COMMENT ON TABLE seller_reviews IS 'Seller reviews and ratings from customers';
COMMENT ON TABLE review_helpful_votes IS 'Helpful votes on product reviews';
