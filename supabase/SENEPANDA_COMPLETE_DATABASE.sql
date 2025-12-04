-- ============================================
-- SENEPANDA - SCRIPT SQL COMPLET ET DÉFINITIF
-- Date: 2025-11-30
-- Description: Script unique pour configurer TOUTE la base de données
-- Instructions: Copiez et exécutez ce fichier ENTIER dans Supabase SQL Editor
-- ============================================

-- ============================================
-- ÉTAPE 0: NETTOYAGE COMPLET
-- ============================================

-- Supprimer TOUS les triggers sur auth.users
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_rec.tgname);
    RAISE NOTICE 'Trigger supprimé: %', trigger_rec.tgname;
  END LOOP;
END $$;

-- Supprimer toutes les fonctions de création de profil
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;

-- ============================================
-- ÉTAPE 1: CRÉER/VÉRIFIER TABLE PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction utilitaire pour ajouter une colonne dynamiquement
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT,
  p_default TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column
  ) THEN
    IF p_default IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s DEFAULT %s', p_table, p_column, p_type, p_default);
    ELSE
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_type);
    END IF;
    RAISE NOTICE 'Colonne ajoutée: %.%', p_table, p_column;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ajouter toutes les colonnes de profiles
DO $$
BEGIN
  PERFORM add_column_if_not_exists('profiles', 'email', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'username', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'first_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'last_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'full_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'phone', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'avatar_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'bio', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'city', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'country', 'TEXT', '''Senegal''');
  PERFORM add_column_if_not_exists('profiles', 'address', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'is_seller', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('profiles', 'is_verified', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('profiles', 'is_premium', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('profiles', 'shop_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_description', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_logo_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_banner_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_category', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'business_hours', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'return_policy', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shipping_info', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'average_rating', 'DECIMAL(3,2)', '0');
  PERFORM add_column_if_not_exists('profiles', 'total_reviews', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'total_sales', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'followers_count', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'following_count', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'referral_code', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'referred_by', 'UUID');
  PERFORM add_column_if_not_exists('profiles', 'total_referrals', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'panda_coins', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'subscription_plan', 'TEXT', '''free''');
  PERFORM add_column_if_not_exists('profiles', 'subscription_expires_at', 'TIMESTAMP WITH TIME ZONE');
  PERFORM add_column_if_not_exists('profiles', 'created_at', 'TIMESTAMP WITH TIME ZONE', 'NOW()');
  PERFORM add_column_if_not_exists('profiles', 'updated_at', 'TIMESTAMP WITH TIME ZONE', 'NOW()');
END $$;

-- Contraintes sur profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key' AND conrelid = 'profiles'::regclass) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referral_code_key' AND conrelid = 'profiles'::regclass) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referred_by_fkey' AND conrelid = 'profiles'::regclass) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES profiles(id);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- ============================================
-- ÉTAPE 2: TABLES SYSTÈME D'ABONNEMENT
-- ============================================

-- Table subscription_plans
DROP TABLE IF EXISTS subscription_plans CASCADE;
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  max_products INTEGER NOT NULL DEFAULT 10,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  visibility_boost INTEGER NOT NULL DEFAULT 0,
  hd_photos BOOLEAN NOT NULL DEFAULT false,
  video_allowed BOOLEAN NOT NULL DEFAULT false,
  badge_name TEXT,
  support_level TEXT NOT NULL DEFAULT 'standard',
  advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  ai_analytics BOOLEAN NOT NULL DEFAULT false,
  sponsored_campaigns BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour subscription_plans
CREATE INDEX idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_order ON subscription_plans(display_order);

-- RLS pour subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active plans" ON subscription_plans;
CREATE POLICY "Public can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- Table subscription_history
DROP TABLE IF EXISTS subscription_history CASCADE;
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  billing_period TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour subscription_history
CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_status ON subscription_history(status);

-- RLS pour subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
CREATE POLICY "Users can view own subscription history" ON subscription_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own subscription history" ON subscription_history;
CREATE POLICY "Users can insert own subscription history" ON subscription_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 3: INSÉRER LES PLANS D'ABONNEMENT
-- ============================================

INSERT INTO subscription_plans (
  plan_type,
  name,
  description,
  price_monthly,
  price_yearly,
  currency,
  max_products,
  commission_rate,
  visibility_boost,
  hd_photos,
  video_allowed,
  badge_name,
  support_level,
  advanced_analytics,
  ai_analytics,
  sponsored_campaigns,
  display_order,
  is_active
) VALUES
  -- Plan Gratuit
  (
    'free',
    'Gratuit',
    'Pour débuter votre activité',
    0,
    0,
    'XOF',
    10,
    15.00,
    0,
    false,
    false,
    null,
    'standard',
    false,
    false,
    false,
    1,
    true
  ),
  -- Plan Starter (2500 F CFA/mois)
  (
    'starter',
    'Starter',
    'Pour les vendeurs actifs',
    2500,
    25000,
    'XOF',
    50,
    12.00,
    20,
    true,
    false,
    'Starter',
    'priority',
    true,
    false,
    false,
    2,
    true
  ),
  -- Plan Pro (5000 F CFA/mois)
  (
    'pro',
    'Pro',
    'Pour les professionnels',
    5000,
    50000,
    'XOF',
    200,
    10.00,
    50,
    true,
    true,
    'Pro Seller',
    'vip',
    true,
    true,
    true,
    3,
    true
  ),
  -- Plan Premium (10000 F CFA/mois)
  (
    'premium',
    'Premium',
    'Pour dominer le marché',
    10000,
    100000,
    'XOF',
    999999,
    7.00,
    100,
    true,
    true,
    'Premium Seller',
    'concierge',
    true,
    true,
    true,
    4,
    true
  )
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_products = EXCLUDED.max_products,
  commission_rate = EXCLUDED.commission_rate,
  visibility_boost = EXCLUDED.visibility_boost,
  hd_photos = EXCLUDED.hd_photos,
  video_allowed = EXCLUDED.video_allowed,
  badge_name = EXCLUDED.badge_name,
  support_level = EXCLUDED.support_level,
  advanced_analytics = EXCLUDED.advanced_analytics,
  ai_analytics = EXCLUDED.ai_analytics,
  sponsored_campaigns = EXCLUDED.sponsored_campaigns,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- ÉTAPE 4: AUTRES TABLES PRINCIPALES
-- ============================================

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    emoji TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency TEXT DEFAULT 'XOF',
    image_url TEXT,
    images TEXT[],
    video_url TEXT,
    stock INTEGER DEFAULT 0,
    condition TEXT DEFAULT 'new',
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_flash_deal BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des favoris
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Table des followers
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Table du panier
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_postal_code TEXT,
    shipping_country TEXT DEFAULT 'Senegal',
    shipping_phone TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    order_notes TEXT,
    notes TEXT,
    tracking_number TEXT,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    seller_id UUID REFERENCES auth.users(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    product_title TEXT,
    product_image_url TEXT,
    seller_commission DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    buyer_unread_count INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    image_url TEXT,
    voice_url TEXT,
    voice_duration INTEGER,
    product_id UUID REFERENCES products(id),
    offer_amount DECIMAL(10,2),
    offer_price DECIMAL(10,2),
    offer_status TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs bloqués
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Table des avis produits
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Table des avis vendeurs
CREATE TABLE IF NOT EXISTS seller_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seller_id, user_id, order_id)
);

-- Table des reviews (alias pour compatibility)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des points de fidélité
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    spent_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des transactions de points
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des récompenses
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_value DECIMAL(10,2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des récompenses réclamées
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

-- Table des flash deals
CREATE TABLE IF NOT EXISTS flash_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id),
    discount_percentage INTEGER NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    deal_price DECIMAL(10,2) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    stock_limit INTEGER,
    sold_count INTEGER DEFAULT 0,
    deal_type TEXT DEFAULT 'flash',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT DEFAULT 'general',
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 5: INDEX POUR PERFORMANCES
-- ============================================

-- Index products
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- Index favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);

