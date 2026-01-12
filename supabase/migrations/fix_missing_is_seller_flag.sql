-- Correction: S'assurer que tous les profils avec shop_name ont is_seller = true
-- Ce fix corrige le problème "boutique introuvable" en production

-- Mettre à jour tous les profils qui ont un shop_name mais is_seller = false
UPDATE profiles
SET is_seller = true
WHERE shop_name IS NOT NULL
  AND shop_name != ''
  AND is_seller = false;

-- Créer un trigger pour s'assurer qu'un profil avec shop_name a automatiquement is_seller = true
CREATE OR REPLACE FUNCTION ensure_seller_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un shop_name est défini, forcer is_seller à true
  IF NEW.shop_name IS NOT NULL AND NEW.shop_name != '' THEN
    NEW.is_seller := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS trigger_ensure_seller_flag ON profiles;
CREATE TRIGGER trigger_ensure_seller_flag
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_seller_flag();

-- Afficher un rapport des profils corrigés
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM profiles
  WHERE shop_name IS NOT NULL
    AND shop_name != ''
    AND is_seller = true;

  RAISE NOTICE '✅ Nombre de boutiques avec is_seller = true: %', fixed_count;
END $$;
