-- Add missing unread count columns to conversations table
DO $$
BEGIN
  -- Add buyer_unread_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'buyer_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN buyer_unread_count integer DEFAULT 0;
  END IF;

  -- Add seller_unread_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'seller_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN seller_unread_count integer DEFAULT 0;
  END IF;

  -- Add last_message_preview column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_preview text;
  END IF;

  -- Add last_message_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
