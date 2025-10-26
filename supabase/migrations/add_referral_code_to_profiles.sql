-- Ajouter un code de parrainage unique à chaque utilisateur

-- Ajouter la colonne referral_code
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code aléatoire de 8 caractères (majuscules + chiffres)
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;

    -- Si le code n'existe pas, on le retourne
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement un code lors de la création d'un profil
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Générer des codes pour les profils existants qui n'en ont pas
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Fonction pour enregistrer un parrainage
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
    'pending',
    200,  -- Points pour le parrain (donné au premier achat du filleul)
    50    -- Points de bienvenue pour le filleul (donnés immédiatement)
  )
  RETURNING id INTO v_referral_id;

  -- Donner immédiatement 50 points de bienvenue au filleul
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

  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'welcome_points', 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON COLUMN profiles.referral_code IS 'Code de parrainage unique pour chaque utilisateur';
COMMENT ON FUNCTION generate_referral_code() IS 'Génère un code de parrainage unique de 8 caractères';
COMMENT ON FUNCTION register_referral(UUID, TEXT) IS 'Enregistre un parrainage et attribue les points de bienvenue';
