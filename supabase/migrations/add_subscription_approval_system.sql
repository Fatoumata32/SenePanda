-- =============================================
-- SYSTÈME D'APPROBATION SIMPLE POUR ABONNEMENTS
-- =============================================

-- Ajouter colonnes pour le statut d'approbation dans profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'rejected', 'expired')),
  ADD COLUMN IF NOT EXISTS subscription_requested_plan VARCHAR(20),
  ADD COLUMN IF NOT EXISTS subscription_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_billing_period VARCHAR(10) CHECK (subscription_billing_period IN ('monthly', 'yearly'));

-- Ajouter des commentaires
COMMENT ON COLUMN profiles.subscription_status IS 'Statut de l''abonnement: active, pending (en attente validation), rejected, expired';
COMMENT ON COLUMN profiles.subscription_requested_plan IS 'Plan demandé en attente d''approbation';
COMMENT ON COLUMN profiles.subscription_requested_at IS 'Date de la demande d''abonnement';
COMMENT ON COLUMN profiles.subscription_billing_period IS 'Période de facturation: monthly ou yearly';

-- Table pour l'historique des demandes d'abonnement
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

-- RLS pour subscription_requests
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view own subscription requests"
  ON subscription_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Users can create subscription requests"
  ON subscription_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FONCTION SIMPLIFIÉE POUR DEMANDER UN ABONNEMENT
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
-- FONCTION POUR L'ADMIN: APPROUVER UN ABONNEMENT
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
    subscription_requested_at = NULL
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
-- FONCTION POUR L'ADMIN: REJETER UN ABONNEMENT
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
-- VUE POUR L'ADMIN: LISTE DES DEMANDES EN ATTENTE
-- =============================================

CREATE OR REPLACE VIEW pending_subscription_requests AS
SELECT
  sr.id,
  sr.user_id,
  p.full_name,
  p.shop_name,
  p.phone,
  sr.plan_type,
  sr.billing_period,
  sr.requested_at,
  sp.name as plan_name,
  sp.price_monthly,
  sp.price_yearly
FROM subscription_requests sr
JOIN profiles p ON sr.user_id = p.id
JOIN subscription_plans sp ON sr.plan_type = sp.plan_type
WHERE sr.status = 'pending'
ORDER BY sr.requested_at ASC;

COMMENT ON VIEW pending_subscription_requests IS 'Vue admin: demandes d''abonnement en attente de validation';

-- =============================================
-- INITIALISATION
-- =============================================

-- Mettre à jour les profils existants avec le nouveau statut
UPDATE profiles
SET subscription_status = 'active'
WHERE subscription_status IS NULL;

-- Ajouter un index pour les notifications
CREATE INDEX IF NOT EXISTS idx_profiles_pending_subscription
  ON profiles(subscription_status, subscription_requested_at)
  WHERE subscription_status = 'pending';
