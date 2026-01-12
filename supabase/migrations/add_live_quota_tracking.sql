-- =============================================
-- MIGRATION: Suivi des quotas Live Shopping
-- =============================================
-- Permet de tracker la consommation des heures de live
-- et gérer les limites par abonnement

-- Table de suivi de l'utilisation des quotas
CREATE TABLE IF NOT EXISTS live_quota_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,

  -- Périodicité (mois de référence)
  billing_period DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW()),

  -- Consommation
  minutes_consumed INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,

  -- Limites du plan (snapshot au moment de la session)
  plan_name TEXT NOT NULL,
  plan_monthly_hours INTEGER NOT NULL,
  plan_max_viewers INTEGER,
  plan_max_products INTEGER,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index pour recherche rapide
  CONSTRAINT unique_user_period UNIQUE(user_id, billing_period)
);

-- Index pour performance
CREATE INDEX idx_quota_usage_user ON live_quota_usage(user_id);
CREATE INDEX idx_quota_usage_period ON live_quota_usage(billing_period);
CREATE INDEX idx_quota_usage_user_period ON live_quota_usage(user_id, billing_period);

-- Politique RLS
ALTER TABLE live_quota_usage ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres quotas
CREATE POLICY "Users can view their own quota usage"
  ON live_quota_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres quotas
CREATE POLICY "Users can insert their own quota usage"
  ON live_quota_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres quotas
CREATE POLICY "Users can update their own quota usage"
  ON live_quota_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- FONCTION: Obtenir le quota actuel
-- =============================================
CREATE OR REPLACE FUNCTION get_current_quota(p_user_id UUID)
RETURNS TABLE (
  minutes_used INTEGER,
  minutes_limit INTEGER,
  sessions_count INTEGER,
  percentage_used NUMERIC,
  billing_period DATE,
  plan_name TEXT,
  can_start_live BOOLEAN,
  minutes_remaining INTEGER
) AS $$
DECLARE
  v_profile RECORD;
  v_usage RECORD;
  v_monthly_hours INTEGER;
BEGIN
  -- Récupérer le profil et le plan d'abonnement
  SELECT
    p.subscription_plan,
    COALESCE(s.live_hours_per_month, 0) AS monthly_hours,
    COALESCE(s.max_viewers_per_session, 100) AS max_viewers,
    COALESCE(s.max_featured_products, 5) AS max_products
  INTO v_profile
  FROM profiles p
  LEFT JOIN subscriptions s ON s.name = p.subscription_plan
  WHERE p.id = p_user_id;

  -- Si pas de plan, retourner des valeurs par défaut (plan free)
  IF v_profile IS NULL THEN
    v_monthly_hours := 0;
  ELSE
    v_monthly_hours := COALESCE(v_profile.monthly_hours, 0);
  END IF;

  -- Récupérer l'utilisation du mois en cours
  SELECT
    COALESCE(q.minutes_consumed, 0) AS minutes,
    COALESCE(q.sessions_count, 0) AS sessions,
    q.billing_period
  INTO v_usage
  FROM live_quota_usage q
  WHERE q.user_id = p_user_id
    AND q.billing_period = DATE_TRUNC('month', NOW())
  LIMIT 1;

  -- Si pas d'entrée pour ce mois, créer des valeurs par défaut
  IF v_usage IS NULL THEN
    v_usage := ROW(0, 0, DATE_TRUNC('month', NOW()));
  END IF;

  -- Calculer les valeurs de retour
  RETURN QUERY SELECT
    v_usage.minutes::INTEGER AS minutes_used,
    (v_monthly_hours * 60)::INTEGER AS minutes_limit,
    v_usage.sessions::INTEGER AS sessions_count,
    CASE
      WHEN v_monthly_hours = 0 THEN 100.0
      ELSE ROUND((v_usage.minutes::NUMERIC / (v_monthly_hours * 60)) * 100, 1)
    END AS percentage_used,
    v_usage.billing_period::DATE,
    COALESCE(v_profile.subscription_plan, 'free')::TEXT AS plan_name,
    (v_monthly_hours = 0 OR v_usage.minutes < (v_monthly_hours * 60))::BOOLEAN AS can_start_live,
    GREATEST(0, (v_monthly_hours * 60) - v_usage.minutes)::INTEGER AS minutes_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FONCTION: Incrémenter le quota
