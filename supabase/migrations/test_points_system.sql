-- Script de test et diagnostic du système de points
-- Exécutez ce script pour diagnostiquer pourquoi les points ne s'affichent pas

-- ============================================
-- 1. Vérifier que les colonnes existent
-- ============================================

DO $$
DECLARE
  v_columns TEXT[];
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '📊 DIAGNOSTIC DU SYSTÈME DE POINTS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ Vérification des colonnes dans profiles:';

  SELECT ARRAY_AGG(column_name ORDER BY column_name) INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name IN ('panda_coins', 'last_login_date', 'current_streak', 'longest_streak', 'welcome_bonus_claimed');

  IF array_length(v_columns, 1) = 5 THEN
    RAISE NOTICE '  ✅ Toutes les colonnes existent: %', v_columns;
  ELSE
    RAISE NOTICE '  ❌ Colonnes manquantes. Trouvées: %', COALESCE(array_length(v_columns, 1), 0);
    RAISE NOTICE '     Colonnes présentes: %', v_columns;
  END IF;
END $$;

-- ============================================
-- 2. Vérifier que les fonctions existent
-- ============================================

DO $$
DECLARE
  v_functions TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ Vérification des fonctions RPC:';

  SELECT ARRAY_AGG(routine_name ORDER BY routine_name) INTO v_functions
  FROM information_schema.routines
  WHERE routine_name IN ('record_points_transaction', 'award_welcome_bonus', 'record_daily_login');

  IF array_length(v_functions, 1) = 3 THEN
    RAISE NOTICE '  ✅ Toutes les fonctions existent: %', v_functions;
  ELSE
    RAISE NOTICE '  ❌ Fonctions manquantes. Trouvées: %', COALESCE(array_length(v_functions, 1), 0);
    RAISE NOTICE '     Fonctions présentes: %', v_functions;
  END IF;
END $$;

-- ============================================
-- 3. Vérifier la table points_transactions
-- ============================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ Vérification de la table points_transactions:';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'points_transactions'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '  ✅ Table points_transactions existe';

    SELECT COUNT(*) INTO v_count FROM points_transactions;
    RAISE NOTICE '     Nombre de transactions: %', v_count;
  ELSE
    RAISE NOTICE '  ❌ Table points_transactions n''existe pas';
  END IF;
END $$;

-- ============================================
-- 4. Afficher les données actuelles
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Données actuelles des utilisateurs:';
END $$;

SELECT
  id,
  email,
  COALESCE(panda_coins, 0) as panda_coins,
  last_login_date,
  COALESCE(current_streak, 0) as current_streak,
  COALESCE(longest_streak, 0) as longest_streak,
  COALESCE(welcome_bonus_claimed, FALSE) as welcome_bonus_claimed
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 5. Tester manuellement le bonus de bienvenue
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣ Test du bonus de bienvenue:';

  -- Prendre le premier utilisateur qui n'a pas réclamé le bonus
  SELECT id INTO v_user_id
  FROM profiles
  WHERE COALESCE(welcome_bonus_claimed, FALSE) = FALSE
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '  🧪 Test avec utilisateur: %', v_user_id;

    -- Appeler la fonction
    SELECT award_welcome_bonus(v_user_id) INTO v_result;

    RAISE NOTICE '  📊 Résultat: %', v_result;

    -- Vérifier les points après
    PERFORM 1 FROM profiles
    WHERE id = v_user_id AND panda_coins >= 500;

    IF FOUND THEN
      RAISE NOTICE '  ✅ Bonus attribué avec succès !';
    ELSE
      RAISE NOTICE '  ❌ Bonus non attribué';
    END IF;
  ELSE
    RAISE NOTICE '  ℹ️ Aucun utilisateur disponible pour le test (tous ont déjà le bonus)';
  END IF;
END $$;

-- ============================================
-- 6. Tester manuellement la connexion quotidienne
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_result JSON;
  v_points_before INTEGER;
  v_points_after INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '6️⃣ Test de la connexion quotidienne:';

  -- Prendre le premier utilisateur
  SELECT id, COALESCE(panda_coins, 0)
  INTO v_user_id, v_points_before
  FROM profiles
  WHERE last_login_date IS NULL OR last_login_date < CURRENT_DATE
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '  🧪 Test avec utilisateur: %', v_user_id;
    RAISE NOTICE '  📊 Points avant: %', v_points_before;

    -- Appeler la fonction
    SELECT record_daily_login(v_user_id) INTO v_result;

    RAISE NOTICE '  📊 Résultat: %', v_result;

    -- Vérifier les points après
    SELECT COALESCE(panda_coins, 0) INTO v_points_after
    FROM profiles
    WHERE id = v_user_id;

    RAISE NOTICE '  📊 Points après: %', v_points_after;

    IF v_points_after > v_points_before THEN
      RAISE NOTICE '  ✅ Points ajoutés avec succès ! (+% points)', v_points_after - v_points_before;
    ELSE
      RAISE NOTICE '  ❌ Aucun point ajouté';
    END IF;
  ELSE
    RAISE NOTICE '  ℹ️ Aucun utilisateur disponible pour le test';
  END IF;
END $$;

-- ============================================
-- 7. Forcer un reset pour un utilisateur (optionnel)
-- ============================================

-- ⚠️ Décommentez les lignes ci-dessous pour réinitialiser un utilisateur spécifique
-- Remplacez 'USER_EMAIL_HERE' par l'email de l'utilisateur

/*
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '7️⃣ Réinitialisation d''un utilisateur pour test:';

  -- Trouver l'utilisateur par email
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = 'USER_EMAIL_HERE';

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '  🔄 Réinitialisation de: %', v_user_id;

    -- Reset
    UPDATE profiles
    SET
      panda_coins = 0,
      last_login_date = NULL,
      current_streak = 0,
      longest_streak = 0,
      welcome_bonus_claimed = FALSE
    WHERE id = v_user_id;

    -- Supprimer les transactions
    DELETE FROM points_transactions
    WHERE user_id = v_user_id;

    RAISE NOTICE '  ✅ Utilisateur réinitialisé';
    RAISE NOTICE '  ℹ️ Reconnectez-vous pour recevoir le bonus de bienvenue';
  ELSE
    RAISE NOTICE '  ❌ Utilisateur non trouvé';
  END IF;
END $$;
*/

-- ============================================
-- 8. Résumé final
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '📋 RÉSUMÉ DU DIAGNOSTIC';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Si les tests ci-dessus montrent des ❌:';
  RAISE NOTICE '   1. Réexécutez fix_points_system.sql';
  RAISE NOTICE '   2. Vérifiez les erreurs dans les logs';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Si tous les tests montrent des ✅:';
  RAISE NOTICE '   1. Déconnectez-vous de l''app';
  RAISE NOTICE '   2. Reconnectez-vous';
  RAISE NOTICE '   3. Attendez 5 secondes';
  RAISE NOTICE '   4. Vous devriez voir les notifications';
  RAISE NOTICE '';
  RAISE NOTICE '🐛 Si ça ne marche toujours pas:';
  RAISE NOTICE '   1. Vérifiez les logs de l''app (console)';
  RAISE NOTICE '   2. Cherchez: "[DailyLogin]"';
  RAISE NOTICE '   3. Partagez les logs pour diagnostic';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
