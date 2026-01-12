-- =====================================================
-- SYNCHRONISATION REALTIME DES PANDACOINS
-- =====================================================
-- Assure la synchronisation entre loyalty_points et profiles.panda_coins
-- =====================================================

-- =====================================================
-- ÉTAPE 1: Activer Realtime sur loyalty_points
-- =====================================================

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;
        RAISE NOTICE '✅ Realtime activé pour loyalty_points';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ loyalty_points déjà dans supabase_realtime';
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
        RAISE NOTICE '✅ Realtime activé pour points_transactions';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ points_transactions déjà dans supabase_realtime';
    END;
END $$;

-- =====================================================
-- ÉTAPE 2: Fonction de synchronisation automatique
-- =====================================================

CREATE OR REPLACE FUNCTION sync_coins_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser les points de loyalty_points vers profiles.panda_coins
    UPDATE profiles
    SET panda_coins = NEW.points
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 3: Trigger pour synchronisation automatique
-- =====================================================

DROP TRIGGER IF EXISTS sync_coins_to_profile_trigger ON loyalty_points;

CREATE TRIGGER sync_coins_to_profile_trigger
    AFTER INSERT OR UPDATE OF points ON loyalty_points
    FOR EACH ROW
    EXECUTE FUNCTION sync_coins_to_profile();

-- =====================================================
-- ÉTAPE 4: Fonction pour synchroniser profiles → loyalty_points
-- =====================================================

CREATE OR REPLACE FUNCTION sync_profile_coins_to_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    -- Si panda_coins change dans profiles, mettre à jour loyalty_points
    IF NEW.panda_coins IS DISTINCT FROM OLD.panda_coins THEN
        INSERT INTO loyalty_points (user_id, points, total_earned, level)
        VALUES (NEW.id, NEW.panda_coins, NEW.panda_coins, 'bronze')
        ON CONFLICT (user_id) DO UPDATE
        SET
            points = NEW.panda_coins,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 5: Trigger bidirectionnel
-- =====================================================

DROP TRIGGER IF EXISTS sync_profile_coins_to_loyalty_trigger ON profiles;

CREATE TRIGGER sync_profile_coins_to_loyalty_trigger
    AFTER UPDATE OF panda_coins ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_coins_to_loyalty();

-- =====================================================
-- ÉTAPE 6: Synchronisation initiale (si décalage)
-- =====================================================

-- Synchroniser toutes les données existantes
DO $$
DECLARE
    v_synced INTEGER := 0;
BEGIN
    -- Mettre à jour profiles.panda_coins depuis loyalty_points
    UPDATE profiles p
    SET panda_coins = lp.points
    FROM loyalty_points lp
    WHERE p.id = lp.user_id
    AND (p.panda_coins IS NULL OR p.panda_coins != lp.points);

    GET DIAGNOSTICS v_synced = ROW_COUNT;

    IF v_synced > 0 THEN
        RAISE NOTICE '✅ % profils synchronisés avec loyalty_points', v_synced;
    ELSE
        RAISE NOTICE 'ℹ️ Tous les profils sont déjà synchronisés';
    END IF;

    -- Créer les entrées manquantes dans loyalty_points
    INSERT INTO loyalty_points (user_id, points, total_earned, level)
    SELECT
        p.id,
        COALESCE(p.panda_coins, 0),
        COALESCE(p.panda_coins, 0),
        'bronze'
    FROM profiles p
    LEFT JOIN loyalty_points lp ON lp.user_id = p.id
    WHERE lp.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING;

    GET DIAGNOSTICS v_synced = ROW_COUNT;

    IF v_synced > 0 THEN
        RAISE NOTICE '✅ % entrées créées dans loyalty_points', v_synced;
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 7: Fonction helper pour ajouter des coins
-- =====================================================

CREATE OR REPLACE FUNCTION award_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
    v_total_earned INTEGER;
    v_level TEXT;
