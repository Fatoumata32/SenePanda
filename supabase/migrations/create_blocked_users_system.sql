-- Ensure conversations table has status column
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

    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
  END IF;
END $$;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Enable RLS
DO $$
BEGIN
  ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Table might already have RLS enabled
END $$;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;

-- Users can view their own blocks
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_blocker_id UUID, p_blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block a user
CREATE OR REPLACE FUNCTION block_user(
  p_blocker_id UUID,
  p_blocked_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if already blocked
  IF is_user_blocked(p_blocker_id, p_blocked_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User is already blocked'
    );
  END IF;

  -- Insert block
  INSERT INTO blocked_users (blocker_id, blocked_id, reason)
  VALUES (p_blocker_id, p_blocked_id, p_reason);

  -- Archive all conversations between the two users
  UPDATE conversations
  SET status = 'blocked'
  WHERE (buyer_id = p_blocker_id AND seller_id = p_blocked_id)
     OR (seller_id = p_blocker_id AND buyer_id = p_blocked_id);

  RETURN json_build_object(
    'success', true,
    'message', 'User blocked successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock a user
CREATE OR REPLACE FUNCTION unblock_user(
  p_blocker_id UUID,
  p_blocked_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Delete block
  DELETE FROM blocked_users
  WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;

  -- Reactivate conversations if they were blocked
  UPDATE conversations
  SET status = 'active'
  WHERE status = 'blocked'
    AND ((buyer_id = p_blocker_id AND seller_id = p_blocked_id)
      OR (seller_id = p_blocker_id AND buyer_id = p_blocked_id));

  RETURN json_build_object(
    'success', true,
    'message', 'User unblocked successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
