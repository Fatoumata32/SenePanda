# 📋 Guide de Migration Supabase - Toutes les Migrations

## 🎯 Instructions

Ce guide vous permet d'appliquer toutes les migrations dans le bon ordre via l'interface web de Supabase.

### Méthode 1: Via SQL Editor (Recommandé)

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Exécuter les migrations dans l'ordre**
   - Copiez le contenu de chaque fichier SQL listé ci-dessous
   - Collez dans le SQL Editor
   - Cliquez sur "Run" (▶️)
   - Attendez la confirmation ✅
   - Passez au fichier suivant

3. **Ordre d'exécution des migrations**

```
ÉTAPE 1: SCHÉMA DE BASE
========================
1. supabase/migrations/20251011232345_create_marketplace_schema.sql
2. supabase/migrations/20251011235000_create_test_profile.sql
3. supabase/migrations/20251012000000_add_username.sql
4. supabase/migrations/20251012000100_username_to_email_function.sql
5. supabase/migrations/20251012000200_create_sample_profiles.sql
6. supabase/migrations/20251012120000_disable_email_confirmation.sql
7. supabase/migrations/20251012120100_confirm_existing_emails.sql

ÉTAPE 2: FONCTIONNALITÉS PRINCIPALES
====================================
8. supabase/migrations/create_favorites_table.sql
9. supabase/migrations/add_notifications.sql
10. supabase/migrations/add_category_emojis.sql
11. supabase/migrations/add_profile_extended_fields.sql
12. supabase/migrations/add_is_premium_to_profiles.sql
13. supabase/migrations/add_products_rating_fields.sql
14. supabase/migrations/fix_products_schema.sql

ÉTAPE 3: SYSTÈME DE RÉCOMPENSES
================================
15. supabase/migrations/add_referral_code_to_profiles.sql
16. supabase/migrations/add_referral_rewards.sql
17. supabase/migrations/add_referral_rewards_trigger.sql
18. supabase/migrations/create_rewards_system.sql
19. supabase/migrations/fix_claimed_rewards_table.sql
20. supabase/migrations/add_claimed_rewards_foreign_key.sql
21. supabase/migrations/fix_immediate_referral_rewards.sql
22. supabase/migrations/retroactive_referral_points.sql
23. supabase/migrations/verify_rewards_system.sql
24. supabase/migrations/create_complete_bonus_system.sql

ÉTAPE 4: SYSTÈME DE CHAT
=========================
25. supabase/migrations/create_chat_system.sql
26. supabase/migrations/fix_chat_system.sql
27. supabase/migrations/fix_conversations_profiles_relationship.sql
28. supabase/migrations/add_missing_conversations_columns.sql
29. supabase/migrations/add_conversations_status_column.sql
30. supabase/migrations/fix_conversations_unread_columns.sql
31. supabase/migrations/fix_messages_table_complete.sql
32. supabase/migrations/fix_messages_content_nullable.sql
33. supabase/migrations/add_media_support_to_messages.sql
34. supabase/migrations/add_offer_columns_to_messages.sql
35. supabase/migrations/fix_send_message_function.sql
36. supabase/migrations/fix_send_message_overload.sql
37. supabase/migrations/create_chat_media_storage.sql
38. supabase/migrations/complete_chat_setup.sql
39. supabase/migrations/fix_complete_chat_schema.sql
40. supabase/migrations/enable_realtime_for_chat.sql
41. supabase/migrations/create_blocked_users_system.sql

ÉTAPE 5: SYSTÈME DE VENTES
===========================
42. supabase/migrations/add_seller_order_policies.sql
43. supabase/migrations/create_seller_subscription_plans.sql
44. supabase/migrations/create_storage_buckets.sql
45. supabase/migrations/update_storage_policies.sql

ÉTAPE 6: SYSTÈME D'AVIS
========================
46. supabase/migrations/create_reviews_system.sql
47. supabase/migrations/reset_and_create_reviews.sql

ÉTAPE 7: FLASH DEALS
=====================
48. supabase/migrations/create_flash_deals_system.sql
49. supabase/migrations/fix_flash_deals_seller_id.sql
50. supabase/migrations/fix_flash_deals_deal_type.sql

ÉTAPE 8: SYSTÈME DE FOLLOWERS
==============================
51. supabase/migrations/create_followers_system.sql

ÉTAPE 9: SYSTÈME DE COMMANDES (NOUVEAU)
========================================
52. supabase/migrations/20251117000000_add_seller_id_to_products.sql
53. supabase/migrations/20251117000001_create_orders_system.sql
```

### Méthode 2: Script Bash (Linux/Mac)

Si vous êtes sur Linux/Mac, vous pouvez utiliser ce script:

```bash
#!/bin/bash

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

# Appliquer chaque migration
for migration in "${MIGRATIONS[@]}"; do
  echo "⏳ Application de: $migration"
  psql "$DATABASE_URL" -f "supabase/migrations/$migration"
  if [ $? -eq 0 ]; then
    echo "✅ $migration - OK"
  else
    echo "❌ $migration - ERREUR"
    exit 1
  fi
done

echo "🎉 Toutes les migrations ont été appliquées avec succès!"
```

### Méthode 3: Via Supabase CLI (si configuré)

```bash
# Lier votre projet (une seule fois)
npx supabase link --project-ref YOUR_PROJECT_REF

# Pousser toutes les migrations
npx supabase db push
```

## 📝 Notes Importantes

1. **Ordre d'exécution**: Respectez impérativement l'ordre des migrations
2. **Erreurs**: Si une migration échoue, ne continuez pas. Corrigez d'abord l'erreur.
3. **Vérification**: Après chaque étape, vérifiez que les tables ont été créées
4. **Backup**: Faites un backup de votre base avant de commencer
5. **Temps**: L'exécution complète prend environ 5-10 minutes

## ✅ Vérifications Post-Migration

Après avoir appliqué toutes les migrations, exécutez ce script pour vérifier:

```sql
-- Vérifier toutes les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Devrait afficher:
-- blocked_users
-- cart_items
-- categories
-- claimed_rewards
-- conversations
-- favorites
-- flash_deals
-- followers
-- messages
-- notifications
-- order_items
-- orders
-- products
-- profiles
-- referral_rewards
-- reviews
-- rewards
-- seller_subscription_plans

-- Vérifier les fonctions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Vérifier les buckets de stockage
SELECT * FROM storage.buckets;
```

## 🆘 En cas de problème

Si vous rencontrez des erreurs:

1. Vérifiez les logs dans Supabase Dashboard → Database → Logs
2. Vérifiez que toutes les extensions sont activées (uuid-ossp, etc.)
3. Consultez les fichiers de migration pour voir les dépendances
4. Contactez le support si l'erreur persiste

---

**Bonne chance avec votre migration ! 🚀**