BEGIN
    -- Initialiser loyalty_points si nécessaire
    INSERT INTO loyalty_points (user_id, points, total_earned, level)
    VALUES (p_user_id, 0, 0, 'bronze')
    ON CONFLICT (user_id) DO NOTHING;

    -- Ajouter les points
    UPDATE loyalty_points
    SET
        points = points + p_amount,
        total_earned = total_earned + p_amount,
        level = CASE
            WHEN total_earned + p_amount >= 15000 THEN 'platinum'
            WHEN total_earned + p_amount >= 5000 THEN 'gold'
            WHEN total_earned + p_amount >= 1000 THEN 'silver'
            ELSE 'bronze'
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING points, total_earned, level INTO v_new_balance, v_total_earned, v_level;

    -- Créer la transaction
    INSERT INTO points_transactions (user_id, points, type, description, related_id)
    VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);

    -- Le trigger sync_coins_to_profile va automatiquement mettre à jour profiles.panda_coins

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'total_earned', v_total_earned,
        'level', v_level,
        'added', p_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION award_coins TO authenticated;

-- =====================================================
-- ÉTAPE 8: Test de synchronisation
-- =====================================================

-- Fonction de test
CREATE OR REPLACE FUNCTION test_coins_sync()
RETURNS TEXT AS $$
DECLARE
    v_test_user_id UUID;
    v_initial_coins INTEGER;
    v_loyalty_coins INTEGER;
    v_profile_coins INTEGER;
    v_result JSONB;
BEGIN
    -- Trouver un utilisateur existant
    SELECT id INTO v_test_user_id FROM profiles LIMIT 1;

    IF v_test_user_id IS NULL THEN
        RETURN '❌ Aucun utilisateur trouvé pour le test';
    END IF;

    -- Récupérer le solde initial
    SELECT COALESCE(points, 0) INTO v_initial_coins
    FROM loyalty_points
    WHERE user_id = v_test_user_id;

    -- Ajouter 10 coins de test
    v_result := award_coins(
        v_test_user_id,
        10,
        'test',
        'Test de synchronisation realtime',
        NULL
    );

    IF NOT (v_result->>'success')::boolean THEN
        RETURN format('❌ Erreur award_coins: %s', v_result->>'error');
    END IF;

    -- Vérifier la synchronisation
    SELECT points INTO v_loyalty_coins
    FROM loyalty_points
    WHERE user_id = v_test_user_id;

    SELECT panda_coins INTO v_profile_coins
    FROM profiles
    WHERE id = v_test_user_id;

    IF v_loyalty_coins = v_profile_coins THEN
        RETURN format(
            '✅ Synchronisation OK! loyalty_points: %s, profiles.panda_coins: %s',
            v_loyalty_coins,
            v_profile_coins
        );
    ELSE
        RETURN format(
            '❌ Décalage détecté! loyalty_points: %s, profiles.panda_coins: %s',
            v_loyalty_coins,
            COALESCE(v_profile_coins, 0)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter le test
SELECT test_coins_sync();

-- =====================================================
-- ÉTAPE 9: Vérification finale
-- =====================================================

SELECT
    '✅ SYNCHRONISATION REALTIME CONFIGURÉE' as status,
    (SELECT COUNT(*) FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
     AND tablename IN ('loyalty_points', 'points_transactions')) as tables_realtime,
    (SELECT COUNT(*) FROM pg_trigger
     WHERE tgname IN ('sync_coins_to_profile_trigger', 'sync_profile_coins_to_loyalty_trigger')) as triggers_actifs;

-- =====================================================
-- EXEMPLE D'UTILISATION
-- =====================================================

/*
-- Ajouter des coins à un utilisateur (déclenche automatiquement la synchronisation)
SELECT award_coins(
    'USER-UUID-HERE',
    100,
    'purchase',
    'Achat de 10000 FCFA',
    'ORDER-UUID-HERE'
);

-- Vérifier la synchronisation
SELECT
    p.id,
    p.panda_coins as profile_coins,
    lp.points as loyalty_coins,
    lp.total_earned,
    lp.level
FROM profiles p
LEFT JOIN loyalty_points lp ON lp.user_id = p.id
WHERE p.id = 'USER-UUID-HERE';
*/
