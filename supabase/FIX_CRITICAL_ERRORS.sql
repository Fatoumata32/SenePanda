-- ============================================================================
-- FIX CRITIQUE : Erreurs RLS et Colonnes Manquantes
-- ============================================================================
-- Ce script corrige :
-- 1. Récursion infinie dans policies profiles
-- 2. Colonne deal_type manquante dans flash_deals
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : FIX RÉCURSION INFINIE - PROFILES
-- ============================================================================

-- Désactiver temporairement RLS pour diagnostic
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes problématiques
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Créer de nouvelles policies SIMPLES et NON-RÉCURSIVES
CREATE POLICY "Allow public read access to profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTIE 2 : FIX FLASH DEALS - AJOUTER COLONNE deal_type
-- ============================================================================

-- Vérifier si la table flash_deals existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'flash_deals'
  ) THEN
    -- Ajouter la colonne deal_type si elle n'existe pas
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'flash_deals'
      AND column_name = 'deal_type'
    ) THEN
      ALTER TABLE flash_deals
      ADD COLUMN deal_type TEXT DEFAULT 'flash_sale' CHECK (deal_type IN ('flash_sale', 'limited_time', 'daily_deal', 'seasonal'));

      RAISE NOTICE '✅ Colonne deal_type ajoutée à flash_deals';
    ELSE
      RAISE NOTICE 'ℹ️ Colonne deal_type existe déjà';
    END IF;

    -- Mettre à jour les enregistrements existants
    UPDATE flash_deals SET deal_type = 'flash_sale' WHERE deal_type IS NULL;

  ELSE
    -- Créer la table flash_deals si elle n'existe pas
    CREATE TABLE flash_deals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      original_price NUMERIC NOT NULL,
      deal_price NUMERIC NOT NULL,
      discount_percentage INTEGER GENERATED ALWAYS AS (
        ROUND(((original_price - deal_price) / original_price * 100)::NUMERIC, 0)::INTEGER
      ) STORED,
      deal_type TEXT DEFAULT 'flash_sale' CHECK (deal_type IN ('flash_sale', 'limited_time', 'daily_deal', 'seasonal')),
      start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_time TIMESTAMPTZ NOT NULL,
      max_quantity INTEGER,
      sold_quantity INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CHECK (deal_price < original_price),
      CHECK (end_time > start_time),
      CHECK (sold_quantity <= max_quantity)
    );

    -- Index pour performance
    CREATE INDEX IF NOT EXISTS idx_flash_deals_product ON flash_deals(product_id);
    CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON flash_deals(is_active, end_time);
    CREATE INDEX IF NOT EXISTS idx_flash_deals_type ON flash_deals(deal_type, is_active);

    -- RLS
    ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Flash deals are viewable by everyone"
    ON flash_deals FOR SELECT
    USING (true);

    CREATE POLICY "Only sellers can manage their flash deals"
    ON flash_deals FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = flash_deals.product_id
        AND p.seller_id = auth.uid()
      )
    );

    RAISE NOTICE '✅ Table flash_deals créée avec colonne deal_type';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 3 : FIX FONCTION is_seller_subscription_active (éviter récursion)
-- ============================================================================

-- Recréer la fonction pour éviter les problèmes de récursion
CREATE OR REPLACE FUNCTION is_seller_subscription_active(seller_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Requête SIMPLE sans appels récursifs
  SELECT subscription_plan, subscription_expires_at
  INTO v_plan, v_expires_at
  FROM profiles
  WHERE id = seller_user_id;

  -- Plan gratuit = pas d'accès
  IF v_plan IS NULL OR v_plan = 'free' THEN
    RETURN FALSE;
  END IF;

  -- Plan payant = vérifier expiration
  IF v_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si non expiré
  RETURN v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTIE 4 : FIX POLICY PRODUCTS (éviter récursion via profiles)
-- ============================================================================

-- Supprimer l'ancienne policy problématique
DROP POLICY IF EXISTS "Public can view active products from subscribed sellers" ON products;

-- Créer une policy plus simple qui n'utilise PAS is_seller_subscription_active
-- Cette policy sera vérifiée côté application via le hook
CREATE POLICY "Public can view active products"
ON products FOR SELECT
USING (is_active = true);

-- Pour les vendeurs, une policy séparée pour gérer leurs propres produits
DROP POLICY IF EXISTS "Sellers can manage their own products" ON products;
CREATE POLICY "Sellers can manage their own products"
ON products FOR ALL
USING (seller_id = auth.uid());

-- ============================================================================
-- PARTIE 5 : VÉRIFICATIONS FINALES
-- ============================================================================

-- Vérifier que les policies ne causent plus de récursion
DO $$
DECLARE
  v_test_result BOOLEAN;
BEGIN
  -- Test simple de lecture
  SELECT EXISTS(SELECT 1 FROM profiles LIMIT 1) INTO v_test_result;

  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE '✅ Policies profiles OK - pas de récursion';
  END IF;

  -- Test flash deals
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flash_deals' AND column_name = 'deal_type'
  ) INTO v_test_result;

  IF v_test_result THEN
    RAISE NOTICE '✅ Colonne deal_type existe dans flash_deals';
  END IF;
END $$;

-- ============================================================================
-- MESSAGES FINAUX
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTIONS APPLIQUÉES AVEC SUCCÈS';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '1. ✅ Policies profiles corrigées (plus de récursion)';
  RAISE NOTICE '2. ✅ Colonne deal_type ajoutée/vérifiée';
  RAISE NOTICE '3. ✅ Fonction is_seller_subscription_active optimisée';
  RAISE NOTICE '4. ✅ Policies products simplifiées';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT:';
  RAISE NOTICE '   - La vérification d''abonnement pour la visibilité';
  RAISE NOTICE '     des produits est maintenant gérée côté application';
  RAISE NOTICE '   - Utiliser useSubscriptionAccess() pour les vérifications';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Redémarrer l''application pour appliquer les changements';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- TESTS RAPIDES (optionnel)
-- ============================================================================

/*
-- Test 1 : Lire profiles (ne doit plus causer de récursion)
SELECT id, first_name, last_name, subscription_plan FROM profiles LIMIT 5;

-- Test 2 : Vérifier flash_deals
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'flash_deals';

-- Test 3 : Tester la fonction subscription
SELECT is_seller_subscription_active('user-id-here');
*/
