-- ============================================
-- TOUTES LES MIGRATIONS COMBINÉES
-- Date: 2025-11-18
-- Total: 52 migrations (create_complete_bonus_system.sql exclu - corrompu)
-- ============================================
--
-- Ce fichier contient TOUTES les migrations dans le bon ordre.
--
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Copier-coller TOUT le contenu de ce fichier
-- 3. Cliquer sur "Run" ▶️
-- 4. Attendre la fin (peut prendre 2-5 minutes)
--
-- NOTES:
-- - Certaines migrations peuvent échouer si déjà appliquées (normal)
-- - Regardez les messages "already exists" comme des confirmations
-- - À la fin, vous devriez voir un résumé avec le nombre de tables
-- - Le fichier create_complete_bonus_system.sql est exclu (corrompu)
--
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================
-- MIGRATION: 20251011232345_create_marketplace_schema.sql
-- ============================================

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

-- ============================================
-- MIGRATION: 20251011235000_create_test_profile.sql
-- ============================================

-- Script pour créer un profil de test simple
-- Ce script crée un utilisateur de test avec un profil basique

-- IDENTIFIANTS DE TEST:
-- Email: test@marketplace.com
-- Mot de passe: TestMarket123!
--
-- Note: Vous devrez d'abord créer l'utilisateur dans Supabase Auth
-- via le dashboard ou l'API avant d'exécuter ce script

-- Insertion d'un profil de test (client)
-- Remplacez 'USER_UUID_HERE' par l'UUID de l'utilisateur créé dans auth.users
INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_HERE', -- Remplacez par l'UUID réel de l'utilisateur
  'Utilisateur Test',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
  false,
  NULL,
  NULL,
  '+221 77 123 45 67',
  'Sénégal',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  phone = EXCLUDED.phone,
  country = EXCLUDED.country,
  updated_at = now();

-- Insertion d'un profil vendeur de test
-- Remplacez 'SELLER_UUID_HERE' par l'UUID d'un autre utilisateur
INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  'SELLER_UUID_HERE', -- Remplacez par l'UUID réel du vendeur
  'Amadou Diallo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
  true,
  'Boutique Africaine',
  'Artisan spécialisé dans les produits traditionnels africains',
  '+225 05 12 34 56 78',
  'Côte d''Ivoire',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  is_seller = EXCLUDED.is_seller,
  shop_name = EXCLUDED.shop_name,
  shop_description = EXCLUDED.shop_description,
  phone = EXCLUDED.phone,
  country = EXCLUDED.country,
  updated_at = now();
-- ============================================
-- MIGRATION: 20251012000000_add_username.sql
-- ============================================

-- Add username field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique username for login';

-- ============================================
-- MIGRATION: 20251012000100_username_to_email_function.sql
-- ============================================

-- Function to get email from username
CREATE OR REPLACE FUNCTION get_email_from_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT au.email INTO user_email
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.username = username_input;

  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_email_from_username(text) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_email_from_username IS 'Returns email address for a given username';

-- ============================================
-- MIGRATION: 20251012000200_create_sample_profiles.sql
-- ============================================

-- Script pour créer des profils de test avec utilisateurs
-- Ce script crée plusieurs utilisateurs de test pour la marketplace

-- Note: Ces profils seront créés une fois que les utilisateurs correspondants
-- existent dans auth.users. Vous devrez d'abord créer les utilisateurs via
-- le dashboard Supabase ou l'API d'authentification.

-- Pour créer les utilisateurs dans Supabase Dashboard:
-- 1. Allez dans Authentication > Users
-- 2. Cliquez sur "Add user"
-- 3. Entrez l'email et le mot de passe
-- 4. Copiez l'UUID généré
-- 5. Remplacez les UUIDs ci-dessous

-- ==========================================
-- PROFILS CLIENTS
-- ==========================================

-- Client 1: Marie Kouassi
-- Email: marie.kouassi@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'marie_kouassi',
  'Marie Kouassi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
  false,
  '+225 07 12 34 56 78',
  'Côte d''Ivoire',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Client 2: Jean Diop
-- Email: jean.diop@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'jean_diop',
  'Jean Diop',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=jean',
  false,
  '+221 77 234 56 78',
  'Sénégal',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Client 3: Fatima Touré
-- Email: fatima.toure@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'fatima_toure',
  'Fatima Touré',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
  false,
  '+223 76 12 34 56',
  'Mali',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- PROFILS VENDEURS
-- ==========================================

-- Vendeur 1: Amadou Diallo - Artisan
-- Email: amadou.diallo@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'amadou_diallo',
  'Amadou Diallo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=amadou',
  true,
  'Artisanat Diallo',
  'Spécialiste de l''artisanat traditionnel africain. Sculptures sur bois, masques et objets décoratifs authentiques.',
  '+225 05 11 22 33 44',
  'Côte d''Ivoire',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 2: Aïcha Ndiaye - Mode
-- Email: aicha.ndiaye@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'aicha_ndiaye',
  'Aïcha Ndiaye',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=aicha',
  true,
  'Boutique Aïcha Mode',
  'Créations de mode africaine contemporaine. Robes, boubous et accessoires en wax et bazin.',
  '+221 77 55 66 77 88',
  'Sénégal',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 3: Kofi Mensah - Bijoux
-- Email: kofi.mensah@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'kofi_mensah',
  'Kofi Mensah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kofi',
  true,
  'Bijoux Kofi',
  'Bijoux artisanaux en or, argent et pierres précieuses. Chaque pièce raconte une histoire.',
  '+233 24 123 45 67',
  'Ghana',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 4: Mariam Traoré - Textile
-- Email: mariam.traore@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'mariam_traore',
  'Mariam Traoré',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=mariam',
  true,
  'Tissus Mariam',
  'Tissus traditionnels africains: bogolan, kente, pagne. Qualité exceptionnelle pour vos créations.',
  '+223 76 88 99 00',
  'Mali',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 5: Youssef Ben Ali - Décoration
-- Email: youssef.benali@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'youssef_benali',
  'Youssef Ben Ali',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef',
  true,
  'Déco Africaine',
  'Décoration d''intérieur inspirée de l''Afrique. Tapis berbères, poufs, coussins et luminaires.',
  '+212 6 12 34 56 78',
  'Maroc',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- INSTRUCTIONS
-- ==========================================
--
-- Pour utiliser ce script:
--
-- 1. Créez d'abord les utilisateurs dans Supabase Dashboard:
--    - Allez dans Authentication > Users
--    - Pour chaque profil ci-dessus, créez un utilisateur avec l'email et le mot de passe indiqués
--
-- 2. Récupérez les UUIDs générés pour chaque utilisateur
--
-- 3. Remplacez les gen_random_uuid() par les vrais UUIDs
--
-- 4. Exécutez ce script SQL dans le SQL Editor
--
-- OU utilisez le script automatique ci-dessous qui génère des UUIDs temporaires
-- (à des fins de démonstration uniquement)

-- ============================================
-- MIGRATION: 20251012120000_disable_email_confirmation.sql
-- ============================================

-- Disable email confirmation for development
-- This allows users to login immediately after registration without email verification

-- Note: This should be done through the Supabase Dashboard in production
-- Go to Authentication > Settings > Email Auth > Confirm email = OFF

-- For now, we'll update the auth config if possible
-- However, auth.config is typically managed through the dashboard or config.toml

-- Add a comment to remind developers
COMMENT ON TABLE auth.users IS 'Users table - Email confirmation should be disabled in development via Supabase Dashboard';

-- ============================================
-- MIGRATION: 20251012120100_confirm_existing_emails.sql
-- ============================================

-- Confirm all existing unconfirmed emails
-- This is useful if you're switching from email confirmation ON to OFF
-- and want to allow existing users to login

UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL
  OR confirmed_at IS NULL;

-- Add a comment to explain
COMMENT ON TABLE auth.users IS 'All existing users have been confirmed. Future users will not require email confirmation if disabled in dashboard.';

-- ============================================
-- MIGRATION: create_favorites_table.sql
-- ============================================

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can't favorite the same product twice
  UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites
-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
  ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

-- Comment on table
COMMENT ON TABLE public.favorites IS 'Stores user favorite products';

-- ============================================
-- MIGRATION: add_notifications.sql
-- ============================================

-- Add notification_token column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_token TEXT;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert notifications (through service role)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- Comment on table
COMMENT ON TABLE notifications IS 'Stores user notifications for orders and other events';

-- ============================================
-- MIGRATION: add_category_emojis.sql
-- ============================================

-- Ajouter des emojis aux catégories pour améliorer l'accessibilité
-- Cela aide les utilisateurs illettrés à reconnaître les catégories visuellement

-- Mettre à jour les catégories existantes avec des emojis
UPDATE categories SET icon = '🎨' WHERE name = 'Artisanat';
UPDATE categories SET icon = '👗' WHERE name = 'Mode';
UPDATE categories SET icon = '💎' WHERE name = 'Bijoux';
UPDATE categories SET icon = '🏠' WHERE name = 'Décoration';
UPDATE categories SET icon = '🎭' WHERE name = 'Art';
UPDATE categories SET icon = '🧵' WHERE name = 'Textile';

-- Ajouter d'autres catégories populaires avec emojis
INSERT INTO categories (name, description, icon) VALUES
  ('Électronique', 'Téléphones, ordinateurs et appareils électroniques', '📱'),
  ('Alimentation', 'Nourriture et boissons', '🍎'),
  ('Beauté', 'Produits de beauté et cosmétiques', '💄'),
  ('Santé', 'Produits de santé et bien-être', '💊'),
  ('Sport', 'Équipements et vêtements de sport', '⚽'),
  ('Enfants', 'Jouets et articles pour enfants', '🧸'),
  ('Maison', 'Articles ménagers et cuisine', '🍳'),
  ('Livres', 'Livres et magazines', '📚'),
  ('Animaux', 'Produits pour animaux de compagnie', '🐾'),
  ('Automobile', 'Pièces et accessoires auto', '🚗'),
  ('Jardin', 'Plantes et outils de jardinage', '🌱'),
  ('Musique', 'Instruments et accessoires musicaux', '🎸'),
  ('Bureautique', 'Fournitures de bureau', '📎'),
  ('Chaussures', 'Chaussures pour tous', '👟')
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, description = EXCLUDED.description;

-- ============================================
-- MIGRATION: add_profile_extended_fields.sql
-- ============================================

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

-- ============================================
-- MIGRATION: add_is_premium_to_profiles.sql
-- ============================================

-- Add is_premium column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Add a comment to the column
COMMENT ON COLUMN profiles.is_premium IS 'Indicates if the user has a premium membership';

-- ============================================
-- MIGRATION: add_products_rating_fields.sql
-- ============================================

-- Add rating fields to products table if they don't exist

ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0);

-- Add index for better performance on ratings
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating DESC);

-- Add comments
COMMENT ON COLUMN products.average_rating IS 'Average rating of the product (0-5)';
COMMENT ON COLUMN products.total_reviews IS 'Total number of reviews for this product';

-- ============================================
-- MIGRATION: fix_products_schema.sql
-- ============================================

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

-- ============================================
-- MIGRATION: add_referral_code_to_profiles.sql
-- ============================================

-- Ajouter un code de parrainage unique à chaque utilisateur

