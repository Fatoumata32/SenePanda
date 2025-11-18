-- ============================================
-- SCRIPT DE MIGRATION COMPLET POUR SUPABASE
-- À exécuter dans l'ordre via SQL Editor
-- ============================================

-- ÉTAPE 1: Migrations de base (timestamped)
\echo '⏳ ÉTAPE 1: Migrations de base...'

-- 1.1: Schéma principal du marketplace
\i supabase/migrations/20251011232345_create_marketplace_schema.sql

-- 1.2: Profils de test
\i supabase/migrations/20251011235000_create_test_profile.sql

-- 1.3: Username
\i supabase/migrations/20251012000000_add_username.sql
\i supabase/migrations/20251012000100_username_to_email_function.sql

-- 1.4: Profils exemples
\i supabase/migrations/20251012000200_create_sample_profiles.sql

-- 1.5: Configuration email
\i supabase/migrations/20251012120000_disable_email_confirmation.sql
\i supabase/migrations/20251012120100_confirm_existing_emails.sql

\echo '✅ ÉTAPE 1 TERMINÉE'

-- ÉTAPE 2: Fonctionnalités principales
\echo '⏳ ÉTAPE 2: Fonctionnalités principales...'

-- 2.1: Favoris
\i supabase/migrations/create_favorites_table.sql

-- 2.2: Notifications
\i supabase/migrations/add_notifications.sql

-- 2.3: Catégories avec emojis
\i supabase/migrations/add_category_emojis.sql

-- 2.4: Champs étendus du profil
\i supabase/migrations/add_profile_extended_fields.sql
\i supabase/migrations/add_is_premium_to_profiles.sql

-- 2.5: Champs de produits
\i supabase/migrations/add_products_rating_fields.sql
\i supabase/migrations/fix_products_schema.sql

\echo '✅ ÉTAPE 2 TERMINÉE'

-- ÉTAPE 3: Système de récompenses et parrainage
\echo '⏳ ÉTAPE 3: Système de récompenses...'

-- 3.1: Code de parrainage
\i supabase/migrations/add_referral_code_to_profiles.sql

-- 3.2: Récompenses de parrainage
\i supabase/migrations/add_referral_rewards.sql
\i supabase/migrations/add_referral_rewards_trigger.sql

-- 3.3: Système de récompenses complet
\i supabase/migrations/create_rewards_system.sql

-- 3.4: Corrections récompenses
\i supabase/migrations/fix_claimed_rewards_table.sql
\i supabase/migrations/add_claimed_rewards_foreign_key.sql
\i supabase/migrations/fix_immediate_referral_rewards.sql
\i supabase/migrations/retroactive_referral_points.sql

-- 3.5: Vérification
\i supabase/migrations/verify_rewards_system.sql

-- 3.6: Système de bonus complet
\i supabase/migrations/create_complete_bonus_system.sql

\echo '✅ ÉTAPE 3 TERMINÉE'

-- ÉTAPE 4: Système de chat et messages
\echo '⏳ ÉTAPE 4: Système de chat...'

-- 4.1: Chat de base
\i supabase/migrations/create_chat_system.sql

-- 4.2: Corrections chat
\i supabase/migrations/fix_chat_system.sql
\i supabase/migrations/fix_conversations_profiles_relationship.sql

-- 4.3: Colonnes manquantes
\i supabase/migrations/add_missing_conversations_columns.sql
\i supabase/migrations/add_conversations_status_column.sql
\i supabase/migrations/fix_conversations_unread_columns.sql

-- 4.4: Messages avancés
\i supabase/migrations/fix_messages_table_complete.sql
\i supabase/migrations/fix_messages_content_nullable.sql
\i supabase/migrations/add_media_support_to_messages.sql
\i supabase/migrations/add_offer_columns_to_messages.sql

-- 4.5: Fonctions de messages
\i supabase/migrations/fix_send_message_function.sql
\i supabase/migrations/fix_send_message_overload.sql

-- 4.6: Média et stockage
\i supabase/migrations/create_chat_media_storage.sql

-- 4.7: Configuration finale
\i supabase/migrations/complete_chat_setup.sql
\i supabase/migrations/fix_complete_chat_schema.sql

-- 4.8: Realtime
\i supabase/migrations/enable_realtime_for_chat.sql

-- 4.9: Utilisateurs bloqués
\i supabase/migrations/create_blocked_users_system.sql

\echo '✅ ÉTAPE 4 TERMINÉE'

-- ÉTAPE 5: Système de ventes et abonnements
\echo '⏳ ÉTAPE 5: Système de ventes...'

-- 5.1: Politiques vendeur
\i supabase/migrations/add_seller_order_policies.sql

-- 5.2: Plans d'abonnement
\i supabase/migrations/create_seller_subscription_plans.sql

-- 5.3: Stockage
\i supabase/migrations/create_storage_buckets.sql
\i supabase/migrations/update_storage_policies.sql

\echo '✅ ÉTAPE 5 TERMINÉE'

-- ÉTAPE 6: Système d'avis
\echo '⏳ ÉTAPE 6: Système d'avis...'

-- 6.1: Avis
\i supabase/migrations/create_reviews_system.sql
\i supabase/migrations/reset_and_create_reviews.sql

\echo '✅ ÉTAPE 6 TERMINÉE'

-- ÉTAPE 7: Flash Deals
\echo '⏳ ÉTAPE 7: Flash Deals...'

-- 7.1: Système de flash deals
\i supabase/migrations/create_flash_deals_system.sql

-- 7.2: Corrections
\i supabase/migrations/fix_flash_deals_seller_id.sql
\i supabase/migrations/fix_flash_deals_deal_type.sql

\echo '✅ ÉTAPE 7 TERMINÉE'

-- ÉTAPE 8: Système de followers
\echo '⏳ ÉTAPE 8: Système de followers...'

\i supabase/migrations/create_followers_system.sql

\echo '✅ ÉTAPE 8 TERMINÉE'

-- ÉTAPE 9: Système de commandes (NOUVEAU)
\echo '⏳ ÉTAPE 9: Système de commandes...'

-- 9.1: Ajouter seller_id aux produits
\i supabase/migrations/20251117000000_add_seller_id_to_products.sql

-- 9.2: Système de commandes complet
\i supabase/migrations/20251117000001_create_orders_system.sql

\echo '✅ ÉTAPE 9 TERMINÉE'

-- ============================================
-- 🎉 TOUTES LES MIGRATIONS SONT TERMINÉES !
-- ============================================

SELECT
  '🎉 MIGRATION COMPLÈTE TERMINÉE !' as status,
  'Toutes les tables, fonctions et politiques ont été créées' as message,
  NOW() as completed_at;
