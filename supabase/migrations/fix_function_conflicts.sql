-- ================================================
-- FIX: Résoudre les conflits de fonctions
-- ================================================
-- Ce script résout l'erreur de type de retour pour get_cart_total

-- Supprimer toutes les versions de get_cart_total
DROP FUNCTION IF EXISTS get_cart_total(UUID);
DROP FUNCTION IF EXISTS get_cart_total(UUID, OUT INTEGER, OUT DECIMAL);

-- Recréer la fonction avec la bonne signature
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS TABLE (
  item_count INTEGER,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CAST(COUNT(*) AS INTEGER) as item_count,
    CAST(COALESCE(SUM(c.quantity * p.price), 0) AS DECIMAL) as total_amount
  FROM cart c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier que la fonction fonctionne
COMMENT ON FUNCTION get_cart_total IS 'Retourne le nombre d''articles et le montant total du panier';

-- Test de la fonction (remplacer l'UUID par un vrai user_id pour tester)
-- SELECT * FROM get_cart_total('00000000-0000-0000-0000-000000000000');
