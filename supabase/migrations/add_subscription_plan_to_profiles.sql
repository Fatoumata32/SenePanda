-- =============================================
-- 📦 AJOUTER LA COLONNE subscription_plan DANS profiles
-- =============================================
-- Date: 2025-12-02
-- Description: Ajoute une colonne pour stocker le plan d'abonnement actuel
--              directement dans le profil de l'utilisateur
-- =============================================

-- =============================================
-- 1. AJOUTER LA COLONNE subscription_plan
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN subscription_plan TEXT DEFAULT 'free';

    RAISE NOTICE '✅ Colonne subscription_plan ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_plan existe déjà';
  END IF;
END $$;

-- =============================================
-- 2. AJOUTER LA COLONNE shop_is_active
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'shop_is_active'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN shop_is_active BOOLEAN DEFAULT false;

    RAISE NOTICE '✅ Colonne shop_is_active ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne shop_is_active existe déjà';
  END IF;
END $$;

-- =============================================
-- 3. METTRE À JOUR LES PROFILS EXISTANTS
-- =============================================

DO $$
BEGIN
  -- Mettre à jour subscription_plan basé sur user_subscriptions
  -- On utilise status = 'active' au lieu de is_active (qui peut ne pas exister)
  UPDATE profiles p
  SET subscription_plan = us.plan_type
  FROM user_subscriptions us
  WHERE p.id = us.user_id
  AND us.status = 'active'
  AND p.subscription_plan IS NULL;

  RAISE NOTICE '✅ Profils existants mis à jour avec leur plan actif';

  -- Activer les boutiques qui ont un abonnement actif
  UPDATE profiles p
  SET shop_is_active = true
  FROM user_subscriptions us
  WHERE p.id = us.user_id
  AND us.status = 'active'
  AND p.shop_name IS NOT NULL
  AND p.is_seller = true;

  RAISE NOTICE '✅ Boutiques avec abonnements actifs activées';
END $$;

-- =============================================
-- 4. CRÉER UN INDEX POUR PERFORMANCE
-- =============================================

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
  ON profiles(subscription_plan);

  CREATE INDEX IF NOT EXISTS idx_profiles_shop_is_active
  ON profiles(shop_is_active)
  WHERE is_seller = true;

  RAISE NOTICE '✅ Index créés pour optimisation';
END $$;

-- =============================================
-- 5. CRÉER UNE FONCTION DE SYNCHRONISATION
-- =============================================

-- Cette fonction met à jour automatiquement le plan dans profiles
-- quand user_subscriptions change
CREATE OR REPLACE FUNCTION sync_subscription_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si l'abonnement devient actif (status = 'active')
  IF NEW.status = 'active' THEN
    UPDATE profiles
    SET
      subscription_plan = NEW.plan_type,
      shop_is_active = (NEW.plan_type != 'free'),
      updated_at = NOW()
    WHERE id = NEW.user_id;

    RAISE NOTICE 'Plan synchronisé: % pour user %', NEW.plan_type, NEW.user_id;

  -- Si l'abonnement devient inactif
  ELSIF NEW.status != 'active' AND OLD.status = 'active' THEN
    -- Vérifier s'il y a un autre abonnement actif
    DECLARE
      other_active_sub user_subscriptions;
    BEGIN
      SELECT * INTO other_active_sub
      FROM user_subscriptions
      WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1;

      IF FOUND THEN
        -- Utiliser l'autre abonnement actif
        UPDATE profiles
        SET
          subscription_plan = other_active_sub.plan_type,
          shop_is_active = (other_active_sub.plan_type != 'free'),
          updated_at = NOW()
        WHERE id = NEW.user_id;
      ELSE
        -- Revenir au plan Free
        UPDATE profiles
        SET
          subscription_plan = 'free',
          shop_is_active = false,
          updated_at = NOW()
        WHERE id = NEW.user_id;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- 6. CRÉER LE TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS trigger_sync_subscription_plan ON user_subscriptions;

CREATE TRIGGER trigger_sync_subscription_plan
AFTER INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_plan();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de synchronisation créé';
END $$;

-- =============================================
-- 7. CRÉER UNE VUE POUR FACILITER LES REQUÊTES
-- =============================================

CREATE OR REPLACE VIEW seller_with_subscription AS
SELECT
  p.id,
  p.phone,
  p.first_name,
  p.last_name,
  p.full_name,
  p.shop_name,
  p.is_seller,
  p.subscription_plan,
  p.shop_is_active,
  us.status AS subscription_status,
  us.start_date AS subscription_start,
  us.end_date AS subscription_end,
  sp.name AS plan_name,
  sp.price_monthly,
  sp.price_yearly,
  sp.features AS plan_features
FROM profiles p
LEFT JOIN user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE p.is_seller = true;

DO $$
BEGIN
  RAISE NOTICE '✅ Vue seller_with_subscription créée';
END $$;

-- =============================================
-- 8. VÉRIFICATION FINALE
-- =============================================

DO $$
DECLARE
  col_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  -- Vérifier colonne subscription_plan
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '✅ Colonne subscription_plan OK';
  ELSE
    RAISE EXCEPTION '❌ Colonne subscription_plan manquante';
  END IF;

  -- Vérifier colonne shop_is_active
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shop_is_active'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '✅ Colonne shop_is_active OK';
  ELSE
    RAISE EXCEPTION '❌ Colonne shop_is_active manquante';
  END IF;

  -- Vérifier trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_sync_subscription_plan'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger de synchronisation OK';
  ELSE
    RAISE EXCEPTION '❌ Trigger de synchronisation manquant';
  END IF;
END $$;

-- =============================================
-- 9. MESSAGE FINAL
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION RÉUSSIE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles colonnes ajoutées:';
  RAISE NOTICE '  - subscription_plan (TEXT)';
  RAISE NOTICE '  - shop_is_active (BOOLEAN)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctionnalités:';
  RAISE NOTICE '  - Synchronisation automatique du plan';
  RAISE NOTICE '  - Activation/désactivation de boutique';
  RAISE NOTICE '  - Vue seller_with_subscription pour requêtes';
  RAISE NOTICE '';
  RAISE NOTICE 'Tous les vendeurs ont un plan FREE par défaut';
  RAISE NOTICE 'Les boutiques sont activées selon le plan choisi';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;
