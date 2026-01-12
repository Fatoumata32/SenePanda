-- Fix des colonnes manquantes dans la base de données

-- 1. Ajouter image_url à la table products si elle n'existe pas
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Copier les données de images vers image_url si image_url est vide
UPDATE products
SET image_url = images
WHERE image_url IS NULL AND images IS NOT NULL;

-- 2. Renommer category en category_id dans la table products
-- D'abord, vérifier si category_id existe déjà
DO $$
BEGIN
    -- Si category existe et category_id n'existe pas
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'category'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'category_id'
    ) THEN
        -- Renommer category en category_id
        ALTER TABLE products RENAME COLUMN category TO category_id;
    END IF;
END $$;

-- 3. Ajouter buyer_id et seller_id à la table conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES profiles(id);

-- Migrer les données existantes si nécessaire
-- Note: participant1_id sera considéré comme buyer_id et participant2_id comme seller_id
UPDATE conversations
SET
    buyer_id = participant1_id,
    seller_id = participant2_id
WHERE buyer_id IS NULL OR seller_id IS NULL;

-- 4. Ajouter discount_percentage à products si elle n'existe pas
ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- 5. Ajouter views_count à products si elle n'existe pas
ALTER TABLE products
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Commentaires pour documentation
COMMENT ON COLUMN products.image_url IS 'URL de l''image principale du produit';
COMMENT ON COLUMN products.category_id IS 'ID de la catégorie du produit (UUID)';
COMMENT ON COLUMN products.discount_percentage IS 'Pourcentage de réduction (0-100)';
COMMENT ON COLUMN products.views_count IS 'Nombre de vues du produit';
COMMENT ON COLUMN conversations.buyer_id IS 'ID de l''acheteur dans la conversation';
COMMENT ON COLUMN conversations.seller_id IS 'ID du vendeur dans la conversation';
