-- ============================================================================
-- FIX COLONNES MANQUANTES - Profiles et Tables Associées
-- ============================================================================
-- Ce script ajoute toutes les colonnes manquantes pour :
-- 1. Système de points (total_points, loyalty_points)
-- 2. Système d'abonnement (champs supplémentaires)
-- 3. Système de parrainage (referral_code, referred_by)
-- 4. Autres colonnes optionnelles
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : AJOUTER COLONNES MANQUANTES À PROFILES
-- ============================================================================

-- Fonction helper pour ajouter colonne si elle n'existe pas
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table_name TEXT,
  p_column_name TEXT,
  p_column_definition TEXT
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s',
      p_table_name, p_column_name, p_column_definition);
    RAISE NOTICE '✅ Colonne %.% ajoutée', p_table_name, p_column_name;
  ELSE
    RAISE NOTICE 'ℹ️  Colonne %.% existe déjà', p_table_name, p_column_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ajouter toutes les colonnes manquantes à profiles
DO $$
BEGIN
  -- Colonnes de points
  PERFORM add_column_if_not_exists('profiles', 'total_points', 'INTEGER DEFAULT 0');
  PERFORM add_column_if_not_exists('profiles', 'loyalty_points', 'INTEGER DEFAULT 0');
  PERFORM add_column_if_not_exists('profiles', 'redeemed_points', 'INTEGER DEFAULT 0');

  -- Colonnes d'abonnement (au cas où)
  PERFORM add_column_if_not_exists('profiles', 'subscription_plan', 'TEXT DEFAULT ''free''');
  PERFORM add_column_if_not_exists('profiles', 'subscription_expires_at', 'TIMESTAMPTZ');
  PERFORM add_column_if_not_exists('profiles', 'is_premium', 'BOOLEAN DEFAULT false');

  -- Colonnes de parrainage
  PERFORM add_column_if_not_exists('profiles', 'referral_code', 'TEXT UNIQUE');
  PERFORM add_column_if_not_exists('profiles', 'referred_by', 'UUID REFERENCES profiles(id)');
  PERFORM add_column_if_not_exists('profiles', 'total_referrals', 'INTEGER DEFAULT 0');

  -- Colonnes de boutique
  PERFORM add_column_if_not_exists('profiles', 'shop_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_description', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'logo_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'banner_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'gradient_colors', 'TEXT[]');
  PERFORM add_column_if_not_exists('profiles', 'theme_style', 'TEXT DEFAULT ''modern''');

  -- Colonnes supplémentaires
  PERFORM add_column_if_not_exists('profiles', 'location', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'date_of_birth', 'DATE');
  PERFORM add_column_if_not_exists('profiles', 'bio', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'avatar_url', 'TEXT');

  RAISE NOTICE '';
  RAISE NOTICE '✅ Vérification des colonnes profiles terminée';
END $$;

-- ============================================================================
-- PARTIE 2 : GÉNÉRER CODES DE PARRAINAGE POUR UTILISATEURS EXISTANTS
-- ============================================================================

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer code aléatoire de 8 caractères
    v_code := upper(substring(md5(random()::text) from 1 for 8));

    -- Vérifier s'il existe déjà
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = v_code) INTO v_exists;

    -- Si unique, sortir de la boucle
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Générer des codes pour les utilisateurs qui n'en ont pas
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- ============================================================================
-- PARTIE 3 : METTRE À JOUR FONCTIONS POUR UTILISER LES BONNES COLONNES
-- ============================================================================

-- Fonction : Enregistrer connexion quotidienne (mise à jour)
CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_login DATE;
  v_current_streak INTEGER := 1;
  v_points_to_award INTEGER := 10;
  v_bonus_points INTEGER := 0;
  v_total_points INTEGER;
  v_message TEXT;