-- Ajouter la colonne referral_code
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code aléatoire de 8 caractères (majuscules + chiffres)
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;

    -- Si le code n'existe pas, on le retourne
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement un code lors de la création d'un profil
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Générer des codes pour les profils existants qui n'en ont pas
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Fonction pour enregistrer un parrainage
CREATE OR REPLACE FUNCTION register_referral(
  p_referred_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_result JSON;
BEGIN
  -- Trouver le parrain via son code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code
  LIMIT 1;

  -- Vérifier que le code existe
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide'
    );
  END IF;

  -- Vérifier que l'utilisateur ne se parraine pas lui-même
  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;

  -- Vérifier que l'utilisateur n'a pas déjà été parrainé
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous avez déjà utilisé un code de parrainage'
    );
  END IF;

  -- Créer le parrainage
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    status,
    referrer_points,
    referred_points
  ) VALUES (
    v_referrer_id,
    p_referred_user_id,
    'pending',
    200,  -- Points pour le parrain (donné au premier achat du filleul)
    50    -- Points de bienvenue pour le filleul (donnés immédiatement)
  )
  RETURNING id INTO v_referral_id;

  -- Donner immédiatement 50 points de bienvenue au filleul
  INSERT INTO loyalty_points (user_id, points, total_earned, level)
  VALUES (p_referred_user_id, 50, 50, 'bronze')
  ON CONFLICT (user_id) DO UPDATE
  SET
    points = loyalty_points.points + 50,
    total_earned = loyalty_points.total_earned + 50;

  -- Créer la transaction pour le filleul
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    reference_id
  ) VALUES (
    p_referred_user_id,
    50,
    'welcome',
    'Bonus de bienvenue via parrainage',
    v_referral_id
  );

  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'welcome_points', 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON COLUMN profiles.referral_code IS 'Code de parrainage unique pour chaque utilisateur';
COMMENT ON FUNCTION generate_referral_code() IS 'Génère un code de parrainage unique de 8 caractères';
COMMENT ON FUNCTION register_referral(UUID, TEXT) IS 'Enregistre un parrainage et attribue les points de bienvenue';

-- ============================================
-- MIGRATION: add_referral_rewards.sql
-- ============================================

-- ========================================
-- ATTRIBUTION DES POINTS DE PARRAINAGE
-- Attribue les points quand le filleul fait son premier achat
-- ========================================

-- Fonction pour attribuer les points de parrainage au premier achat
CREATE OR REPLACE FUNCTION award_referral_points()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_record RECORD;
  v_is_first_purchase BOOLEAN;
BEGIN
  -- Vérifier si c'est le premier achat livré de l'utilisateur
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Compter les commandes livrées de cet utilisateur (avant celle-ci)
    SELECT COUNT(*) = 0 INTO v_is_first_purchase
    FROM orders
    WHERE user_id = NEW.user_id
      AND status = 'delivered'
      AND id != NEW.id;

    -- Si c'est le premier achat
    IF v_is_first_purchase THEN
      -- Chercher le parrainage en attente
      SELECT * INTO v_referral_record
      FROM referrals
      WHERE referred_id = NEW.user_id
        AND status = 'pending'
      LIMIT 1;

      -- Si un parrainage existe
      IF FOUND THEN
        -- Attribuer 200 points au parrain
        PERFORM add_loyalty_points(
          v_referral_record.referrer_id,
          200,
          'referral',
          'Parrainage : ' || (SELECT username FROM profiles WHERE id = NEW.user_id),
          v_referral_record.id
        );

        -- Attribuer 100 points au filleul
        PERFORM add_loyalty_points(
          NEW.user_id,
          100,
          'referral',
          'Bonus de bienvenue via parrainage',
          v_referral_record.id
        );

        -- Mettre à jour le statut du parrainage
        UPDATE referrals
        SET
          status = 'completed',
          referrer_points = 200,
          referred_points = 100,
          completed_at = NOW()
        WHERE id = v_referral_record.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger (après le trigger award_purchase_points)
DROP TRIGGER IF EXISTS trigger_award_referral_points ON orders;
CREATE TRIGGER trigger_award_referral_points
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_points();

-- Commentaire
COMMENT ON FUNCTION award_referral_points() IS 'Attribue les points de parrainage au premier achat du filleul';

-- ============================================
-- MIGRATION: add_referral_rewards_trigger.sql
-- ============================================

-- Système automatique pour attribuer les points de parrainage au parrain
-- lors du premier achat du filleul

-- Fonction pour attribuer les points au parrain lors du premier achat
CREATE OR REPLACE FUNCTION reward_referrer_on_first_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_referral RECORD;
  v_is_first_purchase BOOLEAN;
BEGIN
  -- Vérifier si c'est le premier achat de l'utilisateur (statut completed)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Vérifier si c'est vraiment le premier achat
    SELECT NOT EXISTS(
      SELECT 1 FROM orders
      WHERE user_id = NEW.user_id
      AND status = 'completed'
      AND id != NEW.id
    ) INTO v_is_first_purchase;

    -- Si c'est le premier achat, chercher le parrainage
    IF v_is_first_purchase THEN
      SELECT * INTO v_referral
      FROM referrals
      WHERE referred_id = NEW.user_id
      AND status = 'pending'
      LIMIT 1;

      -- Si un parrainage existe
      IF FOUND THEN
        -- Donner les 200 points au parrain
        INSERT INTO loyalty_points (user_id, points, total_earned, level)
        VALUES (v_referral.referrer_id, 200, 200, 'bronze')
        ON CONFLICT (user_id) DO UPDATE
        SET
          points = loyalty_points.points + 200,
          total_earned = loyalty_points.total_earned + 200;

        -- Créer la transaction pour le parrain
        INSERT INTO points_transactions (
          user_id,
          points,
          type,
          description,
          reference_id
        ) VALUES (
          v_referral.referrer_id,
          200,
          'referral',
          'Bonus parrainage - Premier achat de votre filleul',
          v_referral.id
        );

        -- Mettre à jour le statut du parrainage
        UPDATE referrals
        SET
          status = 'completed',
          completed_at = NOW()
        WHERE id = v_referral.id;

        -- Mettre à jour le compteur de parrainages réussis du parrain
        UPDATE profiles
        SET successful_referrals = COALESCE(successful_referrals, 0) + 1
        WHERE id = v_referral.referrer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table orders
DROP TRIGGER IF EXISTS trigger_reward_referrer ON orders;
CREATE TRIGGER trigger_reward_referrer
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reward_referrer_on_first_purchase();

-- Ajouter une colonne pour compter les parrainages réussis
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- Ajouter une colonne completed_at dans referrals
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Commentaires
COMMENT ON FUNCTION reward_referrer_on_first_purchase() IS 'Attribue automatiquement 200 points au parrain lors du premier achat complété du filleul';
COMMENT ON COLUMN profiles.successful_referrals IS 'Nombre de parrainages réussis (filleuls ayant fait au moins un achat)';
COMMENT ON COLUMN referrals.completed_at IS 'Date à laquelle le parrainage a été complété (premier achat du filleul)';

-- ============================================
-- MIGRATION: create_rewards_system.sql
-- ============================================

-- ========================================
-- SYSTÈME DE RÉCOMPENSES ET UTILISATION DES POINTS
-- Permet aux utilisateurs d'échanger leurs points contre des avantages
-- ========================================

-- Table des récompenses disponibles
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'discount', 'boost', 'premium', 'gift'
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  value DECIMAL(10,2), -- Valeur en XOF pour les réductions
  duration_days INTEGER, -- Durée de validité en jours
  icon TEXT, -- Emoji ou nom d'icône
  is_active BOOLEAN DEFAULT true,
  stock INTEGER, -- NULL = illimité
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des récompenses obtenues par les utilisateurs
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES orders(id), -- Si utilisé sur une commande
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_category ON rewards_catalog(category);

-- Fonction pour échanger des points contre une récompense
CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_reward RECORD;
  v_user_points INTEGER;
  v_user_reward_id UUID;
BEGIN
  -- Récupérer la récompense
  SELECT * INTO v_reward
  FROM rewards_catalog
  WHERE id = p_reward_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Récompense introuvable ou inactive'
    );
  END IF;

  -- Vérifier le stock
  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Récompense en rupture de stock'
    );
  END IF;

  -- Récupérer les points de l'utilisateur
  SELECT points INTO v_user_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  IF v_user_points IS NULL THEN
    v_user_points := 0;
  END IF;

  -- Vérifier si l'utilisateur a assez de points
  IF v_user_points < v_reward.points_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Points insuffisants',
      'required', v_reward.points_cost,
      'available', v_user_points
    );
  END IF;

  -- Déduire les points
  UPDATE loyalty_points
  SET points = points - v_reward.points_cost
  WHERE user_id = p_user_id;

  -- Créer la transaction de débit
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    -v_reward.points_cost,
    'redemption',
    'Échange: ' || v_reward.title,
    p_reward_id
  );

  -- Ajouter la récompense à l'utilisateur
  INSERT INTO user_rewards (
    user_id,
    reward_id,
    points_spent,
    status,
    expires_at
  ) VALUES (
    p_user_id,
    p_reward_id,
    v_reward.points_cost,
    'active',
    CASE
      WHEN v_reward.duration_days IS NOT NULL
      THEN NOW() + INTERVAL '1 day' * v_reward.duration_days
      ELSE NULL
    END
  )
  RETURNING id INTO v_user_reward_id;

  -- Décrémenter le stock si applicable
  IF v_reward.stock IS NOT NULL THEN
    UPDATE rewards_catalog
    SET stock = stock - 1
    WHERE id = p_reward_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_reward_id', v_user_reward_id,
    'reward_title', v_reward.title,
    'points_spent', v_reward.points_cost,
    'remaining_points', v_user_points - v_reward.points_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour appliquer un bon de réduction sur une commande
