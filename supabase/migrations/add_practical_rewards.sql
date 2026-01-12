-- =====================================================
-- SENEPANDA - Ajout de récompenses pratiques
-- =====================================================
-- Ce script ajoute des récompenses pratiques et utilisables
-- Compatible avec la structure existante
-- =====================================================

-- D'abord, créer la table rewards si elle n'existe pas
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    points_required INTEGER,
    reward_type TEXT DEFAULT 'gift',
    reward_value DECIMAL(10,2),
    duration_days INTEGER DEFAULT 30,
    stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    min_level TEXT DEFAULT 'bronze',
    icon TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Colonnes compatibles avec l'app
    title TEXT,
    points_cost INTEGER,
    category TEXT,
    value DECIMAL(10,2)
);

-- Ajouter les colonnes manquantes si la table existe
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS points_cost INTEGER;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS value DECIMAL(10,2);
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS min_level TEXT DEFAULT 'bronze';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Créer claimed_rewards si elle n'existe pas
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_id UUID,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Créer points_transactions si elle n'existe pas
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer loyalty_points si elle n'existe pas
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    level TEXT DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur toutes les tables
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- Policies pour rewards (lecture publique)
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards" ON rewards
    FOR SELECT USING (is_active = true OR is_active IS NULL);

-- Policies pour claimed_rewards
DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
DROP POLICY IF EXISTS "Users can update own claimed rewards" ON claimed_rewards;
CREATE POLICY "Users can view own claimed rewards" ON claimed_rewards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim rewards" ON claimed_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own claimed rewards" ON claimed_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour points_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;
CREATE POLICY "Users can view own transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour loyalty_points
DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own points" ON loyalty_points;
CREATE POLICY "Users can view own points" ON loyalty_points
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON loyalty_points
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON loyalty_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Supprimer les anciennes données de rewards pour repartir proprement
DELETE FROM rewards WHERE title IS NOT NULL;

-- =====================================================
-- RÉCOMPENSES DISCOUNT (Réductions sur commandes)
-- =====================================================

INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, stock, is_active)
VALUES
  ('Réduction 5%', 'Obtenez 5% de réduction sur votre prochaine commande. Applicable sur tous les produits.', 500, 'discount', 5, 30, NULL, true),
  ('Réduction 10%', 'Obtenez 10% de réduction sur votre prochaine commande. Applicable sur tous les produits.', 1000, 'discount', 10, 30, NULL, true),
  ('Réduction 15%', 'Obtenez 15% de réduction sur votre prochaine commande. Une belle économie!', 1500, 'discount', 15, 30, NULL, true),
  ('Méga Réduction 25%', 'Réduction exceptionnelle de 25% sur votre prochaine commande!', 3000, 'discount', 25, 30, 50, true),
  ('Super Réduction 50%', 'Réduction massive de 50% sur une commande! Offre limitée.', 7500, 'discount', 50, 14, 20, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RÉCOMPENSES LIVRAISON GRATUITE
-- =====================================================

INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, stock, is_active)
VALUES
  ('Livraison Gratuite', 'Profitez de la livraison gratuite sur votre prochaine commande, peu importe le montant.', 750, 'free_shipping', 2500, 30, NULL, true),
  ('2x Livraison Gratuite', 'Pack de 2 livraisons gratuites à utiliser sur vos prochaines commandes.', 1300, 'free_shipping', 5000, 60, NULL, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RÉCOMPENSES BOOST (Pour les vendeurs)
-- =====================================================

INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, stock, is_active)
VALUES
  ('Boost Visibilité 24h', 'Mettez votre boutique en avant pendant 24 heures. Idéal pour les lancements!', 800, 'boost', 1, 7, NULL, true),
  ('Boost Visibilité 3 Jours', 'Visibilité premium pendant 3 jours. Plus d''exposition, plus de ventes!', 2000, 'boost', 3, 7, NULL, true),
  ('Boost Visibilité 7 Jours', 'Une semaine complète de visibilité accrue pour votre boutique!', 4500, 'boost', 7, 14, NULL, true),
  ('Mise en Avant Page Accueil', 'Votre produit phare sera affiché sur la page d''accueil pendant 24h!', 1500, 'boost', 1, 7, 30, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RÉCOMPENSES PREMIUM (Avantages exclusifs)
-- =====================================================

INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, stock, is_active)
VALUES
  ('Badge VIP Bronze', 'Affichez fièrement votre badge VIP Bronze sur votre profil pendant 30 jours!', 500, 'premium', 30, 30, NULL, true),
  ('Badge VIP Silver', 'Badge VIP Silver exclusif pour votre profil. Montrez votre statut!', 1500, 'premium', 30, 30, NULL, true),
  ('Badge VIP Gold', 'Le prestigieux badge VIP Gold. Distinction ultime!', 3500, 'premium', 30, 30, NULL, true),
  ('Accès Ventes Flash 24h', 'Accédez aux ventes flash en avant-première pendant 24 heures.', 600, 'premium', 1, 7, NULL, true),
  ('Support Prioritaire 7j', 'Bénéficiez d''un support client prioritaire pendant 7 jours.', 1200, 'premium', 7, 7, NULL, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RÉCOMPENSES CADEAU (Vouchers et bons)
-- =====================================================

INSERT INTO rewards (title, description, points_cost, reward_type, value, duration_days, stock, is_active)
VALUES
  ('Bon d''achat 1000 FCFA', 'Un bon d''achat de 1000 FCFA à utiliser sur n''importe quelle commande.', 500, 'gift', 1000, 60, NULL, true),
  ('Bon d''achat 2500 FCFA', 'Un bon d''achat de 2500 FCFA. Idéal pour vous faire plaisir!', 1200, 'gift', 2500, 60, NULL, true),
  ('Bon d''achat 5000 FCFA', 'Bon d''achat généreux de 5000 FCFA!', 2200, 'gift', 5000, 60, NULL, true),
  ('Bon d''achat 10000 FCFA', 'Super bon d''achat de 10000 FCFA pour de gros achats!', 4000, 'gift', 10000, 60, 100, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Vérification des récompenses ajoutées
-- =====================================================
SELECT
  reward_type,
  COUNT(*) as count,
  MIN(points_cost) as min_points,
  MAX(points_cost) as max_points
FROM rewards
WHERE is_active = true
GROUP BY reward_type
ORDER BY reward_type;

-- Message de succès
SELECT '✅ Récompenses ajoutées avec succès!' as message;
SELECT COUNT(*) as total_rewards FROM rewards WHERE is_active = true;
