-- ================================================================
-- SCRIPT DE CORRECTION COMPLET - FORCE UPDATE
-- ================================================================

-- 1. Ajouter les colonnes manquantes à profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'none';

-- 2. Vérifier et corriger la structure de loyalty_points
-- D'abord, voir si la table existe et la structure qu'elle a
DO $$
BEGIN
  -- Si la table loyalty_points n'a pas la colonne 'total_spent', l'ajouter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loyalty_points' AND column_name = 'total_spent'
  ) THEN
    ALTER TABLE loyalty_points ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- 3. Corriger products - renommer 'stock' en 'stock_quantity' si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock'
  ) THEN
    ALTER TABLE products RENAME COLUMN stock TO stock_quantity;
  END IF;
END $$;

-- S'assurer que stock_quantity existe
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 4. Ajouter la colonne 'title' à products
ALTER TABLE products ADD COLUMN IF NOT EXISTS title TEXT;
UPDATE products SET title = name WHERE title IS NULL OR title = '';

-- 5. Recréer complètement la foreign key entre live_sessions et profiles
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'live_sessions_seller_id_fkey'
  ) THEN
    ALTER TABLE live_sessions DROP CONSTRAINT live_sessions_seller_id_fkey;
  END IF;

  -- Recréer la contrainte
  ALTER TABLE live_sessions
  ADD CONSTRAINT live_sessions_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- 6. Créer la table user_subscriptions si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. S'assurer que tous les users ont un enregistrement loyalty_points
INSERT INTO loyalty_points (user_id, points, available_points, total_earned, lifetime_points, level, total_spent)
SELECT
  p.id,
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  'bronze',
  0
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_points lp WHERE lp.user_id = p.id
)
ON CONFLICT (user_id) DO UPDATE
SET
  points = COALESCE(loyalty_points.points, EXCLUDED.points),
  available_points = COALESCE(loyalty_points.available_points, EXCLUDED.available_points);

-- 8. Forcer le reload du schema cache
NOTIFY pgrst, 'reload schema';

-- 9. Vérification
SELECT 'Configuration terminée!' as status;
