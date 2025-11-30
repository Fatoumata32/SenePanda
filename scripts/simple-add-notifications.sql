-- =============================================
-- Script SIMPLE pour ajouter des notifications de test
-- Si les autres scripts ne marchent pas, essayez celui-ci
-- =============================================

-- Vérifier l'utilisateur actuel
SELECT
    id as user_id,
    email,
    created_at
FROM auth.users
LIMIT 5;

-- Insérer 3 notifications pour VOTRE utilisateur
-- Remplacez 'VOTRE_EMAIL@example.com' par votre vrai email
INSERT INTO deal_notifications (
    user_id,
    deal_id,
    title,
    message,
    type,
    is_read,
    created_at
)
SELECT
    id,
    NULL,
    'Bienvenue sur SenePanda! 🎉',
    'Découvrez nos promotions exclusives.',
    'promo',
    false,
    NOW()
FROM auth.users
WHERE email = 'VOTRE_EMAIL@example.com'  -- ⚠️ CHANGEZ ICI
LIMIT 1;

INSERT INTO deal_notifications (
    user_id,
    deal_id,
    title,
    message,
    type,
    is_read,
    created_at
)
SELECT
    id,
    NULL,
    'Promotion Flash! ⚡',
    'Jusqu''à 50% de réduction.',
    'promo',
    false,
    NOW()
FROM auth.users
WHERE email = 'VOTRE_EMAIL@example.com'  -- ⚠️ CHANGEZ ICI
LIMIT 1;

INSERT INTO deal_notifications (
    user_id,
    deal_id,
    title,
    message,
    type,
    is_read,
    created_at
)
SELECT
    id,
    NULL,
    'Points fidélité 🎁',
    'Vous avez des points disponibles!',
    'reward',
    false,
    NOW()
FROM auth.users
WHERE email = 'VOTRE_EMAIL@example.com'  -- ⚠️ CHANGEZ ICI
LIMIT 1;

-- Vérifier que ça a marché
SELECT
    count(*) as total_notifications,
    user_id
FROM deal_notifications
GROUP BY user_id;

-- Afficher les notifications créées
SELECT
    title,
    message,
    type,
    is_read,
    created_at
FROM deal_notifications
ORDER BY created_at DESC
LIMIT 10;
