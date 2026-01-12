-- ============================================
-- CONFIGURATION DE LA POLITIQUE DE MOT DE PASSE
-- ============================================
-- Ce script configure Supabase pour accepter des codes PIN de 4 chiffres
-- Exécutez ce script dans le SQL Editor de Supabase Dashboard

-- IMPORTANT: Cette configuration doit être faite dans le Dashboard Supabase
-- car la politique de mot de passe n'est pas gérable via SQL

/*
INSTRUCTIONS POUR CONFIGURER LA POLITIQUE DE MOT DE PASSE:

1. Aller dans Supabase Dashboard
2. Sélectionner votre projet
3. Aller dans "Authentication" > "Policies"
4. Dans la section "Password Requirements", configurer:
   - Minimum password length: 4 (au lieu de 6 par défaut)
   - Require uppercase: Non
   - Require lowercase: Non
   - Require numbers: Oui
   - Require special characters: Non

5. Sauvegarder les modifications

ALTERNATIVE: Si vous ne pouvez pas accéder aux paramètres,
utilisez cette solution de contournement:
*/

-- ============================================
-- SOLUTION DE CONTOURNEMENT
-- ============================================
-- Utiliser un padding pour les codes PIN de 4 chiffres

-- Cette fonction ajoute un padding aux codes PIN courts
CREATE OR REPLACE FUNCTION public.pad_pin_code(pin TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si le PIN a moins de 6 caractères, ajouter un padding
  IF LENGTH(pin) < 6 THEN
    -- Ajouter "00" au début pour atteindre 6 caractères
    RETURN LPAD(pin, 6, '0');
  END IF;

  RETURN pin;
END;
$$;

-- Exemples d'utilisation:
-- PIN 1234 devient 001234
-- PIN 5678 devient 005678
-- PIN 123456 reste 123456

COMMENT ON FUNCTION public.pad_pin_code IS 'Ajoute un padding aux codes PIN de 4 chiffres pour respecter la politique de mot de passe Supabase (minimum 6 caractères)';

-- ============================================
-- NOTES POUR LES DÉVELOPPEURS
-- ============================================
/*
Pour utiliser cette solution de contournement dans l'application:

1. Lors de l'inscription/connexion:
   - Si le PIN a 4 chiffres, utiliser pad_pin_code() côté backend
   - Exemple: "1234" → "001234"

2. Dans le code TypeScript:
   const padPinCode = (pin: string): string => {
     return pin.length < 6 ? pin.padStart(6, '0') : pin;
   };

3. Utiliser la fonction avant d'appeler signUp ou signInWithPassword:
   const paddedPin = padPinCode(password);
   await supabase.auth.signUp({ email, password: paddedPin });

IMPORTANT: Cette solution est temporaire.
En production, configurez la politique de mot de passe dans le Dashboard.
*/

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Tester la fonction de padding
SELECT
  '1234' as original,
  pad_pin_code('1234') as padded;

SELECT
  '123456' as original,
  pad_pin_code('123456') as padded;
