-- =====================================================
-- SENEPANDA - Système de Wishlist (Liste de souhaits)
-- =====================================================
-- Permet aux utilisateurs de sauvegarder leurs produits favoris
-- =====================================================

-- Table wishlist
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte: un produit une seule fois par utilisateur
  UNIQUE(user_id, product_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_created_at ON wishlists(created_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre wishlist
CREATE POLICY "Users can view own wishlist"
  ON wishlists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent ajouter à leur wishlist
CREATE POLICY "Users can add to wishlist"
  ON wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer de leur wishlist
CREATE POLICY "Users can remove from wishlist"
  ON wishlists
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FONCTION: toggle_wishlist
-- Ajoute ou retire un produit de la wishlist
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_wishlist(
  p_product_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
  v_action TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Non authentifié'
    );
  END IF;

  -- Vérifier si existe
  SELECT EXISTS (
    SELECT 1 FROM wishlists
    WHERE user_id = v_user_id
      AND product_id = p_product_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Supprimer de la wishlist
    DELETE FROM wishlists
    WHERE user_id = v_user_id
      AND product_id = p_product_id;

    v_action := 'removed';
  ELSE
    -- Ajouter à la wishlist
    INSERT INTO wishlists (user_id, product_id)
    VALUES (v_user_id, p_product_id);

    v_action := 'added';
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'action', v_action,
    'product_id', p_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: get_wishlist_count
-- Récupère le nombre d'items dans la wishlist
-- =====================================================
CREATE OR REPLACE FUNCTION get_wishlist_count()
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM wishlists
  WHERE user_id = v_user_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: is_in_wishlist
-- Vérifie si un produit est dans la wishlist
-- =====================================================
CREATE OR REPLACE FUNCTION is_in_wishlist(p_product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM wishlists
    WHERE user_id = v_user_id
      AND product_id = p_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION toggle_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION get_wishlist_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_in_wishlist TO authenticated;

-- =====================================================
-- Commentaires
-- =====================================================
COMMENT ON TABLE wishlists IS 'Liste de souhaits des utilisateurs';
COMMENT ON FUNCTION toggle_wishlist IS 'Ajoute ou retire un produit de la wishlist';
COMMENT ON FUNCTION get_wishlist_count IS 'Nombre d''items dans la wishlist de l''utilisateur';
COMMENT ON FUNCTION is_in_wishlist IS 'Vérifie si un produit est dans la wishlist';

-- Message de succès
SELECT '✅ Système de wishlist créé avec succès!' as message;
