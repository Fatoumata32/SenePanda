-- Migration: Configuration du système d'abonnement avec activation immédiate
-- Date: 2025-12-04
-- Description: Ajoute les colonnes nécessaires et configure l'activation immédiate des abonnements

-- ============================================
-- 1. Vérifier et ajouter les colonnes nécessaires
-- ============================================

-- Ajouter la colonne subscription_plan si elle n'existe pas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'
CHECK (subscription_plan IN ('free', 'starter', 'pro', 'premium'));

-- Ajouter la colonne subscription_expires_at si elle n'existe pas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN profiles.subscription_plan IS 'Type de plan d''abonnement actuel (free, starter, pro, premium)';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'Date d''expiration de l''abonnement';
COMMENT ON COLUMN profiles.updated_at IS 'Date de dernière mise à jour du profil';

-- ============================================
-- 2. Créer des index pour améliorer les performances
-- ============================================

-- Index pour les recherches par plan d'abonnement
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
ON profiles(subscription_plan)
WHERE subscription_plan != 'free';

-- Index pour trouver les abonnements expirants
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires
ON profiles(subscription_expires_at)
WHERE subscription_expires_at IS NOT NULL;

-- Index composite pour les requêtes combinées
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
ON profiles(subscription_plan, subscription_expires_at)
WHERE subscription_plan != 'free';

-- ============================================
-- 3. Fonction pour vérifier l'expiration des abonnements
-- ============================================

-- Fonction pour vérifier si un abonnement est actif
CREATE OR REPLACE FUNCTION is_subscription_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_data RECORD;
BEGIN
  SELECT subscription_plan, subscription_expires_at
  INTO subscription_data
  FROM profiles
  WHERE id = user_id;

  -- Si plan gratuit, toujours actif
  IF subscription_data.subscription_plan = 'free' OR subscription_data.subscription_plan IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Si pas de date d'expiration, considérer comme expiré
  IF subscription_data.subscription_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si la date n'est pas dépassée
  RETURN subscription_data.subscription_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour la fonction
COMMENT ON FUNCTION is_subscription_active(UUID) IS 'Vérifie si l''abonnement d''un utilisateur est actif';

-- ============================================
-- 4. Fonction pour expirer automatiquement les abonnements
-- ============================================

-- Fonction pour expirer les abonnements
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Mettre à jour les abonnements expirés
  UPDATE profiles
  SET
    subscription_plan = 'free',
    subscription_expires_at = NULL,
    updated_at = NOW()
  WHERE
    subscription_plan != 'free'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour la fonction
COMMENT ON FUNCTION expire_old_subscriptions() IS 'Expire automatiquement les abonnements dont la date est dépassée';

-- ============================================
-- 5. Trigger pour mettre à jour updated_at automatiquement
-- ============================================

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur profiles
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Table d'historique des abonnements (optionnel)
-- ============================================

-- Créer la table d'historique si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'starter', 'pro', 'premium')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'wave',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id
ON subscription_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_history_status
ON subscription_history(status, expires_at);

-- Commentaire pour la table
COMMENT ON TABLE subscription_history IS 'Historique de tous les abonnements activés';

-- RLS pour subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Policy: Utilisateurs peuvent voir leur propre historique
DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
CREATE POLICY "Users can view own subscription history"
ON subscription_history FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Le système peut insérer dans l'historique
DROP POLICY IF EXISTS "System can insert subscription history" ON subscription_history;
CREATE POLICY "System can insert subscription history"
ON subscription_history FOR INSERT
WITH CHECK (true);

-- ============================================
-- 7. Fonction pour enregistrer l'historique lors de l'activation
-- ============================================

CREATE OR REPLACE FUNCTION record_subscription_activation()
RETURNS TRIGGER AS $$
DECLARE
  billing_period TEXT;
  plan_amount NUMERIC(10,2);
