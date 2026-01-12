# 🚀 Guide de Migration Supabase - Senepanda Marketplace

## 📋 Vue d'ensemble

Ce dossier contient **53 migrations SQL** organisées pour configurer complètement votre base de données Supabase pour l'application Senepanda Marketplace.

## 📁 Fichiers Importants

### Scripts de Migration
- **PUSH_ALL_MIGRATIONS.sql** - Script SQL complet avec toutes les migrations
- **PUSH_ALL_MIGRATIONS_COMBINED.md** - Guide détaillé avec 3 méthodes d'application
- **VERIFY_ALL_MIGRATIONS.sql** - Script de vérification post-migration

### Dossier migrations/
Contient 53 fichiers de migration SQL organisés en 9 étapes.

## 🎯 Méthode Recommandée: SQL Editor

### Étape 1: Accéder à Supabase
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### Étape 2: Appliquer les Migrations

Copiez et collez chaque fichier SQL dans l'ordre suivant:

#### 📦 ÉTAPE 1: Schéma de Base (7 migrations)
```
1. 20251011232345_create_marketplace_schema.sql
2. 20251011235000_create_test_profile.sql
3. 20251012000000_add_username.sql
4. 20251012000100_username_to_email_function.sql
5. 20251012000200_create_sample_profiles.sql
6. 20251012120000_disable_email_confirmation.sql
7. 20251012120100_confirm_existing_emails.sql
```

#### 🎨 ÉTAPE 2: Fonctionnalités Principales (7 migrations)
```
8. create_favorites_table.sql
9. add_notifications.sql
10. add_category_emojis.sql
11. add_profile_extended_fields.sql
12. add_is_premium_to_profiles.sql
13. add_products_rating_fields.sql
14. fix_products_schema.sql
```

#### 🎁 ÉTAPE 3: Système de Récompenses (10 migrations)
```
15. add_referral_code_to_profiles.sql
16. add_referral_rewards.sql
17. add_referral_rewards_trigger.sql
18. create_rewards_system.sql
19. fix_claimed_rewards_table.sql
20. add_claimed_rewards_foreign_key.sql
21. fix_immediate_referral_rewards.sql
22. retroactive_referral_points.sql
23. verify_rewards_system.sql
24. create_complete_bonus_system.sql
```

#### 💬 ÉTAPE 4: Système de Chat (17 migrations)
```
25. create_chat_system.sql
26. fix_chat_system.sql
27. fix_conversations_profiles_relationship.sql
28. add_missing_conversations_columns.sql
29. add_conversations_status_column.sql
30. fix_conversations_unread_columns.sql
31. fix_messages_table_complete.sql
32. fix_messages_content_nullable.sql
33. add_media_support_to_messages.sql
34. add_offer_columns_to_messages.sql
35. fix_send_message_function.sql
36. fix_send_message_overload.sql
37. create_chat_media_storage.sql
38. complete_chat_setup.sql
39. fix_complete_chat_schema.sql
40. enable_realtime_for_chat.sql
41. create_blocked_users_system.sql
```

#### 💰 ÉTAPE 5: Système de Ventes (4 migrations)
```
42. add_seller_order_policies.sql
43. create_seller_subscription_plans.sql
44. create_storage_buckets.sql
45. update_storage_policies.sql
```

#### ⭐ ÉTAPE 6: Système d'Avis (2 migrations)
```
46. create_reviews_system.sql
47. reset_and_create_reviews.sql
```

#### ⚡ ÉTAPE 7: Flash Deals (3 migrations)
```
48. create_flash_deals_system.sql
49. fix_flash_deals_seller_id.sql
50. fix_flash_deals_deal_type.sql
```

#### 👥 ÉTAPE 8: Système de Followers (1 migration)
```
51. create_followers_system.sql
```

#### 🛒 ÉTAPE 9: Système de Commandes - NOUVEAU (2 migrations)
```
52. 20251117000000_add_seller_id_to_products.sql
53. 20251117000001_create_orders_system.sql
```

### Étape 3: Vérifier l'Installation

Après avoir appliqué toutes les migrations, exécutez:
```sql
-- Script de vérification
\i supabase/VERIFY_ALL_MIGRATIONS.sql
```

Ou copiez le contenu de `VERIFY_ALL_MIGRATIONS.sql` dans le SQL Editor.

## ✅ Tables Créées (18+)

Après l'installation complète, vous aurez ces tables:

| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs avec infos vendeur |
| `products` | Produits avec seller_id |
| `categories` | Catégories avec emojis |
| `orders` | Commandes clients |
| `order_items` | Détails des commandes |
| `cart_items` | Panier d'achats |
| `favorites` | Produits favoris |
| `reviews` | Avis et notes |
| `conversations` | Conversations chat |
| `messages` | Messages avec média |
| `notifications` | Notifications push |
| `flash_deals` | Promotions flash |
| `rewards` | Système de récompenses |
| `claimed_rewards` | Récompenses réclamées |
| `referral_rewards` | Récompenses parrainage |
| `followers` | Système de follow |
| `blocked_users` | Utilisateurs bloqués |
| `seller_subscription_plans` | Plans vendeurs |

## 🎯 Buckets de Stockage Créés

- **products** - Images de produits
- **avatars** - Photos de profil
- **shop-images** - Images de boutiques
- **chat-media** - Médias de chat

## 🔍 Vérifications Post-Installation

### Vérifier les Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Vérifier les Politiques RLS
```sql
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

### Vérifier les Buckets
```sql
SELECT name, public
FROM storage.buckets;
```

### Vérifier les Données
```sql
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM orders) as orders;
```

## ⚠️ Notes Importantes

### Ordre d'Exécution
- **RESPECTEZ L'ORDRE** des migrations
- Certaines migrations dépendent des précédentes
- Ne sautez pas de migration

### Gestion des Erreurs
Si une migration échoue:
1. Lisez le message d'erreur
2. Vérifiez que les migrations précédentes ont réussi
3. Vérifiez les dépendances (tables, colonnes, fonctions)
4. Corrigez le problème avant de continuer

### Migrations Déjà Appliquées
Si une migration est déjà appliquée:
- Vous verrez une erreur "already exists"
- C'est normal, continuez avec la suivante
- Le script VERIFY vous dira ce qui manque

## 🔄 Autres Méthodes d'Application

### Méthode 2: Supabase CLI
```bash
# Installer Supabase CLI
npm install -g supabase

# Lier votre projet
npx supabase link --project-ref YOUR_PROJECT_REF

# Pousser les migrations
npx supabase db push
```

### Méthode 3: Script Bash (Linux/Mac)
Voir le fichier `PUSH_ALL_MIGRATIONS_COMBINED.md` pour le script complet.

### Méthode 4: Script SQL Complet
```bash
# Depuis psql
psql YOUR_DATABASE_URL -f supabase/PUSH_ALL_MIGRATIONS.sql
```

## 📊 Temps d'Exécution Estimé

- **Application complète**: 5-10 minutes
- **Vérification**: 1-2 minutes
- **Total**: ~15 minutes

## 🆘 Besoin d'Aide?

### Problèmes Courants

**1. "relation already exists"**
- Migration déjà appliquée
- Continuez avec la suivante

**2. "column already exists"**
- Colonne déjà créée
- Continuez avec la suivante

**3. "function already exists"**
- Fonction déjà créée
- Continuez avec la suivante

**4. "cannot drop ... because other objects depend on it"**
- Il y a des dépendances
- Vérifiez l'ordre des migrations

**5. Extensions manquantes**
```sql
-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Support

- Documentation Supabase: https://supabase.com/docs
- GitHub Issues: (votre repo)
- Discord Supabase: https://discord.supabase.com

## ✨ Après l'Installation

Une fois toutes les migrations appliquées:

1. ✅ Vérifiez avec `VERIFY_ALL_MIGRATIONS.sql`
2. ✅ Testez la connexion depuis l'app
3. ✅ Créez des données de test
4. ✅ Vérifiez les politiques RLS
5. ✅ Testez l'upload de fichiers
6. ✅ Lancez l'application

## 🎉 C'est Parti!

Votre base de données est maintenant prête pour:
- 👥 Gestion des utilisateurs (acheteurs et vendeurs)
- 🛍️ Marketplace multi-vendeurs
- 💬 Chat en temps réel
- 🎁 Système de récompenses et parrainage
- ⚡ Flash deals et promotions
- ⭐ Avis et notations
- 🛒 Panier et commandes
- 📦 Gestion complète des produits

**Bonne chance avec votre marketplace Senepanda ! 🚀🐼**

---

*Dernière mise à jour: 2025-11-18*
*Version: 1.0.0*
*Migrations: 53*