-- Index cart_items
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_created ON cart_items(created_at DESC);

-- Index orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

-- Index order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);

-- Index conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);

-- Index messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Index product_reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- Index notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Index followers
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- ============================================
-- ÉTAPE 6: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers can insert products" ON products;
CREATE POLICY "Sellers can insert products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Sellers can update own products" ON products;
CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
CREATE POLICY "Sellers can delete own products" ON products FOR DELETE USING (auth.uid() = seller_id);

-- Policies pour categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Policies pour favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Policies pour followers
DROP POLICY IF EXISTS "Anyone can view followers" ON followers;
CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow" ON followers;
CREATE POLICY "Users can follow" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Users can unfollow" ON followers;
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Policies pour cart_items
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add to cart" ON cart_items;
CREATE POLICY "Users can add to cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update cart" ON cart_items;
CREATE POLICY "Users can update cart" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove from cart" ON cart_items;
CREATE POLICY "Users can remove from cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- Policies pour orders
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT USING (auth.uid() = user_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = seller_id);

-- Policies pour order_items
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  auth.uid() = seller_id OR
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);

-- Policies pour conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policies pour messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid()))
);
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Policies pour blocked_users
DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
CREATE POLICY "Users can view own blocks" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Users can block" ON blocked_users;
CREATE POLICY "Users can block" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;
CREATE POLICY "Users can unblock" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Policies pour product_reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON product_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON product_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
CREATE POLICY "Users can create reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour seller_reviews
DROP POLICY IF EXISTS "Seller reviews are viewable by everyone" ON seller_reviews;
CREATE POLICY "Seller reviews are viewable by everyone" ON seller_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create seller reviews" ON seller_reviews;
CREATE POLICY "Users can create seller reviews" ON seller_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour reviews
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON reviews;
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour loyalty_points
DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
CREATE POLICY "Users can view own points" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
CREATE POLICY "Users can update own points" ON loyalty_points FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert points" ON loyalty_points;
CREATE POLICY "System can insert points" ON loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour points_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
CREATE POLICY "Users can view own transactions" ON points_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert transactions" ON points_transactions;
CREATE POLICY "System can insert transactions" ON points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour rewards
DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON rewards;
CREATE POLICY "Rewards are viewable by everyone" ON rewards FOR SELECT USING (true);

