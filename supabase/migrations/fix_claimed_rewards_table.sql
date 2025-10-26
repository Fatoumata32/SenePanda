-- ========================================
-- CORRECTION DE LA TABLE claimed_rewards
-- Ajoute les colonnes manquantes pour le système de récompenses
-- ========================================

-- Ajouter la colonne points_spent si elle n'existe pas
ALTER TABLE claimed_rewards
ADD COLUMN IF NOT EXISTS points_spent INTEGER NOT NULL DEFAULT 0;

-- Ajouter d'autres colonnes utiles si elles n'existent pas
ALTER TABLE claimed_rewards
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- S'assurer que la colonne status existe
ALTER TABLE claimed_rewards
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Créer un index pour les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_user_id ON claimed_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_status ON claimed_rewards(status);

-- Mettre à jour les récompenses existantes qui n'ont pas de points_spent
-- Vérifie d'abord si rewards_catalog existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards_catalog') THEN
    UPDATE claimed_rewards
    SET points_spent = (
      SELECT points_cost
      FROM rewards_catalog
      WHERE rewards_catalog.id = claimed_rewards.reward_id
    )
    WHERE points_spent = 0 OR points_spent IS NULL;
  END IF;
END $$;

-- Commentaire
COMMENT ON COLUMN claimed_rewards.points_spent IS 'Nombre de points dépensés pour obtenir cette récompense';
COMMENT ON COLUMN claimed_rewards.expires_at IS 'Date d''expiration de la récompense';
COMMENT ON COLUMN claimed_rewards.status IS 'Statut de la récompense: active, used, expired';
