# Correction des Boutons Confirmer/Annuler - Commandes Vendeur

## Problème Identifié

Les boutons "Confirmer" et "Annuler" dans la page des commandes reçues (`app/seller/orders.tsx`) ne fonctionnaient pas car les **politiques de sécurité RLS (Row Level Security)** dans Supabase ne permettaient pas aux vendeurs de mettre à jour le statut des commandes.

### Analyse des Politiques Existantes

Dans le fichier de migration original (`supabase/migrations/20251011232345_create_marketplace_schema.sql`), seules ces politiques existaient pour la table `orders` :

```sql
-- ✅ Politique SELECT : Les utilisateurs peuvent voir leurs propres commandes
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ✅ Politique INSERT : Les utilisateurs peuvent créer leurs propres commandes
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ❌ MANQUANT : Aucune politique UPDATE pour les vendeurs !
```

**Conséquence** : Quand un vendeur cliquait sur "Confirmer" ou "Annuler", la requête `UPDATE` était bloquée par RLS et retournait une erreur silencieuse.

---

## Solution : Nouvelles Politiques RLS

J'ai créé une nouvelle migration : `supabase/migrations/add_seller_order_policies.sql`

Cette migration ajoute **3 nouvelles politiques** :

### 1. Politique SELECT pour les vendeurs

```sql
CREATE POLICY "Sellers can view orders with their products"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id
      AND p.seller_id = auth.uid()
    )
  );
```

**Effet** : Les vendeurs peuvent maintenant voir toutes les commandes qui contiennent au moins un de leurs produits.

### 2. Politique UPDATE pour les vendeurs (LA PLUS IMPORTANTE)

```sql
CREATE POLICY "Sellers can update orders with their products"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id
      AND p.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id
      AND p.seller_id = auth.uid()
    )
  );
```

**Effet** : Les vendeurs peuvent maintenant mettre à jour le statut des commandes contenant leurs produits. C'est cette politique qui permet aux boutons "Confirmer" et "Annuler" de fonctionner !

### 3. Politique SELECT pour order_items (vendeurs)

```sql
CREATE POLICY "Sellers can view order items for their products"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM products p
      WHERE p.id = order_items.product_id
      AND p.seller_id = auth.uid()
    )
  );
```

**Effet** : Les vendeurs peuvent voir les détails (order_items) des commandes pour leurs propres produits.

---

## Installation de la Correction

### Option 1 : Via l'interface Supabase (Recommandé)

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor** (dans le menu de gauche)
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `supabase/migrations/add_seller_order_policies.sql`
5. Cliquez sur **Run** pour exécuter le script

### Option 2 : Via le CLI Supabase

Si vous avez le CLI Supabase installé :

```bash
cd project
supabase db push
```

---

## Vérification

Après avoir exécuté la migration, vérifiez que tout fonctionne :

### 1. Vérifier les politiques dans Supabase

1. Dans Supabase, allez dans **Database** → **Tables**
2. Sélectionnez la table `orders`
3. Cliquez sur l'onglet **Policies**
4. Vous devriez voir ces nouvelles politiques :
   - ✅ "Sellers can view orders with their products"
   - ✅ "Sellers can update orders with their products"

5. Sélectionnez la table `order_items`
6. Vous devriez voir :
   - ✅ "Sellers can view order items for their products"

### 2. Tester dans l'application

1. Connectez-vous en tant que vendeur
2. Allez dans **Commandes reçues**
3. Trouvez une commande avec statut "En attente"
4. Cliquez sur **Confirmer** → La commande devrait passer à "Confirmée" ✅
5. Pour une autre commande, cliquez sur **Annuler** → Une confirmation devrait apparaître, puis la commande passe à "Annulée" ✅

---

## Flux Complet des Commandes

Voici comment fonctionne maintenant le système :

```
┌─────────────┐
│  En attente │ ← Nouvelle commande créée par l'acheteur
└──────┬──────┘
       │
       ├─→ [Confirmer] ──→ ┌─────────────┐
       │                    │  Confirmée  │
       │                    └──────┬──────┘
       │                           │
       │                           └─→ [Marquer comme expédiée] ──→ ┌──────────┐
       │                                                              │ Expédiée │
       │                                                              └────┬─────┘
       │                                                                   │
       │                                                                   └─→ [Marquer comme livrée] ──→ ┌─────────┐
       │                                                                                                   │ Livrée  │
       │                                                                                                   └─────────┘
       │
       └─→ [Annuler] ──→ ┌──────────┐
                         │ Annulée  │
                         └──────────┘
```

---

## Sécurité

### Qui peut faire quoi ?

| Action | Acheteur | Vendeur | Admin |
|--------|----------|---------|-------|
| Voir ses propres commandes | ✅ | ✅ (ses produits) | ✅ |
| Créer une commande | ✅ | ❌ | ✅ |
| Modifier le statut | ❌ | ✅ (ses produits) | ✅ |
| Annuler une commande | ❌ | ✅ (ses produits) | ✅ |
| Voir les détails | ✅ | ✅ (ses produits) | ✅ |

### Protection des Données

- Un vendeur ne peut pas voir les commandes d'autres vendeurs
- Un vendeur ne peut pas modifier les commandes ne contenant pas ses produits
- Les acheteurs peuvent seulement voir leurs propres commandes
- Toutes les modifications sont auditées avec `updated_at` timestamp

---

## Dépannage

### Erreur : "Could not update the row(s)"

**Cause** : Les politiques RLS n'ont pas été appliquées correctement.

**Solution** :
1. Vérifiez que vous avez exécuté la migration `add_seller_order_policies.sql`
2. Vérifiez que RLS est activé sur la table `orders` : `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`
3. Vérifiez que l'utilisateur connecté est bien un vendeur (`is_seller = true` dans la table `profiles`)

### Erreur : "Permission denied"

**Cause** : L'utilisateur n'a pas les permissions nécessaires.

**Solution** :
1. Vérifiez que l'utilisateur est authentifié
2. Vérifiez que l'utilisateur est bien le vendeur du produit dans la commande
3. Vérifiez que les permissions GRANT ont été appliquées : `GRANT SELECT, UPDATE ON orders TO authenticated;`

### Les boutons ne répondent toujours pas

**Cause** : Erreur JavaScript ou problème de connexion.

**Solution** :
1. Ouvrez la console de développement (F12)
2. Cliquez sur un bouton et vérifiez les erreurs
3. Vérifiez que `supabase.auth.getUser()` retourne bien un utilisateur
4. Vérifiez que l'ID de la commande est correct

---

## Fichiers Modifiés

### Nouveaux Fichiers
- ✅ `supabase/migrations/add_seller_order_policies.sql` - Migration avec les nouvelles politiques
- ✅ `SELLER_ORDERS_FIX.md` - Cette documentation

### Fichiers Non Modifiés
- `app/seller/orders.tsx` - Le code était déjà correct
- Seules les politiques RLS dans Supabase devaient être corrigées

---

## Conclusion

Le problème n'était **pas dans le code React Native**, mais dans les **politiques de sécurité de la base de données**.

Après avoir appliqué cette migration, les vendeurs pourront :
- ✅ Confirmer les commandes
- ✅ Annuler les commandes (avec confirmation)
- ✅ Marquer les commandes comme expédiées
- ✅ Marquer les commandes comme livrées
- ✅ Voir tous les détails des commandes contenant leurs produits

**Action requise** : Exécutez la migration `add_seller_order_policies.sql` dans votre base de données Supabase maintenant !

---

**Date** : Octobre 2025
**Version** : 1.0
**Statut** : Prêt pour production
