# 🛠️ Guide: Menu Déroulant Commandes pour Vendeurs

## ❌ Problème Rencontré

Un vendeur ne voit pas le menu déroulant "Commandes" dans son profil, mais seulement le bouton simple "Mes Commandes".

---

## 🔍 Diagnostic Rapide

### Le menu déroulant s'affiche SI:
```
profile.is_seller === true
```

### Sinon, affichage du bouton simple:
```
Bouton "Mes Commandes" → /orders
```

---

## ✅ Solution Étape par Étape

### ÉTAPE 1: Vérifier le Profil dans Supabase

1. Ouvrez **Supabase Dashboard**
2. Allez dans **Table Editor** → `profiles`
3. Cherchez le profil du vendeur (par email ou nom)
4. Vérifiez les colonnes:
   - `is_seller` → Doit être **`true`** ✅
   - `subscription_plan` → Doit avoir une valeur (`free`, `starter`, `pro`, `premium`)

---

### ÉTAPE 2: Corriger via SQL

Si `is_seller = false` ou `NULL`, exécutez ce SQL:

```sql
-- Remplacez l'email par celui du vendeur
UPDATE profiles
SET
  is_seller = true,
  subscription_plan = 'free',
  subscription_status = 'active',
  subscription_end_date = NOW() + INTERVAL '7 days'
WHERE email = 'vendeur@exemple.com';
```

---

### ÉTAPE 3: Vérifier la Mise à Jour

```sql
SELECT
  email,
  is_seller,
  subscription_plan,
  subscription_status,
  subscription_end_date
FROM profiles
WHERE email = 'vendeur@exemple.com';
```

**Résultat attendu:**
```
email: vendeur@exemple.com
is_seller: true ✅
subscription_plan: free ✅
subscription_status: active ✅
subscription_end_date: [date dans 7 jours]
```

---

### ÉTAPE 4: Tester dans l'App

1. **Fermez complètement l'application** (ne pas juste minimiser)
2. **Redémarrez l'application**
3. Connectez-vous avec le compte vendeur
4. Allez dans **Profil**
5. Vous devriez maintenant voir:
   ```
   📦 Commandes [🔽]  ← Avec icône chevron
   ```
6. Cliquez dessus → Le menu se déplie avec:
   - 📈 **Mes Ventes** → `/seller/orders`
   - 🛒 **Mes Achats** → `/orders`

---

## 🎯 Comment Fonctionne le Menu

### Code Source ([app/(tabs)/profile.tsx](app/(tabs)/profile.tsx:620-686))

```typescript
{profile?.is_seller ? (
  // MENU DÉROULANT pour les vendeurs
  <View>
    <MenuItem
      label="Commandes"
      onPress={() => setOrdersMenuExpanded(!ordersMenuExpanded)}
      rightIcon={ordersMenuExpanded ? <ChevronUp /> : <ChevronDown />}
    />

    {ordersMenuExpanded && (
      <View>
        {/* Mes Ventes */}
        <TouchableOpacity onPress={() => router.push('/seller/orders')}>
          <Text>Mes Ventes</Text>
          <Text>{totalSales} commande(s) reçue(s)</Text>
        </TouchableOpacity>

        {/* Mes Achats */}
        <TouchableOpacity onPress={() => router.push('/orders')}>
          <Text>Mes Achats</Text>
          <Text>{totalOrders} commande(s) passée(s)</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
) : (
  // BOUTON SIMPLE pour les non-vendeurs
  <MenuItem
    label="Mes Commandes"
    onPress={() => router.push('/orders')}
  />
)}
```

**Logique:**
- Si `is_seller = true` → Menu déroulant avec 2 options
- Si `is_seller = false` → Bouton simple vers achats

---

## 🐛 Problèmes Fréquents

### Problème 1: Menu ne se déplie pas

**Symptômes:**
- Le menu "Commandes" s'affiche avec chevron
- Mais rien ne se passe au clic

**Solution:**
1. Vérifier dans les logs (Metro):
   ```
   console.log('ordersMenuExpanded:', ordersMenuExpanded);
   ```
2. Redémarrer l'app complètement
3. Vider le cache:
   ```bash
   npx expo start -c
   ```

---

### Problème 2: "Mes Ventes" affiche une alerte "Abonnement requis"

**Symptômes:**
- Le menu se déplie correctement
- Clic sur "Mes Ventes"
- Alerte: "Souscrivez à un plan pour gérer vos ventes"

**Cause:** `subscription_plan` est `NULL`

