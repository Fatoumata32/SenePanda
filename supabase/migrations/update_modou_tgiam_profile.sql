-- Mise à jour du profil de Modou Tgiam pour corriger les initiales
-- Le sigle passera de "F3" à "MT"

UPDATE profiles
SET
  first_name = 'Modou',
  last_name = 'Tgiam',
  full_name = 'Modou Tgiam',
  updated_at = NOW()
WHERE username = 'user_f3a6sd14';

-- Alternative si le username n'existe pas, chercher par email ou ID
-- Décommenter et adapter selon vos besoins:
-- UPDATE profiles
-- SET
--   first_name = 'Modou',
--   last_name = 'Tgiam',
--   full_name = 'Modou Tgiam',
--   updated_at = NOW()
-- WHERE email = 'votre.email@example.com';
