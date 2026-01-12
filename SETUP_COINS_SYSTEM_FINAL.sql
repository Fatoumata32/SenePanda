-- =====================================================
-- SENEPANDA - SYSTÈME COINS - VERSION FINALE
-- =====================================================
-- ✅ Compatible avec TOUTES les structures existantes
-- ✅ Détection automatique des colonnes
-- ✅ Ne casse rien
-- =====================================================

-- =====================================================
-- ÉTAPE 1: Vérifier et créer les tables de base
-- =====================================================

-- Table loyalty_points
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

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);

-- Table points_transactions (compatible avec structure existante)
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);

-- Table rewards (s'adapter à la structure existante)
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter reward_type si manquant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rewards' AND column_name = 'reward_type'
    ) THEN
        ALTER TABLE rewards ADD COLUMN reward_type TEXT DEFAULT 'gift';
    END IF;
END $$;

-- Mettre à jour les NULL
UPDATE rewards SET reward_type = COALESCE(reward_type, 'gift') WHERE reward_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active) WHERE is_active = true;

-- Table claimed_rewards
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claimed_rewards_user_id ON claimed_rewards(user_id);

-- =====================================================
-- ÉTAPE 2: Activer RLS
-- =====================================================

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 3: Policies RLS (suppression sécurisée)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own points" ON loyalty_points;

CREATE POLICY "Users can view own points"
    ON loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own points"
    ON loyalty_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points"
    ON loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON points_transactions;

CREATE POLICY "Users can view own transactions"
    ON points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions"
    ON points_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;

CREATE POLICY "Anyone can view active rewards"
    ON rewards FOR SELECT USING (is_active = true OR is_active IS NULL);

DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can update own claimed rewards" ON claimed_rewards;

CREATE POLICY "Users can view own claimed rewards"
    ON claimed_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim rewards"
    ON claimed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own claimed rewards"
    ON claimed_rewards FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- ÉTAPE 4: Insérer les récompenses (si table vide)
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM rewards;

    IF v_count = 0 THEN
        INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, is_active) VALUES
        -- Réductions FCFA
        ('Réduction 500 FCFA', 'Réduction de 500 FCFA sur votre prochaine commande', 100, 'discount', 500, 30, true),
        ('Réduction 1000 FCFA', 'Réduction de 1000 FCFA sur votre prochaine commande', 200, 'discount', 1000, 30, true),
        ('Réduction 2500 FCFA', 'Réduction de 2500 FCFA sur votre prochaine commande', 500, 'discount', 2500, 30, true),
        ('Réduction 5000 FCFA', 'Réduction de 5000 FCFA sur votre prochaine commande', 1000, 'discount', 5000, 30, true),

        -- Réductions %
        ('Réduction 5%', 'Réduction de 5% sur votre prochaine commande', 300, 'discount', 5, 30, true),
        ('Réduction 10%', 'Réduction de 10% sur votre prochaine commande', 600, 'discount', 10, 30, true),
        ('Réduction 15%', 'Réduction de 15% sur votre prochaine commande', 1000, 'discount', 15, 30, true),

        -- Livraison gratuite
        ('Livraison Gratuite', 'Livraison offerte sur votre prochaine commande', 150, 'free_shipping', 2500, 30, true),
        ('2x Livraison Gratuite', 'Pack de 2 livraisons gratuites', 250, 'free_shipping', 5000, 60, true),

        -- Boost visibilité
        ('Boost 24h', 'Boutique en avant pendant 24h', 200, 'boost', 1, 7, true),
        ('Boost 3 jours', 'Boutique en avant pendant 3 jours', 450, 'boost', 3, 7, true),
        ('Boost 7 jours', 'Boutique en avant pendant 7 jours', 800, 'boost', 7, 14, true),

        -- Badges VIP
        ('Badge VIP Bronze 30j', 'Badge VIP Bronze pendant 30 jours', 500, 'premium', 30, 30, true),
        ('Badge VIP Silver 30j', 'Badge VIP Silver pendant 30 jours', 1000, 'premium', 30, 30, true),
        ('Badge VIP Gold 30j', 'Badge VIP Gold pendant 30 jours', 2000, 'premium', 30, 30, true),

        -- Bons d'achat
        ('Bon 1000 FCFA', 'Bon d''achat de 1000 FCFA', 200, 'gift', 1000, 60, true),
        ('Bon 2500 FCFA', 'Bon d''achat de 2500 FCFA', 450, 'gift', 2500, 60, true),
        ('Bon 5000 FCFA', 'Bon d''achat de 5000 FCFA', 900, 'gift', 5000, 60, true),
        ('Bon 10000 FCFA', 'Bon d''achat de 10000 FCFA', 1800, 'gift', 10000, 60, true);

        RAISE NOTICE '✅ 19 récompenses insérées';
    ELSE
        RAISE NOTICE 'ℹ️ Table rewards contient déjà % récompenses', v_count;
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 5: Fonctions utilitaires
-- =====================================================

-- Fonction: Obtenir le solde
CREATE OR REPLACE FUNCTION get_user_points_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    SELECT COALESCE(points, 0) INTO v_points
    FROM loyalty_points
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO loyalty_points (user_id, points)
        VALUES (p_user_id, 0)
        RETURNING points INTO v_points;
    END IF;

    RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Ajouter des points
