-- ========================================
-- ATTRIBUTION RÉTROACTIVE DES POINTS DE PARRAINAGE
-- Donne les 200 points aux parrains qui avaient des filleuls en attente
-- ========================================

-- S'assurer que la colonne successful_referrals existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- S'assurer que la colonne completed_at existe dans referrals
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

DO $$
DECLARE
  r RECORD;
  v_referral_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Début de l''attribution rétroactive des points de parrainage...';

  FOR r IN
    SELECT
      ref.referrer_id,
      ref.id as referral_id,
      ref.referred_id,
      p.username as referrer_username,
      p2.username as referred_username
    FROM referrals ref
    JOIN profiles p ON p.id = ref.referrer_id
    JOIN profiles p2 ON p2.id = ref.referred_id
    WHERE ref.status = 'pending'
  LOOP
    -- Donner 200 points au parrain
    INSERT INTO loyalty_points (user_id, points, total_earned, level)
    VALUES (r.referrer_id, 200, 200, 'bronze')
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
      r.referrer_id,
      200,
      'referral',
      'Bonus parrainage rétroactif - Filleul: ' || COALESCE(r.referred_username, 'Utilisateur'),
      r.referral_id
    );

    -- Incrémenter le compteur de parrainages du parrain
    UPDATE profiles
    SET successful_referrals = COALESCE(successful_referrals, 0) + 1
    WHERE id = r.referrer_id;

    -- Mettre à jour le statut du parrainage
    UPDATE referrals
    SET
      status = 'active',
      referrer_points = 200
    WHERE id = r.referral_id;

    v_referral_count := v_referral_count + 1;

    RAISE NOTICE 'Points attribués: Parrain % a reçu 200 points pour le filleul %',
      COALESCE(r.referrer_username, 'ID: ' || r.referrer_id::text),
      COALESCE(r.referred_username, 'ID: ' || r.referred_id::text);
  END LOOP;

  RAISE NOTICE 'Attribution rétroactive terminée. % parrainage(s) traité(s).', v_referral_count;

  IF v_referral_count = 0 THEN
    RAISE NOTICE 'Aucun parrainage en attente trouvé.';
  END IF;
END $$;

-- Afficher un résumé des points attribués
SELECT
  p.username,
  p.full_name,
  lp.points as points_actuels,
  lp.total_earned as total_gagné,
  p.successful_referrals as parrainages_réussis
FROM profiles p
LEFT JOIN loyalty_points lp ON lp.user_id = p.id
WHERE p.successful_referrals > 0
ORDER BY lp.points DESC;
