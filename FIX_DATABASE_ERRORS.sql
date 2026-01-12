-- ================================================================
-- SENEPANDA - SCRIPT DE CORRECTION DES ERREURS
-- Corrige les colonnes et tables manquantes
-- ================================================================
--
-- Instructions :
-- 1. Allez sur https://app.supabase.com
-- 2. Ouvrez votre projet inhzfdufjhuihtuykwmw
-- 3. SQL Editor → New query
-- 4. Copiez-collez TOUT ce fichier
-- 5. Cliquez sur "Run"
--
-- ================================================================

-- ================================================================
-- 1. AJOUTER LES COLONNES MANQUANTES
-- ================================================================

-- Ajouter preferred_role à profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_role TEXT CHECK (preferred_role IN ('buyer', 'seller'));

-- Ajouter subscription_plan à profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'none';

-- Renommer stock en stock_quantity dans products (si la colonne 'stock' existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock'
  ) THEN
    ALTER TABLE products RENAME COLUMN stock TO stock_quantity;
  END IF;
END $$;

-- ================================================================
-- 2. LA TABLE LOYALTY_POINTS EXISTE DÉJÀ
-- ================================================================

-- La table loyalty_points est déjà créée avec la bonne structure
-- Pas besoin de la recréer

-- Activer RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour loyalty_points
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON loyalty_points;
CREATE POLICY "Users can view their own loyalty points"
  ON loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own loyalty points" ON loyalty_points;
CREATE POLICY "Users can insert their own loyalty points"
  ON loyalty_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own loyalty points" ON loyalty_points;
CREATE POLICY "Users can update their own loyalty points"
  ON loyalty_points FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- 3. CRÉER LA TABLE USER_SUBSCRIPTIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Type d'abonnement
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),

  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),

  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Paiement
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'XOF',
  payment_method TEXT,

  -- Métadonnées
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ================================================================
-- 4. CORRIGER LES FOREIGN KEYS MANQUANTES
-- ================================================================

-- S'assurer que la foreign key entre live_sessions et profiles existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'live_sessions_seller_id_fkey'
    AND table_name = 'live_sessions'
  ) THEN
    ALTER TABLE live_sessions
    ADD CONSTRAINT live_sessions_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ================================================================
-- 5. AJOUTER LES COLONNES MANQUANTES DANS PRODUCTS
-- ================================================================

-- Ajouter la colonne title si elle n'existe pas (alias de name)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS title TEXT;

-- Copier les valeurs de name vers title si title est vide
UPDATE products SET title = name WHERE title IS NULL;

-- ================================================================
-- 6. CRÉER DES ENTRÉES LOYALTY_POINTS POUR LES USERS EXISTANTS
-- ================================================================

-- Insérer des enregistrements loyalty_points pour tous les profils qui n'en ont pas
INSERT INTO loyalty_points (user_id, points, available_points, total_earned, lifetime_points, level)
SELECT
  p.id,
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  COALESCE(p.panda_coins, 0),
  'bronze'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_points lp WHERE lp.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ================================================================
-- 7. MISE À JOUR DES POLICIES POUR LIVE_FEATURED_PRODUCTS
-- ================================================================

-- Ajouter les policies manquantes pour live_featured_products
ALTER TABLE live_featured_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view featured products" ON live_featured_products;
CREATE POLICY "Public can view featured products"
  ON live_featured_products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sellers can manage their featured products" ON live_featured_products;
CREATE POLICY "Sellers can manage their featured products"
  ON live_featured_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      WHERE ls.id = live_featured_products.live_session_id
      AND ls.seller_id = auth.uid()
    )
  );

-- ================================================================
-- 8. AJOUTER POLICIES POUR LIVE_VIEWERS
-- ================================================================

ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view live viewers" ON live_viewers;
CREATE POLICY "Public can view live viewers"
  ON live_viewers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join live sessions" ON live_viewers;
CREATE POLICY "Users can join live sessions"
  ON live_viewers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave live sessions" ON live_viewers;
CREATE POLICY "Users can leave live sessions"
  ON live_viewers FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- 9. REFRESH DU SCHEMA CACHE
-- ================================================================

-- Forcer Supabase à recharger le cache du schéma
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- 10. VÉRIFICATION FINALE
-- ================================================================

DO $$
DECLARE
  missing_columns TEXT := '';
  missing_tables TEXT := '';
BEGIN
  -- Vérifier les colonnes critiques
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_role') THEN
    missing_columns := missing_columns || 'profiles.preferred_role, ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    missing_columns := missing_columns || 'profiles.subscription_plan, ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    missing_columns := missing_columns || 'products.stock_quantity, ';
  END IF;

  -- Vérifier les tables critiques
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points') THEN
    missing_tables := missing_tables || 'loyalty_points, ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    missing_tables := missing_tables || 'user_subscriptions, ';
  END IF;

  -- Afficher le résultat
  IF missing_columns = '' AND missing_tables = '' THEN
    RAISE NOTICE '✅ TOUTES LES CORRECTIONS ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Colonnes ajoutées:';
    RAISE NOTICE '   - profiles.preferred_role';
    RAISE NOTICE '   - profiles.subscription_plan';
    RAISE NOTICE '   - products.stock_quantity';
    RAISE NOTICE '   - products.title';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables créées:';
    RAISE NOTICE '   - loyalty_points';
    RAISE NOTICE '   - user_subscriptions';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Policies RLS configurées';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Votre base de données est maintenant à jour!';
    RAISE NOTICE '📱 Vous pouvez relancer votre application.';
  ELSE
    IF missing_columns != '' THEN
      RAISE WARNING '❌ Colonnes manquantes: %', missing_columns;
    END IF;
    IF missing_tables != '' THEN
      RAISE WARNING '❌ Tables manquantes: %', missing_tables;
    END IF;
  END IF;
END $$;
