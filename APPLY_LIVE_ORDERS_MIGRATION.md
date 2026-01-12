# 🚀 Guide Rapide: Appliquer la Migration Orders

## Étape 1: Ouvrir Supabase Dashboard

1. Aller sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. Dans le menu de gauche, cliquer sur **SQL Editor**

## Étape 2: Créer une Nouvelle Query

1. Cliquer sur **+ New query**
2. Copier **TOUT** le contenu du fichier:
   ```
   supabase/migrations/add_live_shopping_orders.sql
   ```

## Étape 3: Exécuter la Migration

1. Coller le code SQL dans l'éditeur
2. Cliquer sur **Run** (ou Ctrl+Enter)
3. Attendre la confirmation ✅ "Success. No rows returned"

## Étape 4: Vérifier que Tout est Créé

Exécuter cette requête de vérification:

```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'order_items', 'order_status_history')
ORDER BY table_name;

-- Devrait retourner 3 lignes:
-- order_items
-- order_status_history
-- orders
```

## Étape 5: Tester la Création d'une Commande

```sql
-- Créer une commande de test (remplacer les UUIDs par de vrais IDs)
INSERT INTO orders (
  user_id,
  seller_id,
  product_id,
  product_title,
  quantity,
  unit_price,
  subtotal,
  total_amount,
  currency,
  payment_method,
  status
) VALUES (
  'YOUR_USER_ID',      -- Remplacer
  'YOUR_SELLER_ID',    -- Remplacer
  'YOUR_PRODUCT_ID',   -- Remplacer
  'Produit Test',
  1,
  5000,
  5000,
  5000,
  'FCFA',
  'orange_money',
  'pending'
);

-- Vérifier
SELECT
  order_number,
  product_title,
  status,
  total_amount,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;

-- Devrait retourner quelque chose comme:
-- order_number: ORD-20251231-00001
-- product_title: Produit Test
-- status: pending
-- total_amount: 5000
```

## Étape 6: Vérifier les Statistiques

```sql
-- Voir les stats (devrait montrer 1 commande)
SELECT * FROM order_stats;
```

## ✅ Migration Réussie!

Si tout fonctionne:
- ✅ 3 tables créées (orders, order_items, order_status_history)
- ✅ Numéros de commande auto-générés
- ✅ Vue order_stats accessible
- ✅ RLS policies actives

## 🔄 Prochaine Étape

Maintenant vous pouvez:
1. Tester l'achat pendant un live dans l'app
2. Vérifier que les commandes sont créées automatiquement après paiement
3. Voir les commandes dans la table `orders`

## 🐛 En Cas de Problème

### Erreur: "relation already exists"
C'est OK! La table existe déjà. Vous pouvez continuer.

### Erreur: "permission denied"
Vérifier que vous êtes bien connecté en tant qu'admin du projet.

### Erreur: "foreign key constraint"
Assurez-vous que les tables `auth.users`, `profiles`, `products`, `live_sessions`, `payments` existent.

## 📞 Besoin d'Aide?

Consulter:
- `LIVE_SHOPPING_PAYMENT_GUIDE.md` - Guide complet
- `TECHNICAL_DOCUMENTATION.md` - Documentation technique
- Console JavaScript de l'app pour voir les logs

---

**Date:** 31 Décembre 2025