CREATE OR REPLACE FUNCTION apply_discount_reward(
  p_user_id UUID,
  p_order_id UUID,
  p_user_reward_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_reward RECORD;
  v_reward RECORD;
  v_discount_amount DECIMAL(10,2);
BEGIN
  -- Récupérer la récompense de l'utilisateur
  SELECT * INTO v_user_reward
  FROM user_rewards
  WHERE id = p_user_reward_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Récompense invalide ou expirée'
    );
  END IF;

  -- Récupérer les détails de la récompense
  SELECT * INTO v_reward
  FROM rewards_catalog
  WHERE id = v_user_reward.reward_id
    AND category = 'discount';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette récompense n''est pas un bon de réduction'
    );
  END IF;

  v_discount_amount := v_reward.value;

  -- Marquer la récompense comme utilisée
  UPDATE user_rewards
  SET
    status = 'used',
    used_at = NOW(),
    order_id = p_order_id
  WHERE id = p_user_reward_id;

  RETURN json_build_object(
    'success', true,
    'discount_amount', v_discount_amount,
    'reward_title', v_reward.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour convertir des points en réduction directe
CREATE OR REPLACE FUNCTION convert_points_to_discount(
  p_user_id UUID,
  p_points_to_convert INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_user_points INTEGER;
  v_discount_amount DECIMAL(10,2);
  v_conversion_rate DECIMAL(10,2) := 10.0; -- 1 point = 10 XOF
BEGIN
  -- Vérifier que le montant est valide
  IF p_points_to_convert <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Montant de points invalide'
    );
  END IF;

  -- Minimum 50 points pour convertir
  IF p_points_to_convert < 50 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Minimum 50 points requis pour la conversion'
    );
  END IF;

  -- Récupérer les points de l'utilisateur
  SELECT points INTO v_user_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  IF v_user_points IS NULL OR v_user_points < p_points_to_convert THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Points insuffisants'
    );
  END IF;

  -- Calculer la réduction
  v_discount_amount := p_points_to_convert * v_conversion_rate;

  -- Déduire les points
  UPDATE loyalty_points
  SET points = points - p_points_to_convert
  WHERE user_id = p_user_id;

  -- Créer la transaction
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description
  ) VALUES (
    p_user_id,
    -p_points_to_convert,
    'conversion',
    'Conversion en réduction: ' || v_discount_amount || ' XOF'
  );

  RETURN json_build_object(
    'success', true,
    'points_converted', p_points_to_convert,
    'discount_amount', v_discount_amount,
    'remaining_points', v_user_points - p_points_to_convert
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les récompenses actives d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_active_rewards(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  reward_title TEXT,
  reward_description TEXT,
  reward_category TEXT,
  points_spent INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  reward_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.id,
    rc.title,
    rc.description,
    rc.category,
    ur.points_spent,
    ur.expires_at,
    rc.value
  FROM user_rewards ur
  JOIN rewards_catalog rc ON rc.id = ur.reward_id
  WHERE ur.user_id = p_user_id
    AND ur.status = 'active'
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY ur.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer des récompenses par défaut
INSERT INTO rewards_catalog (title, description, category, points_cost, value, duration_days, icon) VALUES
-- Réductions
('Bon de 500 XOF', 'Réduction de 500 XOF sur votre prochaine commande', 'discount', 50, 500, 30, '💰'),
('Bon de 1000 XOF', 'Réduction de 1000 XOF sur votre prochaine commande', 'discount', 100, 1000, 30, '💵'),
('Bon de 2500 XOF', 'Réduction de 2500 XOF sur votre prochaine commande', 'discount', 200, 2500, 30, '💸'),
('Bon de 5000 XOF', 'Réduction de 5000 XOF sur votre prochaine commande', 'discount', 400, 5000, 30, '🎁'),

-- Boosts de visibilité
('Boost 24h', 'Mettez en avant vos produits pendant 24h', 'boost', 100, NULL, 1, '🚀'),
('Boost 3 jours', 'Mettez en avant vos produits pendant 3 jours', 'boost', 250, NULL, 3, '⭐'),
('Boost 7 jours', 'Mettez en avant vos produits pendant 7 jours', 'boost', 500, NULL, 7, '🔥'),

-- Avantages Premium
('Badge VIP 30j', 'Badge VIP visible sur votre profil pendant 30 jours', 'premium', 300, NULL, 30, '👑'),
('Livraison Gratuite x3', '3 livraisons gratuites', 'premium', 150, NULL, 60, '🚚'),
('Support Prioritaire', 'Support client prioritaire pendant 30 jours', 'premium', 200, NULL, 30, '💬')

ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE rewards_catalog IS 'Catalogue des récompenses disponibles à l''échange';
COMMENT ON TABLE user_rewards IS 'Récompenses obtenues par les utilisateurs';
COMMENT ON FUNCTION redeem_reward(UUID, UUID) IS 'Permet à un utilisateur d''échanger ses points contre une récompense';
COMMENT ON FUNCTION apply_discount_reward(UUID, UUID, UUID) IS 'Applique un bon de réduction sur une commande';
COMMENT ON FUNCTION convert_points_to_discount(UUID, INTEGER) IS 'Convertit des points en réduction directe (1 point = 10 XOF)';
COMMENT ON FUNCTION get_user_active_rewards(UUID) IS 'Récupère toutes les récompenses actives d''un utilisateur';

-- ============================================
-- MIGRATION: fix_claimed_rewards_table.sql
-- ============================================

-- ========================================
-- CORRECTION DE LA TABLE claimed_rewards
-- Ajoute les colonnes manquantes pour le système de récompenses
-- ========================================

-- Ajouter la colonne points_spent si elle n'existe pas
ALTER TABLE claimed_rewards
ADD COLUMN IF NOT EXISTS points_spent INTEGER NOT NULL DEFAULT 0;

-- Ajouter d'autres colonnes utiles si elles n'existent pas
ALTER TABLE claimed_rewards
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- S'assurer que la colonne status existe
ALTER TABLE claimed_rewards
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Créer un index pour les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_user_id ON claimed_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_status ON claimed_rewards(status);

-- Mettre à jour les récompenses existantes qui n'ont pas de points_spent
-- Vérifie d'abord si rewards_catalog existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards_catalog') THEN
    UPDATE claimed_rewards
    SET points_spent = (
      SELECT points_cost
      FROM rewards_catalog
      WHERE rewards_catalog.id = claimed_rewards.reward_id
    )
    WHERE points_spent = 0 OR points_spent IS NULL;
  END IF;
END $$;

-- Commentaire
COMMENT ON COLUMN claimed_rewards.points_spent IS 'Nombre de points dépensés pour obtenir cette récompense';
COMMENT ON COLUMN claimed_rewards.expires_at IS 'Date d''expiration de la récompense';
COMMENT ON COLUMN claimed_rewards.status IS 'Statut de la récompense: active, used, expired';

-- ============================================
-- MIGRATION: add_claimed_rewards_foreign_key.sql
-- ============================================

-- ========================================
-- AJOUTER LA RELATION ENTRE claimed_rewards ET rewards
-- Permet de charger les détails de la récompense via Supabase
-- ========================================

-- Vérifier d'abord si la table claimed_rewards existe
DO $$
BEGIN
  -- Ajouter la colonne reward_id si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'claimed_rewards'
    AND column_name = 'reward_id'
  ) THEN
    ALTER TABLE claimed_rewards
    ADD COLUMN reward_id UUID;
  END IF;

  -- Supprimer la contrainte existante si elle existe
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'claimed_rewards_reward_id_fkey'
  ) THEN
    ALTER TABLE claimed_rewards
    DROP CONSTRAINT claimed_rewards_reward_id_fkey;
  END IF;

  -- Ajouter la contrainte de clé étrangère
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'rewards'
  ) THEN
    ALTER TABLE claimed_rewards
    ADD CONSTRAINT claimed_rewards_reward_id_fkey
    FOREIGN KEY (reward_id)
    REFERENCES rewards(id)
    ON DELETE CASCADE;
  END IF;

  -- Créer un index pour améliorer les performances des jointures
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_claimed_rewards_reward_id'
  ) THEN
    CREATE INDEX idx_claimed_rewards_reward_id ON claimed_rewards(reward_id);
  END IF;
END $$;

-- Commentaire
COMMENT ON CONSTRAINT claimed_rewards_reward_id_fkey ON claimed_rewards
IS 'Lie une récompense réclamée à son entrée dans le catalogue de récompenses';

-- ============================================
-- MIGRATION: fix_immediate_referral_rewards.sql
-- ============================================

-- ========================================
-- CORRECTION : Attribution immédiate des points de parrainage
-- Attribue 200 points au parrain ET 50 points au filleul dès le parrainage
-- ========================================

-- Nouvelle fonction register_referral avec attribution immédiate des points au parrain
CREATE OR REPLACE FUNCTION register_referral(
  p_referred_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_result JSON;
BEGIN
  -- Trouver le parrain via son code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code
  LIMIT 1;

  -- Vérifier que le code existe
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide'
    );
  END IF;

  -- Vérifier que l'utilisateur ne se parraine pas lui-même
  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;

  -- Vérifier que l'utilisateur n'a pas déjà été parrainé
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous avez déjà utilisé un code de parrainage'
    );
  END IF;

  -- Créer le parrainage
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    status,
    referrer_points,
    referred_points
  ) VALUES (
    v_referrer_id,
    p_referred_user_id,
    'active',  -- Changé de 'pending' à 'active' car les points sont donnés immédiatement
    200,  -- Points pour le parrain (donnés immédiatement)
    50    -- Points de bienvenue pour le filleul (donnés immédiatement)
  )
  RETURNING id INTO v_referral_id;

  -- DONNER IMMÉDIATEMENT 200 POINTS AU PARRAIN
  INSERT INTO loyalty_points (user_id, points, total_earned, level)
  VALUES (v_referrer_id, 200, 200, 'bronze')
  ON CONFLICT (user_id) DO UPDATE
  SET
    points = loyalty_points.points + 200,
    total_earned = loyalty_points.total_earned + 200;

  -- Créer la transaction pour le parrain
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    reference_id
  ) VALUES (
    v_referrer_id,
    200,
    'referral',
    'Bonus parrainage - Nouveau filleul inscrit',
    v_referral_id
  );

  -- DONNER IMMÉDIATEMENT 50 POINTS AU FILLEUL
  INSERT INTO loyalty_points (user_id, points, total_earned, level)
  VALUES (p_referred_user_id, 50, 50, 'bronze')
  ON CONFLICT (user_id) DO UPDATE
  SET
    points = loyalty_points.points + 50,
    total_earned = loyalty_points.total_earned + 50;

  -- Créer la transaction pour le filleul
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    reference_id
  ) VALUES (
    p_referred_user_id,
    50,
    'welcome',
    'Bonus de bienvenue via parrainage',
    v_referral_id
  );

  -- Incrémenter le compteur de parrainages du parrain
  UPDATE profiles
  SET successful_referrals = COALESCE(successful_referrals, 0) + 1
  WHERE id = v_referrer_id;

  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_points', 200,
    'welcome_points', 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION register_referral(UUID, TEXT) IS 'Enregistre un parrainage et attribue IMMÉDIATEMENT 200 points au parrain et 50 points au filleul';

-- Note : Les triggers existants (reward_referrer_on_first_purchase et award_referral_points)
-- continueront de fonctionner mais ne devraient pas réattribuer de points car le statut sera 'active' et non 'pending'
-- Ils peuvent être désactivés si nécessaire, mais ils ne causeront pas de problème.

-- ============================================
-- MIGRATION: retroactive_referral_points.sql
-- ============================================

-- ========================================
-- ATTRIBUTION RÉTROACTIVE DES POINTS DE PARRAINAGE
-- Donne les 200 points aux parrains qui avaient des filleuls en attente
-- ========================================

-- S'assurer que la colonne successful_referrals existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- S'assurer que la colonne completed_at existe dans referrals
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

DO $$
DECLARE
  r RECORD;
  v_referral_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Début de l''attribution rétroactive des points de parrainage...';

  FOR r IN
    SELECT
      ref.referrer_id,
      ref.id as referral_id,
      ref.referred_id,
      p.username as referrer_username,
      p2.username as referred_username
    FROM referrals ref
    JOIN profiles p ON p.id = ref.referrer_id
    JOIN profiles p2 ON p2.id = ref.referred_id
    WHERE ref.status = 'pending'
  LOOP
    -- Donner 200 points au parrain
    INSERT INTO loyalty_points (user_id, points, total_earned, level)
    VALUES (r.referrer_id, 200, 200, 'bronze')
    ON CONFLICT (user_id) DO UPDATE
    SET
      points = loyalty_points.points + 200,
      total_earned = loyalty_points.total_earned + 200;

    -- Créer la transaction pour le parrain
    INSERT INTO points_transactions (
      user_id,
      points,
      type,
      description,
      reference_id
    ) VALUES (
      r.referrer_id,
      200,
      'referral',
      'Bonus parrainage rétroactif - Filleul: ' || COALESCE(r.referred_username, 'Utilisateur'),
      r.referral_id
    );

    -- Incrémenter le compteur de parrainages du parrain
    UPDATE profiles
    SET successful_referrals = COALESCE(successful_referrals, 0) + 1
    WHERE id = r.referrer_id;

    -- Mettre à jour le statut du parrainage
    UPDATE referrals
    SET
      status = 'active',
      referrer_points = 200
    WHERE id = r.referral_id;

    v_referral_count := v_referral_count + 1;

    RAISE NOTICE 'Points attribués: Parrain % a reçu 200 points pour le filleul %',
      COALESCE(r.referrer_username, 'ID: ' || r.referrer_id::text),
      COALESCE(r.referred_username, 'ID: ' || r.referred_id::text);
  END LOOP;

  RAISE NOTICE 'Attribution rétroactive terminée. % parrainage(s) traité(s).', v_referral_count;

  IF v_referral_count = 0 THEN
    RAISE NOTICE 'Aucun parrainage en attente trouvé.';
  END IF;
END $$;

-- Afficher un résumé des points attribués
SELECT
  p.username,
  p.full_name,
  lp.points as points_actuels,
  lp.total_earned as total_gagné,
  p.successful_referrals as parrainages_réussis
FROM profiles p
LEFT JOIN loyalty_points lp ON lp.user_id = p.id
WHERE p.successful_referrals > 0
ORDER BY lp.points DESC;

-- ============================================
-- MIGRATION: verify_rewards_system.sql
-- ============================================

-- ========================================
-- VÉRIFICATION DU SYSTÈME DE RÉCOMPENSES
-- Exécutez ce script pour vérifier que tout est bien configuré
-- ========================================

-- 1. Vérifier que les tables existent
SELECT 'Tables existantes:' as verification;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('rewards_catalog', 'user_rewards', 'loyalty_points', 'points_transactions')
ORDER BY table_name;

-- 2. Vérifier que les fonctions existent
SELECT 'Fonctions existantes:' as verification;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('redeem_reward', 'convert_points_to_discount', 'apply_discount_reward', 'get_user_active_rewards', 'register_referral')
ORDER BY routine_name;

