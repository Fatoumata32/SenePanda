-- ============================================================================
-- SCRIPT DE DÉPLOIEMENT COMPLET - SENEPANDA V2.0
-- ============================================================================
-- Ce script déploie toutes les nouvelles fonctionnalités :
-- 1. Système de points bonus
-- 2. Logique d'accès par abonnement
-- 3. Filtrage des boutiques
-- 4. Triggers de protection
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : SYSTÈME DE POINTS BONUS
-- ============================================================================

-- Table pour suivre les séries de connexion quotidienne
CREATE TABLE IF NOT EXISTS daily_login_streak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  streak_count INTEGER DEFAULT 1,
  points_awarded INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_daily_login_user_date ON daily_login_streak(user_id, login_date DESC);

-- Fonction : Enregistrer connexion quotidienne
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
    -- Continuer la série
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_login IS NULL OR v_last_login < v_yesterday THEN
    -- Réinitialiser la série
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

  -- Mettre à jour les points du profil
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

-- Fonction : Attribuer points d'achat
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

  -- Attribuer les points
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

-- Fonction : Attribuer points d'avis
CREATE OR REPLACE FUNCTION award_review_points(
  p_user_id UUID,
  p_review_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_points INTEGER := 5;
  v_review_text TEXT;
  v_has_images BOOLEAN;
BEGIN
  -- Récupérer les détails de l'avis
  SELECT comment, (images IS NOT NULL AND array_length(images, 1) > 0)
  INTO v_review_text, v_has_images
  FROM product_reviews
  WHERE id = p_review_id AND user_id = p_user_id;

  -- Points selon la qualité
  IF v_has_images THEN
    v_points := 20;
  ELSIF LENGTH(v_review_text) > 100 THEN
    v_points := 10;
  END IF;

  -- Attribuer les points
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + v_points,
    loyalty_points = COALESCE(loyalty_points, 0) + v_points
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'points_awarded', v_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 2 : LOGIQUE D'ACCÈS PAR ABONNEMENT
-- ============================================================================

-- Fonction : Vérifier si abonnement actif
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

  -- Plan gratuit = pas d'accès
  IF v_plan = 'free' OR v_plan IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Plan payant = vérifier expiration
  IF v_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Compter produits d'un vendeur
CREATE OR REPLACE FUNCTION get_seller_product_count(seller_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  product_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO product_count
  FROM products
  WHERE seller_id = seller_user_id;

  RETURN COALESCE(product_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Vérifier si peut ajouter un produit
CREATE OR REPLACE FUNCTION can_seller_add_product(seller_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
  v_product_count INTEGER;
  v_max_products INTEGER;
BEGIN
  -- Récupérer le plan
  SELECT subscription_plan, subscription_expires_at
  INTO v_plan, v_expires_at
  FROM profiles
  WHERE id = seller_user_id;

  -- Vérifier si abonnement actif
  IF NOT is_seller_subscription_active(seller_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtenir le nombre de produits
  v_product_count := get_seller_product_count(seller_user_id);

  -- Déterminer la limite
  v_max_products := CASE v_plan
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 200
    WHEN 'premium' THEN 999999
    ELSE 0
  END;

  RETURN v_product_count < v_max_products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : Vérifier limite avant insertion
CREATE OR REPLACE FUNCTION check_product_limit_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_seller_add_product(NEW.seller_id) THEN
    RAISE EXCEPTION 'Vous avez atteint la limite de produits de votre plan ou votre abonnement est inactif.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS enforce_product_limit ON products;
CREATE TRIGGER enforce_product_limit
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION check_product_limit_before_insert();

-- ============================================================================
-- PARTIE 3 : VUE ET POLITIQUE RLS
-- ============================================================================

-- Vue : Produits des vendeurs avec abonnement actif
CREATE OR REPLACE VIEW active_seller_products AS
SELECT p.*
FROM products p
INNER JOIN profiles pr ON p.seller_id = pr.id
WHERE
  p.is_active = TRUE
  AND (
    pr.subscription_plan != 'free'
    AND pr.subscription_plan IS NOT NULL
    AND pr.subscription_expires_at > NOW()
  );

-- RLS Policy : Seuls produits de vendeurs abonnés visibles
DROP POLICY IF EXISTS "Public can view active products from subscribed sellers" ON products;
CREATE POLICY "Public can view active products from subscribed sellers"
ON products FOR SELECT
USING (
  is_active = TRUE
  AND is_seller_subscription_active(seller_id)
);

-- ============================================================================
-- PARTIE 4 : INDEX POUR PERFORMANCE
-- ============================================================================

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_products_seller_active
ON products(seller_id, is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription
ON profiles(subscription_plan, subscription_expires_at);

CREATE INDEX IF NOT EXISTS idx_profiles_points
ON profiles(total_points DESC);

-- ============================================================================
-- PARTIE 5 : COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION record_daily_login IS 'Enregistre la connexion quotidienne et attribue des points avec bonus de série';
COMMENT ON FUNCTION award_purchase_points IS 'Attribue des points bonus après un achat (1% du montant)';
COMMENT ON FUNCTION award_review_points IS 'Attribue des points bonus après un avis produit (5-20 points)';
COMMENT ON FUNCTION is_seller_subscription_active IS 'Vérifie si un vendeur a un abonnement actif';
COMMENT ON FUNCTION get_seller_product_count IS 'Retourne le nombre de produits d''un vendeur';
COMMENT ON FUNCTION can_seller_add_product IS 'Vérifie si un vendeur peut ajouter plus de produits selon son plan';
COMMENT ON FUNCTION check_product_limit_before_insert IS 'Trigger vérifiant la limite de produits avant insertion';
COMMENT ON VIEW active_seller_products IS 'Vue des produits uniquement des vendeurs avec abonnement actif';
COMMENT ON TABLE daily_login_streak IS 'Table de suivi des connexions quotidiennes et séries';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Toutes les fonctionnalités ont été déployées avec succès !';
  RAISE NOTICE '📊 Fonctions créées : 6';
  RAISE NOTICE '🔒 Policies RLS : 1';
  RAISE NOTICE '👁️ Vues : 1';
  RAISE NOTICE '⚡ Triggers : 1';
  RAISE NOTICE '📈 Index : 4';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape : Tester les fonctions avec des données de test';
END $$;

-- ============================================================================
-- REQUÊTES DE TEST (À EXÉCUTER SÉPARÉMENT)
-- ============================================================================

/*
-- Test 1 : Connexion quotidienne
SELECT * FROM record_daily_login('user-id-here');

-- Test 2 : Vérifier série
SELECT * FROM daily_login_streak WHERE user_id = 'user-id-here' ORDER BY login_date DESC;

-- Test 3 : Vérifier abonnement actif
SELECT is_seller_subscription_active('user-id-here');

-- Test 4 : Compter produits
SELECT get_seller_product_count('user-id-here');

-- Test 5 : Vérifier si peut ajouter produit
SELECT can_seller_add_product('user-id-here');

-- Test 6 : Voir produits actifs
SELECT * FROM active_seller_products LIMIT 10;

-- Test 7 : Vérifier points
SELECT id, first_name, total_points, loyalty_points, subscription_plan
FROM profiles
WHERE id = 'user-id-here';
*/
