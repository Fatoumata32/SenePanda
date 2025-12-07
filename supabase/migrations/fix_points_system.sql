-- Migration: Réparation du système de points et daily login
-- Date: 2025-12-04
-- Description: Ajoute/vérifie toutes les colonnes nécessaires pour le système de points

-- ============================================
-- 1. Ajouter les colonnes nécessaires dans profiles
-- ============================================

DO $$
BEGIN
  -- panda_coins (points de l'utilisateur)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'panda_coins'
  ) THEN
    ALTER TABLE profiles ADD COLUMN panda_coins INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne panda_coins ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne panda_coins existe déjà';
  END IF;

  -- last_login_date (dernière connexion)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_date DATE;
    RAISE NOTICE '✅ Colonne last_login_date ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne last_login_date existe déjà';
  END IF;

  -- current_streak (nombre de jours consécutifs)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne current_streak ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne current_streak existe déjà';
  END IF;

  -- longest_streak (meilleur streak)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne longest_streak ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne longest_streak existe déjà';
  END IF;

  -- welcome_bonus_claimed (bonus de bienvenue réclamé)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'welcome_bonus_claimed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN welcome_bonus_claimed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Colonne welcome_bonus_claimed ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne welcome_bonus_claimed existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. Ajouter des commentaires pour la documentation
-- ============================================

COMMENT ON COLUMN profiles.panda_coins IS 'Points de fidélité de l''utilisateur (PandaCoins)';
COMMENT ON COLUMN profiles.last_login_date IS 'Date de la dernière connexion pour le système de streak';
COMMENT ON COLUMN profiles.current_streak IS 'Nombre de jours de connexion consécutifs';
COMMENT ON COLUMN profiles.longest_streak IS 'Meilleur streak de connexions consécutives';
COMMENT ON COLUMN profiles.welcome_bonus_claimed IS 'Indique si le bonus de bienvenue a été réclamé';

-- ============================================
-- 3. Créer la table points_transactions si elle n'existe pas
-- ============================================

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'daily_login', 'welcome_bonus', 'referral_bonus', 'purchase',
    'refund', 'admin_adjustment', 'reward_redemption', 'survey_completion',
    'charitable_donation', 'merchandise_purchase', 'subscription_purchase'
  )),
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id
ON points_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_points_transactions_type
ON points_transactions(type, created_at DESC);

COMMENT ON TABLE points_transactions IS 'Historique de toutes les transactions de points';

-- ============================================
-- 4. RLS pour points_transactions
-- ============================================

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
CREATE POLICY "Users can view own transactions"
ON points_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Le système peut insérer des transactions
DROP POLICY IF EXISTS "System can insert transactions" ON points_transactions;
CREATE POLICY "System can insert transactions"
ON points_transactions FOR INSERT
WITH CHECK (true);

-- ============================================
-- 5. Fonction pour enregistrer une transaction de points
-- ============================================

