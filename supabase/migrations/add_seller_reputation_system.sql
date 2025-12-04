-- =====================================================
-- SYSTÈME DE RÉPUTATION VENDEUR
-- =====================================================
-- Ce fichier ajoute les fonctions et triggers nécessaires
-- pour calculer et maintenir la réputation des vendeurs
-- =====================================================

-- =====================================================
-- FONCTION: Obtenir les statistiques de commandes d'un vendeur
-- =====================================================
CREATE OR REPLACE FUNCTION get_seller_order_stats(seller_id_param UUID)
RETURNS TABLE(
  response_rate NUMERIC,
  completion_rate NUMERIC,
  total_orders INTEGER,
  completed_orders INTEGER,
  avg_response_time_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH seller_orders AS (
    SELECT
      o.id,
      o.status,
      o.created_at
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = seller_id_param
    GROUP BY o.id, o.status, o.created_at
  ),
  order_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status IN ('delivered', 'confirmed')) AS completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
    FROM seller_orders
  ),
  -- Simuler un taux de réponse basé sur l'activité
  response_stats AS (
    SELECT
      CASE
        WHEN COUNT(*) > 0 THEN
          LEAST(100, 50 + (COUNT(*) * 2)) -- Commence à 50%, augmente avec l'activité
        ELSE 50
      END AS rate
    FROM seller_reviews
    WHERE seller_id = seller_id_param
  )
  SELECT
    COALESCE((SELECT rate FROM response_stats), 75)::NUMERIC AS response_rate,
    CASE
      WHEN os.total > 0 THEN
        ((os.completed::NUMERIC / os.total::NUMERIC) * 100)
      ELSE 85
    END AS completion_rate,
    os.total::INTEGER AS total_orders,
    os.completed::INTEGER AS completed_orders,
    NULL::NUMERIC AS avg_response_time_hours
  FROM order_stats os;
END;
$$;

COMMENT ON FUNCTION get_seller_order_stats IS 'Calcule les statistiques de commandes pour un vendeur';

-- =====================================================
-- FONCTION: Calculer et mettre à jour la note moyenne du vendeur
-- =====================================================
CREATE OR REPLACE FUNCTION update_seller_average_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
BEGIN
  -- Récupérer le seller_id depuis NEW ou OLD
  IF (TG_OP = 'DELETE') THEN
    v_seller_id := OLD.seller_id;
  ELSE
    v_seller_id := NEW.seller_id;
  END IF;

  -- Calculer la nouvelle moyenne et le nombre total d'avis
  SELECT
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_total_reviews
  FROM seller_reviews
  WHERE seller_id = v_seller_id;

  -- Mettre à jour le profil du vendeur
  UPDATE profiles
  SET
    average_rating = ROUND(v_avg_rating, 2),
    total_reviews = v_total_reviews,
    updated_at = NOW()
  WHERE id = v_seller_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_seller_average_rating IS 'Met à jour automatiquement la note moyenne et le nombre d''avis d''un vendeur';

-- =====================================================
-- TRIGGER: Mettre à jour la note moyenne lors de l'ajout/modification/suppression d'avis
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_seller_rating ON seller_reviews;

CREATE TRIGGER trigger_update_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_average_rating();

COMMENT ON TRIGGER trigger_update_seller_rating ON seller_reviews IS 'Déclenche la mise à jour de la note moyenne du vendeur';

