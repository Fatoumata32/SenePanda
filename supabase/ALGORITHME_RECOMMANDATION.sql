-- =====================================================
-- ALGORITHME DE RECOMMANDATION SENEPANDA
-- =====================================================
-- Ce script améliore l'affichage des produits avec:
-- 1. Compteur de vues (impressions)
-- 2. Score de popularité
-- 3. Recommandations personnalisées
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. AJOUTER LES COLONNES DE TRACKING AUX PRODUITS
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS popularity_score FLOAT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ DEFAULT NOW();

-- 2. CRÉER LA TABLE DES VUES DE PRODUITS (pour tracking détaillé)
CREATE TABLE IF NOT EXISTS product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    view_type VARCHAR(20) DEFAULT 'impression', -- 'impression', 'click', 'detail_view'
    session_id VARCHAR(100),
    device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
    source VARCHAR(50), -- 'home', 'search', 'category', 'recommendation'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created_at ON product_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_popularity ON products(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(trending_score DESC);

-- 3. CRÉER LA TABLE DES INTERACTIONS UTILISATEUR
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    interaction_type VARCHAR(30) NOT NULL, -- 'view', 'click', 'favorite', 'cart_add', 'purchase', 'share'
    category_id UUID REFERENCES categories(id),
    seller_id UUID REFERENCES auth.users(id),
    interaction_weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, interaction_type, created_at)
);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_product ON user_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_category ON user_interactions(category_id);

