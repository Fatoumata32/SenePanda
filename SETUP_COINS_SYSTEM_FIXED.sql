-- =====================================================
-- SENEPANDA - SCRIPT SQL COMPLET POUR SYSTÈME COINS
-- VERSION CORRIGÉE ET SÉCURISÉE
-- =====================================================
-- ✅ Compatible avec tables existantes
-- ✅ N'écrase pas les données existantes
-- ✅ Utilise reward_type (pas category)
-- =====================================================

-- =====================================================
-- 1. Table loyalty_points (solde de coins des utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    level TEXT DEFAULT 'bronze',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);

-- =====================================================
-- 2. Table points_transactions (historique des transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'daily_login', 'welcome_bonus', 'referral_bonus', 'purchase',
        'refund', 'admin_adjustment', 'reward_redemption', 'live_interaction',
        'achievement'
    )),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);

-- =====================================================
-- 3. Table rewards (récompenses disponibles)
-- =====================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type TEXT NOT NULL DEFAULT 'gift',
    value DECIMAL(10,2),
    duration_days INTEGER DEFAULT 30,
    stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    min_level TEXT DEFAULT 'bronze',
    icon TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter reward_type si elle n'existe pas (pour tables existantes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rewards' AND column_name = 'reward_type'
    ) THEN
        ALTER TABLE rewards ADD COLUMN reward_type TEXT DEFAULT 'gift';
        RAISE NOTICE 'Colonne reward_type ajoutée à la table rewards';
    END IF;
END $$;

-- Mettre à jour les NULL si la colonne existait
UPDATE rewards SET reward_type = 'gift' WHERE reward_type IS NULL;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);

-- =====================================================
-- 4. Table claimed_rewards (récompenses réclamées)
-- =====================================================
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_user_id ON claimed_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_status ON claimed_rewards(status);

-- =====================================================
-- 5. Activer RLS (Row Level Security)
-- =====================================================
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Policies RLS
-- =====================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON points_transactions;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can update own claimed rewards" ON claimed_rewards;

-- Policies pour loyalty_points
CREATE POLICY "Users can view own points"
    ON loyalty_points FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points"
    ON loyalty_points FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points"
    ON loyalty_points FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies pour points_transactions
CREATE POLICY "Users can view own transactions"
    ON points_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON points_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
    ON points_transactions FOR INSERT
    WITH CHECK (true);

-- Policies pour rewards
CREATE POLICY "Anyone can view active rewards"
    ON rewards FOR SELECT
    USING (is_active = true);

-- Policies pour claimed_rewards
CREATE POLICY "Users can view own claimed rewards"
    ON claimed_rewards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can claim rewards"
    ON claimed_rewards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claimed rewards"
    ON claimed_rewards FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 7. Insérer les récompenses (SEULEMENT si table vide)
-- =====================================================

DO $$
BEGIN
    -- Vérifier si la table rewards est vide
    IF NOT EXISTS (SELECT 1 FROM rewards LIMIT 1) THEN
        -- Insérer les récompenses de base
        INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, is_active) VALUES
        -- Réductions
        ('Réduction 500 FCFA', 'Réduction de 500 FCFA sur votre prochaine commande', 100, 'discount', 500, 30, true),
        ('Réduction 1000 FCFA', 'Réduction de 1000 FCFA sur votre prochaine commande', 200, 'discount', 1000, 30, true),
        ('Réduction 2500 FCFA', 'Réduction de 2500 FCFA sur votre prochaine commande', 500, 'discount', 2500, 30, true),
        ('Réduction 5000 FCFA', 'Réduction de 5000 FCFA sur votre prochaine commande', 1000, 'discount', 5000, 30, true),
        ('Réduction 10%', 'Réduction de 10% sur votre prochaine commande', 800, 'discount', 10, 30, true),

        -- Livraison gratuite
        ('Livraison Gratuite', 'Livraison offerte sur votre prochaine commande', 150, 'free_shipping', 2500, 30, true),
        ('2x Livraison Gratuite', 'Pack de 2 livraisons gratuites', 250, 'free_shipping', 5000, 60, true),

        -- Boost vendeurs
        ('Boost 24h', 'Boutique mise en avant pendant 24 heures', 200, 'boost', 1, 7, true),
        ('Boost 3 jours', 'Boutique mise en avant pendant 3 jours', 450, 'boost', 3, 7, true),
        ('Boost 7 jours', 'Boutique mise en avant pendant 7 jours', 800, 'boost', 7, 14, true),

        -- Premium
        ('Badge VIP Bronze 30j', 'Badge VIP Bronze pendant 30 jours', 500, 'premium', 30, 30, true),
        ('Badge VIP Silver 30j', 'Badge VIP Silver pendant 30 jours', 1000, 'premium', 30, 30, true),
        ('Badge VIP Gold 30j', 'Badge VIP Gold pendant 30 jours', 2000, 'premium', 30, 30, true),

        -- Bons d'achat
        ('Bon 1000 FCFA', 'Bon d''achat de 1000 FCFA', 200, 'gift', 1000, 60, true),
        ('Bon 2000 FCFA', 'Bon d''achat de 2000 FCFA', 400, 'gift', 2000, 60, true),
        ('Bon 5000 FCFA', 'Bon d''achat de 5000 FCFA', 900, 'gift', 5000, 60, true),
        ('Bon 10000 FCFA', 'Bon d''achat de 10000 FCFA', 1800, 'gift', 10000, 60, true);

        RAISE NOTICE '✅ 17 récompenses insérées avec succès';
    ELSE
        RAISE NOTICE 'ℹ️ Table rewards contient déjà des données, insertion ignorée';
    END IF;
