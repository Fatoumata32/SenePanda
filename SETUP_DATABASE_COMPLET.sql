-- ================================================================
-- SENEPANDA - SCRIPT SQL COMPLET
-- Configuration complète de la base de données
-- ================================================================
--
-- Instructions :
-- 1. Allez sur https://app.supabase.com
-- 2. Ouvrez votre projet
-- 3. SQL Editor → New query
-- 4. Copiez-collez TOUT ce fichier
-- 5. Cliquez sur "Run"
-- 6. Attendez que tout s'exécute (peut prendre 30 secondes)
--
-- ================================================================

-- ================================================================
-- 1. CONFIGURATION DE L'AUTHENTIFICATION
-- ================================================================

-- NOTE : La confirmation email doit être désactivée dans le dashboard
-- Allez sur : Authentication → Settings → Email Auth
-- Décochez "Enable email confirmations"
--
-- Cette configuration ne peut pas être faite via SQL dans les versions récentes de Supabase

-- ================================================================
-- 2. SUPPRESSION DES TABLES EXISTANTES (RESET COMPLET)
-- ================================================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Les profils sont visibles publiquement" ON profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur profil" ON profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur profil" ON profiles;
DROP POLICY IF EXISTS "Public product read access" ON products;
DROP POLICY IF EXISTS "Sellers can manage their products" ON products;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Supprimer les tables dans l'ordre (à cause des foreign keys)
DROP TABLE IF EXISTS live_viewers CASCADE;
DROP TABLE IF EXISTS live_featured_products CASCADE;
DROP TABLE IF EXISTS live_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ================================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- ================================================================

-- Table PROFILES (Utilisateurs)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,

  -- Informations personnelles
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,

  -- Rôles et statuts
  is_seller BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,

  -- Gamification
  panda_coins INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,

  -- Parrainage
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),

  -- Localisation
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  city TEXT,
  country TEXT DEFAULT 'Senegal',

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table SHOPS (Boutiques des vendeurs)
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Informations de la boutique
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,

  -- Thème visuel
  primary_color TEXT DEFAULT '#FF6B35',
  secondary_color TEXT DEFAULT '#FFB800',

  -- Localisation
  address TEXT,
  city TEXT,
  phone TEXT,

  -- Statistiques
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  -- Statut
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table PRODUCTS (Produits)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

  -- Informations du produit
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,

  -- Promotion / Réduction
  has_discount BOOLEAN DEFAULT FALSE,
  discount_percent INTEGER DEFAULT 0,
  original_price DECIMAL(10,2),

  -- Stock
  stock_quantity INTEGER DEFAULT 0,

  -- Catégorisation
  category TEXT,
  tags TEXT[],

  -- Média
  images TEXT[],
  video_url TEXT,

  -- Localisation
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,

  -- Statistiques
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,

  -- Statut
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table ORDERS (Commandes)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Informations de la commande
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,

  -- Livraison
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_phone TEXT,
  delivery_notes TEXT,

  -- Paiement
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table ORDER_ITEMS (Articles de commande)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Détails de l'article
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table FAVORITES (Produits favoris)
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, product_id)
);

-- Table REVIEWS (Avis sur les produits)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_id, user_id)
);

-- Table LIVE_SESSIONS (Sessions de live shopping)
CREATE TABLE live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

  -- Informations du live
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Configuration ZegoCloud
  room_id TEXT UNIQUE,

  -- Statut
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),

  -- Statistiques
  viewers_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,

  -- Timing
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table LIVE_FEATURED_PRODUCTS (Produits mis en avant pendant le live)
CREATE TABLE live_featured_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  -- Prix spécial live
  special_price DECIMAL(10,2),

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,

  -- Statut
  is_currently_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(live_session_id, product_id)
);

-- Table LIVE_VIEWERS (Spectateurs du live)
CREATE TABLE live_viewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  UNIQUE(live_session_id, user_id)
);

-- Table CONVERSATIONS (Conversations de chat)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Dernier message
  last_message TEXT,
  last_message_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(participant1_id, participant2_id)
);