BEGIN
  -- Ignorer si c'est une mise à jour vers 'free' ou si le plan n'a pas changé
  IF NEW.subscription_plan = 'free' OR
     (OLD.subscription_plan = NEW.subscription_plan AND
      OLD.subscription_expires_at IS NOT DISTINCT FROM NEW.subscription_expires_at) THEN
    RETURN NEW;
  END IF;

  -- Déterminer la période de facturation
  IF NEW.subscription_expires_at IS NOT NULL THEN
    -- Calculer la différence en mois
    IF EXTRACT(YEAR FROM AGE(NEW.subscription_expires_at, NOW())) >= 1 THEN
      billing_period := 'yearly';
    ELSE
      billing_period := 'monthly';
    END IF;
  ELSE
    billing_period := 'monthly';
  END IF;

  -- Déterminer le montant (vous pouvez ajuster selon vos prix)
  plan_amount := CASE NEW.subscription_plan
    WHEN 'starter' THEN CASE billing_period WHEN 'monthly' THEN 5000 ELSE 50000 END
    WHEN 'pro' THEN CASE billing_period WHEN 'monthly' THEN 15000 ELSE 150000 END
    WHEN 'premium' THEN CASE billing_period WHEN 'monthly' THEN 30000 ELSE 300000 END
    ELSE 0
  END;

  -- Insérer dans l'historique
  INSERT INTO subscription_history (
    user_id,
    plan_type,
    billing_period,
    amount,
    payment_method,
    status,
    activated_at,
    expires_at
  ) VALUES (
    NEW.id,
    NEW.subscription_plan,
    billing_period,
    plan_amount,
    'wave',
    'active',
    NOW(),
    NEW.subscription_expires_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_subscription_activation ON profiles;
CREATE TRIGGER on_subscription_activation
  AFTER UPDATE OF subscription_plan, subscription_expires_at ON profiles
  FOR EACH ROW
  WHEN (NEW.subscription_plan != 'free' AND NEW.subscription_expires_at IS NOT NULL)
  EXECUTE FUNCTION record_subscription_activation();

-- ============================================
-- 8. Vue pour obtenir le statut des abonnements
-- ============================================

CREATE OR REPLACE VIEW subscription_status AS
SELECT
  p.id AS user_id,
  p.email,
  p.subscription_plan,
  p.subscription_expires_at,
  CASE
    WHEN p.subscription_plan = 'free' THEN TRUE
    WHEN p.subscription_expires_at IS NULL THEN FALSE
    WHEN p.subscription_expires_at > NOW() THEN TRUE
    ELSE FALSE
  END AS is_active,
  CASE
    WHEN p.subscription_plan = 'free' THEN NULL
    WHEN p.subscription_expires_at IS NULL THEN NULL
    WHEN p.subscription_expires_at < NOW() THEN 0
    ELSE EXTRACT(DAY FROM (p.subscription_expires_at - NOW()))::INTEGER
  END AS days_remaining,
  p.updated_at
FROM profiles p;

-- Commentaire pour la vue
COMMENT ON VIEW subscription_status IS 'Vue pour obtenir facilement le statut des abonnements';

-- RLS pour la vue
ALTER VIEW subscription_status SET (security_invoker = on);

-- ============================================
-- 9. Fonction RPC pour obtenir le statut de l'abonnement
-- ============================================

CREATE OR REPLACE FUNCTION get_subscription_status(user_id UUID)
RETURNS TABLE (
  subscription_plan TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.subscription_plan,
    CASE
      WHEN p.subscription_plan = 'free' THEN TRUE
      WHEN p.subscription_expires_at IS NULL THEN FALSE
      WHEN p.subscription_expires_at > NOW() THEN TRUE
      ELSE FALSE
    END AS is_active,
    p.subscription_expires_at AS expires_at,
    CASE
      WHEN p.subscription_plan = 'free' THEN NULL
      WHEN p.subscription_expires_at IS NULL THEN NULL
      WHEN p.subscription_expires_at < NOW() THEN 0
      ELSE EXTRACT(DAY FROM (p.subscription_expires_at - NOW()))::INTEGER
    END AS days_remaining
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour la fonction
COMMENT ON FUNCTION get_subscription_status(UUID) IS 'Obtient le statut de l''abonnement d''un utilisateur via RPC';

-- ============================================
-- 10. Logs et monitoring
-- ============================================

-- Table de logs pour les activations d'abonnement
CREATE TABLE IF NOT EXISTS subscription_activation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('activated', 'renewed', 'upgraded', 'downgraded', 'expired', 'cancelled')),
  previous_plan TEXT,
  new_plan TEXT,
  payment_method TEXT,
  amount NUMERIC(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les logs
CREATE INDEX IF NOT EXISTS idx_subscription_logs_user
ON subscription_activation_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_action
ON subscription_activation_logs(action, created_at DESC);

-- Commentaire
COMMENT ON TABLE subscription_activation_logs IS 'Logs de toutes les actions sur les abonnements';

-- ============================================
-- 11. Mise à jour des données existantes
-- ============================================

-- Mettre à jour les utilisateurs sans plan défini
UPDATE profiles
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL;

-- S'assurer que tous les plans gratuits ont updated_at
UPDATE profiles
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- ============================================
-- 12. Grant des permissions
-- ============================================

-- Permettre aux utilisateurs authentifiés d'utiliser les fonctions
GRANT EXECUTE ON FUNCTION is_subscription_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_status(UUID) TO authenticated;

-- Permettre à postgres d'exécuter la fonction d'expiration (pour les cron jobs)
GRANT EXECUTE ON FUNCTION expire_old_subscriptions() TO postgres;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée: Système d''abonnement avec activation immédiate configuré';
  RAISE NOTICE '📋 Colonnes ajoutées: subscription_plan, subscription_expires_at, updated_at';
  RAISE NOTICE '📊 Tables créées: subscription_history, subscription_activation_logs';
  RAISE NOTICE '🔧 Fonctions créées: is_subscription_active, expire_old_subscriptions, get_subscription_status';
  RAISE NOTICE '👁️ Vue créée: subscription_status';
  RAISE NOTICE '⚡ Triggers créés: on_subscription_activation, set_updated_at';
END $$;