-- 3. Compter les récompenses dans le catalogue
SELECT 'Nombre de récompenses:' as verification;
SELECT category, COUNT(*) as nombre
FROM rewards_catalog
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 4. Afficher toutes les récompenses disponibles
SELECT 'Récompenses disponibles:' as verification;
SELECT
  title,
  category,
  points_cost,
  value,
  duration_days,
  stock,
  icon
FROM rewards_catalog
WHERE is_active = true
ORDER BY points_cost;

-- 5. Vérifier un utilisateur test (remplacez par votre user_id)
-- SELECT 'Points utilisateur test:' as verification;
-- SELECT points, total_earned, level
-- FROM loyalty_points
-- WHERE user_id = 'VOTRE-USER-ID-ICI';

-- 6. Tester la fonction redeem_reward (sans l'exécuter réellement)
SELECT 'Test de la fonction redeem_reward:' as verification;
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'redeem_reward'
LIMIT 1;

-- ============================================
-- MIGRATION: create_chat_system.sql
-- ============================================

/*
  # Système de Chat en Direct Vendeur-Acheteur

  Fonctionnalités:
  - Conversations 1-to-1 vendeur-acheteur
  - Messages en temps réel
  - Support images
  - Notifications
  - Indicateur "en ligne"
  - Historique complet
*/

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL, -- Produit concerné (optionnel)

  -- État
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),

  -- Dernière activité
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,

  -- Compteurs de messages non lus
  buyer_unread_count integer DEFAULT 0,
  seller_unread_count integer DEFAULT 0,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contrainte d'unicité pour éviter doublons
  UNIQUE(buyer_id, seller_id, product_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,

  -- Expéditeur
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contenu
  content text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  image_url text,

  -- État du message
  is_read boolean DEFAULT false,
  read_at timestamptz,

  -- Offre de prix (pour négociation)
  offer_price numeric,
  offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table pour tracking des utilisateurs en ligne
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  device_token text, -- Pour notifications push
  updated_at timestamptz DEFAULT now()
);

-- Table pour les réponses rapides prédéfinies
CREATE TABLE IF NOT EXISTS quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online, last_seen DESC);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- Conversations: Visible par les participants
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages: Visible par les participants de la conversation
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- User presence: Visible par tous, modifiable par soi-même
CREATE POLICY "Everyone can view user presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quick replies: Visible et modifiable par le vendeur propriétaire
CREATE POLICY "Sellers can manage own quick replies"
  ON quick_replies FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Fonction pour créer ou récupérer une conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Vérifier si la conversation existe déjà
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE buyer_id = p_buyer_id
    AND seller_id = p_seller_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL));

  -- Si elle n'existe pas, la créer
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, product_id)
    VALUES (p_buyer_id, p_seller_id, p_product_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour envoyer un message
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = COALESCE(
      CASE
        WHEN p_message_type = 'image' THEN '📷 Photo'
        WHEN p_offer_price IS NOT NULL THEN '💰 Offre de prix'
        ELSE LEFT(p_content, 100)
      END,
      ''
    ),
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer les messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Marquer les messages non lus comme lus
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  -- Réinitialiser le compteur de messages non lus
  UPDATE conversations
  SET
    buyer_unread_count = CASE WHEN buyer_id = p_user_id THEN 0 ELSE buyer_unread_count END,
    seller_unread_count = CASE WHEN seller_id = p_user_id THEN 0 ELSE seller_unread_count END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour la présence utilisateur
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id uuid,
  p_is_online boolean,
  p_device_token text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, is_online, device_token, last_seen, updated_at)
  VALUES (p_user_id, p_is_online, p_device_token, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_online = p_is_online,
    device_token = COALESCE(p_device_token, user_presence.device_token),
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les conversations avec derniers messages
CREATE OR REPLACE FUNCTION get_conversations_with_details(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  is_seller boolean,
  product_id uuid,
  product_title text,
  product_image text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer,
  other_user_online boolean,
  other_user_last_seen timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END as other_user_id,
    COALESCE(p.full_name, p.username, 'Utilisateur') as other_user_name,
    p.avatar_url as other_user_avatar,
    (c.seller_id != p_user_id) as is_seller,
    c.product_id,
    prod.title as product_title,
    prod.image_url as product_image,
    c.last_message_preview as last_message,
    c.last_message_at,
    CASE WHEN c.buyer_id = p_user_id THEN c.buyer_unread_count ELSE c.seller_unread_count END as unread_count,
    COALESCE(up.is_online, false) as other_user_online,
    up.last_seen as other_user_last_seen
  FROM conversations c
  LEFT JOIN profiles p ON p.id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  LEFT JOIN products prod ON prod.id = c.product_id
  LEFT JOIN user_presence up ON up.user_id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nettoyer les vieilles présences
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Insertion de réponses rapides par défaut pour les nouveaux vendeurs
INSERT INTO quick_replies (seller_id, message, display_order)
SELECT
  id,
  message,
  display_order
FROM profiles,
LATERAL (
  VALUES
    ('Bonjour ! Comment puis-je vous aider ?', 1),
    ('Le produit est disponible en stock', 2),
    ('La livraison prend 2-3 jours', 3),
    ('Je peux faire une réduction pour plusieurs articles', 4),
    ('Merci pour votre intérêt !', 5)
) AS quick(message, display_order)
WHERE profiles.is_seller = true
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION: fix_chat_system.sql
-- ============================================

-- Fix Chat System Migration
-- This script only creates missing elements

-- Drop and recreate the function to ensure it's up to date
DROP FUNCTION IF EXISTS get_conversations_with_details(uuid);

CREATE OR REPLACE FUNCTION get_conversations_with_details(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  is_seller boolean,
  product_id uuid,
  product_title text,
  product_image text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer,
  other_user_online boolean,
  other_user_last_seen timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END as other_user_id,
    COALESCE(p.full_name, p.username, 'Utilisateur') as other_user_name,
    p.avatar_url as other_user_avatar,
    (c.seller_id != p_user_id) as is_seller,
    c.product_id,
    prod.title as product_title,
    prod.image_url as product_image,
    c.last_message_preview as last_message,
    c.last_message_at,
    CASE WHEN c.buyer_id = p_user_id THEN c.buyer_unread_count ELSE c.seller_unread_count END as unread_count,
    COALESCE(up.is_online, false) as other_user_online,
    up.last_seen as other_user_last_seen
  FROM conversations c
  LEFT JOIN profiles p ON p.id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  LEFT JOIN products prod ON prod.id = c.product_id
  LEFT JOIN user_presence up ON up.user_id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate other essential functions
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Vérifier si la conversation existe déjà
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE buyer_id = p_buyer_id
    AND seller_id = p_seller_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL));

  -- Si elle n'existe pas, la créer
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, product_id)
    VALUES (p_buyer_id, p_seller_id, p_product_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = COALESCE(
      CASE
        WHEN p_message_type = 'image' THEN '📷 Photo'
        WHEN p_offer_price IS NOT NULL THEN '💰 Offre de prix'
        ELSE LEFT(p_content, 100)
      END,
      ''
    ),
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);

CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Marquer les messages non lus comme lus
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  -- Réinitialiser le compteur de messages non lus
  UPDATE conversations
  SET
    buyer_unread_count = CASE WHEN buyer_id = p_user_id THEN 0 ELSE buyer_unread_count END,
    seller_unread_count = CASE WHEN seller_id = p_user_id THEN 0 ELSE seller_unread_count END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_user_presence(uuid, boolean, text);

CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id uuid,
  p_is_online boolean,
  p_device_token text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, is_online, device_token, last_seen, updated_at)
  VALUES (p_user_id, p_is_online, p_device_token, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_online = p_is_online,
    device_token = COALESCE(p_device_token, user_presence.device_token),
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS cleanup_old_presence();

CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_conversations_with_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, boolean, text) TO authenticated;

-- ============================================
-- MIGRATION: fix_conversations_profiles_relationship.sql
-- ============================================

-- Fix the relationship between conversations and profiles
-- The issue is that conversations references auth.users but we need to join with profiles

-- Since profiles.id references auth.users.id, we can use this relationship
-- We just need to make sure Supabase understands the foreign key hints

-- The queries in the code use:
-- buyer:profiles!buyer_id and seller:profiles!seller_id
-- This works because:
-- 1. conversations.buyer_id -> auth.users.id
-- 2. profiles.id -> auth.users.id
-- So we can join through the user_id

-- The error suggests PostgREST can't find the relationship
-- Let's verify the foreign keys exist

-- Check if we need to add comments to help PostgREST
COMMENT ON COLUMN conversations.buyer_id IS 'Foreign key to auth.users, can be joined with profiles.id';
COMMENT ON COLUMN conversations.seller_id IS 'Foreign key to auth.users, can be joined with profiles.id';

-- Also check messages table
COMMENT ON COLUMN messages.sender_id IS 'Foreign key to auth.users, can be joined with profiles.id';

-- Make sure profiles table has proper foreign key
-- This should already exist, but let's ensure it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- MIGRATION: add_missing_conversations_columns.sql
-- ============================================

-- Add missing unread count columns to conversations table
DO $$
BEGIN
  -- Add buyer_unread_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'buyer_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN buyer_unread_count integer DEFAULT 0;
  END IF;

  -- Add seller_unread_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'seller_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN seller_unread_count integer DEFAULT 0;
  END IF;

  -- Add last_message_preview column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_preview text;
  END IF;

  -- Add last_message_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================
-- MIGRATION: add_conversations_status_column.sql
-- ============================================

-- Add status column to conversations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE conversations
    ADD COLUMN status text DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'blocked'));

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

    RAISE NOTICE 'Column status added to conversations table';
  ELSE
    RAISE NOTICE 'Column status already exists in conversations table';
  END IF;
END $$;

-- ============================================
-- MIGRATION: fix_conversations_unread_columns.sql
-- ============================================

-- Add missing unread count columns to conversations table
-- These columns are needed to track unread messages for buyer and seller

DO $$
BEGIN
  -- Add buyer_unread_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'buyer_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN buyer_unread_count integer DEFAULT 0;
  END IF;

  -- Add seller_unread_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'seller_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN seller_unread_count integer DEFAULT 0;
  END IF;

  -- Add last_message_preview column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_preview text;
  END IF;

  -- Add last_message_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================
-- MIGRATION: fix_messages_table_complete.sql
-- ============================================

-- Fix messages table and send_message function
-- This migration adds missing columns and updates the function

-- Step 1: Add missing columns to messages table if they don't exist
DO $$
BEGIN
  -- Add offer_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'offer_price'
  ) THEN
    ALTER TABLE messages ADD COLUMN offer_price numeric;
  END IF;

  -- Add offer_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'offer_status'
  ) THEN
    ALTER TABLE messages ADD COLUMN offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;

  -- Add message_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system'));
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;
END $$;

-- Step 2: Create index for faster queries on offer status
CREATE INDEX IF NOT EXISTS idx_messages_offer_status ON messages(offer_status) WHERE offer_status IS NOT NULL;

-- Step 3: Drop all existing versions of send_message function
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

-- Step 4: Create the complete send_message function
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
  v_message_preview text;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message avec toutes les colonnes
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Déterminer le preview du message
  IF p_message_type = 'image' THEN
    v_message_preview := '📷 Photo';
  ELSIF p_offer_price IS NOT NULL THEN
    v_message_preview := '💰 Offre de prix';
  ELSE
    v_message_preview := LEFT(COALESCE(p_content, ''), 100);
  END IF;

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = v_message_preview,
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;

-- ============================================
-- MIGRATION: fix_messages_content_nullable.sql
-- ============================================

-- Allow content to be NULL in messages table
-- This is needed because messages can be images or voice without text content

-- Remove NOT NULL constraint from content column
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add a check constraint to ensure at least one type of content exists
-- A message must have either: content, image_url, voice_url, or offer_price
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_has_content_check;

ALTER TABLE messages ADD CONSTRAINT messages_has_content_check
CHECK (
  content IS NOT NULL OR
  image_url IS NOT NULL OR
  voice_url IS NOT NULL OR
  offer_price IS NOT NULL
);

-- Add comment for clarity
COMMENT ON COLUMN messages.content IS 'Text content of the message. Can be NULL for image/voice messages.';

