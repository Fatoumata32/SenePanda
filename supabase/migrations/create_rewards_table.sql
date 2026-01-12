-- Migration: Création de la table rewards
-- Date: 2026-01-11

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('discount', 'free_shipping', 'voucher')) NOT NULL,
  reward_value NUMERIC,
  min_level TEXT CHECK (min_level IN ('bronze', 'silver', 'gold', 'platinum')) NOT NULL DEFAULT 'bronze',
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les récompenses actives
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active);

-- Index pour le type de récompense
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);

-- Index pour le niveau minimum
CREATE INDEX IF NOT EXISTS idx_rewards_min_level ON rewards(min_level);