-- Table CHAT_MESSAGES (Messages de chat)
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Contenu du message
  content TEXT NOT NULL,

  -- Type de message
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'product', 'order')),

  -- Métadonnées optionnelles
  metadata JSONB,

  -- Statut de lecture
  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table NOTIFICATIONS (Notifications utilisateur)
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Contenu de la notification
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,

  -- Métadonnées
  data JSONB,

  -- Statut
  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table POINTS_TRANSACTIONS (Transactions de Panda Coins)
CREATE TABLE points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  related_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table REFERRALS (Système de parrainage)
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ================================================================
-- 4. INDEXES POUR LA PERFORMANCE
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

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS) - SÉCURITÉ
-- ================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- POLICIES pour PROFILES
CREATE POLICY "Profils publics visibles par tous"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Utilisateurs peuvent créer leur profil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent modifier leur profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- POLICIES pour PRODUCTS
CREATE POLICY "Produits actifs visibles par tous"
  ON products FOR SELECT
  USING (is_active = true OR seller_id = auth.uid());

CREATE POLICY "Vendeurs peuvent créer des produits"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendeurs peuvent modifier leurs produits"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Vendeurs peuvent supprimer leurs produits"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- POLICIES pour SHOPS
CREATE POLICY "Boutiques visibles par tous"
  ON shops FOR SELECT
  USING (is_active = true OR seller_id = auth.uid());

CREATE POLICY "Vendeurs peuvent créer leur boutique"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendeurs peuvent modifier leur boutique"
  ON shops FOR UPDATE
  USING (auth.uid() = seller_id);

-- POLICIES pour ORDERS
CREATE POLICY "Utilisateurs voient leurs commandes"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Acheteurs peuvent créer des commandes"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Vendeurs peuvent modifier leurs commandes"
  ON orders FOR UPDATE
  USING (auth.uid() = seller_id);

-- POLICIES pour ORDER_ITEMS
CREATE POLICY "Utilisateurs voient leurs articles de commande"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

-- POLICIES pour FAVORITES
CREATE POLICY "Utilisateurs voient leurs favoris"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs gèrent leurs favoris"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- POLICIES pour REVIEWS
CREATE POLICY "Avis visibles par tous"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Utilisateurs peuvent créer des avis"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs avis"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- POLICIES pour LIVE_SESSIONS
CREATE POLICY "Lives publics visibles par tous"
  ON live_sessions FOR SELECT
  USING (true);

CREATE POLICY "Vendeurs peuvent créer des lives"
  ON live_sessions FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendeurs peuvent modifier leurs lives"
  ON live_sessions FOR UPDATE
  USING (auth.uid() = seller_id);

-- POLICIES pour NOTIFICATIONS
CREATE POLICY "Utilisateurs voient leurs notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- POLICIES pour POINTS_TRANSACTIONS
CREATE POLICY "Utilisateurs voient leurs transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- POLICIES pour REFERRALS
CREATE POLICY "Utilisateurs voient leurs parrainages"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ================================================================
-- 6. FONCTIONS ET TRIGGERS
-- ================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number TEXT;
  fname TEXT;
  lname TEXT;
BEGIN
  -- Extraire le numéro de téléphone de l'email (format: +221771234567@senepanda.app)
  phone_number := SPLIT_PART(NEW.email, '@', 1);

  -- Extraire prénom et nom depuis raw_user_meta_data
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
    100, -- Bonus de bienvenue
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- ================================================================

-- Vous pouvez décommenter cette section pour avoir des données de test

/*
-- Créer un utilisateur test
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '+221771234567@senepanda.app',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
*/

-- ================================================================
-- 8. VÉRIFICATION FINALE
-- ================================================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Base de données SenePanda créée avec succès!';
  RAISE NOTICE '📊 Tables créées: %', (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public'
  );
  RAISE NOTICE '🔐 Policies RLS activées';
  RAISE NOTICE '⚡ Triggers configurés';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser l''application!';
END $$;
