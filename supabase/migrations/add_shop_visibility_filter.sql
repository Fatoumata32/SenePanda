-- Migration: Ajouter filtre pour masquer les boutiques/produits des vendeurs sans abonnement actif

-- Fonction pour vérifier si un vendeur a un abonnement actif
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

  -- Si le plan est gratuit, pas d'accès
  IF v_plan = 'free' OR v_plan IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Si le plan est payant, vérifier l'expiration
  IF v_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si l'abonnement n'est pas expiré
  RETURN v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour les produits avec vérification d'abonnement
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

-- Commenter pour expliquer la vue
COMMENT ON VIEW active_seller_products IS 'Produits des vendeurs avec abonnement actif uniquement';

-- RLS Policy pour la table products - Lecture publique seulement des produits de vendeurs avec abonnement actif
DROP POLICY IF EXISTS "Public can view active products from subscribed sellers" ON products;
CREATE POLICY "Public can view active products from subscribed sellers"
ON products FOR SELECT
USING (
  is_active = TRUE
  AND is_seller_subscription_active(seller_id)
);

-- Fonction pour obtenir le nombre de produits d'un vendeur
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

-- Fonction pour vérifier si un vendeur peut ajouter plus de produits
CREATE OR REPLACE FUNCTION can_seller_add_product(seller_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
  v_product_count INTEGER;
  v_max_products INTEGER;
BEGIN
  -- Récupérer le plan et l'expiration
  SELECT subscription_plan, subscription_expires_at
  INTO v_plan, v_expires_at
  FROM profiles
  WHERE id = seller_user_id;

  -- Vérifier si l'abonnement est actif
  IF NOT is_seller_subscription_active(seller_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtenir le nombre de produits actuels
  v_product_count := get_seller_product_count(seller_user_id);

  -- Déterminer la limite selon le plan
  v_max_products := CASE v_plan
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 200
    WHEN 'premium' THEN 999999
    ELSE 0
  END;

  -- Vérifier si la limite n'est pas atteinte
  RETURN v_product_count < v_max_products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier avant l'insertion d'un produit
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

-- Commentaires
COMMENT ON FUNCTION is_seller_subscription_active IS 'Vérifie si un vendeur a un abonnement actif';
COMMENT ON FUNCTION get_seller_product_count IS 'Retourne le nombre de produits d\'un vendeur';
COMMENT ON FUNCTION can_seller_add_product IS 'Vérifie si un vendeur peut ajouter plus de produits selon son plan';
COMMENT ON FUNCTION check_product_limit_before_insert IS 'Vérifie la limite de produits avant insertion';
