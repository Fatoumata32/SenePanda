-- =============================================
-- SYSTÈME DE BONUS POINTS AMÉLIORÉ
-- =============================================

-- 1. Ajouter colonnes pour le tracking des bonus
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT FALSE;

-- 2. Table pour tracker les points quotidiens (daily streak)
CREATE TABLE IF NOT EXISTS daily_login_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    points_earned INTEGER DEFAULT 0,
    streak_day INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, login_date)
);

-- 3. Table pour les surveys
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    points_reward INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id, user_id)
);

-- 4. Améliorer la table points_transactions avec plus de types
-- Les types de points existants + nouveaux :
-- 'welcome_bonus', 'referral_bonus', 'daily_login', 'streak_bonus',
-- 'survey_completion', 'product_review', 'product_rating',
-- 'purchase', 'redeem'

COMMENT ON COLUMN points_transactions.type IS 'Types: welcome_bonus, referral_bonus, daily_login, streak_bonus, survey_completion, product_review, product_rating, purchase, redeem';

-- =============================================
-- FONCTIONS POUR LES BONUS POINTS
-- =============================================

-- Fonction 1: Bonus de bienvenue (appelé à la première connexion)
CREATE OR REPLACE FUNCTION award_welcome_bonus(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_welcome_points INTEGER := 500; -- 500 points de bienvenue
    v_already_claimed BOOLEAN;
BEGIN
    -- Vérifier si déjà réclamé
    SELECT welcome_bonus_claimed INTO v_already_claimed
    FROM profiles
    WHERE id = p_user_id;

    IF v_already_claimed THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Bonus de bienvenue déjà réclamé'
        );
    END IF;

    -- Ajouter les points
    UPDATE loyalty_points
    SET
        available_points = available_points + v_welcome_points,
        lifetime_points = lifetime_points + v_welcome_points,
        total_points = total_points + v_welcome_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction
    INSERT INTO points_transactions (user_id, points, type, description)
    VALUES (p_user_id, v_welcome_points, 'welcome_bonus', 'Bonus de bienvenue - Merci de nous rejoindre !');

    -- Marquer comme réclamé
    UPDATE profiles
    SET welcome_bonus_claimed = TRUE
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'points', v_welcome_points,
        'message', 'Bienvenue ! Vous avez reçu ' || v_welcome_points || ' points !'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 2: Daily Login Streak
CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_last_login DATE;
    v_today DATE := CURRENT_DATE;
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_points_earned INTEGER := 0;
    v_base_points INTEGER := 10; -- Points de base pour login quotidien
    v_streak_bonus INTEGER := 0;
    v_already_logged_today BOOLEAN;