-- ============================================
-- MIGRATION: add_media_support_to_messages.sql
-- ============================================

-- Add media support to messages table (images and voice messages)
-- This enables users to send images and voice messages in chat

DO $$
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;

  -- Add voice_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'voice_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN voice_url text;
  END IF;

  -- Add voice_duration column if it doesn't exist (in seconds)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'voice_duration'
  ) THEN
    ALTER TABLE messages ADD COLUMN voice_duration integer;
  END IF;

  -- Add message_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'system'));
  END IF;
END $$;

-- Create indexes for media queries
CREATE INDEX IF NOT EXISTS idx_messages_image ON messages(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_voice ON messages(voice_url) WHERE voice_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Update send_message function to support media
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_voice_url text DEFAULT NULL,
  p_voice_duration integer DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
  v_message_preview text;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message avec support média
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    voice_url,
    voice_duration,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_voice_url,
    p_voice_duration,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Déterminer le preview du message selon le type
  IF p_message_type = 'image' THEN
    v_message_preview := '📷 Photo';
  ELSIF p_message_type = 'voice' THEN
    v_message_preview := '🎤 Message vocal';
  ELSIF p_offer_price IS NOT NULL THEN
    v_message_preview := '💰 Offre de prix';
  ELSE
    v_message_preview := LEFT(COALESCE(p_content, ''), 100);
  END IF;

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = v_message_preview,
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, text, integer, numeric) TO authenticated;

-- ============================================
-- MIGRATION: add_offer_columns_to_messages.sql
-- ============================================

-- Add missing offer_price and offer_status columns to messages table
-- These columns are needed for price negotiation feature

-- Add offer_price column if it doesn't exist
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS offer_price numeric;

-- Add offer_status column if it doesn't exist
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired'));

-- Create index for faster queries on offer status
CREATE INDEX IF NOT EXISTS idx_messages_offer_status ON messages(offer_status) WHERE offer_status IS NOT NULL;

-- ============================================
-- MIGRATION: fix_send_message_function.sql
-- ============================================

-- Fix send_message function - simplified version without message_type and image_url columns
-- These columns don't exist in the actual database schema

-- Drop ALL possible versions of send_message function
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

-- Create the new simplified version
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
  v_message_preview text;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  -- Déterminer le destinataire
  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  -- Insérer le message (sans message_type et image_url)
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  -- Déterminer le preview du message
  IF p_offer_price IS NOT NULL THEN
    v_message_preview := '💰 Offre de prix';
  ELSE
    v_message_preview := LEFT(COALESCE(p_content, ''), 100);
  END IF;

  -- Mettre à jour la conversation
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = v_message_preview,
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, numeric) TO authenticated;

-- ============================================
-- MIGRATION: fix_send_message_overload.sql
-- ============================================

-- Fix send_message function overloading conflict
-- Drop the old version and keep only the new one with media support

-- Drop the old send_message function (without media parameters)
DROP FUNCTION IF EXISTS public.send_message(uuid, uuid, text, numeric);

-- Make sure we only have the new version with all parameters
-- This function should already exist from add_media_support_to_messages.sql
-- If it doesn't exist, create it

CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_voice_url text DEFAULT NULL,
  p_voice_duration integer DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
  v_buyer_id uuid;
  v_seller_id uuid;
  v_is_buyer boolean;
BEGIN
  -- Get conversation details
  SELECT buyer_id, seller_id
  INTO v_buyer_id, v_seller_id
  FROM conversations
  WHERE id = p_conversation_id;

  -- Check if sender is buyer or seller
  v_is_buyer := (p_sender_id = v_buyer_id);

  -- Insert the message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    voice_url,
    voice_duration,
    offer_price,
    created_at
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_voice_url,
    p_voice_duration,
    p_offer_price,
    NOW()
  )
  RETURNING id INTO v_message_id;

  -- Update conversation
  UPDATE conversations
  SET
    last_message_at = NOW(),
    last_message_preview = COALESCE(
      CASE
        WHEN p_message_type = 'text' THEN p_content
        WHEN p_message_type = 'image' THEN '📷 Photo'
        WHEN p_message_type = 'voice' THEN '🎤 Message vocal'
        ELSE 'Message'
      END,
      'Message'
    ),
    buyer_unread_count = CASE WHEN v_is_buyer THEN 0 ELSE buyer_unread_count + 1 END,
    seller_unread_count = CASE WHEN v_is_buyer THEN seller_unread_count + 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_message(uuid, uuid, text, text, text, text, integer, numeric) TO authenticated;

-- ============================================
-- MIGRATION: create_chat_media_storage.sql
-- ============================================

-- Create storage buckets for chat media (images and voice messages)

-- Create bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for voice messages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-voice',
  'chat-voice',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Chat images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Voice messages are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice messages" ON storage.objects;

-- Storage policies for chat images
CREATE POLICY "Users can upload their own chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Chat images are publicly accessible"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for voice messages
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-voice' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Voice messages are publicly accessible"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-voice');

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-voice' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- MIGRATION: complete_chat_setup.sql
-- ============================================

-- Complete Chat System Setup
-- This script creates everything needed for the chat system

-- ============================================================================
-- STEP 1: Create Tables
-- ============================================================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  buyer_unread_count integer DEFAULT 0,
  seller_unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, seller_id, product_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  image_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  offer_price numeric,
  offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table pour tracking des utilisateurs en ligne
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  device_token text,
  updated_at timestamptz DEFAULT now()
);

-- Table pour les réponses rapides prédéfinies
CREATE TABLE IF NOT EXISTS quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STEP 2: Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online, last_seen DESC);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Drop existing policies (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Everyone can view user presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON user_presence;
DROP POLICY IF EXISTS "Sellers can manage own quick replies" ON quick_replies;

-- ============================================================================
-- STEP 5: Create RLS Policies
-- ============================================================================

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- User presence policies
CREATE POLICY "Everyone can view user presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quick replies policies
CREATE POLICY "Sellers can manage own quick replies"
  ON quick_replies FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- ============================================================================
-- STEP 6: Create Functions
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS get_conversations_with_details(uuid);
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS update_user_presence(uuid, boolean, text);
DROP FUNCTION IF EXISTS cleanup_old_presence();

-- Function to get conversations with details
CREATE FUNCTION get_conversations_with_details(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  is_seller boolean,
  product_id uuid,
  product_title text,
  product_image text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer,
  other_user_online boolean,
  other_user_last_seen timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END as other_user_id,
    COALESCE(p.full_name, p.username, 'Utilisateur') as other_user_name,
    p.avatar_url as other_user_avatar,
    (c.seller_id != p_user_id) as is_seller,
    c.product_id,
    prod.title as product_title,
    prod.image_url as product_image,
    c.last_message_preview as last_message,
    c.last_message_at,
    CASE WHEN c.buyer_id = p_user_id THEN c.buyer_unread_count ELSE c.seller_unread_count END as unread_count,
    COALESCE(up.is_online, false) as other_user_online,
    up.last_seen as other_user_last_seen
  FROM conversations c
  LEFT JOIN profiles p ON p.id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  LEFT JOIN products prod ON prod.id = c.product_id
  LEFT JOIN user_presence up ON up.user_id = CASE WHEN c.buyer_id = p_user_id THEN c.seller_id ELSE c.buyer_id END
  WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or get conversation
CREATE FUNCTION get_or_create_conversation(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE buyer_id = p_buyer_id
    AND seller_id = p_seller_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL));

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, product_id)
    VALUES (p_buyer_id, p_seller_id, p_product_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send message
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
BEGIN
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = COALESCE(
      CASE
        WHEN p_message_type = 'image' THEN '📷 Photo'
        WHEN p_offer_price IS NOT NULL THEN '💰 Offre de prix'
        ELSE LEFT(p_content, 100)
      END,
      ''
    ),
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  UPDATE conversations
  SET
    buyer_unread_count = CASE WHEN buyer_id = p_user_id THEN 0 ELSE buyer_unread_count END,
    seller_unread_count = CASE WHEN seller_id = p_user_id THEN 0 ELSE seller_unread_count END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
CREATE FUNCTION update_user_presence(
  p_user_id uuid,
  p_is_online boolean,
  p_device_token text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, is_online, device_token, last_seen, updated_at)
  VALUES (p_user_id, p_is_online, p_device_token, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_online = p_is_online,
    device_token = COALESCE(p_device_token, user_presence.device_token),
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old presence
CREATE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Grant Permissions
-- ============================================================================

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON user_presence TO authenticated;
GRANT ALL ON quick_replies TO authenticated;

GRANT EXECUTE ON FUNCTION get_conversations_with_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_presence() TO authenticated;

-- ============================================
-- MIGRATION: fix_complete_chat_schema.sql
-- ============================================

-- Complete fix for chat system schema
-- This migration adds missing columns and fixes all functions

-- 1. Add missing columns to conversations table if they don't exist
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_preview text;

-- 2. Add missing columns to messages table if they don't exist
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system'));

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Drop ALL versions of send_message function
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS send_message(uuid, uuid, text, text, text, numeric);

-- 4. Create send_message function with full support
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_image_url text DEFAULT NULL,
  p_offer_price numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_conversation conversations%ROWTYPE;
  v_recipient_id uuid;
  v_message_preview text;
BEGIN
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  IF v_conversation.buyer_id = p_sender_id THEN
    v_recipient_id := v_conversation.seller_id;
  ELSE
    v_recipient_id := v_conversation.buyer_id;
  END IF;

  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    image_url,
    offer_price,
    offer_status
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_image_url,
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO v_message_id;

  IF p_message_type = 'image' OR p_image_url IS NOT NULL THEN
    v_message_preview := '📷 Photo';
  ELSIF p_offer_price IS NOT NULL THEN
    v_message_preview := '💰 Offre de prix';
  ELSE
    v_message_preview := LEFT(COALESCE(p_content, ''), 100);
  END IF;

  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = v_message_preview,
    buyer_unread_count = CASE
      WHEN v_recipient_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN v_recipient_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_message(uuid, uuid, text, text, text, numeric) TO authenticated;

-- ============================================
-- MIGRATION: enable_realtime_for_chat.sql
-- ============================================

-- Enable Realtime for chat tables
-- This allows real-time synchronization of messages and conversations

-- Enable realtime replication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime replication for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime replication for user_presence table
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Set replica identity to FULL for messages (allows UPDATE events to send full row data)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Set replica identity to FULL for conversations
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Set replica identity to FULL for user_presence
ALTER TABLE user_presence REPLICA IDENTITY FULL;

-- ============================================
-- MIGRATION: create_blocked_users_system.sql
-- ============================================

-- Ensure conversations table has status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE conversations
    ADD COLUMN status text DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'blocked'));

    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
  END IF;
END $$;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Enable RLS
DO $$
BEGIN
  ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Table might already have RLS enabled
END $$;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;

