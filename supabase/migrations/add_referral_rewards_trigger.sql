-- Système automatique pour attribuer les points de parrainage au parrain
-- lors du premier achat du filleul

-- Fonction pour attribuer les points au parrain lors du premier achat
CREATE OR REPLACE FUNCTION reward_referrer_on_first_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_referral RECORD;
  v_is_first_purchase BOOLEAN;
BEGIN
  -- Vérifier si c'est le premier achat de l'utilisateur (statut completed)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Vérifier si c'est vraiment le premier achat
    SELECT NOT EXISTS(
      SELECT 1 FROM orders
      WHERE user_id = NEW.user_id
      AND status = 'completed'
      AND id != NEW.id
    ) INTO v_is_first_purchase;

    -- Si c'est le premier achat, chercher le parrainage
    IF v_is_first_purchase THEN
      SELECT * INTO v_referral
      FROM referrals
      WHERE referred_id = NEW.user_id
      AND status = 'pending'
      LIMIT 1;

      -- Si un parrainage existe
      IF FOUND THEN
        -- Donner les 200 points au parrain
        INSERT INTO loyalty_points (user_id, points, total_earned, level)
        VALUES (v_referral.referrer_id, 200, 200, 'bronze')
        ON CONFLICT (user_id) DO UPDATE
        SET
          points = loyalty_points.points + 200,
          total_earned = loyalty_points.total_earned + 200;

        -- Créer la transaction pour le parrain
        INSERT INTO points_transactions (
          user_id,
          points,
          type,
          description,
          reference_id
        ) VALUES (
          v_referral.referrer_id,
          200,
          'referral',
          'Bonus parrainage - Premier achat de votre filleul',
          v_referral.id
        );

        -- Mettre à jour le statut du parrainage
        UPDATE referrals
        SET
          status = 'completed',
          completed_at = NOW()
        WHERE id = v_referral.id;

        -- Mettre à jour le compteur de parrainages réussis du parrain
        UPDATE profiles
        SET successful_referrals = COALESCE(successful_referrals, 0) + 1
        WHERE id = v_referral.referrer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table orders
DROP TRIGGER IF EXISTS trigger_reward_referrer ON orders;
CREATE TRIGGER trigger_reward_referrer
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reward_referrer_on_first_purchase();

-- Ajouter une colonne pour compter les parrainages réussis
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- Ajouter une colonne completed_at dans referrals
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Commentaires
COMMENT ON FUNCTION reward_referrer_on_first_purchase() IS 'Attribue automatiquement 200 points au parrain lors du premier achat complété du filleul';
COMMENT ON COLUMN profiles.successful_referrals IS 'Nombre de parrainages réussis (filleuls ayant fait au moins un achat)';
COMMENT ON COLUMN referrals.completed_at IS 'Date à laquelle le parrainage a été complété (premier achat du filleul)';