END $$;

-- =====================================================
-- 8. Fonctions utilitaires
-- =====================================================

-- Fonction pour obtenir le solde de points
CREATE OR REPLACE FUNCTION get_user_points_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    SELECT COALESCE(points, 0) INTO v_points
    FROM loyalty_points
    WHERE user_id = p_user_id;

    -- Initialiser si pas de record
    IF NOT FOUND THEN
        INSERT INTO loyalty_points (user_id, points)
        VALUES (p_user_id, 0)
        RETURNING points INTO v_points;
    END IF;

    RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter des points
CREATE OR REPLACE FUNCTION add_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Initialiser loyalty_points si nécessaire
    INSERT INTO loyalty_points (user_id, points, total_earned)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Ajouter les points
    UPDATE loyalty_points
    SET
        points = points + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction
    INSERT INTO points_transactions (
        user_id, amount, transaction_type, description, reference_id
    ) VALUES (
        p_user_id, p_amount, p_type, p_description, p_reference_id
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour dépenser des points
CREATE OR REPLACE FUNCTION spend_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_points INTEGER;
BEGIN
    -- Vérifier le solde
    SELECT points INTO v_current_points
    FROM loyalty_points
    WHERE user_id = p_user_id;

    IF v_current_points IS NULL OR v_current_points < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant';
    END IF;

    -- Déduire les points
    UPDATE loyalty_points
    SET
        points = points - p_amount,
        total_spent = total_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction (montant négatif)
    INSERT INTO points_transactions (
        user_id, amount, transaction_type, description, reference_id
    ) VALUES (
        p_user_id, -p_amount, p_type, p_description, p_reference_id
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Grants
-- =====================================================
GRANT EXECUTE ON FUNCTION get_user_points_balance TO authenticated;
GRANT EXECUTE ON FUNCTION add_points TO authenticated;
GRANT EXECUTE ON FUNCTION spend_points TO authenticated;

-- =====================================================
-- 10. Vérification finale
-- =====================================================

-- Afficher le résultat
DO $$
DECLARE
    v_rewards_count INTEGER;
    v_tables_count INTEGER := 0;
BEGIN
    -- Compter les récompenses
    SELECT COUNT(*) INTO v_rewards_count FROM rewards WHERE is_active = true;

    -- Compter les tables créées
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points') THEN
        v_tables_count := v_tables_count + 1;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'points_transactions') THEN
        v_tables_count := v_tables_count + 1;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
        v_tables_count := v_tables_count + 1;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claimed_rewards') THEN
        v_tables_count := v_tables_count + 1;
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '✅ SYSTÈME COINS CONFIGURÉ AVEC SUCCÈS !';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '📊 Tables créées: % / 4', v_tables_count;
    RAISE NOTICE '📊 Récompenses actives: %', v_rewards_count;
    RAISE NOTICE '📊 Fonctions créées: 3';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Prochaines étapes:';
    RAISE NOTICE '  1. Vérifier que les tables sont créées';
    RAISE NOTICE '  2. Tester avec: SELECT * FROM rewards;';
    RAISE NOTICE '  3. Initialiser les points pour un utilisateur de test';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Utiliser les fonctions:';
    RAISE NOTICE '  - get_user_points_balance(user_id)';
    RAISE NOTICE '  - add_points(user_id, amount, type, description)';
    RAISE NOTICE '  - spend_points(user_id, amount, type, description)';
    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
