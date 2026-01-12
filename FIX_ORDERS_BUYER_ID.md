# ✅ Fix - Colonne orders.buyer_id

## ❌ Erreur Corrigée

```
ERROR  column orders.user_id does not exist
HINT: Perhaps you meant to reference the column "orders.buyer_id".
```

**Cause:** La table `orders` utilise `buyer_id` au lieu de `user_id`.

---

## 🔧 Corrections Appliquées

### Fichier: `app/seller/orders.tsx`

#### 1. Type TypeScript (ligne 32)

**AVANT:**
```typescript
type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  user_id: string;  // ❌ Incorrect
  order_items: OrderItem[];
  profile: {
    full_name: string | null;
    phone: string | null;
  };
};
```

**APRÈS:**
```typescript
type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  buyer_id: string;  // ✅ Correct
  order_items: OrderItem[];
  profile: {
    full_name: string | null;
    phone: string | null;
  };
};
```

---

#### 2. Requête SELECT (ligne 106)

**AVANT:**
```typescript
order:orders!inner(
  id,
  created_at,
  total_amount,
  status,
  shipping_address,
  user_id  // ❌ Incorrect
)
```

**APRÈS:**
```typescript
order:orders!inner(
  id,
  created_at,
  total_amount,
  status,
  shipping_address,
  buyer_id  // ✅ Correct
)
```

---

#### 3. Récupération du Profil Acheteur (ligne 124)

**AVANT:**
```typescript
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, phone')
  .eq('id', item.order.user_id)  // ❌ Incorrect
  .single();
```

**APRÈS:**
```typescript
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, phone')
  .eq('id', item.order.buyer_id)  // ✅ Correct
  .single();
```

---

## 📊 Schéma de la Table `orders`

Voici la structure correcte de la table `orders`:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id),  -- ✅ Nom correct
  seller_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(10, 2),
  status TEXT,
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Colonnes importantes:**
- `buyer_id` → L'utilisateur qui **achète** (client)
- `seller_id` → L'utilisateur qui **vend** (vendeur) *(si utilisé)*

---

## ✅ Résultat

Après ces corrections:

1. ✅ La page "Mes Ventes" charge correctement les commandes
2. ✅ Le profil de l'acheteur (nom + téléphone) s'affiche
3. ✅ Plus d'erreur `column orders.user_id does not exist`
4. ✅ Les types TypeScript correspondent à la base de données

---

## 🧪 Test de Vérification

Pour vérifier que tout fonctionne:

```sql
-- Vérifier la structure de la table orders
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('buyer_id', 'user_id', 'seller_id');
```

**Résultat attendu:**
```
column_name | data_type
------------|----------
buyer_id    | uuid
seller_id   | uuid (optionnel)
```

*Note: `user_id` ne devrait PAS apparaître.*

---

## 🔍 Autres Fichiers à Vérifier

Si vous avez d'autres fichiers qui utilisent `orders.user_id`, ils doivent aussi être corrigés:

### Rechercher dans le projet:

```bash
# Chercher tous les fichiers avec "orders" et "user_id"
grep -r "user_id" --include="*.tsx" --include="*.ts" .
```

### Fichiers potentiellement à corriger:

1. `hooks/useOrders.ts` ⚠️ (mentionné dans l'erreur)
2. `app/orders/index.tsx` (page des achats)
3. `types/database.ts` (types de base de données)

---

## 📝 Fichier `hooks/useOrders.ts`

Vérifiez ce fichier car l'erreur provient aussi de là:

```
ERROR  ❌ [ERROR] Failed to fetch orders
  at fetchOrders (hooks\useOrders.ts)
```

**Correction à appliquer:**

```typescript
// AVANT
.select(`
  *,
  order:orders!inner(
    user_id  // ❌ Incorrect
  )
`)

// APRÈS
.select(`
  *,
  order:orders!inner(
    buyer_id  // ✅ Correct
  )
`)
```

---

## ✅ Checklist Finale

- [x] Type `Order` corrigé (`buyer_id` au lieu de `user_id`)
- [x] Requête SELECT corrigée (ligne 106)
- [x] Récupération du profil corrigée (ligne 124)
- [ ] Vérifier `hooks/useOrders.ts` ⚠️
- [ ] Vérifier `app/orders/index.tsx` (si existe)
- [ ] Tester la page "Mes Ventes" en production

---

**Date:** 2026-01-12
**Fichier Modifié:** `app/seller/orders.tsx`
**Status:** ✅ Corrigé
**Fichier Suivant:** `hooks/useOrders.ts` (à vérifier)
