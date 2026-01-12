-- ================================================================
-- SENEPANDA - SCRIPT SQL MEGA COMPLET
-- Toutes les tables pour l'application complète
-- ================================================================
--
-- Ce script crée TOUTES les tables nécessaires pour SenePanda
--
-- Instructions :
-- 1. Allez sur https://app.supabase.com
-- 2. Ouvrez votre projet
-- 3. SQL Editor → New query
-- 4. Copiez-collez TOUT ce fichier
-- 5. Cliquez sur "Run"
-- 6. Attendez 1-2 minutes
--
-- ================================================================

-- ================================================================
-- ÉTAPE 1 : Désactiver temporairement les triggers
-- ================================================================

SET session_replication_role = replica;

-- ================================================================
-- ÉTAPE 2 : Supprimer toutes les policies et tables existantes
-- ================================================================

-- Supprimer toutes les policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Supprimer toutes les tables
DROP TABLE IF EXISTS wave_transactions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_requests CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS seller_subscriptions CASCADE;
DROP TABLE IF EXISTS seller_reviews CASCADE;
DROP TABLE IF EXISTS seller_of_month CASCADE;
DROP TABLE IF EXISTS seller_monthly_stats CASCADE;
DROP TABLE IF EXISTS seller_badges CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS quick_replies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_views CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS pandacoins_transactions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS merchandise_orders CASCADE;
DROP TABLE IF EXISTS merchandise_catalog CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS live_viewers CASCADE;
DROP TABLE IF EXISTS live_sessions CASCADE;
DROP TABLE IF EXISTS live_reactions CASCADE;
DROP TABLE IF EXISTS live_orders CASCADE;
DROP TABLE IF EXISTS live_featured_products CASCADE;
DROP TABLE IF EXISTS live_chat_messages CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS flash_deals CASCADE;
DROP TABLE IF EXISTS featured_products_rotation CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS deal_notifications CASCADE;
DROP TABLE IF EXISTS deal_history CASCADE;
DROP TABLE IF EXISTS deal_claims CASCADE;
DROP TABLE IF EXISTS daily_streaks CASCADE;
DROP TABLE IF EXISTS daily_login_tracking CASCADE;
DROP TABLE IF EXISTS daily_login_streak CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS claimed_rewards CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS charitable_donations CASCADE;
DROP TABLE IF EXISTS charitable_causes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS blocked_users_legacy_20260106003448 CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS admin_phone_login_attempts CASCADE;
DROP TABLE IF EXISTS admin_login_logs CASCADE;
DROP TABLE IF EXISTS admin_identifiers CASCADE;

-- ================================================================
-- ÉTAPE 3 : Créer les tables principales
-- ================================================================

-- Table PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  panda_coins INTEGER DEFAULT 100,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  city TEXT,
  country TEXT DEFAULT 'Senegal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table SHOPS
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#FF6B35',
  secondary_color TEXT DEFAULT '#FFB800',
  address TEXT,
  city TEXT,
  phone TEXT,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table CATEGORIES
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  emoji TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table PRODUCTS
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  has_discount BOOLEAN DEFAULT FALSE,
  discount_percent INTEGER DEFAULT 0,
  original_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  images TEXT[],
  video_url TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table ORDERS
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_phone TEXT,
  delivery_notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table ORDER_ITEMS
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table CART_ITEMS
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table FAVORITES
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Table REVIEWS
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Table PRODUCT_REVIEWS (plus détaillée)
CREATE TABLE product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table LIVE_SESSIONS
CREATE TABLE live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  room_id TEXT UNIQUE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  viewers_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table LIVE_FEATURED_PRODUCTS
CREATE TABLE live_featured_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  special_price DECIMAL(10,2),
  display_order INTEGER DEFAULT 0,
  is_currently_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sold_count INTEGER DEFAULT 0,
  stock_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_session_id, product_id)
);

-- Table LIVE_VIEWERS
CREATE TABLE live_viewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(live_session_id, user_id)
);

