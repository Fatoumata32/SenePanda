-- =============================================
-- 🔧 CORRECTION COMPLÈTE DES ERREURS D'ABONNEMENT
-- =============================================
-- Date: 2025-11-30
-- Description: Corrige toutes les erreurs du système d'abonnement
-- Instructions: Exécutez ce fichier dans le SQL Editor de Supabase
-- =============================================

-- =============================================
-- 1. AJOUTER LES COLONNES MANQUANTES DANS PROFILES
-- =============================================

-- Ajouter subscription_starts_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_starts_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_starts_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne subscription_starts_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_starts_at existe déjà';
  END IF;
END $$;

-- Ajouter subscription_status si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'rejected', 'expired'));
    RAISE NOTICE '✅ Colonne subscription_status ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_status existe déjà';
  END IF;
END $$;

-- Ajouter subscription_requested_plan si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_requested_plan'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_requested_plan VARCHAR(20);
    RAISE NOTICE '✅ Colonne subscription_requested_plan ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_requested_plan existe déjà';
  END IF;
END $$;

-- Ajouter subscription_requested_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_requested_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_requested_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne subscription_requested_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_requested_at existe déjà';
  END IF;
END $$;

-- Ajouter subscription_billing_period si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_billing_period'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_billing_period VARCHAR(10) CHECK (subscription_billing_period IN ('monthly', 'yearly'));
    RAISE NOTICE '✅ Colonne subscription_billing_period ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne subscription_billing_period existe déjà';
  END IF;
END $$;

-- =============================================
-- 2. CRÉER LA TABLE SUBSCRIPTION_REQUESTS SI NÉCESSAIRE
-- =============================================

CREATE TABLE IF NOT EXISTS subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL,
  billing_period VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_pending_subscription ON profiles(subscription_status, subscription_requested_at) WHERE subscription_status = 'pending';

-- =============================================
-- 3. ACTIVER RLS SUR SUBSCRIPTION_REQUESTS
-- =============================================

ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own subscription requests" ON subscription_requests;
DROP POLICY IF EXISTS "Users can create subscription requests" ON subscription_requests;

-- Créer les nouvelles policies
CREATE POLICY "Users can view own subscription requests"
  ON subscription_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscription requests"
  ON subscription_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 4. CRÉER/METTRE À JOUR LA FONCTION REQUEST_SUBSCRIPTION
-- =============================================

CREATE OR REPLACE FUNCTION request_subscription(
  p_user_id UUID,
  p_plan_type VARCHAR,
  p_billing_period VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Vérifier si l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Vérifier si le plan existe
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE plan_type = p_plan_type) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Plan d''abonnement non valide'
    );
  END IF;

  -- Créer la demande d'abonnement
  INSERT INTO subscription_requests (user_id, plan_type, billing_period, status)
  VALUES (p_user_id, p_plan_type, p_billing_period, 'pending')
  RETURNING id INTO v_request_id;

  -- Mettre à jour le profil avec la demande en attente
  UPDATE profiles
  SET
    subscription_status = 'pending',
    subscription_requested_plan = p_plan_type,
    subscription_requested_at = NOW(),
    subscription_billing_period = p_billing_period
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Demande d''abonnement envoyée. En attente de validation par l''administrateur.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION request_subscription IS 'Créer une demande d''abonnement en attente de validation admin';

-- =============================================
-- 5. CRÉER/METTRE À JOUR LA FONCTION APPROVE_SUBSCRIPTION_REQUEST
-- =============================================

CREATE OR REPLACE FUNCTION approve_subscription_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
  v_duration_days INTEGER;
