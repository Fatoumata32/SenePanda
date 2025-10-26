-- Fix the relationship between conversations and profiles
-- The issue is that conversations references auth.users but we need to join with profiles

-- Since profiles.id references auth.users.id, we can use this relationship
-- We just need to make sure Supabase understands the foreign key hints

-- The queries in the code use:
-- buyer:profiles!buyer_id and seller:profiles!seller_id
-- This works because:
-- 1. conversations.buyer_id -> auth.users.id
-- 2. profiles.id -> auth.users.id
-- So we can join through the user_id

-- The error suggests PostgREST can't find the relationship
-- Let's verify the foreign keys exist

-- Check if we need to add comments to help PostgREST
COMMENT ON COLUMN conversations.buyer_id IS 'Foreign key to auth.users, can be joined with profiles.id';
COMMENT ON COLUMN conversations.seller_id IS 'Foreign key to auth.users, can be joined with profiles.id';

-- Also check messages table
COMMENT ON COLUMN messages.sender_id IS 'Foreign key to auth.users, can be joined with profiles.id';

-- Make sure profiles table has proper foreign key
-- This should already exist, but let's ensure it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
