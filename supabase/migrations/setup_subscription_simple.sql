-- Migration simplifiée: Configuration minimale du système d'abonnement
-- Date: 2025-12-04
-- Description: Version simplifiée pour démarrage rapide

-- ============================================
-- 1. Ajouter les colonnes essentielles
-- ============================================

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
  -- subscription_plan
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    ALTER TABLE profiles ADD CONSTRAINT check_subscription_plan
      CHECK (subscription_plan IN ('free', 'starter', 'pro', 'premium'));
    RAISE NOTICE '✅ Colonne subscription_plan ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne subscription_plan existe déjà';
  END IF;

  -- subscription_expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Colonne subscription_expires_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne subscription_expires_at existe déjà';
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Colonne updated_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️ Colonne updated_at existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. Créer les index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
ON profiles(subscription_plan)
WHERE subscription_plan != 'free';

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires
ON profiles(subscription_expires_at)
WHERE subscription_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
ON profiles(subscription_plan, subscription_expires_at)
WHERE subscription_plan != 'free';

-- ============================================
-- 3. Mise à jour des données existantes
-- ============================================

-- Mettre à jour les utilisateurs sans plan défini
UPDATE profiles
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL;

-- S'assurer que tous ont un updated_at
UPDATE profiles
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- ============================================
-- 4. Vérifier l'installation
-- ============================================

DO $$
DECLARE
  col_count INTEGER;
  idx_count INTEGER;
BEGIN
  -- Compter les colonnes
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name IN ('subscription_plan', 'subscription_expires_at', 'updated_at');

  -- Compter les index
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE tablename = 'profiles'
  AND indexname LIKE 'idx_profiles_subscription%';

  -- Afficher le résultat
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '📊 Colonnes ajoutées: % / 3', col_count;
  RAISE NOTICE '📊 Index créés: % / 3', idx_count;
  RAISE NOTICE '';

  IF col_count = 3 AND idx_count >= 3 THEN
    RAISE NOTICE '🎉 Installation complète - Tout est prêt !';
  ELSE
    RAISE NOTICE '⚠️ Installation partielle - Vérifier les erreurs ci-dessus';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- ============================================
-- 5. Afficher les informations utiles
-- ============================================

-- Afficher les colonnes créées
SELECT
  'Colonnes profiles' AS info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'subscription_expires_at', 'updated_at')
ORDER BY column_name;

-- Afficher les index créés
SELECT
  'Index créés' AS info,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname LIKE 'idx_profiles_subscription%';
