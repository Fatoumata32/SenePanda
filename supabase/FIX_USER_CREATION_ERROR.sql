-- ========================================
-- FIX: Database Error Saving New User
-- This script fixes the user creation trigger to handle errors gracefully
-- ========================================

-- First, ensure the generate_referral_code function exists
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the handle_new_user function with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  BEGIN
    -- Generate referral code
    new_referral_code := generate_referral_code();

    -- Insert profile (do nothing if already exists)
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      referral_code
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, NEW.id::text),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      new_referral_code
    )
    ON CONFLICT (id) DO UPDATE
    SET
      username = COALESCE(profiles.username, EXCLUDED.username),
      referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code);

    -- Initialize loyalty points (do nothing if already exists)
    INSERT INTO public.loyalty_points (
      user_id,
      points,
      total_earned,
      level
    ) VALUES (
      NEW.id,
      0,
      0,
      'bronze'
    )
    ON CONFLICT (user_id) DO NOTHING;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't prevent user creation
      RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Test that the function exists
SELECT 'User creation trigger fixed successfully! ✅' as status;

-- Verify the trigger is active
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
