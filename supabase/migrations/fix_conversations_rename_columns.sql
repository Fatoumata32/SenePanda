-- ===================================================================
-- FIX: Renommer les colonnes de la table conversations
-- ===================================================================
-- Aligner la structure avec le code TypeScript
-- participant1_id → buyer_id
-- participant2_id → seller_id
-- ===================================================================

-- Vérifier si les anciennes colonnes existent
DO $$
BEGIN
  -- Renommer participant1_id en buyer_id si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'participant1_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN participant1_id TO buyer_id;
    RAISE NOTICE '✅ Colonne participant1_id renommée en buyer_id';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne buyer_id existe déjà';
  END IF;

  -- Renommer participant2_id en seller_id si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'participant2_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN participant2_id TO seller_id;
    RAISE NOTICE '✅ Colonne participant2_id renommée en seller_id';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne seller_id existe déjà';
  END IF;

  -- S'assurer que les colonnes nécessaires existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'buyer_id'
  ) THEN
    -- Créer buyer_id si elle n'existe pas
    ALTER TABLE conversations ADD COLUMN buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Colonne buyer_id créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'seller_id'
  ) THEN
    -- Créer seller_id si elle n'existe pas
    ALTER TABLE conversations ADD COLUMN seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Colonne seller_id créée';
  END IF;

  -- S'assurer que les compteurs unread existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'buyer_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN buyer_unread_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne buyer_unread_count créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'seller_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN seller_unread_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne seller_unread_count créée';
  END IF;

  -- S'assurer que last_message_at existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Colonne last_message_at créée';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

END $$;
