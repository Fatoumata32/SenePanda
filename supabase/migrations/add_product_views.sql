-- Ajouter la colonne views_count aux produits
ALTER TABLE products
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_products_views_count ON products(views_count DESC);

-- Fonction pour incrémenter le nombre de vues d'un produit
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_views_count INTEGER;
BEGIN
  -- Incrémenter le compteur de vues
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = product_id
  RETURNING views_count INTO new_views_count;

  RETURN new_views_count;
END;
$$;

-- Fonction pour obtenir les statistiques de vues d'un produit
CREATE OR REPLACE FUNCTION get_product_view_stats(product_id UUID)
RETURNS TABLE(
  total_views INTEGER,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.views_count as total_views,
    (
      SELECT COUNT(*)::INTEGER + 1
      FROM products p2
      WHERE p2.views_count > p.views_count
    ) as rank
  FROM products p
  WHERE p.id = product_id;
END;
$$;

-- Fonction pour obtenir les produits les plus vus
CREATE OR REPLACE FUNCTION get_trending_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  name TEXT,
  price NUMERIC,
  image_url TEXT,
  views_count INTEGER,
  seller_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.views_count,
    p.seller_id
  FROM products p
  WHERE p.stock > 0
  ORDER BY p.views_count DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$;
