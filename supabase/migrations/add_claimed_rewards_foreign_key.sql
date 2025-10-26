-- ========================================
-- AJOUTER LA RELATION ENTRE claimed_rewards ET rewards
-- Permet de charger les détails de la récompense via Supabase
-- ========================================

-- Vérifier d'abord si la table claimed_rewards existe
DO $$
BEGIN
  -- Ajouter la colonne reward_id si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'claimed_rewards'
    AND column_name = 'reward_id'
  ) THEN
    ALTER TABLE claimed_rewards
    ADD COLUMN reward_id UUID;
  END IF;

  -- Supprimer la contrainte existante si elle existe
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'claimed_rewards_reward_id_fkey'
  ) THEN
    ALTER TABLE claimed_rewards
    DROP CONSTRAINT claimed_rewards_reward_id_fkey;
  END IF;

  -- Ajouter la contrainte de clé étrangère
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'rewards'
  ) THEN
    ALTER TABLE claimed_rewards
    ADD CONSTRAINT claimed_rewards_reward_id_fkey
    FOREIGN KEY (reward_id)
    REFERENCES rewards(id)
    ON DELETE CASCADE;
  END IF;

  -- Créer un index pour améliorer les performances des jointures
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_claimed_rewards_reward_id'
  ) THEN
    CREATE INDEX idx_claimed_rewards_reward_id ON claimed_rewards(reward_id);
  END IF;
END $$;

-- Commentaire
COMMENT ON CONSTRAINT claimed_rewards_reward_id_fkey ON claimed_rewards
IS 'Lie une récompense réclamée à son entrée dans le catalogue de récompenses';