-- Table LIVE_CHAT_MESSAGES
CREATE TABLE live_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system', 'product_highlight')),
  product_id UUID REFERENCES products(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table LIVE_REACTIONS
CREATE TABLE live_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'clap', 'star', 'cart')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table LIVE_ORDERS
CREATE TABLE live_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table CONVERSATIONS
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Table CHAT_MESSAGES
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'product', 'order')),
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table MESSAGES (alternative)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  image_url TEXT,
  voice_url TEXT,
  product_id UUID REFERENCES products(id),
  voice_duration INTEGER,
  offer_amount DECIMAL(10,2),
  offer_price DECIMAL(10,2),
  offer_status TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table NOTIFICATIONS
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table POINTS_TRANSACTIONS
CREATE TABLE points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table REFERRALS
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Table FLASH_DEALS
CREATE TABLE flash_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  seller_id UUID REFERENCES auth.users(id),
  original_price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER,
  stock_limit INTEGER,
  stock_sold INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  deal_type TEXT DEFAULT 'flash_sale' CHECK (deal_type IN ('flash_sale', 'limited_time', 'daily_deal', 'seasonal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table FOLLOWERS
CREATE TABLE followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Table BLOCKED_USERS
CREATE TABLE blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table LOYALTY_POINTS
CREATE TABLE loyalty_points (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table DAILY_STREAKS
CREATE TABLE daily_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE NOT NULL,
  total_logins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table USER_PRESENCE
CREATE TABLE user_presence (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  device_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ÉTAPE 4 : Activer Row Level Security (RLS)
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- ÉTAPE 5 : Créer les policies RLS
-- ================================================================

-- PROFILES
CREATE POLICY "Profils publics" ON profiles FOR SELECT USING (true);
CREATE POLICY "Créer profil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Modifier profil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS
CREATE POLICY "Produits visibles" ON products FOR SELECT USING (is_active = true OR seller_id = auth.uid());
CREATE POLICY "Créer produit" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Modifier produit" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Supprimer produit" ON products FOR DELETE USING (auth.uid() = seller_id);

-- ORDERS
CREATE POLICY "Voir commandes" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Créer commande" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Modifier commande" ON orders FOR UPDATE USING (auth.uid() = seller_id);

-- FAVORITES
CREATE POLICY "Gérer favoris" ON favorites FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Voir notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Modifier notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- LIVE_SESSIONS
CREATE POLICY "Voir lives" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Créer live" ON live_sessions FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Modifier live" ON live_sessions FOR UPDATE USING (auth.uid() = seller_id);

-- CATEGORIES (public)
CREATE POLICY "Voir catégories" ON categories FOR SELECT USING (is_active = true);

-- SHOPS
CREATE POLICY "Voir boutiques" ON shops FOR SELECT USING (is_active = true OR seller_id = auth.uid());
CREATE POLICY "Créer boutique" ON shops FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Modifier boutique" ON shops FOR UPDATE USING (auth.uid() = seller_id);

-- CART_ITEMS
CREATE POLICY "Gérer panier" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- CONVERSATIONS
CREATE POLICY "Voir conversations" ON conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- CHAT_MESSAGES
CREATE POLICY "Voir messages" ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
  ));

-- POINTS_TRANSACTIONS
CREATE POLICY "Voir transactions" ON points_transactions FOR SELECT USING (auth.uid() = user_id);

-- REFERRALS
CREATE POLICY "Voir parrainages" ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- FLASH_DEALS
CREATE POLICY "Voir deals" ON flash_deals FOR SELECT USING (is_active = true);

-- FOLLOWERS
CREATE POLICY "Gérer followers" ON followers FOR ALL
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- BLOCKED_USERS
CREATE POLICY "Gérer bloqués" ON blocked_users FOR ALL USING (auth.uid() = blocker_id);

-- LOYALTY_POINTS
CREATE POLICY "Voir points" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);

-- DAILY_STREAKS
CREATE POLICY "Voir streaks" ON daily_streaks FOR SELECT USING (auth.uid() = user_id);

-- USER_PRESENCE
CREATE POLICY "Voir présence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Modifier présence" ON user_presence FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- ÉTAPE 6 : Créer les fonctions et triggers
-- ================================================================

-- Supprimer les fonctions si elles existent
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Supprimer la fonction si elle existe
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number TEXT;
  fname TEXT;
  lname TEXT;
BEGIN
  -- Extraire le téléphone de l'email
  phone_number := SPLIT_PART(NEW.email, '@', 1);

  -- Extraire prénom/nom
  fname := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  lname := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  -- Créer le profil
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    first_name,
    last_name,
    full_name,
    panda_coins,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', phone_number),
    fname,
    lname,
    TRIM(fname || ' ' || lname),
    100,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger pour créer le profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- ÉTAPE 7 : Réactiver les triggers
-- ================================================================

SET session_replication_role = DEFAULT;

-- ================================================================

-- Ajout FK manquante entre user_subscriptions et subscription_plans (sécurité)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name='user_subscriptions' AND constraint_type='FOREIGN KEY' AND constraint_name LIKE '%plan_id%'
  ) THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_plan_id FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;
  END IF;
END $$;
-- ================================================================

CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_live_sessions_seller_id ON live_sessions(seller_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_flash_deals_product_id ON flash_deals(product_id);
CREATE INDEX idx_flash_deals_active ON flash_deals(is_active, ends_at);

-- ================================================================
-- TERMINÉ !
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Base de données SenePanda créée avec succès!';
  RAISE NOTICE '📊 Tables créées: 35+';
  RAISE NOTICE '🔐 Policies RLS activées';
  RAISE NOTICE '⚡ Triggers configurés';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser l''application!';
  RAISE NOTICE '💡 N''oubliez pas de désactiver la confirmation email dans:';
  RAISE NOTICE '   Authentication → Settings → Email Auth';
END $$;