BEGIN
    -- Vérifier si déjà connecté aujourd'hui
    SELECT EXISTS (
        SELECT 1 FROM daily_login_tracking
        WHERE user_id = p_user_id AND login_date = v_today
    ) INTO v_already_logged_today;

    IF v_already_logged_today THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Vous avez déjà réclamé vos points aujourd''hui'
        );
    END IF;

    -- Récupérer le dernier login et le streak actuel
    SELECT last_login_date, current_streak, longest_streak
    INTO v_last_login, v_current_streak, v_longest_streak
    FROM profiles
    WHERE id = p_user_id;

    -- Calculer le nouveau streak
    IF v_last_login IS NULL THEN
        -- Premier login
        v_current_streak := 1;
    ELSIF v_last_login = v_today - INTERVAL '1 day' THEN
        -- Connexion consécutive
        v_current_streak := v_current_streak + 1;
    ELSIF v_last_login < v_today - INTERVAL '1 day' THEN
        -- Streak cassé, recommencer à 1
        v_current_streak := 1;
    END IF;

    -- Calculer les points : base + bonus de streak
    v_points_earned := v_base_points;

    -- Bonus de streak (tous les 7 jours)
    IF v_current_streak % 7 = 0 THEN
        v_streak_bonus := 50; -- Bonus pour 7 jours consécutifs
        v_points_earned := v_points_earned + v_streak_bonus;
    END IF;

    -- Bonus supplémentaire pour les long streaks
    IF v_current_streak >= 30 THEN
        v_streak_bonus := v_streak_bonus + 100; -- Bonus pour 30 jours
        v_points_earned := v_points_earned + 100;
    END IF;

    -- Mettre à jour le longest streak
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;

    -- Ajouter les points
    UPDATE loyalty_points
    SET
        available_points = available_points + v_points_earned,
        lifetime_points = lifetime_points + v_points_earned,
        total_points = total_points + v_points_earned,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction
    INSERT INTO points_transactions (user_id, points, type, description)
    VALUES (
        p_user_id,
        v_points_earned,
        CASE WHEN v_streak_bonus > 0 THEN 'streak_bonus' ELSE 'daily_login' END,
        'Connexion quotidienne - Jour ' || v_current_streak ||
        CASE WHEN v_streak_bonus > 0 THEN ' (Bonus streak: +' || v_streak_bonus || ')' ELSE '' END
    );

    -- Enregistrer le login du jour
    INSERT INTO daily_login_tracking (user_id, login_date, points_earned, streak_day)
    VALUES (p_user_id, v_today, v_points_earned, v_current_streak);

    -- Mettre à jour le profil
    UPDATE profiles
    SET
        last_login_date = v_today,
        current_streak = v_current_streak,
        longest_streak = v_longest_streak
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'points', v_points_earned,
        'streak', v_current_streak,
        'longest_streak', v_longest_streak,
        'streak_bonus', v_streak_bonus,
        'message',
            CASE
                WHEN v_streak_bonus > 0 THEN
                    'Félicitations ! ' || v_current_streak || ' jours consécutifs ! +' || v_points_earned || ' points (dont ' || v_streak_bonus || ' de bonus)'
                ELSE
                    '+' || v_points_earned || ' points - Jour ' || v_current_streak
            END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 3: Points pour notation de produit
CREATE OR REPLACE FUNCTION award_points_for_rating(p_user_id UUID, p_product_id UUID, p_rating INTEGER)
RETURNS JSON AS $$
DECLARE
    v_points INTEGER := 5; -- 5 points pour une note
BEGIN
    -- Vérifier si c'est une nouvelle note (pas un update)
    IF NOT EXISTS (
        SELECT 1 FROM product_reviews
        WHERE user_id = p_user_id AND product_id = p_product_id
    ) THEN
        -- Ajouter les points
        UPDATE loyalty_points
        SET
            available_points = available_points + v_points,
            lifetime_points = lifetime_points + v_points,
            total_points = total_points + v_points,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Enregistrer la transaction
        INSERT INTO points_transactions (user_id, points, type, description, related_id)
        VALUES (p_user_id, v_points, 'product_rating', 'Note de produit', p_product_id);

        RETURN json_build_object(
            'success', true,
            'points', v_points,
            'message', '+' || v_points || ' points pour votre note !'
        );
    END IF;

    RETURN json_build_object('success', false, 'message', 'Points déjà attribués');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 4: Points pour commentaire de produit
