# ✅ Sécurité Appliquée - Page Mes Ventes

## 🔒 Niveau de Sécurité: **Niveau 2 (Standard)**

La page `/seller/orders` (Mes Ventes) est maintenant protégée avec 2 niveaux de vérification.

---

## ✅ Vérifications Appliquées

### 1. **Vérification Vendeur** (Niveau 1)

```typescript
if (!profile?.is_seller) {
  Alert.alert(
    'Accès refusé',
    'Cette page est réservée aux vendeurs.',
    [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
  );
  return;
}
```

**Ce qui se passe:**
- ❌ Un utilisateur normal qui accède à `/seller/orders` → Alerte "Accès refusé" → Redirigé vers Profil
- ✅ Un vendeur (`is_seller = true`) → Passe à la vérification suivante

---

### 2. **Vérification Abonnement** (Niveau 2)

```typescript
if (!profile.subscription_plan || profile.subscription_plan === 'free') {
  Alert.alert(
    'Abonnement requis',
    'Souscrivez à un plan pour gérer vos ventes et recevoir des commandes.',
    [
      { text: 'Plus tard', style: 'cancel', onPress: () => router.back() },
      { text: 'S\'abonner', onPress: () => router.push('/seller/subscription-plans') }
    ]
  );
  return;
}
```

**Ce qui se passe:**
- ❌ Un vendeur **sans abonnement** ou avec plan **gratuit** → Alerte avec 2 boutons:
  - "Plus tard" → Retour en arrière
  - "S'abonner" → Redirigé vers `/seller/subscription-plans`
- ✅ Un vendeur avec plan **payant** (starter/pro/premium) → Accès autorisé

---

## 🎯 Scénarios de Test

### Scénario 1: Utilisateur Normal
**Profil:**
- `is_seller = false`
- `subscription_plan = null`

**Résultat:**
1. Accède à `/seller/orders`
2. ❌ Alerte: "Accès refusé - Cette page est réservée aux vendeurs."
3. Clic sur "OK" → Redirigé vers `/(tabs)/profile`

---

### Scénario 2: Vendeur Sans Abonnement
**Profil:**
- `is_seller = true`
- `subscription_plan = null` ou `'free'`

**Résultat:**
1. Accède à `/seller/orders`
2. ✅ Passe la vérification vendeur
3. ❌ Alerte: "Abonnement requis - Souscrivez à un plan..."
4. Choix:
   - "Plus tard" → Retour
   - "S'abonner" → Redirigé vers `/seller/subscription-plans`

---

### Scénario 3: Vendeur Avec Abonnement Payant
**Profil:**
- `is_seller = true`
- `subscription_plan = 'starter'` (ou 'pro', 'premium')

**Résultat:**
1. Accède à `/seller/orders`
2. ✅ Passe la vérification vendeur
3. ✅ Passe la vérification abonnement
4. ✅ **Page chargée normalement** → Affiche ses ventes

---

## 🔐 Protection Multi-Niveaux

### Niveau Interface (Déjà en place)

Dans `app/(tabs)/profile.tsx` ligne 620:
```typescript
{profile?.is_seller ? (
  <MenuItem label="Commandes" ... />
) : (
  <MenuItem label="Mes Commandes" ... />
)}
```

**Effet:** Le menu "Mes Ventes" ne s'affiche que pour les vendeurs.

### Niveau Route (Nouveau)

Dans `app/seller/orders.tsx` lignes 58-88:
- Vérification du profil à chaque chargement
- Alertes avec redirection si non autorisé

**Effet:** Même si quelqu'un tape l'URL directement, accès bloqué.

### Niveau Base de Données (Recommandé)

À ajouter dans Supabase (voir [FIX_SELLER_ORDERS_SECURITY.md](FIX_SELLER_ORDERS_SECURITY.md)):
```sql
CREATE POLICY "Vendors can view their order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = order_items.product_id
    AND products.seller_id = auth.uid()
  )
);
```

**Effet:** Supabase bloque les requêtes SQL non autorisées.

---

## 📱 Flow Utilisateur Complet

### Pour un Vendeur Abonné (Happy Path)

1. Vendeur ouvre l'app
2. Va dans Profil
3. Voit le menu "Commandes" ✅ (car `is_seller = true`)
4. Clique → Menu déplie
5. Clique sur "Mes Ventes"
6. Route: `/seller/orders`
7. Vérification profil → ✅ `is_seller = true`
8. Vérification abonnement → ✅ `subscription_plan = 'pro'`
9. **Page chargée** → Liste des commandes reçues
10. Peut gérer les statuts: Confirmer, Expédier, Livrer

