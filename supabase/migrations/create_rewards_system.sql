-- ========================================
-- SYSTÈME DE RÉCOMPENSES ET UTILISATION DES POINTS
-- Permet aux utilisateurs d'échanger leurs points contre des avantages
-- ========================================

-- Table des récompenses disponibles
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'discount', 'boost', 'premium', 'gift'
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  value DECIMAL(10,2), -- Valeur en XOF pour les réductions
  duration_days INTEGER, -- Durée de validité en jours
  icon TEXT, -- Emoji ou nom d'icône
  is_active BOOLEAN DEFAULT true,
  stock INTEGER, -- NULL = illimité
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des récompenses obtenues par les utilisateurs
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES orders(id), -- Si utilisé sur une commande
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_category ON rewards_catalog(category);

-- Fonction pour échanger des points contre une récompense
CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_reward RECORD;
  v_user_points INTEGER;
  v_user_reward_id UUID;
BEGIN
  -- Récupérer la récompense
  SELECT * INTO v_reward
  FROM rewards_catalog
  WHERE id = p_reward_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Récompense introuvable ou inactive'
    );
  END IF;

  -- Vérifier le stock
  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Récompense en rupture de stock'
    );
  END IF;

  -- Récupérer les points de l'utilisateur
  SELECT points INTO v_user_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  IF v_user_points IS NULL THEN
    v_user_points := 0;
  END IF;

  -- Vérifier si l'utilisateur a assez de points
  IF v_user_points < v_reward.points_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Points insuffisants',
      'required', v_reward.points_cost,
      'available', v_user_points
    );
  END IF;

  -- Déduire les points
  UPDATE loyalty_points
  SET points = points - v_reward.points_cost
  WHERE user_id = p_user_id;

  -- Créer la transaction de débit
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    -v_reward.points_cost,
    'redemption',
    'Échange: ' || v_reward.title,
    p_reward_id
  );

  -- Ajouter la récompense à l'utilisateur
  INSERT INTO user_rewards (
    user_id,
    reward_id,
    points_spent,
    status,
    expires_at
  ) VALUES (
    p_user_id,
    p_reward_id,
    v_reward.points_cost,
    'active',
    CASE
      WHEN v_reward.duration_days IS NOT NULL
      THEN NOW() + INTERVAL '1 day' * v_reward.duration_days
      ELSE NULL
    END
  )
  RETURNING id INTO v_user_reward_id;

  -- Décrémenter le stock si applicable
  IF v_reward.stock IS NOT NULL THEN
    UPDATE rewards_catalog
    SET stock = stock - 1
    WHERE id = p_reward_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_reward_id', v_user_reward_id,
    'reward_title', v_reward.title,
    'points_spent', v_reward.points_cost,
    'remaining_points', v_user_points - v_reward.points_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour appliquer un bon de réduction sur une commande
