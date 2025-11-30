-- =============================================
-- Création de la table deal_notifications
-- Date: 2025-11-30
-- Description: Table pour stocker les notifications de promotions et deals
-- =============================================

-- Créer la table deal_notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS deal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id UUID,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'promo',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_deal_notifications_user_id ON deal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_is_read ON deal_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_created_at ON deal_notifications(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres notifications
CREATE POLICY "Users can view own deal notifications"
    ON deal_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres notifications
CREATE POLICY "Users can update own deal notifications"
    ON deal_notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Permettre l'insertion de notifications (système ou admin)
CREATE POLICY "Allow insert deal notifications"
    ON deal_notifications
    FOR INSERT
    WITH CHECK (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_deal_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_deal_notifications_updated_at ON deal_notifications;
CREATE TRIGGER trigger_update_deal_notifications_updated_at
    BEFORE UPDATE ON deal_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_notifications_updated_at();

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table deal_notifications créée avec succès';
    RAISE NOTICE '✅ Indexes et RLS configurés';
END $$;
