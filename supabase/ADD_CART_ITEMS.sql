-- ========================================
-- AJOUTER LA TABLE CART_ITEMS
-- Script rapide pour ajouter uniquement le panier
-- ========================================

-- Créer la table cart_items si elle n'existe pas
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Créer les index pour la performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Vérification
SELECT 'Table cart_items créée avec succès! ✅' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cart_items' ORDER BY ordinal_position;
