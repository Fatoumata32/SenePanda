-- ================================================
-- ÉTAPE 1 : AJOUTER seller_id À products
-- ================================================
-- Cette migration doit s'exécuter AVANT 20251117000001_create_orders_system.sql

-- Vérifier et ajouter la colonne seller_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'seller_id'
  ) THEN
    -- Ajouter la colonne seller_id
    ALTER TABLE products
    ADD COLUMN seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

    RAISE NOTICE 'Colonne seller_id ajoutée avec succès à la table products';
  ELSE
    RAISE NOTICE 'La colonne seller_id existe déjà dans la table products';
  END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.seller_id IS 'Référence au vendeur (profile) qui a créé ce produit';