CREATE OR REPLACE FUNCTION record_points_transaction(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    related_id
  ) VALUES (
    p_user_id,
    p_points,
    p_type,
    p_description,
    p_related_id
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_points_transaction IS 'Enregistre une transaction de points dans l''historique';

-- ============================================
-- 6. Fonction pour le bonus de bienvenue
-- ============================================

CREATE OR REPLACE FUNCTION award_welcome_bonus(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_welcome_points INTEGER := 500;
  v_already_claimed BOOLEAN;
  v_current_points INTEGER;
BEGIN
  -- Vérifier si déjà réclamé
  SELECT welcome_bonus_claimed, panda_coins INTO v_already_claimed, v_current_points
  FROM profiles
  WHERE id = p_user_id;

  IF v_already_claimed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Bonus de bienvenue déjà réclamé'
    );
  END IF;

  -- Mettre à jour le profil
  UPDATE profiles
  SET
    panda_coins = COALESCE(panda_coins, 0) + v_welcome_points,
    welcome_bonus_claimed = true
  WHERE id = p_user_id;

  -- Enregistrer la transaction
  PERFORM record_points_transaction(
    p_user_id,
    v_welcome_points,
    'welcome_bonus',
    'Bonus de bienvenue'
  );

  RETURN json_build_object(
    'success', true,
    'points', v_welcome_points,
    'message', 'Bonus de bienvenue attribué'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_welcome_bonus IS 'Attribue le bonus de bienvenue à un nouvel utilisateur';

-- ============================================
-- 7. Fonction pour enregistrer la connexion quotidienne
-- ============================================

CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_login DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_points_earned INTEGER := 10; -- Points de base
  v_streak_bonus INTEGER := 0;
  v_total_points INTEGER;
  v_days_diff INTEGER;
BEGIN
  -- Récupérer les données actuelles
  SELECT
    last_login_date,
    COALESCE(current_streak, 0),
    COALESCE(longest_streak, 0),
    COALESCE(panda_coins, 0)
  INTO v_last_login, v_current_streak, v_longest_streak, v_total_points
  FROM profiles
  WHERE id = p_user_id;

  -- Si déjà connecté aujourd'hui
  IF v_last_login = v_today THEN
    RETURN json_build_object(
      'success', false,
      'already_logged_today', true,
      'message', 'Déjà connecté aujourd''hui'
    );
  END IF;

  -- Calculer le streak
  IF v_last_login IS NULL THEN
    -- Première connexion
    v_current_streak := 1;
  ELSE
    v_days_diff := v_today - v_last_login;

    IF v_days_diff = 1 THEN
      -- Connexion consécutive
      v_current_streak := v_current_streak + 1;
    ELSIF v_days_diff > 1 THEN
      -- Streak cassé
      v_current_streak := 1;
    END IF;
  END IF;

  -- Bonus de streak (tous les 7 jours)
  IF v_current_streak % 7 = 0 THEN
    v_streak_bonus := 50;
    v_points_earned := v_points_earned + v_streak_bonus;
  END IF;

  -- Bonus supplémentaire pour 30 jours
  IF v_current_streak >= 30 AND v_current_streak % 30 = 0 THEN
    v_streak_bonus := v_streak_bonus + 100;
    v_points_earned := v_points_earned + 100;
  END IF;

  -- Mettre à jour le meilleur streak
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Mettre à jour le profil
  UPDATE profiles
  SET
    last_login_date = v_today,
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    panda_coins = COALESCE(panda_coins, 0) + v_points_earned
  WHERE id = p_user_id;

  -- Enregistrer la transaction
  PERFORM record_points_transaction(
    p_user_id,
    v_points_earned,
    'daily_login',
    format('Connexion quotidienne - Jour %s', v_current_streak)
  );

  RETURN json_build_object(
    'success', true,
    'points', v_points_earned,
    'streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'streak_bonus', v_streak_bonus,
    'message', format('+%s points - Jour %s', v_points_earned, v_current_streak)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_daily_login IS 'Enregistre une connexion quotidienne et attribue les points de streak';

-- ============================================
-- 8. Créer des index pour les performances
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_last_login
ON profiles(last_login_date)
WHERE last_login_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_streak
ON profiles(current_streak DESC)
WHERE current_streak > 0;

CREATE INDEX IF NOT EXISTS idx_profiles_panda_coins
ON profiles(panda_coins DESC);

-- ============================================
-- 9. Initialiser les valeurs par défaut
-- ============================================

-- Mettre à jour les profils existants sans panda_coins
UPDATE profiles
SET panda_coins = 0
WHERE panda_coins IS NULL;

-- Mettre à jour les profils existants sans streak
UPDATE profiles
SET current_streak = 0
WHERE current_streak IS NULL;

UPDATE profiles
SET longest_streak = 0
WHERE longest_streak IS NULL;

-- Mettre à jour les profils existants sans welcome_bonus_claimed
UPDATE profiles
SET welcome_bonus_claimed = FALSE
WHERE welcome_bonus_claimed IS NULL;

-- ============================================
-- 10. Grant des permissions
-- ============================================

GRANT EXECUTE ON FUNCTION record_points_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION award_welcome_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION record_daily_login TO authenticated;

-- ============================================
-- 11. Statistiques du système de points
-- ============================================

-- Vue pour les statistiques
CREATE OR REPLACE VIEW points_statistics AS
SELECT
  COUNT(DISTINCT id) AS total_users_with_points,
  COALESCE(SUM(panda_coins), 0) AS total_points_in_circulation,
  COALESCE(AVG(panda_coins), 0) AS average_points_per_user,
  COALESCE(MAX(panda_coins), 0) AS highest_points,
  COALESCE(AVG(current_streak), 0) AS average_streak,
  COALESCE(MAX(current_streak), 0) AS longest_current_streak,
  COALESCE(MAX(longest_streak), 0) AS all_time_longest_streak
FROM profiles
WHERE panda_coins > 0;

COMMENT ON VIEW points_statistics IS 'Statistiques globales du système de points';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
DECLARE
  col_count INTEGER;
  func_count INTEGER;
BEGIN
  -- Compter les colonnes
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name IN ('panda_coins', 'last_login_date', 'current_streak', 'longest_streak', 'welcome_bonus_claimed');

  -- Compter les fonctions
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_name IN ('record_points_transaction', 'award_welcome_bonus', 'record_daily_login');

  -- Afficher le résultat
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration du système de points terminée !';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '📊 Colonnes ajoutées: % / 5', col_count;
  RAISE NOTICE '📊 Fonctions créées: % / 3', func_count;
  RAISE NOTICE '📊 Table points_transactions créée';
  RAISE NOTICE '';

  IF col_count = 5 AND func_count = 3 THEN
    RAISE NOTICE '🎉 Installation complète - Système de points prêt !';
    RAISE NOTICE '';
    RAISE NOTICE '📱 L''utilisateur recevra maintenant:';
    RAISE NOTICE '  • 500 PandaCoins de bienvenue';
    RAISE NOTICE '  • 10 PandaCoins par connexion quotidienne';
    RAISE NOTICE '  • +50 PandaCoins tous les 7 jours de streak';
    RAISE NOTICE '  • +100 PandaCoins tous les 30 jours de streak';
  ELSE
    RAISE NOTICE '⚠️ Installation partielle - Vérifier les erreurs ci-dessus';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
