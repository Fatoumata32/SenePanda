-- ============================================
-- Fix: Correction sécurisée du schéma
-- ============================================
-- Version safe qui s'adapte à la structure existante
-- ============================================

-- PARTIE 1: Ajouter la colonne currency à products
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'currency'
  ) THEN
    ALTER TABLE products
    ADD COLUMN currency TEXT DEFAULT 'FCFA' NOT NULL;
    RAISE NOTICE '✅ Colonne currency ajoutée à products';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne currency existe déjà';
  END IF;
END $$;

UPDATE products
SET currency = 'FCFA'
WHERE currency IS NULL;


-- PARTIE 2: Vérifier et adapter user_subscriptions
-- =============================================

-- Vérifier si user_subscriptions existe déjà
DO $$
DECLARE
  table_exists BOOLEAN;
  has_plan_type BOOLEAN;
  has_plan_id BOOLEAN;
BEGIN
  -- Vérifier si la table existe
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_subscriptions'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE 'ℹ️  Table user_subscriptions existe déjà';

    -- Vérifier si elle a plan_type
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_subscriptions'
        AND column_name = 'plan_type'
    ) INTO has_plan_type;

    -- Vérifier si elle a plan_id
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_subscriptions'
        AND column_name = 'plan_id'
    ) INTO has_plan_id;

    -- Ajouter plan_id si manquant mais plan_type existe
    IF has_plan_type AND NOT has_plan_id THEN
      ALTER TABLE user_subscriptions
      ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
      RAISE NOTICE '✅ Colonne plan_id ajoutée à user_subscriptions';

      -- Remplir plan_id à partir de plan_type
      UPDATE user_subscriptions us
      SET plan_id = sp.id
      FROM subscription_plans sp
      WHERE us.plan_type = sp.plan_type
        AND us.plan_id IS NULL;

      RAISE NOTICE '✅ plan_id synchronisé avec plan_type';
    END IF;

    -- Ajouter is_approved si manquant
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_subscriptions'
        AND column_name = 'is_approved'
    ) THEN
      ALTER TABLE user_subscriptions
      ADD COLUMN is_approved BOOLEAN DEFAULT true;
      RAISE NOTICE '✅ Colonne is_approved ajoutée';
    END IF;

  ELSE
    -- Créer la table si elle n'existe pas
    CREATE TABLE user_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      plan_type TEXT,
      plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'active',
      starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ends_at TIMESTAMP WITH TIME ZONE,
      is_approved BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ Table user_subscriptions créée';
  END IF;
END $$;


-- PARTIE 3: Configurer RLS (safe)
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


-- PARTIE 4: Synchroniser les abonnements existants (safe)
-- =============================================

-- Utiliser UPSERT pour mettre à jour ou insérer
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
  p.id as user_id,
  p.subscription_plan as plan_type,
  sp.id as plan_id,
  COALESCE(p.subscription_status, 'active') as status,
  COALESCE(p.created_at, NOW()) as starts_at,
  p.subscription_expires_at as ends_at,
  true as is_approved
FROM profiles p
LEFT JOIN subscription_plans sp ON sp.plan_type = p.subscription_plan
WHERE p.subscription_plan IS NOT NULL
  AND p.subscription_plan != 'free'
  AND COALESCE(p.subscription_status, 'active') = 'active'
ON CONFLICT (user_id)
DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status,
  ends_at = EXCLUDED.ends_at,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();


-- PARTIE 5: Créer/Recréer la fonction de synchronisation
-- =============================================

CREATE OR REPLACE FUNCTION sync_profile_to_user_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  plan_uuid UUID;
BEGIN
  -- Si subscription_plan a changé et est actif
  IF NEW.subscription_plan IS NOT NULL
     AND NEW.subscription_plan != 'free'
     AND COALESCE(NEW.subscription_status, 'active') = 'active'
     AND (OLD IS NULL
          OR OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan
          OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN

    -- Trouver l'UUID du plan
    SELECT id INTO plan_uuid
    FROM subscription_plans
    WHERE plan_type = NEW.subscription_plan
    LIMIT 1;

    -- Créer ou mettre à jour l'entrée dans user_subscriptions
    INSERT INTO user_subscriptions (
      user_id,
      plan_type,
      plan_id,
      status,
      starts_at,
      ends_at,
      is_approved
    ) VALUES (
      NEW.id,
      NEW.subscription_plan,
      plan_uuid,
      COALESCE(NEW.subscription_status, 'active'),
      NOW(),
      NEW.subscription_expires_at,
      true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      ends_at = EXCLUDED.ends_at,
      is_approved = EXCLUDED.is_approved,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_sync_profile_subscription ON profiles;
CREATE TRIGGER trigger_sync_profile_subscription
  AFTER UPDATE OF subscription_plan, subscription_status, subscription_expires_at ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_subscriptions();


-- PARTIE 6: Messages de confirmation
-- =============================================

DO $$
DECLARE
  products_has_currency BOOLEAN;
  user_subs_count INTEGER;
  subs_with_plan_id INTEGER;
BEGIN
  -- Vérifier currency dans products
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'currency'
  ) INTO products_has_currency;

  -- Compter les abonnements
  SELECT COUNT(*) INTO user_subs_count
  FROM user_subscriptions;

  -- Compter les abonnements avec plan_id
  SELECT COUNT(*) INTO subs_with_plan_id
  FROM user_subscriptions
  WHERE plan_id IS NOT NULL;

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé:';
  RAISE NOTICE '✅ Colonne currency dans products: %', products_has_currency;
  RAISE NOTICE '✅ Table user_subscriptions: OK';
  RAISE NOTICE '✅ Total abonnements: %', user_subs_count;
  RAISE NOTICE '✅ Abonnements avec plan_id: %', subs_with_plan_id;
  RAISE NOTICE '✅ Trigger de synchronisation: Activé';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Redémarrez votre application mobile';
  RAISE NOTICE '2. Les erreurs devraient disparaître';
  RAISE NOTICE '====================================';
END $$;