-- Users can view their own blocks
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_blocker_id UUID, p_blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block a user
CREATE OR REPLACE FUNCTION block_user(
  p_blocker_id UUID,
  p_blocked_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if already blocked
  IF is_user_blocked(p_blocker_id, p_blocked_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User is already blocked'
    );
  END IF;

  -- Insert block
  INSERT INTO blocked_users (blocker_id, blocked_id, reason)
  VALUES (p_blocker_id, p_blocked_id, p_reason);

  -- Archive all conversations between the two users
  UPDATE conversations
  SET status = 'blocked'
  WHERE (buyer_id = p_blocker_id AND seller_id = p_blocked_id)
     OR (seller_id = p_blocker_id AND buyer_id = p_blocked_id);

  RETURN json_build_object(
    'success', true,
    'message', 'User blocked successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock a user
CREATE OR REPLACE FUNCTION unblock_user(
  p_blocker_id UUID,
  p_blocked_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Delete block
  DELETE FROM blocked_users
  WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;

  -- Reactivate conversations if they were blocked
  UPDATE conversations
  SET status = 'active'
  WHERE status = 'blocked'
    AND ((buyer_id = p_blocker_id AND seller_id = p_blocked_id)
      OR (seller_id = p_blocker_id AND buyer_id = p_blocked_id));

  RETURN json_build_object(
    'success', true,
    'message', 'User unblocked successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION: add_seller_order_policies.sql
-- ============================================

A
-- ============================================
-- MIGRATION: create_seller_subscription_plans.sql
-- ============================================

/*
  # Système de Plans d'Abonnement pour Vendeurs

  Ce système offre 4 plans d'abonnement avec des avantages progressifs:

  1. GRATUIT (Free)
     - Commission: 20%
     - 5 produits maximum
     - Photos standard
     - Aucune mise en avant

  2. STARTER (Débutant) - 5,000 XOF/mois
     - Commission: 15%
     - 25 produits maximum
     - Photos HD
     - Badge "Vendeur Vérifié"
     - Apparition occasionnelle en page d'accueil
     - Support prioritaire

  3. PRO (Professionnel) - 15,000 XOF/mois
     - Commission: 10%
     - 100 produits maximum
     - Photos HD + Vidéos
     - Badge "Vendeur Pro"
     - Mise en avant régulière (rotation toutes les 2 heures)
     - Boost de visibilité +50%
     - Support prioritaire VIP
     - Statistiques avancées

  4. PREMIUM (Elite) - 30,000 XOF/mois
     - Commission: 7%
     - Produits illimités
     - Photos HD + Vidéos + 360°
     - Badge "Vendeur Elite"
     - Position premium permanente
     - Boost de visibilité +100%
     - Concierge dédié 24/7
     - Statistiques avancées + Analytics IA
     - Campagnes marketing sponsorisées
*/

-- Types ENUM pour les plans
DO $$ BEGIN
  CREATE TYPE subscription_plan_type AS ENUM ('free', 'starter', 'pro', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des définitions de plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan_type NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL CHECK (price_monthly >= 0),
  currency text DEFAULT 'XOF',

  -- Avantages commerciaux
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  max_products integer NOT NULL CHECK (max_products > 0),

  -- Avantages de visibilité
  visibility_boost integer DEFAULT 0 CHECK (visibility_boost >= 0),
  featured_rotation_hours integer, -- null = pas de rotation automatique
  homepage_spots integer DEFAULT 0, -- nombre de slots sur la page d'accueil
  priority_in_search integer DEFAULT 0 CHECK (priority_in_search >= 0), -- boost dans les résultats de recherche

  -- Fonctionnalités média
  hd_photos boolean DEFAULT false,
  video_allowed boolean DEFAULT false,
  photo_360_allowed boolean DEFAULT false,
  max_photos_per_product integer DEFAULT 5,

  -- Badges et certifications
  badge_name text,
  verified_badge boolean DEFAULT false,

  -- Support et services
  support_level text, -- 'standard', 'priority', 'vip', 'concierge'
  advanced_analytics boolean DEFAULT false,
  ai_analytics boolean DEFAULT false,
  sponsored_campaigns boolean DEFAULT false,

  -- Metadata
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements des vendeurs
CREATE TABLE IF NOT EXISTS seller_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  plan_type subscription_plan_type NOT NULL,

  -- Informations d'abonnement
  status subscription_status DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,

  -- Facturation
  amount_paid numeric,
  currency text DEFAULT 'XOF',
  payment_method text,
  transaction_id text,

  -- Renouvellement automatique
  auto_renew boolean DEFAULT true,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(seller_id, plan_type)
);

-- Table des rotations de mise en avant
CREATE TABLE IF NOT EXISTS featured_products_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type subscription_plan_type NOT NULL,

  -- Slot de rotation
  rotation_slot integer NOT NULL, -- 1-12 pour les différentes rotations de la journée
  priority integer DEFAULT 0,

  -- Période d'affichage
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,

  -- Statistiques
  views_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

-- Table de l'historique des abonnements
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type subscription_plan_type NOT NULL,
  action text NOT NULL, -- 'activated', 'renewed', 'cancelled', 'expired', 'upgraded', 'downgraded'
  old_plan_type subscription_plan_type,
  new_plan_type subscription_plan_type,
  amount_paid numeric,
  currency text DEFAULT 'XOF',
  created_at timestamptz DEFAULT now()
);

-- Insertion des plans par défaut
INSERT INTO subscription_plans (
  plan_type, name, description, price_monthly, commission_rate, max_products,
  visibility_boost, featured_rotation_hours, homepage_spots, priority_in_search,
  hd_photos, video_allowed, photo_360_allowed, max_photos_per_product,
  badge_name, verified_badge, support_level, advanced_analytics, ai_analytics,
  sponsored_campaigns, display_order
) VALUES
  (
    'free', 'Gratuit',
    'Idéal pour commencer à vendre sur la plateforme',
    0, 20, 5,
    0, null, 0, 0,
    false, false, false, 5,
    null, false, 'standard', false, false, false, 1
  ),
  (
    'starter', 'Starter',
    'Pour les vendeurs qui démarrent leur activité',
    5000, 15, 25,
    20, 24, 1, 10,
    true, false, false, 10,
    'Vendeur Vérifié', true, 'priority', false, false, false, 2
  ),
  (
    'pro', 'Pro',
    'Pour les vendeurs professionnels établis',
    15000, 10, 100,
    50, 2, 3, 30,
    true, true, false, 15,
    'Vendeur Pro', true, 'vip', true, false, false, 3
  ),
  (
    'premium', 'Premium',
    'Pour les vendeurs d''élite à fort volume',
    30000, 7, 999999,
    100, null, 5, 50,
    true, true, true, 30,
    'Vendeur Elite', true, 'concierge', true, true, true, 4
  )
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  commission_rate = EXCLUDED.commission_rate,
  max_products = EXCLUDED.max_products,
  visibility_boost = EXCLUDED.visibility_boost,
  featured_rotation_hours = EXCLUDED.featured_rotation_hours,
  homepage_spots = EXCLUDED.homepage_spots,
  priority_in_search = EXCLUDED.priority_in_search,
  hd_photos = EXCLUDED.hd_photos,
  video_allowed = EXCLUDED.video_allowed,
  photo_360_allowed = EXCLUDED.photo_360_allowed,
  max_photos_per_product = EXCLUDED.max_photos_per_product,
  badge_name = EXCLUDED.badge_name,
  verified_badge = EXCLUDED.verified_badge,
  support_level = EXCLUDED.support_level,
  advanced_analytics = EXCLUDED.advanced_analytics,
  ai_analytics = EXCLUDED.ai_analytics,
  sponsored_campaigns = EXCLUDED.sponsored_campaigns,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- Ajouter les colonnes d'abonnement à la table profiles si elles n'existent pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan_type DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_auto_renew boolean DEFAULT false;

-- Indexes pour la performance
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_seller_id ON seller_subscriptions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_status ON seller_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_expires_at ON seller_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_featured_products_rotation_times ON featured_products_rotation(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_featured_products_rotation_product ON featured_products_rotation(product_id);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_products_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Les plans sont visibles par tous
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Les vendeurs peuvent voir leur propre abonnement
CREATE POLICY "Sellers can view own subscription"
  ON seller_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Les vendeurs peuvent créer leur propre abonnement
CREATE POLICY "Sellers can create own subscription"
  ON seller_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Les vendeurs peuvent mettre à jour leur propre abonnement
CREATE POLICY "Sellers can update own subscription"
  ON seller_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Les rotations de produits sont visibles par tous
CREATE POLICY "Featured rotations are viewable by everyone"
  ON featured_products_rotation FOR SELECT
  TO authenticated, anon
  USING (true);

-- Les vendeurs peuvent voir leur historique
CREATE POLICY "Sellers can view own subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Fonction pour vérifier si un vendeur peut ajouter un produit
CREATE OR REPLACE FUNCTION can_add_product(seller_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_plan subscription_plan_type;
  product_count integer;
  max_allowed integer;
BEGIN
  -- Récupérer le plan actuel du vendeur
  SELECT subscription_plan INTO current_plan
  FROM profiles
  WHERE id = seller_uuid;

  -- Si pas de plan, considérer comme 'free'
  IF current_plan IS NULL THEN
    current_plan := 'free';
  END IF;

  -- Compter les produits actifs du vendeur
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE seller_id = seller_uuid AND is_active = true;

  -- Récupérer la limite du plan
  SELECT max_products INTO max_allowed
  FROM subscription_plans
  WHERE plan_type = current_plan;

  -- Retourner si le vendeur peut ajouter un produit
  RETURN product_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les avantages du plan d'un vendeur
CREATE OR REPLACE FUNCTION get_seller_plan_benefits(seller_uuid uuid)
RETURNS TABLE (
  plan_type subscription_plan_type,
  commission_rate numeric,
  max_products integer,
  current_products integer,
  visibility_boost integer,
  can_add_more_products boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.plan_type,
    sp.commission_rate,
    sp.max_products,
    (SELECT COUNT(*)::integer FROM products WHERE seller_id = seller_uuid AND is_active = true) as current_products,
    sp.visibility_boost,
    can_add_product(seller_uuid) as can_add_more_products
  FROM subscription_plans sp
  INNER JOIN profiles p ON p.subscription_plan = sp.plan_type
  WHERE p.id = seller_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le plan d'un vendeur
CREATE OR REPLACE FUNCTION upgrade_seller_plan(
  seller_uuid uuid,
  new_plan subscription_plan_type,
  payment_amount numeric,
  payment_transaction_id text
)
RETURNS void AS $$
DECLARE
  old_plan subscription_plan_type;
  plan_id_var uuid;
  expires_date timestamptz;
BEGIN
  -- Récupérer le plan actuel
  SELECT subscription_plan INTO old_plan
  FROM profiles
  WHERE id = seller_uuid;

  -- Récupérer l'ID du nouveau plan
  SELECT id INTO plan_id_var
  FROM subscription_plans
  WHERE plan_type = new_plan;

  -- Calculer la date d'expiration (30 jours)
  expires_date := now() + interval '30 days';

  -- Mettre à jour le profil
  UPDATE profiles
  SET
    subscription_plan = new_plan,
    subscription_expires_at = expires_date,
    subscription_auto_renew = true,
    updated_at = now()
  WHERE id = seller_uuid;

  -- Annuler les anciens abonnements actifs
  UPDATE seller_subscriptions
  SET
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  WHERE seller_id = seller_uuid AND status = 'active';

  -- Créer un nouvel abonnement
  INSERT INTO seller_subscriptions (
    seller_id, plan_id, plan_type, status,
    expires_at, amount_paid, transaction_id
  ) VALUES (
    seller_uuid, plan_id_var, new_plan, 'active',
    expires_date, payment_amount, payment_transaction_id
  );

  -- Enregistrer dans l'historique
  INSERT INTO subscription_history (
    seller_id, plan_type, action, old_plan_type, new_plan_type, amount_paid
  ) VALUES (
    seller_uuid, new_plan,
    CASE
      WHEN old_plan IS NULL OR old_plan = 'free' THEN 'activated'
      WHEN new_plan > old_plan THEN 'upgraded'
      ELSE 'downgraded'
    END,
    old_plan, new_plan, payment_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier le nombre de produits avant insertion
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_add_product(NEW.seller_id) THEN
    RAISE EXCEPTION 'Product limit reached for your subscription plan. Please upgrade to add more products.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_product_limit ON products;
CREATE TRIGGER enforce_product_limit
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_limit();

-- ============================================
-- MIGRATION: create_storage_buckets.sql
-- ============================================

/*
  # Configuration du stockage pour les images

  1. Buckets
    - `images` - Bucket pour toutes les images (produits, boutiques, profils)

  2. Politiques de sécurité
    - Lecture publique pour tous
    - Upload restreint aux utilisateurs authentifiés
    - Mise à jour/suppression selon le type de ressource

  3. Structure des dossiers:
    - images/products/{product_id}/{filename} - Images de produits
    - images/shops/{shop_id}/{filename} - Logos et bannières de boutiques
    - images/profiles/{user_id}/{filename} - Photos de profil
*/

-- Créer le bucket pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politique pour permettre à tous de lire les images (public)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader des images
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs images de profil
DROP POLICY IF EXISTS "Users can update their profile images" ON storage.objects;
CREATE POLICY "Users can update their profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre aux vendeurs de mettre à jour les images de leurs produits
DROP POLICY IF EXISTS "Sellers can update their product images" ON storage.objects;
CREATE POLICY "Sellers can update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
);

-- Politique pour permettre aux vendeurs de mettre à jour les images de leur boutique
DROP POLICY IF EXISTS "Sellers can update their shop images" ON storage.objects;
CREATE POLICY "Sellers can update their shop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
);

-- Politique pour permettre aux utilisateurs de supprimer leurs images de profil
DROP POLICY IF EXISTS "Users can delete their profile images" ON storage.objects;
CREATE POLICY "Users can delete their profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre aux vendeurs de supprimer les images de leurs produits
DROP POLICY IF EXISTS "Sellers can delete their product images" ON storage.objects;
CREATE POLICY "Sellers can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
);

-- Politique pour permettre aux vendeurs de supprimer les images de leur boutique
DROP POLICY IF EXISTS "Sellers can delete their shop images" ON storage.objects;
CREATE POLICY "Sellers can delete their shop images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
);

-- ============================================
-- MIGRATION: update_storage_policies.sql
-- ============================================

/*
  # Mise à jour des politiques de stockage pour les images

  1. Buckets
    - `images` - Bucket pour toutes les images (produits, boutiques, profils)

  2. Politiques de sécurité
    - Lecture publique pour tous
    - Upload restreint aux utilisateurs authentifiés
    - Mise à jour/suppression selon le type de ressource

  3. Structure des dossiers:
    - images/products/{product_id}/{filename} - Images de produits
    - images/shops/{shop_id}/{filename} - Logos et bannières de boutiques
    - images/profiles/{user_id}/{filename} - Photos de profil
*/

-- Créer le bucket pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politique pour permettre à tous de lire les images (public)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader des images
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs images de profil
DROP POLICY IF EXISTS "Users can update their profile images" ON storage.objects;
CREATE POLICY "Users can update their profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre aux vendeurs de mettre à jour les images de leurs produits
DROP POLICY IF EXISTS "Sellers can update their product images" ON storage.objects;
CREATE POLICY "Sellers can update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id::text = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id::text = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
);

-- Politique pour permettre aux vendeurs de mettre à jour les images de leur boutique
DROP POLICY IF EXISTS "Sellers can update their shop images" ON storage.objects;
CREATE POLICY "Sellers can update their shop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
);

-- Politique pour permettre aux utilisateurs de supprimer leurs images de profil
DROP POLICY IF EXISTS "Users can delete their profile images" ON storage.objects;
CREATE POLICY "Users can delete their profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre aux vendeurs de supprimer les images de leurs produits
DROP POLICY IF EXISTS "Sellers can delete their product images" ON storage.objects;
CREATE POLICY "Sellers can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id::text = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
);

