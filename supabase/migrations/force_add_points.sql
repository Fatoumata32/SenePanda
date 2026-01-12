-- Script pour forcer l'ajout de points à tous les utilisateurs existants
-- Exécutez ce script pour attribuer immédiatement les points aux utilisateurs

-- ============================================
-- 1. Attribuer le bonus de bienvenue à tous
-- ============================================

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
  v_result JSON;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🎁 Attribution du bonus de bienvenue';
  RAISE NOTICE '═══════════════════════════════════════════════════';

  FOR v_user IN
    SELECT id, email
    FROM profiles
    WHERE COALESCE(welcome_bonus_claimed, FALSE) = FALSE
  LOOP
    BEGIN
      -- Attribuer le bonus
      SELECT award_welcome_bonus(v_user.id) INTO v_result;

      IF (v_result->>'success')::BOOLEAN THEN
        v_count := v_count + 1;
        RAISE NOTICE '✅ Bonus attribué à: % (500 PC)', v_user.email;
      ELSE
        RAISE NOTICE '⏭️ Déjà attribué à: %', v_user.email;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur pour: % - %', v_user.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '📊 Total: % bonus attribués', v_count;
END $$;

-- ============================================
-- 2. Attribuer les points de connexion quotidienne
-- ============================================

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
  v_result JSON;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🔥 Attribution des points de connexion quotidienne';
  RAISE NOTICE '═══════════════════════════════════════════════════';

  FOR v_user IN
    SELECT id, email, last_login_date
    FROM profiles
    WHERE last_login_date IS NULL OR last_login_date < CURRENT_DATE
    LIMIT 20  -- Limiter à 20 pour éviter de surcharger
  LOOP
    BEGIN
      -- Attribuer les points
      SELECT record_daily_login(v_user.id) INTO v_result;

      IF (v_result->>'success')::BOOLEAN THEN
        v_count := v_count + 1;
        RAISE NOTICE '✅ Points attribués à: % (+% PC, streak: %)',
          v_user.email,
          (v_result->>'points')::INTEGER,
          (v_result->>'streak')::INTEGER;
      ELSE
        RAISE NOTICE '⏭️ Déjà connecté aujourd''hui: %', v_user.email;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur pour: % - %', v_user.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '📊 Total: % connexions enregistrées', v_count;
END $$;

-- ============================================
-- 3. Afficher le résumé des points
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '💰 Résumé des points par utilisateur';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

SELECT
  email,
  COALESCE(panda_coins, 0) as panda_coins,
  COALESCE(current_streak, 0) as streak,
  COALESCE(welcome_bonus_claimed, FALSE) as welcome_bonus,
  last_login_date
FROM profiles
WHERE COALESCE(panda_coins, 0) > 0 OR COALESCE(welcome_bonus_claimed, FALSE) = TRUE
ORDER BY panda_coins DESC
LIMIT 20;

-- ============================================
-- 4. Afficher les dernières transactions
-- ============================================

DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '📜 Dernières transactions de points';
  RAISE NOTICE '═══════════════════════════════════════════════════';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'points_transactions'
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE NOTICE '❌ Table points_transactions n''existe pas';
  END IF;
END $$;

SELECT
  p.email,
  pt.points,
  pt.type,
  pt.description,
  pt.created_at
FROM points_transactions pt
JOIN profiles p ON p.id = pt.user_id
ORDER BY pt.created_at DESC
LIMIT 10;

-- ============================================
-- 5. Message final
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ TRAITEMENT TERMINÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Prochaines étapes:';
  RAISE NOTICE '   1. Allez dans l''app';
  RAISE NOTICE '   2. Ouvrez votre Profil';
  RAISE NOTICE '   3. Vérifiez vos PandaCoins';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Si les points n''apparaissent pas:';
  RAISE NOTICE '   1. Fermez complètement l''app';
  RAISE NOTICE '   2. Relancez l''app';
  RAISE NOTICE '   3. Les points devraient apparaître';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
