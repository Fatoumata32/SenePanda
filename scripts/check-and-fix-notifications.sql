-- =============================================
-- Script pour vérifier et corriger la table deal_notifications
-- À exécuter dans le dashboard Supabase SQL Editor
-- =============================================

-- 1. Vérifier la structure actuelle de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deal_notifications'
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Ajouter la colonne title si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deal_notifications' AND column_name = 'title'
    ) THEN
        ALTER TABLE deal_notifications ADD COLUMN title TEXT NOT NULL DEFAULT 'Notification';
        RAISE NOTICE '✅ Colonne title ajoutée';
    END IF;

    -- Ajouter la colonne message si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deal_notifications' AND column_name = 'message'
    ) THEN
        ALTER TABLE deal_notifications ADD COLUMN message TEXT;
        RAISE NOTICE '✅ Colonne message ajoutée';
    END IF;

    -- Ajouter la colonne type si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deal_notifications' AND column_name = 'type'
    ) THEN
        ALTER TABLE deal_notifications ADD COLUMN type TEXT DEFAULT 'promo';
        RAISE NOTICE '✅ Colonne type ajoutée';
    END IF;

    -- Ajouter la colonne updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deal_notifications' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE deal_notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Colonne updated_at ajoutée';
    END IF;
END $$;

-- 3. Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_deal_notifications_user_id ON deal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_is_read ON deal_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_created_at ON deal_notifications(created_at DESC);

-- 4. Activer RLS si pas déjà activé
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;

-- 5. Recréer les policies
DROP POLICY IF EXISTS "Users can view own deal notifications" ON deal_notifications;
DROP POLICY IF EXISTS "Users can update own deal notifications" ON deal_notifications;
DROP POLICY IF EXISTS "Allow insert deal notifications" ON deal_notifications;

CREATE POLICY "Users can view own deal notifications"
    ON deal_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own deal notifications"
    ON deal_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow insert deal notifications"
    ON deal_notifications FOR INSERT
    WITH CHECK (true);

-- 6. Insérer des notifications de test pour TOUS les utilisateurs
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

-- 7. Afficher le résultat
DO $$
DECLARE
    notif_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notif_count FROM deal_notifications;
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE '✅ Table deal_notifications configurée';
    RAISE NOTICE '✅ % utilisateurs trouvés', user_count;
    RAISE NOTICE '✅ % notifications au total', notif_count;
END $$;
