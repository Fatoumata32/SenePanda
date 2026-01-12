-- =============================================
-- 📦 AJOUTER LA COLONNE subscription_plan DANS profiles (VERSION SIMPLE)
-- =============================================
-- Date: 2025-12-02
-- Description: Ajoute subscription_plan et shop_is_active dans profiles
--              Version simplifiée sans synchronisation automatique
-- =============================================

-- =============================================
-- 1. AJOUTER LA COLONNE subscription_plan
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN subscription_plan TEXT DEFAULT 'free';

    RAISE NOTICE '✅ Colonne subscription_plan ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_plan existe déjà';
  END IF;
END $$;

-- =============================================
-- 2. AJOUTER LA COLONNE shop_is_active
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'shop_is_active'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN shop_is_active BOOLEAN DEFAULT false;

    RAISE NOTICE '✅ Colonne shop_is_active ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne shop_is_active existe déjà';
  END IF;
END $$;

-- =============================================
-- 3. METTRE À JOUR LES PROFILS EXISTANTS
-- =============================================

DO $$
BEGIN
  -- Mettre tous les profils existants sur plan FREE par défaut
  UPDATE profiles
  SET subscription_plan = 'free'
  WHERE subscription_plan IS NULL;

  RAISE NOTICE '✅ Profils existants mis à jour avec plan FREE par défaut';

  -- Les boutiques restent inactives par défaut (shop_is_active = false)
  -- Elles seront activées quand le vendeur choisira un plan payant
  RAISE NOTICE '✅ shop_is_active défini à false par défaut';
END $$;

-- =============================================
-- 4. CRÉER UN INDEX POUR PERFORMANCE
-- =============================================

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
  ON profiles(subscription_plan);

  CREATE INDEX IF NOT EXISTS idx_profiles_shop_is_active
  ON profiles(shop_is_active)
  WHERE is_seller = true;

  RAISE NOTICE '✅ Index créés pour optimisation';
END $$;

-- =============================================
-- 5. VÉRIFICATION FINALE
-- =============================================

DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Vérifier colonne subscription_plan
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '✅ Colonne subscription_plan OK';
  ELSE
    RAISE EXCEPTION '❌ Colonne subscription_plan manquante';
  END IF;

  -- Vérifier colonne shop_is_active
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shop_is_active'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '✅ Colonne shop_is_active OK';
  ELSE
    RAISE EXCEPTION '❌ Colonne shop_is_active manquante';
  END IF;
END $$;

-- =============================================
-- 6. MESSAGE FINAL
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION RÉUSSIE (VERSION SIMPLE)';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles colonnes ajoutées:';
  RAISE NOTICE '  - subscription_plan (TEXT, default: free)';
  RAISE NOTICE '  - shop_is_active (BOOLEAN, default: false)';
  RAISE NOTICE '';
  RAISE NOTICE 'Notes importantes:';
  RAISE NOTICE '  - Tous les profils ont plan FREE par défaut';
  RAISE NOTICE '  - Boutiques inactives par défaut';
  RAISE NOTICE '  - L''app React Native gérera les mises à jour';
  RAISE NOTICE '  - Pas de trigger automatique (géré côté app)';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '  1. L''app créera abonnement FREE pour nouveaux vendeurs';
  RAISE NOTICE '  2. L''app mettra à jour subscription_plan lors du paiement';
  RAISE NOTICE '  3. L''app activera shop_is_active selon le plan';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

-- =============================================
-- 7. REQUÊTES UTILES POUR VÉRIFICATION
-- =============================================

-- Voir tous les vendeurs avec leur plan
-- SELECT id, full_name, shop_name, subscription_plan, shop_is_active
-- FROM profiles
-- WHERE is_seller = true
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Compter les vendeurs par plan
-- SELECT
--   subscription_plan,
--   COUNT(*) as count,
--   COUNT(CASE WHEN shop_is_active THEN 1 END) as active_shops
-- FROM profiles
-- WHERE is_seller = true
-- GROUP BY subscription_plan;
