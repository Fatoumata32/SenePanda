-- Ajouter la colonne fcm_token à la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;

-- Créer un index pour rechercher rapidement par token
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON profiles(fcm_token);

-- Commentaire
COMMENT ON COLUMN profiles.fcm_token IS 'Firebase Cloud Messaging token pour les notifications push';
COMMENT ON COLUMN profiles.fcm_token_updated_at IS 'Date de dernière mise à jour du token FCM';