-- Politique pour permettre aux vendeurs de supprimer les images de leur boutique
DROP POLICY IF EXISTS "Sellers can delete their shop images" ON storage.objects;
CREATE POLICY "Sellers can delete their shop images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
);

-- ============================================
-- MIGRATION: create_reviews_system.sql
-- ============================================

-- Create reviews table for products
CREATE TABLE IF NOT EXISTS product_reviews (
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
CREATE TABLE IF NOT EXISTS seller_reviews (
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
CREATE TABLE IF NOT EXISTS review_helpful_votes (
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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_badge TEXT; -- 'bronze', 'silver', 'gold', 'platinum'

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON product_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_user ON seller_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating ON seller_reviews(rating DESC);

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
CREATE OR REPLACE FUNCTION update_product_rating()
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
CREATE OR REPLACE FUNCTION update_seller_rating()
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
CREATE OR REPLACE FUNCTION update_helpful_count()
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
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

DROP TRIGGER IF EXISTS trigger_update_seller_rating ON seller_reviews;
CREATE TRIGGER trigger_update_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();

DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_helpful_votes;
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

-- ============================================
-- MIGRATION: reset_and_create_reviews.sql
-- ============================================

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

-- ============================================
-- MIGRATION: create_flash_deals_system.sql
-- ============================================

/*
  # Système de Promos Flash & Deals du Jour

  Fonctionnalités:
  - Promotions à durée limitée avec compte à rebours
  - Deals du jour automatiques
  - Stock limité pour créer l'urgence
  - Historique des deals
  - Notifications aux utilisateurs
*/

-- Type ENUM pour le statut des promotions
CREATE TYPE deal_status AS ENUM ('scheduled', 'active', 'expired', 'cancelled');
CREATE TYPE deal_type AS ENUM ('flash_sale', 'daily_deal', 'weekend_special', 'seasonal');

-- Table des promotions flash
CREATE TABLE IF NOT EXISTS flash_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Produit concerné
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Type et statut
  deal_type deal_type DEFAULT 'flash_sale',
  status deal_status DEFAULT 'scheduled',

  -- Prix
  original_price numeric NOT NULL,
  deal_price numeric NOT NULL,
  discount_percentage integer GENERATED ALWAYS AS (
    ROUND(((original_price - deal_price) / original_price * 100)::numeric, 0)::integer
  ) STORED,

  -- Période
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,

  -- Stock limité pour créer l'urgence
  total_stock integer NOT NULL,
  claimed_count integer DEFAULT 0,
  remaining_stock integer GENERATED ALWAYS AS (total_stock - claimed_count) STORED,

  -- Visibilité et priorité
  is_featured boolean DEFAULT false,
  priority_order integer DEFAULT 0,

  -- Badge personnalisé
  badge_text text DEFAULT 'PROMO FLASH',
  badge_color text DEFAULT '#EF4444',

  -- Statistiques
  views_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT valid_price_range CHECK (deal_price > 0 AND deal_price < original_price),
  CONSTRAINT valid_date_range CHECK (ends_at > starts_at),
  CONSTRAINT valid_stock CHECK (total_stock > 0)
);

-- Table pour les utilisateurs qui ont claim un deal
CREATE TABLE IF NOT EXISTS deal_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES flash_deals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,

  -- Prix réservé
  claimed_price numeric NOT NULL,
  quantity integer DEFAULT 1,

  -- Statut
  is_purchased boolean DEFAULT false,
  purchased_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,

  -- Expiration de la réservation (15 minutes)
  expires_at timestamptz DEFAULT (now() + interval '15 minutes'),

  created_at timestamptz DEFAULT now(),

  -- Un utilisateur ne peut claim qu'une fois par deal
  UNIQUE(deal_id, user_id)
);

-- Table pour notifier les utilisateurs intéressés
CREATE TABLE IF NOT EXISTS deal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES flash_deals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Type de notification
  notification_type text CHECK (notification_type IN ('deal_starting', 'deal_ending', 'stock_low')),

  -- État
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz DEFAULT now(),

  UNIQUE(deal_id, user_id, notification_type)
);