**Solution:**
```sql
UPDATE profiles
SET subscription_plan = 'free',
    subscription_status = 'active',
    subscription_end_date = NOW() + INTERVAL '7 days'
WHERE email = 'vendeur@exemple.com';
```

---

### Problème 3: Menu simple au lieu de déroulant

**Symptômes:**
- Affiche "Mes Commandes" (bouton simple)
- Pas de chevron, pas de menu déroulant

**Cause:** `is_seller = false` ou `NULL`

**Solution:**
```sql
UPDATE profiles
SET is_seller = true
WHERE email = 'vendeur@exemple.com';
```

---

### Problème 4: Menu ne s'affiche pas du tout

**Symptômes:**
- Aucun menu "Commandes" ou "Mes Commandes"

**Cause:** Problème de rendu React ou profil non chargé

**Solution:**
1. Vérifier dans les logs:
   ```javascript
   console.log('Profile loaded:', profile);
   console.log('is_seller:', profile?.is_seller);
   ```
2. Vérifier que `fetchProfile()` est appelé
3. Redémarrer l'app

---

## 📊 Schéma de Décision

```
Utilisateur connecté
    │
    ├─ is_seller = true ?
    │   │
    │   ├─ OUI → Menu "Commandes" [🔽]
    │   │         │
    │   │         ├─ Clic → Menu se déplie
    │   │         │         │
    │   │         │         ├─ Mes Ventes (→ /seller/orders)
    │   │         │         │   │
    │   │         │         │   ├─ subscription_plan existe ?
    │   │         │         │   │   ├─ OUI → Page chargée ✅
    │   │         │         │   │   └─ NON → Alerte "Abonnement requis" ❌
    │   │         │         │
    │   │         │         └─ Mes Achats (→ /orders) ✅
    │   │         │
    │   │
    │   └─ NON → Bouton simple "Mes Commandes" (→ /orders) ✅
```

---

## ✅ Checklist de Vérification

Avant de dire que c'est réparé, vérifiez:

- [ ] `is_seller = true` dans la base de données
- [ ] `subscription_plan` a une valeur (pas NULL)
- [ ] Application redémarrée complètement
- [ ] Menu "Commandes" s'affiche avec chevron 🔽
- [ ] Clic sur "Commandes" → Menu se déplie
- [ ] "Mes Ventes" est visible dans le menu
- [ ] "Mes Achats" est visible dans le menu
- [ ] Clic sur "Mes Ventes" → Page charge (pas d'alerte)
- [ ] Clic sur "Mes Achats" → Page charge

---

## 🚀 Script de Correction Automatique

Pour corriger **TOUS** les vendeurs d'un coup:

```sql
-- Activer tous les vendeurs qui ont configuré une boutique
UPDATE profiles
SET
  is_seller = true,
  subscription_plan = COALESCE(subscription_plan, 'free'),
  subscription_status = 'active',
  subscription_end_date = CASE
    WHEN subscription_end_date IS NULL THEN NOW() + INTERVAL '7 days'
    ELSE subscription_end_date
  END,
  updated_at = NOW()
WHERE shop_name IS NOT NULL;  -- Seulement ceux avec boutique

-- Vérification
SELECT
  COUNT(*) as total_vendeurs,
  COUNT(CASE WHEN subscription_plan IS NOT NULL THEN 1 END) as avec_abonnement
FROM profiles
WHERE is_seller = true;
```

---

## 📱 Test Complet

### Test 1: Vendeur avec abonnement
1. Profil: `is_seller = true`, `subscription_plan = 'free'`
2. Résultat attendu:
   - Menu "Commandes" déroulant ✅
   - "Mes Ventes" → Page charge ✅
   - "Mes Achats" → Page charge ✅

### Test 2: Vendeur sans abonnement
1. Profil: `is_seller = true`, `subscription_plan = NULL`
2. Résultat attendu:
   - Menu "Commandes" déroulant ✅
   - "Mes Ventes" → Alerte "Abonnement requis" ⚠️
   - "Mes Achats" → Page charge ✅

### Test 3: Non-vendeur
1. Profil: `is_seller = false`
2. Résultat attendu:
   - Bouton simple "Mes Commandes" ✅
   - Clic → Page `/orders` ✅
   - Pas de menu déroulant ✅

---

**Date:** 2026-01-12
**Fichiers concernés:**
- [app/(tabs)/profile.tsx](app/(tabs)/profile.tsx:620-686)
- [app/seller/orders.tsx](app/seller/orders.tsx:67-88)

**Status:** ✅ Solution complète documentée