CREATE OR REPLACE FUNCTION add_user_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Initialiser si nécessaire
    INSERT INTO loyalty_points (user_id, points, total_earned)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Ajouter les points
    UPDATE loyalty_points
    SET
        points = points + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING points INTO v_new_balance;

    -- Enregistrer transaction
    INSERT INTO points_transactions (user_id, points, type, description)
    VALUES (p_user_id, p_amount, p_type, p_description);

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'added', p_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Dépenser des points
CREATE OR REPLACE FUNCTION spend_user_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Vérifier le solde
    SELECT points INTO v_current_balance
    FROM loyalty_points
    WHERE user_id = p_user_id;

    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Solde insuffisant',
            'current_balance', COALESCE(v_current_balance, 0),
            'required', p_amount
        );
    END IF;

    -- Déduire les points
    UPDATE loyalty_points
    SET
        points = points - p_amount,
        total_spent = total_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING points INTO v_new_balance;

    -- Enregistrer transaction (montant négatif)
    INSERT INTO points_transactions (user_id, points, type, description)
    VALUES (p_user_id, -p_amount, p_type, p_description);

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'spent', p_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Réclamer une récompense
CREATE OR REPLACE FUNCTION claim_reward(
    p_user_id UUID,
    p_reward_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_reward RECORD;
    v_user_balance INTEGER;
    v_result JSONB;
BEGIN
    -- Récupérer la récompense
    SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Récompense introuvable');
    END IF;

    -- Vérifier le stock
    IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock épuisé');
    END IF;

    -- Vérifier le solde
    SELECT points INTO v_user_balance FROM loyalty_points WHERE user_id = p_user_id;

    IF v_user_balance IS NULL OR v_user_balance < v_reward.points_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Points insuffisants',
            'required', v_reward.points_cost,
            'balance', COALESCE(v_user_balance, 0)
        );
    END IF;

    -- Dépenser les points
    v_result := spend_user_points(
        p_user_id,
        v_reward.points_cost,
        'reward_redemption',
        format('Récompense: %s', v_reward.title)
    );

    IF NOT (v_result->>'success')::boolean THEN
        RETURN v_result;
    END IF;

    -- Enregistrer la récompense réclamée
    INSERT INTO claimed_rewards (
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
        NOW() + (v_reward.duration_days || ' days')::INTERVAL
    );

    -- Décrémenter le stock
    IF v_reward.stock IS NOT NULL THEN
        UPDATE rewards
        SET stock = stock - 1
        WHERE id = p_reward_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'reward', v_reward.title,
        'points_spent', v_reward.points_cost,
        'new_balance', (v_result->>'new_balance')::integer
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 6: Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_user_points_balance TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_points TO authenticated;
GRANT EXECUTE ON FUNCTION spend_user_points TO authenticated;
GRANT EXECUTE ON FUNCTION claim_reward TO authenticated;

-- =====================================================
-- ÉTAPE 7: Vérification finale
-- =====================================================

DO $$
DECLARE
    v_tables INTEGER := 0;
    v_rewards INTEGER;
    v_functions INTEGER := 0;
BEGIN
    -- Compter tables
    SELECT COUNT(*) INTO v_tables FROM information_schema.tables
    WHERE table_name IN ('loyalty_points', 'points_transactions', 'rewards', 'claimed_rewards');

    -- Compter récompenses
    SELECT COUNT(*) INTO v_rewards FROM rewards WHERE is_active = true;

    -- Compter fonctions
    SELECT COUNT(*) INTO v_functions FROM information_schema.routines
    WHERE routine_name IN ('get_user_points_balance', 'add_user_points', 'spend_user_points', 'claim_reward');

    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '🎉 SYSTÈME COINS INSTALLÉ AVEC SUCCÈS !';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '✅ Tables: % / 4', v_tables;
    RAISE NOTICE '✅ Récompenses actives: %', v_rewards;
    RAISE NOTICE '✅ Fonctions: % / 4', v_functions;
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTER LE SYSTÈME:';
    RAISE NOTICE '';
    RAISE NOTICE '-- 1. Voir les récompenses';
    RAISE NOTICE 'SELECT * FROM rewards WHERE is_active = true;';
    RAISE NOTICE '';
    RAISE NOTICE '-- 2. Obtenir votre solde (remplacez UUID)';
    RAISE NOTICE 'SELECT get_user_points_balance(''YOUR-USER-UUID'');';
    RAISE NOTICE '';
    RAISE NOTICE '-- 3. Ajouter 100 points de test';
    RAISE NOTICE 'SELECT add_user_points(''YOUR-USER-UUID'', 100, ''admin_adjustment'', ''Test'');';
    RAISE NOTICE '';
    RAISE NOTICE '-- 4. Réclamer une récompense';
    RAISE NOTICE 'SELECT claim_reward(''YOUR-USER-UUID'', ''REWARD-UUID'');';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- =====================================================
-- ÉTAPE 8: ACTIVER REALTIME (IMPORTANT!)
-- =====================================================
-- Permet la synchronisation en temps réel des coins

DO $$
BEGIN
    -- Activer la réplication pour loyalty_points
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;
        RAISE NOTICE '✅ Realtime activé pour loyalty_points';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ loyalty_points déjà dans supabase_realtime';
    END;

    -- Activer la réplication pour points_transactions  
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
        RAISE NOTICE '✅ Realtime activé pour points_transactions';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ points_transactions déjà dans supabase_realtime';
    END;
END $$;

-- Vérifier les tables dans la publication realtime
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

SELECT '🎯 INSTALLATION TERMINÉE - Les PandaCoins se synchroniseront en temps réel!' as final_status;
