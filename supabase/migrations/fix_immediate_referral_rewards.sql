-- ========================================
-- CORRECTION : Attribution immédiate des points de parrainage
-- Attribue 200 points au parrain ET 50 points au filleul dès le parrainage
-- ========================================

-- Nouvelle fonction register_referral avec attribution immédiate des points au parrain
CREATE OR REPLACE FUNCTION register_referral(
  p_referred_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_result JSON;
BEGIN
  -- Trouver le parrain via son code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code
  LIMIT 1;

  -- Vérifier que le code existe
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide'
    );
  END IF;

  -- Vérifier que l'utilisateur ne se parraine pas lui-même
  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;

  -- Vérifier que l'utilisateur n'a pas déjà été parrainé
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous avez déjà utilisé un code de parrainage'
    );
  END IF;

  -- Créer le parrainage
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    status,
    referrer_points,
    referred_points
  ) VALUES (
    v_referrer_id,
    p_referred_user_id,
    'active',  -- Changé de 'pending' à 'active' car les points sont donnés immédiatement
    200,  -- Points pour le parrain (donnés immédiatement)
    50    -- Points de bienvenue pour le filleul (donnés immédiatement)
  )
  RETURNING id INTO v_referral_id;

  -- DONNER IMMÉDIATEMENT 200 POINTS AU PARRAIN
  INSERT INTO loyalty_points (user_id, points, total_earned, level)
  VALUES (v_referrer_id, 200, 200, 'bronze')
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
    v_referrer_id,
    200,
    'referral',
    'Bonus parrainage - Nouveau filleul inscrit',
    v_referral_id
  );

  -- DONNER IMMÉDIATEMENT 50 POINTS AU FILLEUL
  INSERT INTO loyalty_points (user_id, points, total_earned, level)
  VALUES (p_referred_user_id, 50, 50, 'bronze')
  ON CONFLICT (user_id) DO UPDATE
  SET
    points = loyalty_points.points + 50,
    total_earned = loyalty_points.total_earned + 50;

  -- Créer la transaction pour le filleul
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    description,
    reference_id
  ) VALUES (
    p_referred_user_id,
    50,
    'welcome',
    'Bonus de bienvenue via parrainage',
    v_referral_id
  );

  -- Incrémenter le compteur de parrainages du parrain
  UPDATE profiles
  SET successful_referrals = COALESCE(successful_referrals, 0) + 1
  WHERE id = v_referrer_id;

  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_points', 200,
    'welcome_points', 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION register_referral(UUID, TEXT) IS 'Enregistre un parrainage et attribue IMMÉDIATEMENT 200 points au parrain et 50 points au filleul';

-- Note : Les triggers existants (reward_referrer_on_first_purchase et award_referral_points)
-- continueront de fonctionner mais ne devraient pas réattribuer de points car le statut sera 'active' et non 'pending'
-- Ils peuvent être désactivés si nécessaire, mais ils ne causeront pas de problème.
