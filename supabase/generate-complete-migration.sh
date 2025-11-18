#!/bin/bash

# ============================================
# Script pour générer un fichier SQL complet
# avec toutes les migrations combinées
# ============================================

OUTPUT_FILE="supabase/ALL_MIGRATIONS_COMBINED.sql"

echo "🚀 Génération du fichier SQL complet..."
echo ""

# Créer l'en-tête du fichier
cat > "$OUTPUT_FILE" << 'HEADER'
-- ============================================
-- TOUTES LES MIGRATIONS COMBINÉES
-- Généré automatiquement
-- ============================================
--
-- Ce fichier contient TOUTES les 53 migrations
-- dans le bon ordre d'exécution.
--
-- ATTENTION:
-- - Ce script peut prendre quelques minutes à exécuter
-- - Assurez-vous d'avoir un backup avant de l'exécuter
-- - Certaines migrations peuvent échouer si déjà appliquées (c'est normal)
--
-- Pour exécuter:
-- 1. Ouvrir Supabase SQL Editor
-- 2. Copier-coller tout le contenu de ce fichier
-- 3. Cliquer sur "Run"
--
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

HEADER

echo "✅ En-tête créé"

# Liste des migrations dans l'ordre
MIGRATIONS=(
  "20251011232345_create_marketplace_schema.sql"
  "20251011235000_create_test_profile.sql"
  "20251012000000_add_username.sql"
  "20251012000100_username_to_email_function.sql"
  "20251012000200_create_sample_profiles.sql"
  "20251012120000_disable_email_confirmation.sql"
  "20251012120100_confirm_existing_emails.sql"
  "create_favorites_table.sql"
  "add_notifications.sql"
  "add_category_emojis.sql"
  "add_profile_extended_fields.sql"
  "add_is_premium_to_profiles.sql"
  "add_products_rating_fields.sql"
  "fix_products_schema.sql"
  "add_referral_code_to_profiles.sql"
  "add_referral_rewards.sql"
  "add_referral_rewards_trigger.sql"
  "create_rewards_system.sql"
  "fix_claimed_rewards_table.sql"
  "add_claimed_rewards_foreign_key.sql"
  "fix_immediate_referral_rewards.sql"
  "retroactive_referral_points.sql"
  "verify_rewards_system.sql"
  "create_complete_bonus_system.sql"
  "create_chat_system.sql"
  "fix_chat_system.sql"
  "fix_conversations_profiles_relationship.sql"
  "add_missing_conversations_columns.sql"
  "add_conversations_status_column.sql"
  "fix_conversations_unread_columns.sql"
  "fix_messages_table_complete.sql"
  "fix_messages_content_nullable.sql"
  "add_media_support_to_messages.sql"
  "add_offer_columns_to_messages.sql"
  "fix_send_message_function.sql"
  "fix_send_message_overload.sql"
  "create_chat_media_storage.sql"
  "complete_chat_setup.sql"
  "fix_complete_chat_schema.sql"
  "enable_realtime_for_chat.sql"
  "create_blocked_users_system.sql"
  "add_seller_order_policies.sql"
  "create_seller_subscription_plans.sql"
  "create_storage_buckets.sql"
  "update_storage_policies.sql"
  "create_reviews_system.sql"
  "reset_and_create_reviews.sql"
  "create_flash_deals_system.sql"
  "fix_flash_deals_seller_id.sql"
  "fix_flash_deals_deal_type.sql"
  "create_followers_system.sql"
  "20251117000000_add_seller_id_to_products.sql"
  "20251117000001_create_orders_system.sql"
)

# Compteur
COUNT=0
TOTAL=${#MIGRATIONS[@]}

# Ajouter chaque migration
for migration in "${MIGRATIONS[@]}"; do
  COUNT=$((COUNT + 1))
  MIGRATION_FILE="supabase/migrations/$migration"

  if [ -f "$MIGRATION_FILE" ]; then
    echo "[$COUNT/$TOTAL] Ajout de $migration..."

    # Ajouter un séparateur
    cat >> "$OUTPUT_FILE" << SEPARATOR

-- ============================================
-- MIGRATION $COUNT/$TOTAL: $migration
-- ============================================

SEPARATOR

    # Ajouter le contenu du fichier
    cat "$MIGRATION_FILE" >> "$OUTPUT_FILE"

    echo "" >> "$OUTPUT_FILE"
  else
    echo "⚠️  ATTENTION: $migration n'existe pas, ignoré"
  fi
done

# Ajouter le pied de page
cat >> "$OUTPUT_FILE" << 'FOOTER'

-- ============================================
-- FIN DES MIGRATIONS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 TOUTES LES MIGRATIONS ONT ÉTÉ EXÉCUTÉES !';
  RAISE NOTICE 'Vérifiez les logs ci-dessus pour les erreurs éventuelles';
END $$;

-- Afficher un résumé
SELECT
  '✅ Migrations terminées' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count,
  (SELECT COUNT(*) FROM storage.buckets) as buckets_count,
  NOW() as completed_at;

FOOTER

echo ""
echo "✅ Fichier généré avec succès !"
echo "📄 Fichier: $OUTPUT_FILE"
echo "📊 $COUNT/$TOTAL migrations ajoutées"
echo ""
echo "Pour l'utiliser:"
echo "1. Ouvrir Supabase SQL Editor"
echo "2. Copier le contenu de $OUTPUT_FILE"
echo "3. Coller dans SQL Editor"
echo "4. Cliquer sur Run ▶️"
echo ""
