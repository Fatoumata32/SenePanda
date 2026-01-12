-- Migration: Ajouter les champs de réduction aux produits
-- Date: 2025-12-31
-- Description: Permet aux vendeurs de sauvegarder le prix original et le pourcentage de réduction

-- Ajouter les colonnes pour les réductions
ALTER TABLE products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT FALSE;

-- Commentaires pour la documentation
COMMENT ON COLUMN products.original_price IS 'Prix original avant réduction (en FCFA)';
COMMENT ON COLUMN products.discount_percent IS 'Pourcentage de réduction appliqué (0-100)';
COMMENT ON COLUMN products.has_discount IS 'Indique si le produit a une réduction active';

-- Index pour améliorer les performances des requêtes sur les produits en promotion
CREATE INDEX IF NOT EXISTS idx_products_has_discount ON products(has_discount) WHERE has_discount = TRUE;

-- Fonction pour mettre à jour automatiquement has_discount
CREATE OR REPLACE FUNCTION update_product_discount_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si discount_percent > 0 et original_price existe, activer has_discount
  IF NEW.discount_percent > 0 AND NEW.original_price IS NOT NULL THEN
    NEW.has_discount := TRUE;
  ELSE
    NEW.has_discount := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement has_discount
DROP TRIGGER IF EXISTS trigger_update_product_discount_status ON products;
CREATE TRIGGER trigger_update_product_discount_status
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_discount_status();

-- Mettre à jour les produits existants
UPDATE products
SET has_discount = FALSE
WHERE discount_percent = 0 OR discount_percent IS NULL OR original_price IS NULL;
