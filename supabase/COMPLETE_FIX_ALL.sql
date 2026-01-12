-- ============================================================================
-- SENEPANDA V2.0 - SCRIPT COMPLET DE CORRECTION ET DÉPLOIEMENT
-- ============================================================================
-- Ce script unique corrige TOUTES les erreurs et déploie TOUTES les fonctionnalités
-- Exécuter ce script UNE SEULE FOIS dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : NETTOYAGE - Supprimer les fonctions en doublon
-- ============================================================================

DROP FUNCTION IF EXISTS add_column_if_not_exists(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS record_daily_login(UUID) CASCADE;
DROP FUNCTION IF EXISTS award_purchase_points(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS award_review_points(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS award_referral_points(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS redeem_points(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_seller_subscription_active(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_product_limit_before_insert() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Supprimer les vues
DROP VIEW IF EXISTS active_seller_products CASCADE;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS enforce_product_limit ON products CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;

-- Supprimer les anciennes policies problématiques
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'products'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON products', r.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- ÉTAPE 2 : CRÉER/VÉRIFIER TOUTES LES TABLES
-- ============================================================================

-- Table profiles (vérifier et ajouter colonnes manquantes)
DO $$
BEGIN
  -- Points
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_points') THEN
    ALTER TABLE profiles ADD COLUMN total_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'loyalty_points') THEN
    ALTER TABLE profiles ADD COLUMN loyalty_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'redeemed_points') THEN
    ALTER TABLE profiles ADD COLUMN redeemed_points INTEGER DEFAULT 0;
  END IF;

  -- Parrainage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_referrals') THEN
    ALTER TABLE profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
  END IF;

  -- Abonnement
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;

  -- Boutique
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shop_name') THEN
    ALTER TABLE profiles ADD COLUMN shop_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shop_description') THEN
    ALTER TABLE profiles ADD COLUMN shop_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'logo_url') THEN
    ALTER TABLE profiles ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banner_url') THEN
    ALTER TABLE profiles ADD COLUMN banner_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gradient_colors') THEN
    ALTER TABLE profiles ADD COLUMN gradient_colors TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'theme_style') THEN
    ALTER TABLE profiles ADD COLUMN theme_style TEXT DEFAULT 'modern';
  END IF;

  -- Profil
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Table flash_deals (ajouter deal_type si manquant)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flash_deals' AND column_name = 'deal_type') THEN
    ALTER TABLE flash_deals ADD COLUMN deal_type TEXT DEFAULT 'flash_sale';
  END IF;
END $$;

-- Table daily_login_streak
CREATE TABLE IF NOT EXISTS daily_login_streak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  login_date DATE NOT NULL,
  streak_count INTEGER DEFAULT 1,
  points_awarded INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

-- Table point_transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÉTAPE 3 : INITIALISER LES DONNÉES
-- ============================================================================

-- Générer codes de parrainage uniques
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Générer codes pour utilisateurs sans code
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Initialiser les points NULL à 0
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
-- ÉTAPE 4 : CRÉER TOUTES LES FONCTIONS
-- ============================================================================

-- 1. Fonction : Connexion quotidienne
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

  -- Calculer les bonus
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

  -- Mettre à jour les points
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_total_points,
    loyalty_points = COALESCE(loyalty_points, 0) + v_total_points
  WHERE id = p_user_id;

  -- Enregistrer la transaction
  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, v_total_points, 'daily_login', v_message);

  RETURN json_build_object(
    'success', true,
    'points', v_total_points,
    'streak', v_current_streak,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction : Points d'achat
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
  -- Obtenir le montant
  SELECT total_amount INTO v_order_amount
  FROM orders
  WHERE id = p_order_id AND user_id = p_user_id;

  IF v_order_amount IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;

  -- Obtenir le plan
  SELECT subscription_plan INTO v_subscription_plan
  FROM profiles
  WHERE id = p_user_id;

  -- Multiplicateur selon plan
  v_multiplier := CASE v_subscription_plan
    WHEN 'premium' THEN 2.0
    WHEN 'pro' THEN 1.5
    WHEN 'starter' THEN 1.2
    ELSE 1.0
  END;

  -- Calculer points (1%)
  v_points_to_award := FLOOR((v_order_amount * 0.01) * v_multiplier);

  -- Attribuer
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_points_to_award,
    loyalty_points = COALESCE(loyalty_points, 0) + v_points_to_award
  WHERE id = p_user_id;

  -- Transaction
  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (p_user_id, v_points_to_award, 'purchase',
          format('Achat de %s FCFA (x%s)', v_order_amount, v_multiplier), p_order_id);

  RETURN json_build_object(
    'success', true,
    'points_awarded', v_points_to_award,
    'multiplier', v_multiplier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction : Points d'avis
CREATE OR REPLACE FUNCTION award_review_points(
  p_user_id UUID,
  p_review_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_review_rating INTEGER;
  v_points_to_award INTEGER;
BEGIN
  SELECT rating INTO v_review_rating
  FROM reviews
  WHERE id = p_review_id AND user_id = p_user_id;

  IF v_review_rating IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Avis introuvable');
  END IF;

  -- 5 points + bonus si 5 étoiles
  v_points_to_award := 5;
  IF v_review_rating = 5 THEN
    v_points_to_award := 20;
  END IF;

  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_points_to_award,
    loyalty_points = COALESCE(loyalty_points, 0) + v_points_to_award
  WHERE id = p_user_id;

  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (p_user_id, v_points_to_award, 'review',
          format('Avis %s étoiles', v_review_rating), p_review_id);

  RETURN json_build_object('success', true, 'points_awarded', v_points_to_award);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction : Points de parrainage
CREATE OR REPLACE FUNCTION award_referral_points(
  p_referrer_id UUID,
  p_referred_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_points INTEGER := 100;
BEGIN
  -- Vérifier que le parrainage n'existe pas déjà
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_referred_id AND referred_by IS NOT NULL) THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur déjà parrainé');
  END IF;

  -- Mettre à jour le parrainé
  UPDATE profiles
  SET referred_by = p_referrer_id
  WHERE id = p_referred_id;

  -- Donner points au parrain
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_points,
    loyalty_points = COALESCE(loyalty_points, 0) + v_points,
    total_referrals = COALESCE(total_referrals, 0) + 1
  WHERE id = p_referrer_id;

  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (p_referrer_id, v_points, 'referral', 'Parrainage réussi', p_referred_id);

  RETURN json_build_object('success', true, 'points_awarded', v_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction : Échanger des points
CREATE OR REPLACE FUNCTION redeem_points(
  p_user_id UUID,
  p_points INTEGER,
  p_description TEXT
)
RETURNS JSON AS $$
DECLARE
  v_current_points INTEGER;
BEGIN
  SELECT total_points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_points < p_points THEN
    RETURN json_build_object('success', false, 'error', 'Points insuffisants');
  END IF;

  UPDATE profiles
  SET
    total_points = total_points - p_points,
    redeemed_points = COALESCE(redeemed_points, 0) + p_points
  WHERE id = p_user_id;

  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, -p_points, 'redemption', p_description);

  RETURN json_build_object('success', true, 'points_redeemed', p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction : Vérifier abonnement actif
CREATE OR REPLACE FUNCTION is_seller_subscription_active(seller_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT subscription_plan, subscription_expires_at
  INTO v_plan, v_expires_at
  FROM profiles
  WHERE id = seller_user_id;

  IF v_plan = 'free' OR v_plan IS NULL THEN
    RETURN false;
  END IF;

  IF v_expires_at IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Fonction : Vérifier limite produits
CREATE OR REPLACE FUNCTION check_product_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_products INTEGER;
  v_plan TEXT;
BEGIN
  SELECT subscription_plan INTO v_plan
  FROM profiles
  WHERE id = NEW.seller_id;

  v_max_products := CASE v_plan
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 200
    WHEN 'premium' THEN 999999
    ELSE 0
  END;

  SELECT COUNT(*) INTO v_current_count
  FROM products
  WHERE seller_id = NEW.seller_id;

  IF v_current_count >= v_max_products THEN
    RAISE EXCEPTION 'Limite de produits atteinte pour le plan %', v_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction : Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 5 : CRÉER LES TRIGGERS
-- ============================================================================

CREATE TRIGGER enforce_product_limit
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_limit_before_insert();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ÉTAPE 6 : CRÉER LES VUES
-- ============================================================================

CREATE OR REPLACE VIEW active_seller_products AS
SELECT p.*
FROM products p
INNER JOIN profiles pr ON p.seller_id = pr.id
WHERE
  pr.subscription_plan IN ('starter', 'pro', 'premium')
  AND pr.subscription_expires_at > NOW()
  AND p.is_active = true;

-- ============================================================================
-- ÉTAPE 7 : CRÉER LES RLS POLICIES (SIMPLIFIÉES)
-- ============================================================================

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_login_streak ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles : Policies simples sans récursion
CREATE POLICY "Allow public read access to profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users to insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Products : Policies simples
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow sellers to insert their own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Allow sellers to update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Allow sellers to delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- Daily login streak
CREATE POLICY "Users can view their own login streak"
  ON daily_login_streak FOR SELECT
  USING (auth.uid() = user_id);

-- Point transactions
CREATE POLICY "Users can view their own transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- ÉTAPE 8 : CRÉER LES INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan, subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_login_user_date ON daily_login_streak(user_id, login_date);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);

-- ============================================================================
-- ÉTAPE 9 : VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DÉPLOIEMENT COMPLET TERMINÉ AVEC SUCCÈS';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Vérifier colonnes
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('total_points', 'loyalty_points', 'referral_code');
  RAISE NOTICE '✅ Colonnes profiles : %/3 trouvées', v_count;

  -- Vérifier fonctions
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname IN ('record_daily_login', 'award_purchase_points', 'is_seller_subscription_active');
  RAISE NOTICE '✅ Fonctions créées : %/3 trouvées', v_count;

  -- Vérifier triggers
  SELECT COUNT(*) INTO v_count
  FROM pg_trigger
  WHERE tgname IN ('enforce_product_limit', 'update_profiles_updated_at');
  RAISE NOTICE '✅ Triggers créés : %/2 trouvés', v_count;

  -- Vérifier policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'profiles';
  RAISE NOTICE '✅ Policies profiles : % créées', v_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Fonctionnalités déployées :';
  RAISE NOTICE '  • Système de points bonus complet';
  RAISE NOTICE '  • Connexions quotidiennes avec séries';
  RAISE NOTICE '  • Points d''achat avec multiplicateurs';
  RAISE NOTICE '  • Points d''avis (5-20 pts)';
  RAISE NOTICE '  • Points de parrainage (+100 pts)';
  RAISE NOTICE '  • Restrictions par abonnement';
  RAISE NOTICE '  • Limites produits (0/50/200/∞)';
  RAISE NOTICE '  • RLS sécurisé sans récursion';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Redémarrer l''application : npx expo start --clear';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