CREATE OR REPLACE FUNCTION award_points_for_review(p_user_id UUID, p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    v_points INTEGER := 20; -- 20 points pour un commentaire
BEGIN
    -- Ajouter les points
    UPDATE loyalty_points
    SET
        available_points = available_points + v_points,
        lifetime_points = lifetime_points + v_points,
        total_points = total_points + v_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction
    INSERT INTO points_transactions (user_id, points, type, description, related_id)
    VALUES (p_user_id, v_points, 'product_review', 'Commentaire de produit', p_product_id);

    RETURN json_build_object(
        'success', true,
        'points', v_points,
        'message', '+' || v_points || ' points pour votre avis !'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 5: Points pour complétion de survey
CREATE OR REPLACE FUNCTION complete_survey(p_survey_id UUID, p_user_id UUID, p_responses JSONB)
RETURNS JSON AS $$
DECLARE
    v_points INTEGER;
    v_survey_active BOOLEAN;
    v_already_completed BOOLEAN;
BEGIN
    -- Vérifier si le survey existe et est actif
    SELECT points_reward, is_active
    INTO v_points, v_survey_active
    FROM surveys
    WHERE id = p_survey_id;

    IF NOT FOUND OR NOT v_survey_active THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Sondage non disponible'
        );
    END IF;

    -- Vérifier si déjà complété
    SELECT EXISTS (
        SELECT 1 FROM survey_responses
        WHERE survey_id = p_survey_id AND user_id = p_user_id
    ) INTO v_already_completed;

    IF v_already_completed THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Vous avez déjà complété ce sondage'
        );
    END IF;

    -- Enregistrer la réponse
    INSERT INTO survey_responses (survey_id, user_id, responses, points_earned)
    VALUES (p_survey_id, p_user_id, p_responses, v_points);

    -- Ajouter les points
    UPDATE loyalty_points
    SET
        available_points = available_points + v_points,
        lifetime_points = lifetime_points + v_points,
        total_points = total_points + v_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Enregistrer la transaction
    INSERT INTO points_transactions (user_id, points, type, description, related_id)
    VALUES (p_user_id, v_points, 'survey_completion', 'Sondage complété', p_survey_id);

    RETURN json_build_object(
        'success', true,
        'points', v_points,
        'message', 'Merci ! Vous avez gagné ' || v_points || ' points !'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- POLICIES RLS
-- =============================================

-- Policies pour daily_login_tracking
ALTER TABLE daily_login_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own login tracking" ON daily_login_tracking;
CREATE POLICY "Users can view own login tracking" ON daily_login_tracking
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert login tracking" ON daily_login_tracking;
CREATE POLICY "System can insert login tracking" ON daily_login_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Surveys are viewable by everyone" ON surveys;
CREATE POLICY "Surveys are viewable by everyone" ON surveys
    FOR SELECT USING (is_active = true);

-- Policies pour survey_responses
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own responses" ON survey_responses;
CREATE POLICY "Users can view own responses" ON survey_responses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create responses" ON survey_responses;
CREATE POLICY "Users can create responses" ON survey_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INDEXES POUR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_daily_login_user_date ON daily_login_tracking(user_id, login_date DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);

-- =============================================
-- DONNÉES DE TEST (SURVEYS EXEMPLES)
-- =============================================

INSERT INTO surveys (title, description, points_reward, is_active, expires_at)
VALUES
    ('Amélioration de SenePanda', 'Aidez-nous à améliorer votre expérience', 50, true, NOW() + INTERVAL '30 days'),
    ('Vos habitudes d''achat', 'Partagez vos préférences d''achat', 30, true, NOW() + INTERVAL '60 days'),
    ('Catégories préférées', 'Quelles catégories vous intéressent le plus ?', 25, true, NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTAIRES
-- =============================================

COMMENT ON TABLE daily_login_tracking IS 'Suivi des connexions quotidiennes pour le système de streak';
COMMENT ON TABLE surveys IS 'Sondages disponibles pour les utilisateurs';
COMMENT ON TABLE survey_responses IS 'Réponses des utilisateurs aux sondages';

COMMENT ON FUNCTION award_welcome_bonus IS 'Attribue 500 points de bienvenue à la première connexion';
COMMENT ON FUNCTION record_daily_login IS 'Enregistre le login quotidien et calcule le streak (10 pts/jour + bonus)';
COMMENT ON FUNCTION award_points_for_rating IS 'Attribue 5 points pour une note de produit';
COMMENT ON FUNCTION award_points_for_review IS 'Attribue 20 points pour un commentaire de produit';
COMMENT ON FUNCTION complete_survey IS 'Enregistre une réponse de sondage et attribue les points';
