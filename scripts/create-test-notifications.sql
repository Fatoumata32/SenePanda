-- =============================================
-- Script pour créer des notifications de test
-- À exécuter dans le dashboard Supabase SQL Editor
-- =============================================

-- 1. Créer la table deal_notifications si elle n'existe pas
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

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own deal notifications" ON deal_notifications;
DROP POLICY IF EXISTS "Users can update own deal notifications" ON deal_notifications;
DROP POLICY IF EXISTS "Allow insert deal notifications" ON deal_notifications;

-- Nouvelles policies
CREATE POLICY "Users can view own deal notifications"
    ON deal_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own deal notifications"
    ON deal_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow insert deal notifications"
    ON deal_notifications FOR INSERT
    WITH CHECK (true);

-- 2. Insérer des notifications de test pour TOUS les utilisateurs
INSERT INTO deal_notifications (user_id, title, message, type, is_read)
SELECT
    id as user_id,
    'Bienvenue sur SenePanda! 🎉',
    'Découvrez nos promotions exclusives et commencez à acheter ou vendre dès maintenant.',
    'promo',
    false
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM deal_notifications
    WHERE deal_notifications.user_id = auth.users.id
    AND title = 'Bienvenue sur SenePanda! 🎉'
);

INSERT INTO deal_notifications (user_id, title, message, type, is_read)
SELECT
    id as user_id,
    'Nouvelle promotion Flash! ⚡',
    'Ne manquez pas nos offres flash du jour avec jusqu''à 50% de réduction.',
    'promo',
    false
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM deal_notifications
    WHERE deal_notifications.user_id = auth.users.id
    AND title = 'Nouvelle promotion Flash! ⚡'
);

INSERT INTO deal_notifications (user_id, title, message, type, is_read)
SELECT
    id as user_id,
    'Points de fidélité disponibles 🎁',
    'Vous avez accumulé des points! Consultez vos récompenses maintenant.',
    'reward',
    false
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM deal_notifications
    WHERE deal_notifications.user_id = auth.users.id
    AND title = 'Points de fidélité disponibles 🎁'
);

-- Afficher le nombre de notifications créées
DO $$
DECLARE
    notif_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notif_count FROM deal_notifications;
    RAISE NOTICE '✅ Table deal_notifications configurée';
    RAISE NOTICE '✅ Total de % notifications créées', notif_count;
END $$;