-- =====================================================
-- FONCTION: Calculer le badge de réputation d'un vendeur
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_seller_badge(seller_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
  v_badge TEXT;
BEGIN
  -- Récupérer les statistiques du vendeur
  SELECT average_rating, total_reviews
  INTO v_avg_rating, v_total_reviews
  FROM profiles
  WHERE id = seller_id_param;

  -- Calculer le badge selon des critères
  IF v_avg_rating >= 4.9 AND v_total_reviews >= 100 THEN
    v_badge := 'platinum';
  ELSIF v_avg_rating >= 4.7 AND v_total_reviews >= 50 THEN
    v_badge := 'gold';
  ELSIF v_avg_rating >= 4.5 AND v_total_reviews >= 20 THEN
    v_badge := 'silver';
  ELSIF v_avg_rating >= 4.0 AND v_total_reviews >= 5 THEN
    v_badge := 'bronze';
  ELSE
    v_badge := NULL;
  END IF;

  RETURN v_badge;
END;
$$;

COMMENT ON FUNCTION calculate_seller_badge IS 'Calcule le badge de réputation d''un vendeur basé sur sa note et son nombre d''avis';

-- =====================================================
-- FONCTION: Mettre à jour automatiquement le badge de réputation
-- =====================================================
CREATE OR REPLACE FUNCTION update_seller_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_badge TEXT;
BEGIN
  -- Calculer le nouveau badge
  v_new_badge := calculate_seller_badge(NEW.id);

  -- Mettre à jour uniquement si le badge a changé
  IF v_new_badge IS DISTINCT FROM NEW.seller_badge THEN
    NEW.seller_badge := v_new_badge;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_seller_badge IS 'Met à jour automatiquement le badge de réputation lors de la modification du profil';

-- =====================================================
-- TRIGGER: Mettre à jour le badge lors de la modification du profil
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_seller_badge ON profiles;

CREATE TRIGGER trigger_update_seller_badge
  BEFORE UPDATE OF average_rating, total_reviews ON profiles
  FOR EACH ROW
  WHEN (OLD.is_seller = TRUE AND NEW.is_seller = TRUE)
  EXECUTE FUNCTION update_seller_badge();

COMMENT ON TRIGGER trigger_update_seller_badge ON profiles IS 'Déclenche la mise à jour du badge de réputation du vendeur';

-- =====================================================
-- FONCTION: Obtenir le classement des meilleurs vendeurs
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_sellers(
  limit_param INTEGER DEFAULT 10,
  min_reviews INTEGER DEFAULT 5
)
RETURNS TABLE(
  seller_id UUID,
  shop_name TEXT,
  shop_logo_url TEXT,
  average_rating NUMERIC,
  total_reviews INTEGER,
  seller_badge TEXT,
  verified_seller BOOLEAN,
  reputation_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS seller_id,
    p.shop_name,
    p.shop_logo_url,
    p.average_rating,
    p.total_reviews,
    p.seller_badge,
    p.verified_seller,
    -- Calcul d'un score de réputation simplifié
    (
      (p.average_rating * 20) + -- Note sur 100
      (LEAST(p.total_reviews, 100) * 0.5) -- Nombre d'avis (max 50 points)
    )::INTEGER AS reputation_score
  FROM profiles p
  WHERE
    p.is_seller = TRUE
    AND p.total_reviews >= min_reviews
    AND p.average_rating >= 4.0
  ORDER BY
    reputation_score DESC,
    p.average_rating DESC,
    p.total_reviews DESC
  LIMIT limit_param;
END;
$$;

COMMENT ON FUNCTION get_top_sellers IS 'Récupère le classement des meilleurs vendeurs par réputation';

-- =====================================================
-- FONCTION: Obtenir les statistiques détaillées de réputation d'un vendeur
-- =====================================================
CREATE OR REPLACE FUNCTION get_seller_reputation_details(seller_id_param UUID)
RETURNS TABLE(
  seller_id UUID,
  average_rating NUMERIC,
  total_reviews INTEGER,
  total_votes INTEGER,
  positive_reviews INTEGER,
  neutral_reviews INTEGER,
  negative_reviews INTEGER,
  communication_rating NUMERIC,
  shipping_speed_rating NUMERIC,
  seller_badge TEXT,
  verified_seller BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH review_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE rating >= 4) AS positive,
      COUNT(*) FILTER (WHERE rating = 3) AS neutral,
      COUNT(*) FILTER (WHERE rating <= 2) AS negative,
      AVG(communication_rating) AS avg_communication,
      AVG(shipping_speed_rating) AS avg_shipping
    FROM seller_reviews
    WHERE seller_reviews.seller_id = seller_id_param
  ),
  vote_stats AS (
    SELECT
      COALESCE(SUM(pr.helpful_count), 0) AS total_votes
    FROM product_reviews pr
    JOIN products p ON pr.product_id = p.id
    WHERE p.seller_id = seller_id_param
  )
  SELECT
    p.id AS seller_id,
    p.average_rating,
    p.total_reviews,
    vs.total_votes::INTEGER,
    COALESCE(rs.positive, 0)::INTEGER AS positive_reviews,
    COALESCE(rs.neutral, 0)::INTEGER AS neutral_reviews,
    COALESCE(rs.negative, 0)::INTEGER AS negative_reviews,
    ROUND(COALESCE(rs.avg_communication, 0), 2) AS communication_rating,
    ROUND(COALESCE(rs.avg_shipping, 0), 2) AS shipping_speed_rating,
    p.seller_badge,
    p.verified_seller
  FROM profiles p
  CROSS JOIN vote_stats vs
  LEFT JOIN review_stats rs ON TRUE
  WHERE p.id = seller_id_param;
END;
$$;

COMMENT ON FUNCTION get_seller_reputation_details IS 'Récupère les statistiques détaillées de réputation d''un vendeur';

-- =====================================================
-- VUE: Vue simplifiée des vendeurs avec leur réputation
-- =====================================================
CREATE OR REPLACE VIEW seller_reputation_view AS
SELECT
  p.id AS seller_id,
  p.shop_name,
  p.shop_logo_url,
  p.average_rating,
  p.total_reviews,
  p.seller_badge,
  p.verified_seller,
  p.is_premium,
  p.subscription_plan,
  -- Calcul du score de réputation
  (
    (p.average_rating * 20) +
    (LEAST(p.total_reviews, 100) * 0.5)
  )::INTEGER AS reputation_score,
  -- Niveau de réputation basé sur le score
  CASE
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 95 THEN 'diamond'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 80 THEN 'platinum'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 60 THEN 'gold'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 40 THEN 'silver'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 20 THEN 'bronze'
    ELSE 'nouveau'
  END AS reputation_level
FROM profiles p
WHERE p.is_seller = TRUE;

COMMENT ON VIEW seller_reputation_view IS 'Vue des vendeurs avec leur score et niveau de réputation calculés';

-- =====================================================
-- INDEX: Améliorer les performances des requêtes de réputation
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_rating
  ON seller_reviews(seller_id, rating);

CREATE INDEX IF NOT EXISTS idx_product_reviews_helpful_count
  ON product_reviews(helpful_count) WHERE helpful_count > 0;

CREATE INDEX IF NOT EXISTS idx_profiles_seller_reputation
  ON profiles(is_seller, average_rating DESC, total_reviews DESC)
  WHERE is_seller = TRUE;

-- =====================================================
-- PERMISSIONS RLS
-- =====================================================
-- Les fonctions sont SECURITY DEFINER, elles s'exécutent avec les permissions du créateur
-- Autoriser l'accès public en lecture à la vue
GRANT SELECT ON seller_reputation_view TO anon, authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
