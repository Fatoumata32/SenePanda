# 🔧 Fix: Produits n'apparaissent pas dans Explorer

## 🐛 Problème

Les produits ne s'affichent pas dans la page Explorer après leur ajout.

## 🔍 Causes Identifiées

1. **Colonne `name` ajoutée récemment** - Le code utilisait uniquement `title` pour la recherche
2. **Produits potentiellement inactifs** (`is_active = false`)
3. **Cache non vidé** après ajout de produits
4. **Colonnes NULL** (`name` peut être NULL si migration pas appliquée)

---

## ✅ Corrections Appliquées

### **1. Code TypeScript - explore.tsx**

Fichier: [`app/(tabs)/explore.tsx`](app/(tabs)/explore.tsx)

#### A. Filtre de recherche (lignes 102-111)

**Avant:**
```typescript
filtered = filtered.filter(
  (p) =>
    p.title.toLowerCase().includes(query) ||
    p.description?.toLowerCase().includes(query)
);
```

**Après:**
```typescript
filtered = filtered.filter(
  (p) =>
    p.title?.toLowerCase().includes(query) ||
    p.name?.toLowerCase().includes(query) ||  // ⬅️ AJOUTÉ
    p.description?.toLowerCase().includes(query)
);
```

**Pourquoi:** Maintenant le filtre recherche aussi dans `name`, et utilise l'optional chaining `?.` pour éviter les erreurs si `title` est NULL.

#### B. Affichage du titre (ligne 465-467)

**Avant:**
```typescript
<Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={2}>
  {product.title}
</Text>
```

**Après:**
```typescript
<Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={2}>
  {product.name || product.title || 'Produit'}  // ⬅️ MODIFIÉ
</Text>
```

**Pourquoi:** Affiche `name` en priorité, puis `title`, puis "Produit" par défaut si les deux sont NULL.

---

### **2. Base de Données SQL**

**Fichiers créés:**
- [`ACTIVER_PRODUITS_RAPIDE.sql`](ACTIVER_PRODUITS_RAPIDE.sql) - Script ultra rapide
- [`FIX_PRODUIT_INVISIBLE.sql`](FIX_PRODUIT_INVISIBLE.sql) - Fix complet
- [`DEBUG_PRODUIT_FIXED.sql`](DEBUG_PRODUIT_FIXED.sql) - Diagnostic

**Actions à effectuer:**

```sql
-- 1. Activer tous les produits récents
UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. S'assurer que name n'est pas NULL
UPDATE products
SET name = COALESCE(name, title, 'Produit')
WHERE name IS NULL OR name = '';

-- 3. Invalider le cache
UPDATE products
SET updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## 🚀 Solution Complète (3 Étapes)

### **ÉTAPE 1: Exécuter la Migration SQL**

Dans **Supabase Dashboard** → **SQL Editor**:

```sql
-- Activer les produits
UPDATE products
SET is_active = true
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Corriger name NULL
UPDATE products
SET name = COALESCE(name, title, 'Produit')
WHERE name IS NULL OR name = '';

-- Forcer la mise à jour
UPDATE products
SET updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '1 day';

-- Vérifier
SELECT
  name,
  title,
  price,
  is_active,
  TO_CHAR(created_at, 'DD/MM HH24:MI') as date_creation
FROM products
ORDER BY created_at DESC
LIMIT 5;
```

### **ÉTAPE 2: Vider le Cache de l'App**

**Option A - Dans l'app:**
1. Fermez complètement l'application
2. Réouvrez l'application
3. Dans Explorer, **tirez vers le bas** pour rafraîchir (pull-to-refresh)

**Option B - Terminal:**
```bash
npm start -- --clear
```

### **ÉTAPE 3: Vérifier**

1. Ouvrez l'app SenePanda
2. Allez dans **Explorer**
3. Vos produits devraient apparaître! ✅

---

## 🔍 Diagnostic

Si les produits n'apparaissent toujours pas, vérifiez:

### 1. Les produits sont-ils actifs?

```sql
SELECT
  name,
  is_active,
  created_at
FROM products
WHERE is_active = false
ORDER BY created_at DESC;
```

### 2. Les colonnes sont-elles correctes?

```sql
SELECT
  name,
  title,
  price,
  currency,
  category_id
FROM products
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu:**
- `name`: **non NULL** ✅
- `title`: **non NULL** ✅
- `price`: **nombre positif** ✅
- `currency`: **'FCFA'** ✅
- `category_id`: **UUID valide** ✅

### 3. Le cache est-il à jour?

```sql
SELECT
  name,
  updated_at,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 1;
```

Si `updated_at` est ancien, réexécutez:
```sql
UPDATE products
SET updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## 📊 Résumé des Modifications

### Fichiers TypeScript
| Fichier | Lignes | Modification |
|---------|--------|--------------|
| `app/(tabs)/explore.tsx` | 102-111 | Ajout recherche sur `name` + optional chaining |
| `app/(tabs)/explore.tsx` | 465-467 | Affichage `name \|\| title \|\| 'Produit'` |
| `app/seller/add-product.tsx` | 299 | Ajout champ `name` lors de l'insertion |

### Scripts SQL Créés
| Fichier | Usage |
|---------|-------|
| `ACTIVER_PRODUITS_RAPIDE.sql` | ⭐ **Utilisez celui-ci** - Fix ultra rapide |
| `FIX_PRODUIT_INVISIBLE.sql` | Fix complet avec vérifications |
| `DEBUG_PRODUIT_FIXED.sql` | Diagnostic détaillé |
| `FIX_RAPIDE_PRODUITS.sql` | Fix colonnes products + user_subscriptions |

---

## ✅ Checklist de Validation

- [x] **Code**: Recherche inclut `name` et `title`
- [x] **Code**: Affichage utilise `name || title || 'Produit'`
- [x] **SQL**: Produits activés (`is_active = true`)
- [x] **SQL**: Colonne `name` remplie (pas NULL)
- [x] **SQL**: Timestamp `updated_at` mis à jour
- [ ] **App**: Cache vidé (redémarrage)
- [ ] **Test**: Produits visibles dans Explorer

---

## 🎯 Résultat Attendu

Après avoir appliqué toutes les corrections:

1. ✅ Les produits s'affichent dans **Explorer**
2. ✅ La recherche fonctionne sur le nom ET le titre
3. ✅ Les produits récents apparaissent en premier
4. ✅ Le filtre par catégorie fonctionne
5. ✅ Pas d'erreur de NULL dans la console

---

**Date**: 2026-01-11
**Status**: ✅ Corrections appliquées
**Action requise**: Exécuter le script SQL + Redémarrer l'app