-- 4. CRÉER LA TABLE DES PRÉFÉRENCES UTILISATEUR (calculées)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferred_categories JSONB DEFAULT '[]',
    preferred_price_range JSONB DEFAULT '{"min": 0, "max": 100000}',
    preferred_sellers JSONB DEFAULT '[]',
    interaction_history JSONB DEFAULT '[]',
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- 5. FONCTION POUR ENREGISTRER UNE VUE/INTERACTION
CREATE OR REPLACE FUNCTION record_product_interaction(
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_interaction_type VARCHAR(30) DEFAULT 'view',
    p_source VARCHAR(50) DEFAULT 'home',
    p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product RECORD;
    v_weight FLOAT;
BEGIN
    -- Récupérer le produit
    SELECT * INTO v_product FROM products WHERE id = p_product_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Produit non trouvé');
    END IF;

    -- Définir le poids selon le type d'interaction
    v_weight := CASE p_interaction_type
        WHEN 'view' THEN 1.0
        WHEN 'click' THEN 2.0
        WHEN 'detail_view' THEN 3.0
        WHEN 'favorite' THEN 5.0
        WHEN 'cart_add' THEN 7.0
        WHEN 'share' THEN 4.0
        WHEN 'purchase' THEN 10.0
        ELSE 1.0
    END;

    -- Enregistrer la vue dans product_views
    IF p_interaction_type IN ('view', 'click', 'detail_view') THEN
        INSERT INTO product_views (product_id, user_id, view_type, source, session_id)
        VALUES (p_product_id, p_user_id, p_interaction_type, p_source, p_session_id);
    END IF;

    -- Enregistrer l'interaction utilisateur (si connecté)
    IF p_user_id IS NOT NULL THEN
        INSERT INTO user_interactions (user_id, product_id, interaction_type, category_id, seller_id, interaction_weight)
        VALUES (p_user_id, p_product_id, p_interaction_type, v_product.category_id, v_product.seller_id, v_weight)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Mettre à jour les compteurs du produit
    UPDATE products SET
        view_count = CASE WHEN p_interaction_type = 'view' THEN view_count + 1 ELSE view_count END,
        click_count = CASE WHEN p_interaction_type IN ('click', 'detail_view') THEN click_count + 1 ELSE click_count END,
        favorite_count = CASE WHEN p_interaction_type = 'favorite' THEN favorite_count + 1 ELSE favorite_count END,
        share_count = CASE WHEN p_interaction_type = 'share' THEN share_count + 1 ELSE share_count END,
        last_interaction_at = NOW()
    WHERE id = p_product_id;

    RETURN json_build_object(
        'success', true,
        'product_id', p_product_id,
        'interaction_type', p_interaction_type,
        'weight', v_weight
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FONCTION POUR CALCULER LE SCORE DE POPULARITÉ
CREATE OR REPLACE FUNCTION calculate_popularity_score(p_product_id UUID)
RETURNS FLOAT AS $$
DECLARE
    v_score FLOAT := 0;
    v_product RECORD;
    v_recent_views INTEGER;
    v_recent_clicks INTEGER;
    v_age_days INTEGER;
    v_freshness_bonus FLOAT;
BEGIN
    SELECT * INTO v_product FROM products WHERE id = p_product_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Calculer les vues récentes (dernières 24h)
    SELECT COUNT(*) INTO v_recent_views
    FROM product_views
    WHERE product_id = p_product_id
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Calculer les clics récents (dernières 24h)
    SELECT COUNT(*) INTO v_recent_clicks
    FROM product_views
    WHERE product_id = p_product_id
    AND view_type IN ('click', 'detail_view')
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Âge du produit en jours
    v_age_days := EXTRACT(DAY FROM NOW() - v_product.created_at);

    -- Bonus de fraîcheur (décroît avec le temps)
    v_freshness_bonus := CASE
        WHEN v_age_days < 1 THEN 50    -- Nouveau aujourd'hui
        WHEN v_age_days < 3 THEN 30    -- Moins de 3 jours
        WHEN v_age_days < 7 THEN 20    -- Moins d'une semaine
        WHEN v_age_days < 14 THEN 10   -- Moins de 2 semaines
        ELSE 0
    END;

    -- Calculer le score
    v_score :=
        (COALESCE(v_product.view_count, 0) * 1) +           -- Vues totales
        (COALESCE(v_product.click_count, 0) * 3) +          -- Clics (plus importants)
        (COALESCE(v_product.favorite_count, 0) * 5) +       -- Favoris
        (COALESCE(v_product.share_count, 0) * 4) +          -- Partages
        (COALESCE(v_product.average_rating, 0) * 10) +      -- Note moyenne
        (COALESCE(v_product.total_reviews, 0) * 3) +        -- Nombre d'avis
        (v_recent_views * 5) +                              -- Vues récentes (boost)
        (v_recent_clicks * 10) +                            -- Clics récents (boost)
        v_freshness_bonus;                                   -- Bonus nouveauté

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- 7. FONCTION POUR CALCULER LE TRENDING SCORE (basé sur activité récente)
CREATE OR REPLACE FUNCTION calculate_trending_score(p_product_id UUID)
RETURNS FLOAT AS $$
DECLARE
    v_score FLOAT := 0;
    v_views_24h INTEGER;
    v_views_48h INTEGER;
    v_growth_rate FLOAT;
BEGIN
    -- Vues dernières 24h
    SELECT COUNT(*) INTO v_views_24h
    FROM product_views
    WHERE product_id = p_product_id
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Vues 24-48h (pour comparer la croissance)
    SELECT COUNT(*) INTO v_views_48h
    FROM product_views
    WHERE product_id = p_product_id
    AND created_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours';

    -- Taux de croissance
    IF v_views_48h > 0 THEN
        v_growth_rate := (v_views_24h::FLOAT - v_views_48h::FLOAT) / v_views_48h::FLOAT;
    ELSE
        v_growth_rate := CASE WHEN v_views_24h > 0 THEN 1.0 ELSE 0 END;
    END IF;

    -- Score trending = activité récente + croissance
    v_score := (v_views_24h * 10) + (v_growth_rate * 50);

    RETURN GREATEST(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- 8. FONCTION POUR METTRE À JOUR TOUS LES SCORES
CREATE OR REPLACE FUNCTION update_all_product_scores()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_product RECORD;
BEGIN
    FOR v_product IN SELECT id FROM products WHERE is_active = true LOOP
        UPDATE products SET
            popularity_score = calculate_popularity_score(v_product.id),
            trending_score = calculate_trending_score(v_product.id)
        WHERE id = v_product.id;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 9. FONCTION POUR OBTENIR LES PRODUITS RECOMMANDÉS
CREATE OR REPLACE FUNCTION get_recommended_products(
    p_user_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_sort_by VARCHAR(20) DEFAULT 'smart' -- 'smart', 'popular', 'trending', 'newest', 'rating'
)
RETURNS TABLE (
    id UUID,
    seller_id UUID,
    category_id UUID,
    title VARCHAR,
    description TEXT,
    price NUMERIC,
    currency VARCHAR,
    image_url TEXT,
    images JSONB,
    stock INTEGER,
    is_active BOOLEAN,
    average_rating FLOAT,
    total_reviews INTEGER,
    view_count INTEGER,
    click_count INTEGER,
    favorite_count INTEGER,
    popularity_score FLOAT,
    trending_score FLOAT,
    created_at TIMESTAMPTZ,
    recommendation_score FLOAT,
    recommendation_reason VARCHAR
) AS $$
DECLARE
    v_user_categories UUID[];
    v_user_favorite_price_min NUMERIC;
    v_user_favorite_price_max NUMERIC;
BEGIN
    -- Si utilisateur connecté, récupérer ses préférences
    IF p_user_id IS NOT NULL THEN
        -- Catégories les plus consultées
        SELECT ARRAY_AGG(DISTINCT ui.category_id)
        INTO v_user_categories
        FROM user_interactions ui
        WHERE ui.user_id = p_user_id
        AND ui.category_id IS NOT NULL
        AND ui.created_at > NOW() - INTERVAL '30 days'
        LIMIT 5;

        -- Fourchette de prix préférée
        SELECT
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY p.price),
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY p.price)
        INTO v_user_favorite_price_min, v_user_favorite_price_max
        FROM user_interactions ui
        JOIN products p ON ui.product_id = p.id
        WHERE ui.user_id = p_user_id
        AND ui.created_at > NOW() - INTERVAL '30 days';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.seller_id,
        p.category_id,
        p.title,
        p.description,
        p.price,
        p.currency,
        p.image_url,
        p.images,
        p.stock,
        p.is_active,
        p.average_rating,
        p.total_reviews,
        COALESCE(p.view_count, 0) as view_count,
        COALESCE(p.click_count, 0) as click_count,
        COALESCE(p.favorite_count, 0) as favorite_count,
        COALESCE(p.popularity_score, 0) as popularity_score,
        COALESCE(p.trending_score, 0) as trending_score,
        p.created_at,
        -- Score de recommandation personnalisé
        CASE
            WHEN p_sort_by = 'smart' THEN
                COALESCE(p.popularity_score, 0) * 0.3 +
                COALESCE(p.trending_score, 0) * 0.2 +
                COALESCE(p.average_rating, 0) * 20 +
                -- Bonus si catégorie préférée
                CASE WHEN p.category_id = ANY(v_user_categories) THEN 30 ELSE 0 END +
                -- Bonus si dans fourchette de prix préférée
                CASE WHEN p.price BETWEEN COALESCE(v_user_favorite_price_min, 0)
                     AND COALESCE(v_user_favorite_price_max, 999999) THEN 15 ELSE 0 END +
                -- Boost nouveauté (moins de 7 jours)
                CASE WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 20 ELSE 0 END
            WHEN p_sort_by = 'popular' THEN COALESCE(p.popularity_score, 0)
            WHEN p_sort_by = 'trending' THEN COALESCE(p.trending_score, 0)
            WHEN p_sort_by = 'newest' THEN EXTRACT(EPOCH FROM p.created_at) / 10000
            WHEN p_sort_by = 'rating' THEN COALESCE(p.average_rating, 0) * 20
            ELSE COALESCE(p.popularity_score, 0)
        END as recommendation_score,
        -- Raison de la recommandation
        CASE
            WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN 'Nouveau'
            WHEN COALESCE(p.trending_score, 0) > 100 THEN 'Tendance'
            WHEN p.category_id = ANY(v_user_categories) THEN 'Pour vous'
            WHEN COALESCE(p.average_rating, 0) >= 4.5 THEN 'Très bien noté'
            WHEN COALESCE(p.popularity_score, 0) > 50 THEN 'Populaire'
            ELSE 'Recommandé'
        END as recommendation_reason
    FROM products p
    WHERE p.is_active = true
    AND p.stock > 0
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    ORDER BY recommendation_score DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 10. ACTIVER RLS
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour product_views
DROP POLICY IF EXISTS "Anyone can insert views" ON product_views;
CREATE POLICY "Anyone can insert views" ON product_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own views" ON product_views;
CREATE POLICY "Users can view own views" ON product_views
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Policies pour user_interactions
DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;
CREATE POLICY "Users can manage own interactions" ON user_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Policies pour user_preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 11. METTRE À JOUR LES SCORES INITIAUX
SELECT update_all_product_scores();

-- 12. VÉRIFICATION
SELECT
    'Algorithme de recommandation activé!' as status,
    COUNT(*) as total_products,
    AVG(popularity_score)::NUMERIC(10,2) as avg_popularity,
    AVG(trending_score)::NUMERIC(10,2) as avg_trending
FROM products
WHERE is_active = true;

-- =====================================================
-- RÉSUMÉ DE L'ALGORITHME
-- =====================================================
--
-- SCORE DE POPULARITÉ basé sur:
-- - Nombre de vues (x1)
-- - Nombre de clics (x3)
-- - Favoris (x5)
-- - Partages (x4)
-- - Note moyenne (x10)
-- - Nombre d'avis (x3)
-- - Vues récentes 24h (x5)
-- - Clics récents 24h (x10)
-- - Bonus nouveauté (jusqu'à +50)
--
-- SCORE TRENDING basé sur:
-- - Activité des dernières 24h
-- - Taux de croissance par rapport aux 24h précédentes
--
-- RECOMMANDATIONS PERSONNALISÉES:
-- - Catégories préférées de l'utilisateur (+30)
-- - Fourchette de prix habituelle (+15)
-- - Nouveautés (<7 jours) (+20)
-- - Mix popularité + trending + rating
--
-- =====================================================
