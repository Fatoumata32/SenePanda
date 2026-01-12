-- =============================================
-- Script FINAL pour corriger et créer les notifications
-- À exécuter dans le dashboard Supabase SQL Editor
-- =============================================

-- 1. Vérifier la structure actuelle de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'deal_notifications'
ORDER BY ordinal_position;

-- 2. Modifier la colonne deal_id pour la rendre NULLABLE (optionnelle)
DO $$
BEGIN
    -- Supprimer la contrainte NOT NULL sur deal_id
    ALTER TABLE deal_notifications ALTER COLUMN deal_id DROP NOT NULL;
    RAISE NOTICE '✅ Colonne deal_id rendue optionnelle';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Note: La colonne deal_id est déjà nullable ou autre erreur: %', SQLERRM;
END $$;

-- 3. Ajouter les colonnes manquantes si elles n'existent pas
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

-- 4. Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_deal_notifications_user_id ON deal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_is_read ON deal_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_created_at ON deal_notifications(created_at DESC);

-- 5. Activer RLS si pas déjà activé
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;

-- 6. Recréer les policies
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

-- 7. Insérer des notifications de test pour TOUS les utilisateurs
-- Note: deal_id est maintenant NULL car ce sont des notifications générales
INSERT INTO deal_notifications (user_id, deal_id, title, message, type, is_read)
SELECT
    id as user_id,
    NULL as deal_id,
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

INSERT INTO deal_notifications (user_id, deal_id, title, message, type, is_read)
SELECT
    id as user_id,
    NULL as deal_id,
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

INSERT INTO deal_notifications (user_id, deal_id, title, message, type, is_read)
SELECT
    id as user_id,
    NULL as deal_id,
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

-- 8. Afficher le résultat final
DO $$
DECLARE
    notif_count INTEGER;
    user_count INTEGER;
    notif_per_user INTEGER;
BEGIN
    SELECT COUNT(*) INTO notif_count FROM deal_notifications;
    SELECT COUNT(*) INTO user_count FROM auth.users;

    IF user_count > 0 THEN
        notif_per_user := notif_count / user_count;
    ELSE
        notif_per_user := 0;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Configuration terminée!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '👥 Utilisateurs: %', user_count;
    RAISE NOTICE '🔔 Total notifications: %', notif_count;
    RAISE NOTICE '📊 Notifications par utilisateur: ~%', notif_per_user;
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 Rechargez votre application pour voir le badge!';
END $$;
