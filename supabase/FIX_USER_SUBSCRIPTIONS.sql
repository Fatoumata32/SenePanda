-- ========================================
-- CRÉER/CORRIGER user_subscriptions
-- ========================================

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  payment_proof_url TEXT,
  is_approved BOOLEAN DEFAULT NULL,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajouter les colonnes manquantes si la table existait déjà
DO $$
BEGIN
  -- is_approved
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN is_approved BOOLEAN DEFAULT NULL;
    RAISE NOTICE '✅ Colonne is_approved ajoutée';
  END IF;

  -- approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN approved_by UUID;
    RAISE NOTICE '✅ Colonne approved_by ajoutée';
  END IF;

  -- approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN approved_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Colonne approved_at ajoutée';
  END IF;

  -- payment_proof_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND column_name = 'payment_proof_url'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN payment_proof_url TEXT;
    RAISE NOTICE '✅ Colonne payment_proof_url ajoutée';
  END IF;
END $$;

-- 3. Créer les index
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
ON user_subscriptions(user_id, status)
WHERE status IN ('pending', 'active');

-- 4. Activer RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Créer policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can view their own subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Policy SELECT créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can create their own subscriptions'
  ) THEN
    CREATE POLICY "Users can create their own subscriptions"
    ON user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE '✅ Policy INSERT créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_subscriptions'
    AND policyname = 'Users can update their own subscriptions'
  ) THEN
    CREATE POLICY "Users can update their own subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Policy UPDATE créée';
  END IF;
END $$;

-- 6. Vérifier
SELECT COUNT(*) as count FROM user_subscriptions;

-- 7. Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USER_SUBSCRIPTIONS PRÊT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table créée avec toutes les colonnes nécessaires';
  RAISE NOTICE 'Index et policies configurés';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape:';
  RAISE NOTICE '  → Exécuter ENABLE_REALTIME_SUBSCRIPTIONS.sql';
  RAISE NOTICE '';
END $$;
