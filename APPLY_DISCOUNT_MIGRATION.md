# 📊 Application de la Migration - Champs de Réduction

**Date:** 31 décembre 2025
**Fichier:** `supabase/migrations/add_product_discount_fields.sql`

---

## 🎯 Objectif

Ajouter les champs nécessaires pour gérer les réductions par pourcentage sur les produits.

## 📋 Nouveaux Champs

| Champ | Type | Description |
|-------|------|-------------|
| `original_price` | DECIMAL(10,2) | Prix original avant réduction |
| `discount_percent` | INTEGER | Pourcentage de réduction (0-100) |
| `has_discount` | BOOLEAN | Indique si le produit a une réduction active |

---

## 🚀 Comment Appliquer la Migration

### Option 1: Dashboard Supabase (Recommandé)

1. **Ouvrir le Dashboard Supabase:**
   ```
   https://supabase.com/dashboard
   ```

2. **Sélectionner votre projet** (senepanda)

3. **Aller dans "SQL Editor"** (dans le menu de gauche)

4. **Créer une nouvelle requête:**
   - Cliquez sur "New query"

5. **Copier-Coller le SQL:**
   - Ouvrez le fichier: `supabase/migrations/add_product_discount_fields.sql`
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL

6. **Exécuter:**
   - Cliquez sur "Run" (ou `Ctrl+Enter`)

7. **Vérifier le succès:**
   - Vous devriez voir "Success. No rows returned"

### Option 2: Via Script Node.js

```bash
# Installer les dépendances si nécessaire
npm install

# Exécuter le script de migration
node scripts/apply-discount-migration.js
```

**Note:** Cette option peut échouer selon les permissions. Utilisez Option 1 si c'est le cas.

---

## ✅ Vérification

Une fois la migration appliquée, vérifiez dans le Dashboard:

1. Allez dans **"Table Editor"**
2. Sélectionnez la table **"products"**
3. Vérifiez que les nouvelles colonnes apparaissent:
   - ✅ `original_price`
   - ✅ `discount_percent`
   - ✅ `has_discount`

---

## 🧪 Test

Après la migration:

1. Aller dans l'app → **Ma Boutique** → **Produits**
2. Cliquer sur **Modifier** un produit
3. Descendre jusqu'à **"💰 Appliquer une réduction"**
4. Tester les boutons de réduction rapide
5. Sauvegarder le produit
6. Vérifier dans Supabase que les champs sont bien remplis

---

## 📊 Requête SQL de Vérification

Pour vérifier que la migration est appliquée:

```sql
-- Vérifier les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('original_price', 'discount_percent', 'has_discount');

-- Vérifier les produits avec réduction
SELECT id, title, price, original_price, discount_percent, has_discount
FROM products
WHERE has_discount = TRUE;
```

---

## 🔄 Fonctionnalités Automatiques

Une fois la migration appliquée, ces fonctionnalités sont actives:

1. **Trigger automatique:**
   - Met à jour `has_discount` automatiquement
   - Se déclenche à chaque INSERT ou UPDATE

2. **Index de performance:**
   - Accélère les requêtes sur les produits en promotion
   - Index partiel sur `has_discount = TRUE`

3. **Validation automatique:**
   - `discount_percent` entre 0 et 100
   - `has_discount` se met à TRUE si réduction > 0

---

## 🎨 Améliorations UI Associées

Avec cette migration, l'interface a été améliorée avec:

✨ **Badge de réduction** sur le champ de prix
🎬 **Animation** lors du changement de prix
📳 **Haptic feedback** pour les interactions
🎯 **Boutons rapides** (-10%, -20%, -30%, -50%)
💰 **Aperçu en temps réel** du calcul
🔄 **Bouton réinitialiser** pour annuler

---

## ❓ Problèmes Potentiels

### Erreur: "permission denied for table products"

**Solution:** Utilisez l'Option 1 (Dashboard Supabase) au lieu du script

### Erreur: "column already exists"

**Réponse:** La migration a déjà été appliquée. Pas de problème!

### Les nouveaux champs ne s'affichent pas

1. Rafraîchir la page du Dashboard
2. Vider le cache du navigateur
3. Réessayer avec `CTRL+F5`

---

## 🎉 Succès!

Une fois la migration appliquée, la fonctionnalité de réduction par pourcentage est **100% opérationnelle** !

Les vendeurs peuvent maintenant:
- Appliquer des réductions en 1 clic
- Voir l'aperçu avant de sauvegarder
- Sauvegarder le prix original pour référence
- Afficher automatiquement le badge de promotion

**La migration des champs de réduction est prête ! 🚀**
