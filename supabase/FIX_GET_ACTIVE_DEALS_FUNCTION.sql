-- ========================================
-- FIX: Fonction get_active_deals pour Flash Deals
-- Cette fonction corrige l'erreur "column d.deal_price does not exist"
-- ========================================

-- Créer ou remplacer la fonction get_active_deals
CREATE OR REPLACE FUNCTION get_active_deals()
RETURNS TABLE (
  deal_id uuid,
  product_id uuid,
  product_title text,
  product_image text,
  seller_name text,
  original_price numeric,
  deal_price numeric,
  discount_percentage integer,
  ends_at timestamptz,
  time_remaining text,
  total_stock integer,
  remaining_stock integer,
  is_featured boolean,
  badge_text text,
  badge_color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    p.id as product_id,
    p.title as product_title,
    COALESCE(
      (SELECT url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1),
      p.image_url,
      'https://via.placeholder.com/200'
    ) as product_image,
    COALESCE(prof.full_name, prof.username, 'Vendeur') as seller_name,
    p.price as original_price,
    d.discount_price as deal_price,
    d.discount_percentage,
    d.ends_at,
    -- Calcul du temps restant
    CASE
      WHEN d.ends_at <= now() THEN 'Terminé'
      WHEN EXTRACT(EPOCH FROM (d.ends_at - now())) / 3600 >= 24 THEN
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) / 86400) || ' jours'
      WHEN EXTRACT(EPOCH FROM (d.ends_at - now())) / 3600 >= 1 THEN
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) / 3600) || 'h ' ||
        ROUND((EXTRACT(EPOCH FROM (d.ends_at - now())) % 3600) / 60) || 'm'
      ELSE
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) / 60) || 'm ' ||
        ROUND(EXTRACT(EPOCH FROM (d.ends_at - now())) % 60) || 's'
    END as time_remaining,
    COALESCE(d.stock_limit, p.stock) as total_stock,
    GREATEST(0, COALESCE(d.stock_limit, p.stock) - COALESCE(d.stock_sold, 0)) as remaining_stock,
    COALESCE(d.is_featured, false) as is_featured,
    CASE
      WHEN d.discount_percentage >= 50 THEN 'MEGA PROMO'
      WHEN d.discount_percentage >= 30 THEN 'HOT DEAL'
      ELSE 'PROMO'
    END as badge_text,
    CASE
      WHEN d.discount_percentage >= 50 THEN '#DC2626'
      WHEN d.discount_percentage >= 30 THEN '#F59E0B'
      ELSE '#10B981'
    END as badge_color
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  LEFT JOIN profiles prof ON prof.id = p.seller_id
  WHERE d.is_active = true
    AND d.starts_at <= now()
    AND d.ends_at > now()
    AND COALESCE(d.stock_limit - d.stock_sold, p.stock) > 0
    AND p.is_published = true
  ORDER BY
    d.is_featured DESC,
    d.discount_percentage DESC,
    d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter des commentaires pour la documentation
COMMENT ON FUNCTION get_active_deals() IS 'Retourne tous les deals flash actifs avec les informations complètes du produit et du vendeur';

-- Tester la fonction
SELECT 'Fonction get_active_deals créée avec succès!' as status;

-- Test de la fonction (devrait retourner des résultats si des deals sont actifs)
SELECT COUNT(*) as active_deals_count FROM get_active_deals();

SELECT '✅ Fonction get_active_deals corrigée et testée avec succès!' as result;