-- =============================================
CREATE OR REPLACE FUNCTION increment_live_quota(
  p_user_id UUID,
  p_session_id UUID,
  p_minutes_consumed INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_current_period DATE;
BEGIN
  v_current_period := DATE_TRUNC('month', NOW());

  -- Récupérer les infos du plan
  SELECT
    p.subscription_plan,
    COALESCE(s.live_hours_per_month, 0) AS monthly_hours,
    COALESCE(s.max_viewers_per_session, 100) AS max_viewers,
    COALESCE(s.max_featured_products, 5) AS max_products
  INTO v_profile
  FROM profiles p
  LEFT JOIN subscriptions s ON s.name = p.subscription_plan
  WHERE p.id = p_user_id;

  -- Insérer ou mettre à jour l'utilisation
  INSERT INTO live_quota_usage (
    user_id,
    session_id,
    billing_period,
    minutes_consumed,
    sessions_count,
    plan_name,
    plan_monthly_hours,
    plan_max_viewers,
    plan_max_products
  ) VALUES (
    p_user_id,
    p_session_id,
    v_current_period,
    p_minutes_consumed,
    1,
    COALESCE(v_profile.subscription_plan, 'free'),
    COALESCE(v_profile.monthly_hours, 0),
    COALESCE(v_profile.max_viewers, 100),
    COALESCE(v_profile.max_products, 5)
  )
  ON CONFLICT (user_id, billing_period)
  DO UPDATE SET
    minutes_consumed = live_quota_usage.minutes_consumed + p_minutes_consumed,
    sessions_count = live_quota_usage.sessions_count + 1,
    session_id = p_session_id,
    updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FONCTION: Vérifier si l'utilisateur peut démarrer un live
-- =============================================
CREATE OR REPLACE FUNCTION can_start_live_session(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota RECORD;
BEGIN
  SELECT * INTO v_quota FROM get_current_quota(p_user_id);

  -- Si pas de limite (0 = illimité pour premium par exemple)
  IF v_quota.minutes_limit = 0 THEN
    RETURN TRUE;
  END IF;

  -- Vérifier si quota non dépassé
  RETURN v_quota.minutes_used < v_quota.minutes_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER: Mettre à jour le quota à la fin d'une session live
-- =============================================
CREATE OR REPLACE FUNCTION update_quota_on_live_end()
RETURNS TRIGGER AS $$
DECLARE
  v_duration_minutes INTEGER;
BEGIN
  -- Ne traiter que les sessions qui se terminent
  IF OLD.status != 'ended' AND NEW.status = 'ended' THEN
    -- Calculer la durée en minutes
    v_duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;

    -- Incrémenter le quota
    PERFORM increment_live_quota(
      NEW.seller_id,
      NEW.id,
      v_duration_minutes::INTEGER
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur live_sessions
DROP TRIGGER IF EXISTS trigger_update_quota_on_live_end ON live_sessions;
CREATE TRIGGER trigger_update_quota_on_live_end
  AFTER UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_quota_on_live_end();

-- =============================================
-- COMMENTAIRES
-- =============================================
COMMENT ON TABLE live_quota_usage IS 'Suivi de la consommation des quotas Live Shopping par utilisateur et par mois';
COMMENT ON FUNCTION get_current_quota IS 'Obtient les statistiques de quota pour un utilisateur pour le mois en cours';
COMMENT ON FUNCTION increment_live_quota IS 'Incrémente la consommation de quota après une session live';
COMMENT ON FUNCTION can_start_live_session IS 'Vérifie si un utilisateur a assez de quota pour démarrer un live';