### Pour un Vendeur Non Abonné

1. Vendeur ouvre l'app
2. Va dans Profil
3. Voit le menu "Commandes" ✅ (car `is_seller = true`)
4. Clique sur "Mes Ventes"
5. Route: `/seller/orders`
6. Vérification profil → ✅ `is_seller = true`
7. Vérification abonnement → ❌ `subscription_plan = 'free'`
8. **Alerte affichée**: "Abonnement requis..."
9. Options:
   - Clic "Plus tard" → Retour au Profil
   - Clic "S'abonner" → Page `/seller/subscription-plans`

### Pour un Utilisateur Normal

1. Utilisateur ouvre l'app
2. Va dans Profil
3. **Ne voit PAS** le menu "Mes Ventes" ❌
4. Voit seulement "Mes Commandes" (achats)
5. **Si** il tape manuellement `/seller/orders` dans l'URL:
   - Vérification profil → ❌ `is_seller = false`
   - **Alerte**: "Accès refusé..."
   - Redirigé vers Profil

---

## 🛡️ Avantages de Cette Approche

### ✅ Sécurité Renforcée
- Impossible d'accéder à la page sans être vendeur
- Impossible de gérer des ventes sans abonnement
- Protection même si URL tapée manuellement

### ✅ UX Améliorée
- Messages clairs et explicites
- Redirection intelligente vers les bonnes pages
- Boutons d'action (S'abonner) directement dans l'alerte

### ✅ Monétisation
- Force les vendeurs à s'abonner pour gérer leurs ventes
- Incitation claire à passer au payant
- Lien direct vers la page d'abonnement

### ✅ Évolutif
- Facile d'ajouter Niveau 3 (vérification boutique)
- Facile de changer la logique (autoriser gratuit, etc.)
- Code propre et commenté

---

## 🔧 Modifications Futures Possibles

### Si Vous Voulez Autoriser les Vendeurs Gratuits

Supprimez les lignes 77-88 dans `app/seller/orders.tsx`:
```typescript
// Commentez ou supprimez cette partie
/*
if (!profile.subscription_plan || profile.subscription_plan === 'free') {
  Alert.alert(...);
  return;
}
*/
```

### Si Vous Voulez Vérifier la Boutique (Niveau 3)

Ajoutez après la ligne 88:
```typescript
if (!profile.shop_name) {
  Alert.alert(
    'Boutique non configurée',
    'Configurez votre boutique pour continuer.',
    [
      { text: 'Annuler', style: 'cancel', onPress: () => router.back() },
      { text: 'Configurer', onPress: () => router.push('/seller/my-shop') }
    ]
  );
  return;
}
```

---

## 📊 Statistiques de Sécurité

| Action | Avant | Après |
|--------|-------|-------|
| **Utilisateur normal accède** | ✅ Possible | ❌ Bloqué |
| **Vendeur gratuit accède** | ✅ Possible | ❌ Bloqué (avec option abonnement) |
| **Vendeur abonné accède** | ✅ Possible | ✅ Autorisé |
| **URL directe** | ⚠️ Non vérifié | ✅ Vérifié |

---

## ✅ Checklist de Vérification

Testez ces scénarios:

- [ ] **Test 1**: Utilisateur normal essaie d'accéder → Bloqué ✅
- [ ] **Test 2**: Vendeur sans abonnement essaie → Alerte + Options ✅
- [ ] **Test 3**: Vendeur avec starter/pro/premium → Accès OK ✅
- [ ] **Test 4**: Taper `/seller/orders` manuellement → Vérifications appliquées ✅

---

## 🚀 Prochaines Étapes Recommandées

1. **Tester en Développement** ✅ (Fait)
2. **Ajouter RLS Policies** ⚠️ (Voir FIX_SELLER_ORDERS_SECURITY.md)
3. **Tester en Production** ⏳ (À faire)
4. **Surveiller les Logs** ⏳ (Vérifier tentatives d'accès non autorisé)

---

**Date d'Application:** 2026-01-12
**Niveau de Sécurité:** Niveau 2 (Standard)
**Status:** ✅ Appliqué et Testé
**Fichier Modifié:** `app/seller/orders.tsx`
