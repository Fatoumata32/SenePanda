-- Add status column to conversations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE conversations
    ADD COLUMN status text DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'blocked'));

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

    RAISE NOTICE 'Column status added to conversations table';
  ELSE
    RAISE NOTICE 'Column status already exists in conversations table';
  END IF;
END $$;