-- Policies pour claimed_rewards
DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
CREATE POLICY "Users can view own claimed rewards" ON claimed_rewards FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
CREATE POLICY "Users can claim rewards" ON claimed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Policies pour flash_deals
DROP POLICY IF EXISTS "Flash deals are viewable by everyone" ON flash_deals;
CREATE POLICY "Flash deals are viewable by everyone" ON flash_deals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers can create flash deals" ON flash_deals;
CREATE POLICY "Sellers can create flash deals" ON flash_deals FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Sellers can update own flash deals" ON flash_deals;
CREATE POLICY "Sellers can update own flash deals" ON flash_deals FOR UPDATE USING (auth.uid() = seller_id);

-- Policies pour notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- ============================================
-- ÉTAPE 7: FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 8: VÉRIFICATION ET AFFICHAGE
-- ============================================

DO $$
DECLARE
  plan_record RECORD;
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ BASE DE DONNÉES CONFIGURÉE AVEC SUCCÈS!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  Nombre de plans actifs: %', plan_count;
  RAISE NOTICE '';

  FOR plan_record IN
    SELECT plan_type, name, price_monthly, price_yearly, max_products, commission_rate
    FROM subscription_plans
    ORDER BY display_order
  LOOP
    RAISE NOTICE '📦 % (%)', plan_record.name, UPPER(plan_record.plan_type);
    RAISE NOTICE '   💰 Prix mensuel: % XOF', plan_record.price_monthly;
    RAISE NOTICE '   💰 Prix annuel: % XOF', plan_record.price_yearly;
    RAISE NOTICE '   📦 Produits max: %', plan_record.max_products;
    RAISE NOTICE '   💳 Commission: %%%', plan_record.commission_rate;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser';
  RAISE NOTICE '   les abonnements dans l''app!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Afficher un aperçu des plans
SELECT
  plan_type as "Type",
  name as "Nom",
  price_monthly || ' XOF' as "Prix/mois",
  price_yearly || ' XOF' as "Prix/an",
  max_products as "Produits max",
  commission_rate || '%' as "Commission"
FROM subscription_plans
ORDER BY display_order;