CREATE OR REPLACE FUNCTION apply_discount_reward(
  p_user_id UUID,
  p_order_id UUID,
  p_user_reward_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_reward RECORD;
  v_reward RECORD;
  v_discount_amount DECIMAL(10,2);
BEGIN
  -- Récupérer la récompense de l'utilisateur
  SELECT * INTO v_user_reward
  FROM user_rewards
  WHERE id = p_user_reward_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Récompense invalide ou expirée'
    );
  END IF;

  -- Récupérer les détails de la récompense
  SELECT * INTO v_reward
  FROM rewards_catalog
  WHERE id = v_user_reward.reward_id
    AND category = 'discount';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette récompense n''est pas un bon de réduction'
    );
  END IF;

  v_discount_amount := v_reward.value;

  -- Marquer la récompense comme utilisée
  UPDATE user_rewards
  SET
    status = 'used',
    used_at = NOW(),
    order_id = p_order_id
  WHERE id = p_user_reward_id;

  RETURN json_build_object(
    'success', true,
    'discount_amount', v_discount_amount,
    'reward_title', v_reward.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour convertir des points en réduction directe
CREATE OR REPLACE FUNCTION convert_points_to_discount(
  p_user_id UUID,
  p_points_to_convert INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_user_points INTEGER;
  v_discount_amount DECIMAL(10,2);
  v_conversion_rate DECIMAL(10,2) := 10.0; -- 1 point = 10 XOF
BEGIN
  -- Vérifier que le montant est valide
  IF p_points_to_convert <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Montant de points invalide'
    );
  END IF;

  -- Minimum 50 points pour convertir
  IF p_points_to_convert < 50 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Minimum 50 points requis pour la conversion'
    );
  END IF;

  -- Récupérer les points de l'utilisateur
  SELECT points INTO v_user_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  IF v_user_points IS NULL OR v_user_points < p_points_to_convert THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Points insuffisants'
    );
  END IF;

  -- Calculer la réduction
  v_discount_amount := p_points_to_convert * v_conversion_rate;

  -- Déduire les points
  UPDATE loyalty_points
  SET points = points - p_points_to_convert
  WHERE user_id = p_user_id;

  -- Créer la transaction
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description
  ) VALUES (
    p_user_id,
    -p_points_to_convert,
    'conversion',
    'Conversion en réduction: ' || v_discount_amount || ' XOF'
  );

  RETURN json_build_object(
    'success', true,
    'points_converted', p_points_to_convert,
    'discount_amount', v_discount_amount,
    'remaining_points', v_user_points - p_points_to_convert
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les récompenses actives d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_active_rewards(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  reward_title TEXT,
  reward_description TEXT,
  reward_category TEXT,
  points_spent INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  reward_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.id,
    rc.title,
    rc.description,
    rc.category,
    ur.points_spent,
    ur.expires_at,
    rc.value
  FROM user_rewards ur
  JOIN rewards_catalog rc ON rc.id = ur.reward_id
  WHERE ur.user_id = p_user_id
    AND ur.status = 'active'
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY ur.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer des récompenses par défaut
INSERT INTO rewards_catalog (title, description, category, points_cost, value, duration_days, icon) VALUES
-- Réductions
('Bon de 500 XOF', 'Réduction de 500 XOF sur votre prochaine commande', 'discount', 50, 500, 30, '💰'),
('Bon de 1000 XOF', 'Réduction de 1000 XOF sur votre prochaine commande', 'discount', 100, 1000, 30, '💵'),
('Bon de 2500 XOF', 'Réduction de 2500 XOF sur votre prochaine commande', 'discount', 200, 2500, 30, '💸'),
('Bon de 5000 XOF', 'Réduction de 5000 XOF sur votre prochaine commande', 'discount', 400, 5000, 30, '🎁'),

-- Boosts de visibilité
('Boost 24h', 'Mettez en avant vos produits pendant 24h', 'boost', 100, NULL, 1, '🚀'),
('Boost 3 jours', 'Mettez en avant vos produits pendant 3 jours', 'boost', 250, NULL, 3, '⭐'),
('Boost 7 jours', 'Mettez en avant vos produits pendant 7 jours', 'boost', 500, NULL, 7, '🔥'),

-- Avantages Premium
('Badge VIP 30j', 'Badge VIP visible sur votre profil pendant 30 jours', 'premium', 300, NULL, 30, '👑'),
('Livraison Gratuite x3', '3 livraisons gratuites', 'premium', 150, NULL, 60, '🚚'),
('Support Prioritaire', 'Support client prioritaire pendant 30 jours', 'premium', 200, NULL, 30, '💬')

ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE rewards_catalog IS 'Catalogue des récompenses disponibles à l''échange';
COMMENT ON TABLE user_rewards IS 'Récompenses obtenues par les utilisateurs';
COMMENT ON FUNCTION redeem_reward(UUID, UUID) IS 'Permet à un utilisateur d''échanger ses points contre une récompense';
COMMENT ON FUNCTION apply_discount_reward(UUID, UUID, UUID) IS 'Applique un bon de réduction sur une commande';
COMMENT ON FUNCTION convert_points_to_discount(UUID, INTEGER) IS 'Convertit des points en réduction directe (1 point = 10 XOF)';
COMMENT ON FUNCTION get_user_active_rewards(UUID) IS 'Récupère toutes les récompenses actives d''un utilisateur';
