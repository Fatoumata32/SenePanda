-- =====================================================
-- ATTRIBUER DES CODES DE PARRAINAGE À TOUS LES UTILISATEURS
-- =====================================================
-- Ce script génère un code de parrainage unique pour tous
-- les utilisateurs qui n'en ont pas encore.
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Ajouter la colonne si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE;

-- 2. Créer un index pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 3. Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    new_code VARCHAR(8);
    code_exists BOOLEAN;
    chars VARCHAR(32) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
    LOOP
        -- Générer un code aléatoire de 8 caractères
        new_code := '';
        FOR i IN 1..8 LOOP
            new_code := new_code || SUBSTR(chars, FLOOR(RANDOM() * 32 + 1)::INT, 1);
        END LOOP;

        -- Vérifier si le code existe déjà
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE referral_code = new_code
        ) INTO code_exists;

        -- Sortir si le code est unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 4. Attribuer des codes à tous les utilisateurs qui n'en ont pas
DO $$
DECLARE
    profile_record RECORD;
    new_code VARCHAR(8);
    updated_count INT := 0;
BEGIN
    FOR profile_record IN
        SELECT id FROM profiles WHERE referral_code IS NULL
    LOOP
        new_code := generate_unique_referral_code();

        UPDATE profiles
        SET referral_code = new_code
        WHERE id = profile_record.id;

        updated_count := updated_count + 1;

        RAISE NOTICE 'Code % attribué à utilisateur %', new_code, profile_record.id;
    END LOOP;

    RAISE NOTICE '✅ Total: % codes de parrainage attribués', updated_count;
END $$;

-- 5. Vérification finale
SELECT
    COUNT(*) as total_users,
    COUNT(referral_code) as users_with_code,
    COUNT(*) - COUNT(referral_code) as users_without_code
FROM profiles;

-- 6. Afficher quelques exemples
SELECT id, full_name, phone, referral_code
FROM profiles
WHERE referral_code IS NOT NULL
LIMIT 10;

-- =====================================================
-- RÉSULTAT ATTENDU:
-- =====================================================
-- Tous les utilisateurs auront maintenant un code de
-- parrainage unique de 8 caractères (ex: "A3B7K9XY")
--
-- Ce code peut être partagé avec des amis. Quand un ami
-- s'inscrit avec ce code:
-- - Le PARRAIN reçoit 500 PandaCoins (récompense)
-- - Le FILLEUL reçoit 200 PandaCoins (bonus inscription)
-- =====================================================