BEGIN
  -- Vérifier si déjà connecté aujourd'hui
  IF EXISTS (
    SELECT 1 FROM daily_login_streak
    WHERE user_id = p_user_id AND login_date = v_today
  ) THEN
    RETURN json_build_object(
      'success', true,
      'already_logged', true,
      'message', 'Déjà connecté aujourd''hui'
    );
  END IF;

  -- Obtenir la dernière connexion
  SELECT login_date, streak_count INTO v_last_login, v_current_streak
  FROM daily_login_streak
  WHERE user_id = p_user_id
  ORDER BY login_date DESC
  LIMIT 1;

  -- Calculer la série
  IF v_last_login = v_yesterday THEN
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_login IS NULL OR v_last_login < v_yesterday THEN
    v_current_streak := 1;
  END IF;

  -- Calculer les bonus de série
  IF v_current_streak >= 90 THEN
    v_bonus_points := 500;
    v_message := '🔥 Série de 90 jours ! Bonus de 500 points !';
  ELSIF v_current_streak >= 30 THEN
    v_bonus_points := 200;
    v_message := '🔥 Série de 30 jours ! Bonus de 200 points !';
  ELSIF v_current_streak >= 7 THEN
    v_bonus_points := 50;
    v_message := '🔥 Série de 7 jours ! Bonus de 50 points !';
  ELSE
    v_message := '✅ +10 points pour la connexion quotidienne';
  END IF;

  v_total_points := v_points_to_award + v_bonus_points;

  -- Enregistrer la connexion
  INSERT INTO daily_login_streak (user_id, login_date, streak_count, points_awarded)
  VALUES (p_user_id, v_today, v_current_streak, v_total_points);

  -- Mettre à jour les points du profil (avec COALESCE pour gérer NULL)
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_total_points,
    loyalty_points = COALESCE(loyalty_points, 0) + v_total_points
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'points', v_total_points,
    'streak', v_current_streak,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Attribuer points d'achat (mise à jour)
CREATE OR REPLACE FUNCTION award_purchase_points(
  p_user_id UUID,
  p_order_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_order_amount NUMERIC;
  v_points_to_award INTEGER;
  v_multiplier NUMERIC := 1.0;
  v_subscription_plan TEXT;
BEGIN
  -- Obtenir le montant de la commande
  SELECT total_amount INTO v_order_amount
  FROM orders
  WHERE id = p_order_id AND user_id = p_user_id;

  IF v_order_amount IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;

  -- Obtenir le plan d'abonnement pour le multiplicateur
  SELECT subscription_plan INTO v_subscription_plan
  FROM profiles
  WHERE id = p_user_id;

  -- Appliquer le multiplicateur selon le plan
  v_multiplier := CASE v_subscription_plan
    WHEN 'premium' THEN 2.0
    WHEN 'pro' THEN 1.5
    WHEN 'starter' THEN 1.2
    ELSE 1.0
  END;

  -- Calculer les points (1% du montant)
  v_points_to_award := FLOOR((v_order_amount * 0.01) * v_multiplier);

  -- Attribuer les points (avec COALESCE)
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_points_to_award,
    loyalty_points = COALESCE(loyalty_points, 0) + v_points_to_award
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'points_awarded', v_points_to_award,
    'multiplier', v_multiplier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 4 : CRÉER INDEX POUR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan, subscription_expires_at);

-- ============================================================================
-- PARTIE 5 : TRIGGER POUR METTRE À JOUR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 6 : INITIALISER POINTS POUR UTILISATEURS EXISTANTS
-- ============================================================================

-- Mettre à 0 les points NULL pour éviter les erreurs
UPDATE profiles
SET
  total_points = COALESCE(total_points, 0),
  loyalty_points = COALESCE(loyalty_points, 0),
  redeemed_points = COALESCE(redeemed_points, 0),
  total_referrals = COALESCE(total_referrals, 0)
WHERE
  total_points IS NULL
  OR loyalty_points IS NULL
  OR redeemed_points IS NULL
  OR total_referrals IS NULL;

-- ============================================================================
-- PARTIE 7 : VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier colonnes points
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('total_points', 'loyalty_points', 'redeemed_points');

  IF v_count = 3 THEN
    RAISE NOTICE '✅ Toutes les colonnes de points existent';
  ELSE
    RAISE WARNING '⚠️  Manque des colonnes de points (trouvé %/3)', v_count;
  END IF;

  -- Vérifier codes de parrainage
  SELECT COUNT(*) INTO v_count
  FROM profiles
  WHERE referral_code IS NULL;

  IF v_count = 0 THEN
    RAISE NOTICE '✅ Tous les utilisateurs ont un code de parrainage';
  ELSE
    RAISE NOTICE 'ℹ️  % utilisateurs sans code de parrainage', v_count;
  END IF;
END $$;

-- ============================================================================
-- MESSAGES FINAUX
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ COLONNES MANQUANTES AJOUTÉES AVEC SUCCÈS';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes ajoutées :';
  RAISE NOTICE '  • total_points, loyalty_points, redeemed_points';
  RAISE NOTICE '  • referral_code, referred_by, total_referrals';
  RAISE NOTICE '  • shop_name, shop_description, logo_url, banner_url';
  RAISE NOTICE '  • gradient_colors, theme_style';
  RAISE NOTICE '  • location, date_of_birth, bio, avatar_url';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions mises à jour :';
  RAISE NOTICE '  • record_daily_login';
  RAISE NOTICE '  • award_purchase_points';
  RAISE NOTICE '';
  RAISE NOTICE 'Index créés pour performance';
  RAISE NOTICE 'Triggers mis à jour';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Redémarrer l''application pour appliquer les changements';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
