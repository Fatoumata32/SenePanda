-- ============================================
-- FIX RAPIDE: Toutes les colonnes manquantes
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- 1. PRODUCTS: Ajouter toutes les colonnes manquantes
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. PRODUCTS: Remplir les valeurs manquantes
UPDATE products SET currency = 'FCFA' WHERE currency IS NULL;
UPDATE products SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE products SET name = 'Produit' WHERE name IS NULL;

-- 3. PRODUCTS: Ajouter NOT NULL sur name
ALTER TABLE products ALTER COLUMN name SET NOT NULL;

-- 4. USER_SUBSCRIPTIONS: Ajouter colonnes manquantes
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 5. USER_SUBSCRIPTIONS: Créer foreign key
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_plan_id_fkey') THEN
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. USER_SUBSCRIPTIONS: Synchroniser plan_id
UPDATE user_subscriptions us
SET plan_id = sp.id
FROM subscription_plans sp
WHERE us.plan_type = sp.plan_type AND us.plan_id IS NULL;

-- 7. Vérification
SELECT 'Products.name: ' || CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'name'
) THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 'Products.currency: ' || CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'currency'
) THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'User_subscriptions.plan_id: ' || CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'user_subscriptions' AND column_name = 'plan_id'
) THEN '✅' ELSE '❌' END;
