-- ============================================
-- Fix Minimal: Correction des erreurs de schéma
-- ============================================
-- Version minimale sans ON CONFLICT
-- ============================================

-- ÉTAPE 1: Ajouter currency à products
-- =============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA' NOT NULL;

UPDATE products
SET currency = 'FCFA'
WHERE currency IS NULL;


-- ÉTAPE 2: Adapter user_subscriptions
-- =============================================

-- Ajouter plan_id si manquant
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Ajouter is_approved si manquant
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Créer la foreign key vers subscription_plans si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_subscriptions_plan_id_fkey'
  ) THEN
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ÉTAPE 3: Synchroniser plan_id avec plan_type
-- =============================================

UPDATE user_subscriptions us
SET plan_id = sp.id
FROM subscription_plans sp
WHERE us.plan_type = sp.plan_type
  AND us.plan_id IS NULL;


-- ÉTAPE 4: Synchroniser avec profiles (sans ON CONFLICT)
-- =============================================

-- D'abord, mettre à jour les entrées existantes
UPDATE user_subscriptions us
SET
  plan_type = p.subscription_plan,
  plan_id = sp.id,
  status = p.subscription_status,
  ends_at = p.subscription_expires_at,
  is_approved = true,
  updated_at = NOW()
FROM profiles p
LEFT JOIN subscription_plans sp ON sp.plan_type = p.subscription_plan
WHERE us.user_id = p.id
  AND p.subscription_plan IS NOT NULL
  AND p.subscription_plan != 'free'
  AND p.subscription_status = 'active';

-- Ensuite, insérer les nouveaux (ceux qui n'existent pas encore)
INSERT INTO user_subscriptions (
  user_id,
  plan_type,
  plan_id,
  status,
  starts_at,
  ends_at,
  is_approved
)
SELECT
  p.id,
  p.subscription_plan,
  sp.id,
  p.subscription_status,
  NOW(),
  p.subscription_expires_at,
  true
FROM profiles p
LEFT JOIN subscription_plans sp ON sp.plan_type = p.subscription_plan
WHERE p.subscription_plan IS NOT NULL
  AND p.subscription_plan != 'free'
  AND p.subscription_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us2
    WHERE us2.user_id = p.id
  );


-- ÉTAPE 5: Configurer RLS
-- =============================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ÉTAPE 6: Vérification finale
-- =============================================

DO $$
DECLARE
  products_has_currency BOOLEAN;
  user_subs_count INTEGER;
  subs_with_plan_id INTEGER;
  subs_active INTEGER;
BEGIN
  -- Vérifier currency
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'currency'
  ) INTO products_has_currency;

  -- Compter les abonnements
  SELECT COUNT(*) INTO user_subs_count FROM user_subscriptions;
  SELECT COUNT(*) INTO subs_with_plan_id FROM user_subscriptions WHERE plan_id IS NOT NULL;
  SELECT COUNT(*) INTO subs_active FROM user_subscriptions WHERE status = 'active';

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration réussie!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Products.currency: %', products_has_currency;
  RAISE NOTICE 'Total abonnements: %', user_subs_count;
  RAISE NOTICE 'Avec plan_id: %', subs_with_plan_id;
  RAISE NOTICE 'Actifs: %', subs_active;
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Redémarrez votre app!';
  RAISE NOTICE '====================================';
END $$;
