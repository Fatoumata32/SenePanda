-- Migration: Ajout du rôle préféré utilisateur
-- Description: Ajoute un champ pour stocker le choix de rôle persistant (acheteur/vendeur)
-- Date: 2025-12-16

-- Ajouter la colonne preferred_role à la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_role TEXT CHECK (preferred_role IN ('buyer', 'seller'));

-- Index pour améliorer les performances de recherche par rôle
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_role
ON profiles(preferred_role)
WHERE preferred_role IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN profiles.preferred_role IS 'Rôle préféré de l''utilisateur: buyer (acheteur) ou seller (vendeur). Demandé une seule fois après la première connexion.';
