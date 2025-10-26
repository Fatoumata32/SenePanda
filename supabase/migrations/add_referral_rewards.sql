-- ========================================
-- ATTRIBUTION DES POINTS DE PARRAINAGE
-- Attribue les points quand le filleul fait son premier achat
-- ========================================

-- Fonction pour attribuer les points de parrainage au premier achat
CREATE OR REPLACE FUNCTION award_referral_points()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_record RECORD;
  v_is_first_purchase BOOLEAN;
BEGIN
  -- Vérifier si c'est le premier achat livré de l'utilisateur
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Compter les commandes livrées de cet utilisateur (avant celle-ci)
    SELECT COUNT(*) = 0 INTO v_is_first_purchase
    FROM orders
    WHERE user_id = NEW.user_id
      AND status = 'delivered'
      AND id != NEW.id;

    -- Si c'est le premier achat
    IF v_is_first_purchase THEN
      -- Chercher le parrainage en attente
      SELECT * INTO v_referral_record
      FROM referrals
      WHERE referred_id = NEW.user_id
        AND status = 'pending'
      LIMIT 1;

      -- Si un parrainage existe
      IF FOUND THEN
        -- Attribuer 200 points au parrain
        PERFORM add_loyalty_points(
          v_referral_record.referrer_id,
          200,
          'referral',
          'Parrainage : ' || (SELECT username FROM profiles WHERE id = NEW.user_id),
          v_referral_record.id
        );

        -- Attribuer 100 points au filleul
        PERFORM add_loyalty_points(
          NEW.user_id,
          100,
          'referral',
          'Bonus de bienvenue via parrainage',
          v_referral_record.id
        );

        -- Mettre à jour le statut du parrainage
        UPDATE referrals
        SET
          status = 'completed',
          referrer_points = 200,
          referred_points = 100,
          completed_at = NOW()
        WHERE id = v_referral_record.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger (après le trigger award_purchase_points)
DROP TRIGGER IF EXISTS trigger_award_referral_points ON orders;
CREATE TRIGGER trigger_award_referral_points
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_points();

-- Commentaire
COMMENT ON FUNCTION award_referral_points() IS 'Attribue les points de parrainage au premier achat du filleul';