-- Table historique des deals passés
CREATE TABLE IF NOT EXISTS deal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES flash_deals(id) ON DELETE SET NULL,
  product_id uuid,
  seller_id uuid,

  -- Résultats
  original_price numeric,
  deal_price numeric,
  total_stock integer,
  claimed_count integer,
  purchased_count integer,
  total_revenue numeric,

  -- Performance
  conversion_rate numeric, -- claimed_count / views_count
  sell_through_rate numeric, -- claimed_count / total_stock

  -- Période
  started_at timestamptz,
  ended_at timestamptz,
  duration_hours numeric,

  created_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_flash_deals_status ON flash_deals(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller ON flash_deals(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_flash_deals_product ON flash_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_featured ON flash_deals(is_featured, priority_order DESC);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON flash_deals(status, ends_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_deal_claims_user ON deal_claims(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_claims_deal ON deal_claims(deal_id, is_purchased);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_user ON deal_notifications(user_id, is_read, created_at DESC);

-- RLS Policies
ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_history ENABLE ROW LEVEL SECURITY;

-- Flash deals : Visibles par tous (actifs), créés/modifiés par vendeurs
CREATE POLICY "Everyone can view active deals"
  ON flash_deals FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Sellers can create own deals"
  ON flash_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own deals"
  ON flash_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own deals"
  ON flash_deals FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Deal claims : Visible par l'utilisateur et le vendeur
CREATE POLICY "Users can view own claims"
  ON deal_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims"
  ON deal_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims"
  ON deal_claims FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deal notifications : Visible uniquement par le destinataire
CREATE POLICY "Users can view own notifications"
  ON deal_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON deal_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deal history : Visible par tous pour transparence
CREATE POLICY "Everyone can view deal history"
  ON deal_history FOR SELECT
  USING (true);

-- Fonction pour obtenir les deals actifs avec détails produit
CREATE OR REPLACE FUNCTION get_active_deals()
RETURNS TABLE (
  deal_id uuid,
  product_id uuid,
  product_title text,
  product_image text,
  seller_id uuid,
  seller_name text,
  deal_type deal_type,
  original_price numeric,
  deal_price numeric,
  discount_percentage integer,
  starts_at timestamptz,
  ends_at timestamptz,
  time_remaining interval,
  total_stock integer,
  remaining_stock integer,
  is_featured boolean,
  badge_text text,
  badge_color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    p.id as product_id,
    p.title as product_title,
    p.image_url as product_image,
    d.seller_id,
    COALESCE(prof.shop_name, prof.full_name, 'Vendeur') as seller_name,
    d.deal_type,
    d.original_price,
    d.deal_price,
    d.discount_percentage,
    d.starts_at,
    d.ends_at,
    (d.ends_at - now()) as time_remaining,
    d.total_stock,
    d.remaining_stock,
    d.is_featured,
    d.badge_text,
    d.badge_color
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  JOIN profiles prof ON prof.id = d.seller_id
  WHERE d.status = 'active'
    AND d.starts_at <= now()
    AND d.ends_at > now()
    AND d.remaining_stock > 0
  ORDER BY d.is_featured DESC, d.priority_order DESC, d.remaining_stock ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour claim un deal
CREATE OR REPLACE FUNCTION claim_flash_deal(
  p_deal_id uuid,
  p_user_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS uuid AS $$
DECLARE
  v_claim_id uuid;
  v_deal flash_deals%ROWTYPE;
  v_product_id uuid;
  v_claimed_price numeric;
BEGIN
  -- Récupérer les infos du deal
  SELECT * INTO v_deal
  FROM flash_deals
  WHERE id = p_deal_id
  FOR UPDATE; -- Lock pour éviter race condition

  -- Vérifications
  IF v_deal.id IS NULL THEN
    RAISE EXCEPTION 'Deal non trouvé';
  END IF;

  IF v_deal.status != 'active' THEN
    RAISE EXCEPTION 'Ce deal n''est plus actif';
  END IF;

  IF v_deal.starts_at > now() THEN
    RAISE EXCEPTION 'Ce deal n''a pas encore commencé';
  END IF;

  IF v_deal.ends_at <= now() THEN
    RAISE EXCEPTION 'Ce deal est terminé';
  END IF;

  IF v_deal.remaining_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuffisant (reste: %)', v_deal.remaining_stock;
  END IF;

  -- Vérifier si l'utilisateur a déjà claim
  IF EXISTS (
    SELECT 1 FROM deal_claims
    WHERE deal_id = p_deal_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà réservé ce deal';
  END IF;

  -- Créer le claim
  INSERT INTO deal_claims (
    deal_id,
    user_id,
    product_id,
    claimed_price,
    quantity
  ) VALUES (
    p_deal_id,
    p_user_id,
    v_deal.product_id,
    v_deal.deal_price,
    p_quantity
  )
  RETURNING id INTO v_claim_id;

  -- Incrémenter le compteur
  UPDATE flash_deals
  SET claimed_count = claimed_count + p_quantity
  WHERE id = p_deal_id;

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les statuts des deals (à appeler périodiquement)
CREATE OR REPLACE FUNCTION update_deal_statuses()
RETURNS void AS $$
BEGIN
  -- Activer les deals qui commencent
  UPDATE flash_deals
  SET status = 'active', updated_at = now()
  WHERE status = 'scheduled'
    AND starts_at <= now();

  -- Expirer les deals terminés
  UPDATE flash_deals
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND (ends_at <= now() OR remaining_stock <= 0);

  -- Nettoyer les réservations expirées
  DELETE FROM deal_claims
  WHERE is_purchased = false
    AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour archiver un deal dans l'historique
CREATE OR REPLACE FUNCTION archive_expired_deal(p_deal_id uuid)
RETURNS void AS $$
DECLARE
  v_deal flash_deals%ROWTYPE;
  v_purchased_count integer;
  v_total_revenue numeric;
BEGIN
  SELECT * INTO v_deal FROM flash_deals WHERE id = p_deal_id;

  IF v_deal.id IS NULL THEN
    RETURN;
  END IF;

  -- Compter les achats réels
  SELECT
    COUNT(*),
    SUM(claimed_price * quantity)
  INTO v_purchased_count, v_total_revenue
  FROM deal_claims
  WHERE deal_id = p_deal_id AND is_purchased = true;

  -- Insérer dans l'historique
  INSERT INTO deal_history (
    deal_id,
    product_id,
    seller_id,
    original_price,
    deal_price,
    total_stock,
    claimed_count,
    purchased_count,
    total_revenue,
    conversion_rate,
    sell_through_rate,
    started_at,
    ended_at,
    duration_hours
  ) VALUES (
    v_deal.id,
    v_deal.product_id,
    v_deal.seller_id,
    v_deal.original_price,
    v_deal.deal_price,
    v_deal.total_stock,
    v_deal.claimed_count,
    v_purchased_count,
    COALESCE(v_total_revenue, 0),
    CASE WHEN v_deal.views_count > 0
      THEN ROUND((v_deal.claimed_count::numeric / v_deal.views_count::numeric * 100), 2)
      ELSE 0
    END,
    ROUND((v_deal.claimed_count::numeric / v_deal.total_stock::numeric * 100), 2),
    v_deal.starts_at,
    v_deal.ends_at,
    EXTRACT(EPOCH FROM (v_deal.ends_at - v_deal.starts_at)) / 3600
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les deals d'un vendeur
CREATE OR REPLACE FUNCTION get_seller_deals(p_seller_id uuid)
RETURNS TABLE (
  deal_id uuid,
  product_title text,
  status deal_status,
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
    d.status,
    d.deal_price,
    d.discount_percentage,
    d.starts_at,
    d.ends_at,
    d.total_stock,
    d.remaining_stock,
    d.claimed_count
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  WHERE d.seller_id = p_seller_id
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nettoyer automatiquement les réservations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_claims()
RETURNS trigger AS $$
BEGIN
  DELETE FROM deal_claims
  WHERE is_purchased = false
    AND expires_at <= now();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_claims
  AFTER INSERT OR UPDATE ON deal_claims
  EXECUTE FUNCTION cleanup_expired_claims();

-- Insertion de deals de démonstration (optionnel, à supprimer en production)
/*
INSERT INTO flash_deals (
  product_id,
  seller_id,
  deal_type,
  status,
  original_price,
  deal_price,
  starts_at,
  ends_at,
  total_stock,
  is_featured,
  badge_text,
  badge_color
)
SELECT
  id as product_id,
  seller_id,
  'flash_sale',
  'active',
  price,
  ROUND(price * 0.7), -- 30% de réduction
  now(),
  now() + interval '24 hours',
  GREATEST(stock / 2, 10), -- La moitié du stock ou 10 minimum
  true,
  'PROMO FLASH -30%',
  '#EF4444'
FROM products
WHERE is_active = true
  AND stock > 10
LIMIT 5;
*/

-- ============================================
-- MIGRATION: fix_flash_deals_seller_id.sql
-- ============================================

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

-- ============================================
-- MIGRATION: fix_flash_deals_deal_type.sql
-- ============================================

-- Migration pour corriger la colonne deal_type manquante dans flash_deals

-- Vérifier si le type deal_type existe, sinon le créer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_type') THEN
    CREATE TYPE deal_type AS ENUM ('flash_sale', 'daily_deal', 'weekend_special', 'seasonal');
  END IF;
END $$;

-- Vérifier si la colonne deal_type existe dans flash_deals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'flash_deals'
    AND column_name = 'deal_type'
  ) THEN
    -- Ajouter la colonne si elle n'existe pas
    ALTER TABLE flash_deals
    ADD COLUMN deal_type deal_type DEFAULT 'flash_sale';
  END IF;
END $$;

-- Mettre à jour les valeurs NULL si nécessaire
UPDATE flash_deals
SET deal_type = 'flash_sale'
WHERE deal_type IS NULL;

-- ============================================
-- MIGRATION: create_followers_system.sql
-- ============================================

-- Create followers table for seller/user following system
CREATE TABLE IF NOT EXISTS followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),

  -- Prevent duplicate follows
  UNIQUE(follower_id, following_id),

  -- Prevent self-following
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view follower relationships
CREATE POLICY "Anyone can view followers"
  ON followers
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only follow/unfollow themselves
CREATE POLICY "Users can manage their own follows"
  ON followers
  FOR ALL
  TO authenticated
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

-- Add follower counts to profiles (optional - for displaying follower stats)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the person being followed
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;

    -- Increment following count for the person who followed
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for the person being unfollowed
    UPDATE profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;

    -- Decrement following count for the person who unfollowed
    UPDATE profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update follower counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- Initialize follower counts for existing profiles
UPDATE profiles
SET
  followers_count = (
    SELECT COUNT(*)
    FROM followers
    WHERE followers.following_id = profiles.id
  ),
  following_count = (
    SELECT COUNT(*)
    FROM followers
    WHERE followers.follower_id = profiles.id
  );

-- Grant permissions
GRANT ALL ON followers TO authenticated;

COMMENT ON TABLE followers IS 'Manages follower/following relationships between users';

-- ============================================
-- MIGRATION: 20251117000000_add_seller_id_to_products.sql
-- ============================================

-- ================================================
-- ÉTAPE 1 : AJOUTER seller_id À products
-- ================================================
-- Cette migration doit s'exécuter AVANT 20251117000001_create_orders_system.sql

-- Vérifier et ajouter la colonne seller_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'seller_id'
  ) THEN
    -- Ajouter la colonne seller_id
    ALTER TABLE products
    ADD COLUMN seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

    RAISE NOTICE 'Colonne seller_id ajoutée avec succès à la table products';
  ELSE
    RAISE NOTICE 'La colonne seller_id existe déjà dans la table products';
  END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.seller_id IS 'Référence au vendeur (profile) qui a créé ce produit';

-- ============================================
-- MIGRATION: 20251117000001_create_orders_system.sql
-- ============================================

-- ================================================
-- ÉTAPE 2 : SYSTÈME DE COMMANDES
-- ================================================
-- Cette migration doit s'exécuter APRÈS 20251117000000_add_seller_id_to_products.sql
-- Elle suppose que seller_id existe déjà dans la table products

-- ================================================
-- TABLES
-- ================================================

-- Table: orders (Commandes)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Montant et devise
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) DEFAULT 'XOF',

  -- Statut de la commande
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),

  -- Informations de livraison
  shipping_name VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50),
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),

  -- Notes et informations supplémentaires
  order_notes TEXT,
  tracking_number VARCHAR(100),

  -- Informations de paiement
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Points utilisés pour cette commande
  points_used INTEGER DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,

  -- Dates importantes
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: order_items (Articles de commande)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Informations du produit au moment de la commande (snapshot)
  product_title VARCHAR(255) NOT NULL,
  product_image_url TEXT,

  -- Prix et quantité
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),

  -- Commission du vendeur
  seller_commission DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEX POUR PERFORMANCES
-- ================================================

-- Index pour cart_items (si non existants)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Index pour orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Index pour order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger pour cart_items (si non existant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_cart_items_updated_at'
  ) THEN
    CREATE TRIGGER update_cart_items_updated_at
      BEFORE UPDATE ON cart_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger pour orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour order_items
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
CREATE POLICY "Users can view order items of their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sellers can view their order items" ON order_items;
CREATE POLICY "Sellers can view their order items"
  ON order_items FOR SELECT
  USING (seller_id = auth.uid());

-- ================================================
-- FONCTIONS UTILITAIRES
-- ================================================

-- Fonction pour obtenir le total du panier
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  total_amount DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_items,
    COALESCE(SUM(ci.quantity * p.price), 0)::DECIMAL(10, 2) as total_amount
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = p_user_id AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vider le panier après une commande
CREATE OR REPLACE FUNCTION clear_cart(p_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM cart_items WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une commande à partir du panier
CREATE OR REPLACE FUNCTION create_order_from_cart(
  p_user_id UUID,
  p_shipping_name VARCHAR(255),
  p_shipping_phone VARCHAR(50),
  p_shipping_address TEXT,
  p_shipping_city VARCHAR(100),
  p_shipping_postal_code VARCHAR(20),
  p_shipping_country VARCHAR(100),
  p_order_notes TEXT DEFAULT NULL,
  p_payment_method VARCHAR(50) DEFAULT 'cash_on_delivery'
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_total_amount DECIMAL(10, 2);
  v_cart_item RECORD;
BEGIN
  -- Vérifier que le panier n'est pas vide
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Calculer le montant total
  SELECT COALESCE(SUM(ci.quantity * p.price), 0)
  INTO v_total_amount
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = p_user_id AND p.is_active = true;

  -- Créer la commande
  INSERT INTO orders (
    user_id,
    total_amount,
    currency,
    status,
    shipping_name,
    shipping_phone,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    shipping_country,
    order_notes,
    payment_method,
    payment_status
  ) VALUES (
    p_user_id,
    v_total_amount,
    'XOF',
    'pending',
    p_shipping_name,
    p_shipping_phone,
    p_shipping_address,
    p_shipping_city,
    p_shipping_postal_code,
    p_shipping_country,
    p_order_notes,
    p_payment_method,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Créer les order_items à partir du panier
  FOR v_cart_item IN
    SELECT
      ci.*,
      p.title,
      p.image_url,
      p.price,
      p.seller_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = p_user_id AND p.is_active = true
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      seller_id,
      product_title,
      product_image_url,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.seller_id,
      v_cart_item.title,
      v_cart_item.image_url,
      v_cart_item.quantity,
      v_cart_item.price,
      v_cart_item.quantity * v_cart_item.price
    );

    -- Décrémenter le stock du produit
    UPDATE products
    SET stock = stock - v_cart_item.quantity
    WHERE id = v_cart_item.product_id;
  END LOOP;

  -- Vider le panier
  PERFORM clear_cart(p_user_id);

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- COMMENTAIRES
-- ================================================

COMMENT ON TABLE orders IS 'Commandes des utilisateurs';
COMMENT ON TABLE order_items IS 'Articles individuels dans chaque commande';
COMMENT ON FUNCTION get_cart_total IS 'Obtenir le nombre d''articles et le montant total du panier';
COMMENT ON FUNCTION clear_cart IS 'Vider le panier d''un utilisateur';
COMMENT ON FUNCTION create_order_from_cart IS 'Créer une commande à partir du contenu du panier';

-- ============================================
-- FIN DES MIGRATIONS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 TOUTES LES 52 MIGRATIONS ONT ÉTÉ EXÉCUTÉES !';
  RAISE NOTICE 'Note: create_complete_bonus_system.sql a été exclu (fichier corrompu)';
  RAISE NOTICE 'Vérifiez les logs ci-dessus pour les erreurs éventuelles';
  RAISE NOTICE 'Les messages "already exists" sont normaux';
END $$;

-- Afficher un résumé final
SELECT
  '✅ Migrations terminées' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as nombre_tables,
  (SELECT COUNT(*) FROM storage.buckets) as nombre_buckets,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as nombre_fonctions,
  NOW() as completed_at;

-- Afficher la liste des tables créées
SELECT
  '📋 Tables créées:' as info,
  string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Afficher les buckets de stockage
SELECT
  '📦 Buckets créés:' as info,
  string_agg(name || ' (' || CASE WHEN public THEN 'public' ELSE 'privé' END || ')', ', ' ORDER BY name) as buckets
FROM storage.buckets;

