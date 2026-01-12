-- =====================================================
-- SCRIPT POUR ACTIVER LE SYSTÈME DE PARRAINAGE
-- =====================================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Ajouter les colonnes nécessaires dans profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- 2. Créer la table referrals pour tracker les parrainages
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'completed',
    reward_amount INTEGER DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- 3. Activer RLS sur referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 4. Créer les policies pour referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- 5. Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- 6. Fonction pour générer un code de parrainage unique
-- Supprimer d'abord le trigger et la fonction existants
DROP TRIGGER IF EXISTS auto_generate_referral_code ON profiles;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    -- Si le profil n'a pas encore de code de parrainage
    IF NEW.referral_code IS NULL THEN
        LOOP
            -- Générer un code aléatoire de 8 caractères
            new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));

            -- Vérifier si le code existe déjà
            SELECT EXISTS (
                SELECT 1 FROM profiles WHERE referral_code = new_code
            ) INTO code_exists;

            -- Sortir de la boucle si le code est unique
            EXIT WHEN NOT code_exists;
        END LOOP;

        NEW.referral_code := new_code;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour auto-générer le code de parrainage
DROP TRIGGER IF EXISTS auto_generate_referral_code ON profiles;
CREATE TRIGGER auto_generate_referral_code
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- 8. Générer des codes pour les utilisateurs existants qui n'en ont pas
UPDATE profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 9. Fonction RPC pour attribuer les bonus de parrainage
-- PARRAIN: 500 points | FILLEUL: 200 points
-- Supprimer l'ancienne fonction si elle existe (avec différentes signatures)
DROP FUNCTION IF EXISTS process_referral_bonus(UUID, UUID);
DROP FUNCTION IF EXISTS process_referral_bonus(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS process_referral_bonus(UUID, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION process_referral_bonus(
    p_referrer_id UUID,
    p_referred_id UUID,
    p_referrer_bonus INTEGER DEFAULT 500,  -- Bonus pour le parrain
    p_referred_bonus INTEGER DEFAULT 200   -- Bonus pour le filleul
)
RETURNS JSON AS $$
DECLARE
    v_referrer_points INTEGER;
    v_referred_points INTEGER;
BEGIN
    -- Vérifier que le parrainage n'existe pas déjà
    IF EXISTS (
        SELECT 1 FROM referrals
        WHERE referrer_id = p_referrer_id AND referred_id = p_referred_id
    ) THEN
        RETURN json_build_object('success', false, 'message', 'Parrainage déjà traité');
    END IF;

    -- Ajouter les points au parrain (500 points)
    UPDATE profiles
    SET panda_coins = COALESCE(panda_coins, 0) + p_referrer_bonus
    WHERE id = p_referrer_id
    RETURNING panda_coins INTO v_referrer_points;

    -- Ajouter les points au filleul (200 points) - déjà fait lors de l'inscription
    SELECT panda_coins INTO v_referred_points
    FROM profiles WHERE id = p_referred_id;

    -- Créer l'entrée de parrainage
    INSERT INTO referrals (referrer_id, referred_id, status, reward_amount)
    VALUES (p_referrer_id, p_referred_id, 'completed', p_referrer_bonus);

    -- Enregistrer les transactions
    INSERT INTO points_transactions (user_id, points, type, description, related_id)
    VALUES
        (p_referrer_id, p_referrer_bonus, 'referral_bonus', 'Bonus de parrainage - Nouveau filleul (+500)', p_referred_id),
        (p_referred_id, p_referred_bonus, 'referral_bonus', 'Bonus inscription - Code parrain utilisé (+200)', p_referrer_id);

    RETURN json_build_object(
        'success', true,
        'referrer_points', v_referrer_points,
        'referred_points', v_referred_points,
        'referrer_bonus', p_referrer_bonus,
        'referred_bonus', p_referred_bonus,
        'message', 'Bonus de parrainage attribué avec succès!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Vérification
SELECT
    'Système de parrainage activé!' as status,
    COUNT(*) FILTER (WHERE referral_code IS NOT NULL) as users_with_codes,
    COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as referred_users
FROM profiles;

-- =====================================================
-- RÉSUMÉ DU SYSTÈME DE PARRAINAGE
-- =====================================================
--
-- 1. Chaque utilisateur reçoit un code de parrainage unique (8 caractères)
-- 2. Lors de l'inscription, un nouvel utilisateur peut entrer un code parrain
-- 3. Si le code est valide:
--    - Le PARRAIN reçoit 500 PandaCoins (récompense)
--    - Le FILLEUL reçoit 200 PandaCoins (bonus inscription)
-- 4. Les transactions sont enregistrées dans points_transactions
-- 5. Les parrainages sont trackés dans la table referrals
--
-- =====================================================
