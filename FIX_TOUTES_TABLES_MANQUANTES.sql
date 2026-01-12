-- ============================================
-- FIX COMPLET: Toutes les tables manquantes
-- ============================================
-- Corrige Explorer, Favorites, Rewards, etc.
-- ============================================

-- PARTIE 1: Colonnes manquantes dans PROFILES
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- PARTIE 2: Colonnes manquantes dans PRODUCTS
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;


ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Correction : Ajout de la colonne product_id si manquante
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- PARTIE 3: Créer table REWARDS si elle n'existe pas
-- ============================================

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type TEXT DEFAULT 'gift',
    value DECIMAL(10,2),
    duration_days INTEGER DEFAULT 30,
    stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    min_level TEXT DEFAULT 'bronze',
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 4: Créer table LOYALTY_POINTS si elle n'existe pas
-- ============================================

CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    level TEXT DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 5: Créer table CLAIMED_REWARDS si elle n'existe pas
-- ============================================

CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_id UUID REFERENCES rewards(id),
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- PARTIE 6: Activer RLS
-- ============================================

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- PARTIE 7: Policies pour REWARDS
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards" ON rewards
    FOR SELECT USING (is_active = true);

-- PARTIE 8: Policies pour LOYALTY_POINTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own points" ON loyalty_points;

CREATE POLICY "Users can view own points" ON loyalty_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON loyalty_points
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON loyalty_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PARTIE 9: Policies pour CLAIMED_REWARDS
-- ============================================

DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can update own claimed rewards" ON claimed_rewards;

CREATE POLICY "Users can view own claimed rewards" ON claimed_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can claim rewards" ON claimed_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claimed rewards" ON claimed_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- PARTIE 10: Ajouter des récompenses de base
-- ============================================

INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, stock, is_active)
VALUES
  ('Réduction 5%', 'Obtenez 5% de réduction sur votre prochaine commande', 500, 'discount', 5, 30, NULL, true),
  ('Réduction 10%', 'Obtenez 10% de réduction sur votre prochaine commande', 1000, 'discount', 10, 30, NULL, true),
  ('Livraison Gratuite', 'Profitez de la livraison gratuite sur votre prochaine commande', 750, 'free_shipping', 2500, 30, NULL, true),
  ('Bon d''achat 1000 FCFA', 'Un bon d''achat de 1000 FCFA à utiliser', 500, 'gift', 1000, 60, NULL, true),
  ('Bon d''achat 5000 FCFA', 'Bon d''achat généreux de 5000 FCFA', 2200, 'gift', 5000, 60, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- PARTIE 11: Activer les produits récents
-- ============================================

UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- PARTIE 12: S'assurer que name n'est pas NULL
-- ============================================

UPDATE products
SET name = COALESCE(name, title, 'Produit')
WHERE name IS NULL OR name = '';

-- PARTIE 13: Forcer la mise à jour du cache
-- ============================================

UPDATE products
SET updated_at = NOW();

-- PARTIE 14: Vérification finale
-- ============================================

SELECT '=== VÉRIFICATION DES TABLES ===' as message;

SELECT
  '✅ PROFILES: shop_logo_url' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'shop_logo_url'
);

SELECT
  '✅ PRODUCTS: views_count' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'views_count'
);

SELECT
  '✅ TABLE: rewards créée' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'rewards'
);

SELECT
  '✅ TABLE: loyalty_points créée' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'loyalty_points'
);

SELECT
  '✅ TABLE: claimed_rewards créée' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'claimed_rewards'
);

SELECT '=== STATISTIQUES ===' as message;

SELECT 'Total produits: ' || COUNT(*)::text as stats FROM products
UNION ALL
SELECT 'Produits actifs: ' || COUNT(*)::text FROM products WHERE is_active = true
UNION ALL
SELECT 'Récompenses actives: ' || COUNT(*)::text FROM rewards WHERE is_active = true;