BEGIN
  -- Récupérer la demande
  SELECT * INTO v_request
  FROM subscription_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Demande non trouvée'
    );
  END IF;

  -- Vérifier que la demande est en attente
  IF v_request.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette demande a déjà été traitée'
    );
  END IF;

  -- Calculer la durée de l'abonnement
  v_duration_days := CASE
    WHEN v_request.billing_period = 'yearly' THEN 365
    ELSE 30
  END;

  -- Activer l'abonnement dans le profil
  UPDATE profiles
  SET
    subscription_plan = v_request.plan_type,
    subscription_status = 'active',
    subscription_starts_at = NOW(),
    subscription_expires_at = NOW() + (v_duration_days || ' days')::INTERVAL,
    subscription_billing_period = v_request.billing_period,
    subscription_requested_plan = NULL,
    subscription_requested_at = NULL,
    is_seller = TRUE
  WHERE id = v_request.user_id;

  -- Marquer la demande comme approuvée
  UPDATE subscription_requests
  SET
    status = 'approved',
    processed_at = NOW(),
    processed_by = p_admin_id,
    admin_notes = p_admin_notes
  WHERE id = p_request_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Abonnement activé avec succès',
    'user_id', v_request.user_id,
    'plan_type', v_request.plan_type,
    'expires_at', NOW() + (v_duration_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_subscription_request IS 'Approuver une demande d''abonnement (admin uniquement)';

-- =============================================
-- 6. CRÉER/METTRE À JOUR LA FONCTION REJECT_SUBSCRIPTION_REQUEST
-- =============================================

CREATE OR REPLACE FUNCTION reject_subscription_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Récupérer la demande
  SELECT * INTO v_request
  FROM subscription_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Demande non trouvée'
    );
  END IF;

  -- Vérifier que la demande est en attente
  IF v_request.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette demande a déjà été traitée'
    );
  END IF;

  -- Réinitialiser le statut dans le profil
  UPDATE profiles
  SET
    subscription_status = 'active',
    subscription_requested_plan = NULL,
    subscription_requested_at = NULL
  WHERE id = v_request.user_id;

  -- Marquer la demande comme rejetée
  UPDATE subscription_requests
  SET
    status = 'rejected',
    processed_at = NOW(),
    processed_by = p_admin_id,
    admin_notes = p_admin_notes
  WHERE id = p_request_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Demande d''abonnement rejetée',
    'user_id', v_request.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reject_subscription_request IS 'Rejeter une demande d''abonnement (admin uniquement)';

-- =============================================
-- 7. CRÉER LA VUE POUR L'ADMIN
-- =============================================

-- Supprimer la vue existante pour éviter les conflits de colonnes
DROP VIEW IF EXISTS pending_subscription_requests CASCADE;

-- Recréer la vue avec la structure correcte
CREATE VIEW pending_subscription_requests AS
SELECT
  sr.id,
  sr.user_id,
  p.full_name,
  p.shop_name,
  p.phone,
  p.email,
  sr.plan_type,
  sr.billing_period,
  sr.requested_at,
  sp.name as plan_name,
  sp.price_monthly,
  sp.price_yearly,
  CASE
    WHEN sr.billing_period = 'yearly' THEN sp.price_yearly
    ELSE sp.price_monthly
  END as amount_due
FROM subscription_requests sr
JOIN profiles p ON sr.user_id = p.id
JOIN subscription_plans sp ON sr.plan_type = sp.plan_type
WHERE sr.status = 'pending'
ORDER BY sr.requested_at ASC;

COMMENT ON VIEW pending_subscription_requests IS 'Vue admin: demandes d''abonnement en attente de validation';

-- =============================================
-- 8. INITIALISER LES DONNÉES
-- =============================================

-- Mettre à jour les profils existants avec le statut par défaut
UPDATE profiles
SET subscription_status = 'active'
WHERE subscription_status IS NULL;

-- Mettre à jour les profils avec abonnement actif
UPDATE profiles
SET
  subscription_status = 'active',
  subscription_starts_at = COALESCE(subscription_starts_at, created_at)
WHERE subscription_plan IS NOT NULL
  AND subscription_plan != 'free'
  AND subscription_expires_at IS NOT NULL
  AND subscription_expires_at > NOW();

-- Marquer comme expirés les abonnements qui ont dépassé la date d'expiration
UPDATE profiles
SET subscription_status = 'expired'
WHERE subscription_plan IS NOT NULL
  AND subscription_plan != 'free'
  AND subscription_expires_at IS NOT NULL
  AND subscription_expires_at <= NOW();

-- =============================================
-- 9. AFFICHER UN RÉSUMÉ
-- =============================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_active_subscriptions INTEGER;
  v_pending_requests INTEGER;
  v_expired_subscriptions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_active_subscriptions
    FROM profiles
    WHERE subscription_status = 'active' AND subscription_plan != 'free';
  SELECT COUNT(*) INTO v_pending_requests
    FROM subscription_requests
    WHERE status = 'pending';
  SELECT COUNT(*) INTO v_expired_subscriptions
    FROM profiles
    WHERE subscription_status = 'expired';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION DES ABONNEMENTS TERMINÉE';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '  • Total utilisateurs: %', v_total_users;
  RAISE NOTICE '  • Abonnements actifs: %', v_active_subscriptions;
  RAISE NOTICE '  • Demandes en attente: %', v_pending_requests;
  RAISE NOTICE '  • Abonnements expirés: %', v_expired_subscriptions;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Toutes les colonnes ont été ajoutées';
  RAISE NOTICE '✅ Toutes les fonctions ont été créées';
  RAISE NOTICE '✅ Toutes les policies RLS sont actives';
  RAISE NOTICE '✅ La vue admin est disponible';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Testez la demande d''abonnement dans l''app';
  RAISE NOTICE '  2. Vérifiez les demandes avec: SELECT * FROM pending_subscription_requests;';
  RAISE NOTICE '  3. Approuvez une demande avec: SELECT approve_subscription_request(''request_id'', ''admin_id'', ''notes'');';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;
