-- ============================================
-- Fix: Correction complète du schéma
-- ============================================
-- Cette migration corrige:
-- 1. Colonne 'currency' manquante dans products
-- 2. Tables user_subscriptions et relations (optionnelles, pour compatibilité)
-- ============================================

-- PARTIE 1: Ajouter la colonne currency à products
-- =============================================

DO $$
BEGIN
  -- Vérifier si la colonne existe déjà
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'currency'
  ) THEN
    -- Ajouter la colonne currency
    ALTER TABLE products
    ADD COLUMN currency TEXT DEFAULT 'FCFA' NOT NULL;

    RAISE NOTICE '✅ Colonne currency ajoutée à products';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne currency existe déjà';
  END IF;
END $$;

-- Mettre à jour les produits existants qui auraient currency NULL
UPDATE products
SET currency = 'FCFA'
WHERE currency IS NULL;


-- PARTIE 2: Créer la table user_subscriptions (si elle n'existe pas)
-- =============================================
-- Cette table est utilisée par useSubscriptionSync (legacy)
-- Elle n'est plus nécessaire avec le nouveau système basé sur profiles
-- mais on la crée pour éviter les erreurs de compatibilité

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

-- RLS pour user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- PARTIE 3: Fonction pour synchroniser profiles <-> user_subscriptions
-- =============================================
-- Cette fonction crée automatiquement un enregistrement dans user_subscriptions
-- quand profiles.subscription_plan change

CREATE OR REPLACE FUNCTION sync_profile_to_user_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  plan_uuid UUID;
BEGIN
  -- Si subscription_plan a changé et est actif
  IF NEW.subscription_plan IS NOT NULL
     AND NEW.subscription_plan != 'free'
     AND NEW.subscription_status = 'active'
     AND (OLD.subscription_plan IS NULL
          OR OLD.subscription_plan != NEW.subscription_plan
          OR OLD.subscription_status != NEW.subscription_status) THEN

    -- Trouver l'UUID du plan
    SELECT id INTO plan_uuid
    FROM subscription_plans
    WHERE plan_type = NEW.subscription_plan
    LIMIT 1;

    -- Créer ou mettre à jour l'entrée dans user_subscriptions
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      starts_at,
      ends_at,
      is_approved
    ) VALUES (
      NEW.id,
      plan_uuid,
      NEW.subscription_status,
      NOW(),
      NEW.subscription_expires_at,
      true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      ends_at = EXCLUDED.ends_at,
      is_approved = EXCLUDED.is_approved,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS trigger_sync_profile_subscription ON profiles;
CREATE TRIGGER trigger_sync_profile_subscription
  AFTER UPDATE OF subscription_plan, subscription_status, subscription_expires_at ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_subscriptions();


-- PARTIE 4: Ajouter une contrainte UNIQUE sur user_id (optionnel)
-- =============================================
-- Pour éviter les doublons, un utilisateur ne peut avoir qu'un abonnement actif

DO $$
BEGIN
  -- Vérifier si la contrainte existe déjà
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_subscriptions_user_id_unique'
  ) THEN
    -- Supprimer les doublons potentiels avant d'ajouter la contrainte
    DELETE FROM user_subscriptions
    WHERE id NOT IN (
      SELECT DISTINCT ON (user_id) id
      FROM user_subscriptions
      ORDER BY user_id, created_at DESC
    );

    -- Ajouter la contrainte UNIQUE
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

    RAISE NOTICE '✅ Contrainte UNIQUE ajoutée sur user_id';
  ELSE
    RAISE NOTICE 'ℹ️  Contrainte UNIQUE existe déjà';
  END IF;
END $$;


-- PARTIE 5: Synchroniser les abonnements existants
-- =============================================
-- Créer des entrées dans user_subscriptions pour tous les utilisateurs
-- qui ont déjà un abonnement actif dans profiles

INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  starts_at,
  ends_at,
  is_approved
)
SELECT
  p.id as user_id,
  sp.id as plan_id,
  p.subscription_status as status,
  NOW() as starts_at,
  p.subscription_expires_at as ends_at,
  true as is_approved
FROM profiles p
LEFT JOIN subscription_plans sp ON sp.plan_type = p.subscription_plan
WHERE p.subscription_plan IS NOT NULL
  AND p.subscription_plan != 'free'
  AND p.subscription_status = 'active'
ON CONFLICT (user_id) DO NOTHING;


-- PARTIE 6: Messages de confirmation
-- =============================================

DO $$
DECLARE
  products_has_currency BOOLEAN;
  user_subs_count INTEGER;
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

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé:';
  RAISE NOTICE '✅ Colonne currency dans products: %', products_has_currency;
  RAISE NOTICE '✅ Table user_subscriptions créée';
  RAISE NOTICE '✅ Trigger de synchronisation activé';
  RAISE NOTICE '✅ % abonnements synchronisés', user_subs_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Redémarrez votre application mobile';
  RAISE NOTICE '2. Les erreurs de schéma devraient disparaître';
  RAISE NOTICE '====================================';
END $$;
