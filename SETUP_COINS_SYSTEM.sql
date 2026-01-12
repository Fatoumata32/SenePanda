-- =====================================================
-- SENEPANDA - SCRIPT SQL COMPLET POUR SYSTÈME COINS
-- =====================================================
-- Copiez et exécutez ce script dans Supabase SQL Editor
-- Il crée/corrige toutes les tables nécessaires
-- =====================================================

-- 1. Table loyalty_points (solde de coins des utilisateurs)
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

-- 2. Table points_transactions (historique des transactions)
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table rewards (récompenses disponibles)
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
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter reward_type si la table existe déjà
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'gift';

-- 4. Table claimed_rewards (récompenses réclamées)
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_id UUID,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Activer RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can update own claimed rewards" ON claimed_rewards;

-- Policies pour loyalty_points
CREATE POLICY "Users can view own points" ON loyalty_points
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON loyalty_points
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON loyalty_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour points_transactions
CREATE POLICY "Users can view own transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour rewards (tout le monde peut voir les récompenses actives)
CREATE POLICY "Anyone can view active rewards" ON rewards
    FOR SELECT USING (is_active = true);

-- Policies pour claimed_rewards
CREATE POLICY "Users can view own claimed rewards" ON claimed_rewards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim rewards" ON claimed_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own claimed rewards" ON claimed_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- Nettoyer les anciennes récompenses
DELETE FROM rewards;

-- Insérer les récompenses pratiques
INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, is_active) VALUES
-- Réductions
('500 FCFA de réduction', 'Réduction de 500 FCFA sur votre prochaine commande', 100, 'discount', 500, 30, true),
('1000 FCFA de réduction', 'Réduction de 1000 FCFA sur votre prochaine commande', 200, 'discount', 1000, 30, true),
('2500 FCFA de réduction', 'Réduction de 2500 FCFA sur votre prochaine commande', 500, 'discount', 2500, 30, true),
('5000 FCFA de réduction', 'Réduction de 5000 FCFA sur votre prochaine commande', 1000, 'discount', 5000, 30, true),

-- Livraison
('Livraison Gratuite', 'Livraison offerte sur votre prochaine commande', 150, 'free_shipping', 1500, 30, true),

-- Boost vendeurs
('Boost 24h', 'Votre boutique mise en avant pendant 24 heures', 200, 'boost', 1, 7, true),
('Boost 7 jours', 'Votre boutique mise en avant pendant 7 jours', 500, 'boost', 7, 14, true),

-- Premium
('Badge Premium 30j', 'Badge Premium sur votre profil pendant 30 jours', 1000, 'premium', 30, 30, true),

-- Cadeaux
('Bon 2000 FCFA', 'Bon d''achat de 2000 FCFA', 400, 'gift', 2000, 60, true);

-- Vérification
SELECT 'Système Coins configuré avec succès!' as status;
SELECT COUNT(*) as total_rewards FROM rewards WHERE is_active = true;
