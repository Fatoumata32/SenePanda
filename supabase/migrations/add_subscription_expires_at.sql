-- ============================================
-- Ajouter la colonne subscription_expires_at à profiles
-- ============================================

-- Ajouter subscription_plan si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

-- Ajouter subscription_expires_at si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'subscription_expires_at');
