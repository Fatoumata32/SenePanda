/*
  # Schéma de base pour marketplace africaine

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs avec informations vendeur
      - `id` (uuid, primary key, référence auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `is_seller` (boolean)
      - `shop_name` (text)
      - `shop_description` (text)
      - `phone` (text)
      - `country` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `categories` - Catégories de produits
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamptz)
    
    - `products` - Produits disponibles
      - `id` (uuid, primary key)
      - `seller_id` (uuid, référence profiles)
      - `category_id` (uuid, référence categories)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `currency` (text, défaut 'XOF')
      - `image_url` (text)
      - `images` (text array)
      - `stock` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `cart_items` - Panier d'achat
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `product_id` (uuid, référence products)
      - `quantity` (integer)
      - `created_at` (timestamptz)
    
    - `orders` - Commandes
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `total_amount` (numeric)
      - `currency` (text)
      - `status` (text)
      - `shipping_address` (text)
      - `created_at` (timestamptz)
    
    - `order_items` - Détails des commandes
      - `id` (uuid, primary key)
      - `order_id` (uuid, référence orders)
      - `product_id` (uuid, référence products)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `created_at` (timestamptz)

  2. Sécurité
    - Active RLS sur toutes les tables
    - Politiques pour lecture publique des produits et catégories
    - Politiques restrictives pour les profils, paniers et commandes
    - Seuls les vendeurs peuvent gérer leurs propres produits
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  is_seller boolean DEFAULT false,
  shop_name text,
  shop_description text,
  phone text,
  country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  currency text DEFAULT 'XOF',
  image_url text,
  images text[],
  stock integer DEFAULT 0 CHECK (stock >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_seller = true)
  );

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

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

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  currency text DEFAULT 'XOF',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for own orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
  ('Artisanat', 'Produits artisanaux africains', 'palette'),
  ('Mode', 'Vêtements et accessoires', 'shirt'),
  ('Bijoux', 'Bijoux et ornements', 'gem'),
  ('Décoration', 'Décoration intérieure', 'home'),
  ('Art', 'Œuvres d''art', 'image'),
  ('Textile', 'Tissus et textiles', 'fabric')
ON CONFLICT DO NOTHING;
