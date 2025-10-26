-- ========================================
-- SETUP COMPLET SENEPANDA - VERSION FINALE
-- ========================================

-- ========================================
-- PARTIE 1: NETTOYAGE COMPLET
-- ========================================

-- Supprimer les triggers et fonctions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;

-- Supprimer toutes les tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS flash_deals CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS claimed_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ========================================
-- PARTIE 2: CRÉATION DES TABLES
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Catégories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profils
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  country TEXT,
  bio TEXT,
  is_seller BOOLEAN DEFAULT false,
  shop_name TEXT,
  shop_description TEXT,
  shop_logo_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  successful_referrals INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produits
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  condition TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commandes
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  delivery_address TEXT,
  delivery_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items de commande
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panier d'achat
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Favoris
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Avis
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points de fidélité
CREATE TABLE loyalty_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions de points
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Récompenses
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10,2),
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  min_level TEXT DEFAULT 'bronze',
  stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Récompenses réclamées
CREATE TABLE claimed_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  points_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parrainages
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash deals
CREATE TABLE flash_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER,
  stock_limit INTEGER,
  stock_sold INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PARTIE 3: INDEX
-- ========================================

CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_loyalty_points_level ON loyalty_points(level);
CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_rewards_is_active ON rewards(is_active);
CREATE INDEX idx_claimed_rewards_user_id ON claimed_rewards(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_flash_deals_is_active ON flash_deals(is_active);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ========================================
-- PARTIE 4: STORAGE
-- ========================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', true),
  ('profiles', 'profiles', true),
  ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PARTIE 5: FONCTIONS (VERSION SÉCURISÉE)
-- ========================================

-- Fonction génération code parrainage
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  max_attempts INTEGER := 10;
  attempt_count INTEGER := 0;
BEGIN
  LOOP
    -- Générer un code aléatoire
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Vérifier si le code existe déjà
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE referral_code = new_code
    ) INTO code_exists;

    -- Sortir si le code est unique
    EXIT WHEN NOT code_exists;

    -- Sécurité: éviter boucle infinie
    attempt_count := attempt_count + 1;
    EXIT WHEN attempt_count >= max_attempts;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Fonction création profil automatique (VERSION CORRIGÉE)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Générer le code de parrainage
  new_referral_code := generate_referral_code();

  -- Insérer le profil (ne rien faire si existe déjà)
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    referral_code
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email, NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    new_referral_code
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insérer les points de fidélité (ne rien faire si existe déjà)
  INSERT INTO public.loyalty_points (
    user_id,
    points,
    total_earned,
    level
  )
  VALUES (
    NEW.id,
    0,
    0,
    'bronze'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, logger mais ne pas bloquer la création de l'utilisateur
    RAISE WARNING 'Erreur dans handle_new_user pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ========================================
-- PARTIE 6: DONNÉES INITIALES
-- ========================================

-- Catégories
INSERT INTO categories (name, description, emoji, is_active) VALUES
  ('Mode & Vêtements', 'Vêtements, chaussures et accessoires', '👗', true),
  ('Électronique', 'Téléphones, ordinateurs et gadgets', '📱', true),
  ('Maison & Jardin', 'Meubles, décoration et électroménager', '🏠', true),
  ('Sport & Loisirs', 'Articles de sport et loisirs', '⚽', true),
  ('Beauté & Santé', 'Cosmétiques, parfums et soins', '💄', true),
  ('Alimentation', 'Produits alimentaires et boissons', '🍔', true),
  ('Enfants & Bébés', 'Jouets, vêtements et accessoires enfants', '👶', true),
  ('Livres & Culture', 'Livres, musique et films', '📚', true),
  ('Auto & Moto', 'Pièces et accessoires automobiles', '🚗', true),
  ('Services', 'Services professionnels', '🛠️', true);

-- Récompenses
INSERT INTO rewards (title, description, reward_type, reward_value, points_cost, min_level, is_active) VALUES
  ('Réduction 5%', 'Bon de réduction de 5% sur votre prochaine commande', 'discount', 5, 50, 'bronze', true),
  ('Réduction 10%', 'Bon de réduction de 10% sur votre prochaine commande', 'discount', 10, 100, 'bronze', true),
  ('Réduction 15%', 'Bon de réduction de 15% sur votre prochaine commande', 'discount', 15, 150, 'silver', true),
  ('Bon 500 XOF', 'Bon de 500 XOF à utiliser sur votre prochaine commande', 'voucher', 500, 50, 'bronze', true),
  ('Bon 1000 XOF', 'Bon de 1000 XOF à utiliser sur votre prochaine commande', 'voucher', 1000, 100, 'bronze', true),
  ('Bon 2500 XOF', 'Bon de 2500 XOF à utiliser sur votre prochaine commande', 'voucher', 2500, 200, 'silver', true),
  ('Livraison Gratuite', 'Une livraison gratuite sur votre prochaine commande', 'free_shipping', NULL, 75, 'bronze', true);

-- ========================================
-- SUCCÈS!
-- ========================================

SELECT '🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!' as message;
SELECT '📊 Nombre total de tables: ' || count(*)::text as info FROM information_schema.tables WHERE table_schema = 'public';
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
