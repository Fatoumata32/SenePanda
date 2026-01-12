-- =====================================================
-- SCRIPT POUR ACTIVER LE SYSTÈME DE POINTS RÉCOMPENSES
-- =====================================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Ajouter les colonnes nécessaires dans profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS panda_coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT FALSE;

-- 2. Mettre à jour les panda_coins à 0 si null
UPDATE profiles SET panda_coins = 0 WHERE panda_coins IS NULL;
UPDATE profiles SET current_streak = 0 WHERE current_streak IS NULL;
UPDATE profiles SET longest_streak = 0 WHERE longest_streak IS NULL;

-- 3. Créer la table loyalty_points si elle n'existe pas
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Créer la table de tracking des logins quotidiens
CREATE TABLE IF NOT EXISTS daily_login_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    points_earned INTEGER DEFAULT 0,
    streak_day INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, login_date)
);

-- 5. Créer la table des transactions de points
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Créer la table pandacoins_transactions pour le wallet
CREATE TABLE IF NOT EXISTS pandacoins_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Activer RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_login_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pandacoins_transactions ENABLE ROW LEVEL SECURITY;

-- 8. Créer les policies
DROP POLICY IF EXISTS "Users can view own loyalty_points" ON loyalty_points;
CREATE POLICY "Users can view own loyalty_points" ON loyalty_points
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own daily_login_tracking" ON daily_login_tracking;
CREATE POLICY "Users can view own daily_login_tracking" ON daily_login_tracking
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own points_transactions" ON points_transactions;
CREATE POLICY "Users can view own points_transactions" ON points_transactions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own pandacoins_transactions" ON pandacoins_transactions;
CREATE POLICY "Users can view own pandacoins_transactions" ON pandacoins_transactions
    FOR ALL USING (auth.uid() = user_id);

-- 9. Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_login_user_date ON daily_login_tracking(user_id, login_date DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pandacoins_transactions_user ON pandacoins_transactions(user_id, created_at DESC);

-- 10. Donner 100 points de départ à tous les utilisateurs existants sans points
UPDATE profiles
SET panda_coins = 100
WHERE panda_coins = 0 OR panda_coins IS NULL;

-- 11. Vérification
SELECT
    'Système de points activé!' as status,
    COUNT(*) as total_users,
    SUM(panda_coins) as total_points_distribues
FROM profiles;
