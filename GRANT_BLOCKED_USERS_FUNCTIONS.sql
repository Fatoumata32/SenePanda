-- =============================================================
-- GRANT EXECUTE for blocked_users RPC functions
-- Run this once per Supabase project (SQL Editor)
-- =============================================================

GRANT EXECUTE ON FUNCTION public.is_user_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid, uuid) TO authenticated;

-- If you use additional roles (e.g., anon with appropriate RLS),
-- duplicate GRANTs for those roles as needed.
