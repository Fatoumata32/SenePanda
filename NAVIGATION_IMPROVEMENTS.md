# Améliorations de la Navigation - Système de Rôle Unifié

## Vue d'ensemble

Améliorations majeures du système de navigation pour une meilleure cohérence et fluidité entre les interfaces Acheteur et Vendeur.

## Problèmes résolus

### Avant
- ❌ Pas de layout pour la section `seller` → Navigation incohérente
- ❌ Redirection systématique qui bloque l'accès au profil
- ❌ Pas de moyen rapide de basculer entre les rôles
- ❌ Logique de navigation confuse et restrictive

### Après
- ✅ Layout unifié pour `seller` avec tabs cohérents
- ✅ Pages communes accessibles par tous les rôles (profil, paramètres)
- ✅ Bouton de changement de rôle rapide dans la navigation
- ✅ Logique de navigation intelligente et contexte-aware

## Nouvelles fonctionnalités

### 1. Layout Seller avec Tabs (`app/seller/_layout.tsx`)

Navigation cohérente pour l'interface vendeur :

**Tabs visibles :**
- 🏪 Ma Boutique (my-shop)
- 📦 Produits (products)
- 📋 Commandes (orders)
- 📈 Ventes (sales)

**Pages cachées** (accessibles via navigation, pas dans les tabs) :
- Ajouter un produit
- Configuration boutique
- Abonnements
- Live shopping
- etc.

**Design :**
- Couleur primaire : Orange (`Colors.primaryOrange`)
- Même style que les tabs acheteur pour cohérence
- Header visible sur la page principale

### 2. Bouton de Changement de Rôle Rapide (`components/RoleSwitchButton.tsx`)

Permet de basculer rapidement entre les interfaces :

**Fonctionnalités :**
- Icône intelligente : affiche le rôle vers lequel on peut basculer
  - Acheteur → Voir icône `storefront` (passer en vendeur)
  - Vendeur → Voir icône `cart` (passer en acheteur)
- Confirmation avant changement
- Mise à jour automatique en DB + AsyncStorage
- Redirection vers l'interface appropriée

**Emplacement :**
- Header de la page Profil (onglet acheteur)
- Header de Ma Boutique (onglet vendeur)

### 3. Navigation Intelligente Améliorée (`components/RoleRedirect.tsx`)

**Logique améliorée :**

#### Pages Communes
Liste des pages accessibles par **tous les rôles** :
```typescript
const commonPages = [
  '/(tabs)/profile',      // Profil
  '/profile',
  '/settings/privacy',    // Paramètres
  '/settings/terms',
  '/settings/delete-account',
  '/help-support',        // Support
  '/my-benefits',         // Avantages fidélité
  '/rewards',             // Récompenses
];
```

#### Règles de Redirection

**Pour les Vendeurs :**
```
Si dans (tabs) ET pas page commune → Rediriger vers /seller/my-shop
Si sur page commune → Laisser passer
```

**Pour les Acheteurs :**
```
Si dans /seller → Rediriger vers /(tabs)
Si sur page commune → Laisser passer
```

**Avantages :**
- ✅ Profil accessible des deux côtés
- ✅ Paramètres accessibles des deux côtés
- ✅ Pas de boucle de redirection
- ✅ Navigation fluide

## Architecture de Navigation

### Structure des Routes

```
app/
├── (tabs)/                      # Interface Acheteur
│   ├── _layout.tsx             # Layout avec tabs + RoleSwitchButton
│   ├── home.tsx                # 🏠 Accueil
│   ├── explore.tsx             # 🛍️ Boutique
│   ├── favorites.tsx           # ❤️ Favoris
│   ├── messages.tsx            # 💬 Messages
│   └── profile.tsx             # 👤 Profil (COMMUN)
│
├── seller/                      # Interface Vendeur
│   ├── _layout.tsx             # Layout avec tabs + RoleSwitchButton (NOUVEAU)
│   ├── my-shop.tsx             # 🏪 Ma Boutique
│   ├── products.tsx            # 📦 Produits
│   ├── orders.tsx              # 📋 Commandes
│   ├── sales.tsx               # 📈 Ventes
│   └── [autres pages cachées]
│
├── settings/                    # Paramètres (COMMUN)
│   ├── privacy.tsx
│   ├── terms.tsx
│   └── delete-account.tsx
│
└── [autres pages communes]
```

### Flux de Navigation

#### Scénario 1 : Acheteur veut accéder au profil
```
Acheteur dans /(tabs)/home
→ Clique sur "Profil"
→ /(tabs)/profile
✅ Accès autorisé (page commune)
```

#### Scénario 2 : Acheteur veut devenir vendeur
```
Acheteur dans /(tabs)/profile
→ Clique sur RoleSwitchButton (icône storefront)
→ Confirme le changement
→ Mise à jour du rôle en DB
→ Redirection vers /seller/my-shop
✅ Maintenant en mode vendeur
```

#### Scénario 3 : Vendeur veut accéder au profil
```
Vendeur dans /seller/my-shop
→ Clique sur "Profil" (via l'app)
→ /(tabs)/profile
✅ Accès autorisé (page commune)
```

#### Scénario 4 : Vendeur accède aux paramètres
```
Vendeur dans /seller/my-shop
→ Va dans /(tabs)/profile → Paramètres
→ /settings/privacy
✅ Accès autorisé (page commune)
→ Peut changer de rôle ici aussi
```

## Composants Modifiés/Créés

### Créés
- ✅ `app/seller/_layout.tsx` - Layout avec tabs pour vendeurs
- ✅ `components/RoleSwitchButton.tsx` - Bouton de changement de rôle rapide

### Modifiés
- ✅ `components/RoleRedirect.tsx` - Logique de navigation intelligente
- ✅ `app/(tabs)/_layout.tsx` - Ajout du RoleSwitchButton dans le header
- ✅ `app/seller/_layout.tsx` - Ajout du RoleSwitchButton dans le header

## Expérience Utilisateur

### Parcours Acheteur
1. **Navigation principale** : Home, Boutique, Favoris, Messages, Profil
2. **Accès au profil** : Toujours accessible via le tab
3. **Changement de rôle** : Bouton dans le header du profil
4. **Fluidité** : Pas de redirection intempestive

### Parcours Vendeur
1. **Navigation principale** : Ma Boutique, Produits, Commandes, Ventes
2. **Accès au profil** : Via navigation (page commune)
3. **Changement de rôle** : Bouton dans le header de Ma Boutique
4. **Fluidité** : Peut accéder aux pages communes sans restriction

### Parcours Hybride (Utilisateur qui change souvent)
1. **Changement rapide** : Un clic sur le bouton → Confirmation → Changement
2. **Pas de perte de contexte** : Retour fluide entre les deux interfaces
3. **Profil unifié** : Mêmes paramètres accessibles des deux côtés

## Avantages Techniques

### Performance
- ✅ Pas de re-rendu inutile
- ✅ Navigation optimisée avec React Navigation
- ✅ Mise en cache des layouts

### Maintenabilité
- ✅ Code DRY (Don't Repeat Yourself)
- ✅ Logique centralisée dans RoleRedirect
- ✅ Composants réutilisables

### Évolutivité
- ✅ Facile d'ajouter de nouvelles pages communes
- ✅ Facile d'ajouter de nouveaux tabs
- ✅ Structure claire et documentée

## Configuration

### Ajouter une Page Commune

Modifier `components/RoleRedirect.tsx` :

```typescript
const commonPages = [
  '/(tabs)/profile',
  '/nouvelle-page-commune',  // Ajouter ici
  // ...
];
```

### Ajouter un Tab Vendeur

Modifier `app/seller/_layout.tsx` :

```tsx
<Tabs.Screen
  name="nouveau-tab"
  options={{
    title: 'Nouveau',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="icon-name" size={size} color={color} />
    ),
  }}
/>
```

### Masquer un Tab

```tsx
<Tabs.Screen
  name="page-cachee"
  options={{
    href: null,  // Cache le tab
  }}
/>
```

## Tests

### Test 1 : Navigation Acheteur
- [x] Accès à toutes les pages du tab bar
- [x] Accès au profil
- [x] Changement vers vendeur via RoleSwitchButton
- [x] Retour vers acheteur

### Test 2 : Navigation Vendeur
- [x] Accès à toutes les pages du tab bar vendeur
- [x] Accès au profil (page commune)
- [x] Changement vers acheteur via RoleSwitchButton
- [x] Retour vers vendeur

### Test 3 : Pages Communes
- [x] Profil accessible par les deux rôles
- [x] Paramètres accessibles par les deux rôles
- [x] Pas de redirection intempestive
- [x] Changement de rôle depuis les paramètres

### Test 4 : Redirections
- [x] Vendeur dans (tabs) → Redirigé vers seller/my-shop
- [x] Acheteur dans seller → Redirigé vers (tabs)
- [x] Pas de boucle de redirection
- [x] Profil non affecté par les redirections

## Migration

### Pour les Utilisateurs Existants

Aucune action requise ! Le système détecte automatiquement :
1. Rôle actuel depuis la DB
2. Navigation actuelle
3. Applique la redirection si nécessaire

### Pour les Développeurs

1. ✅ Le nouveau `seller/_layout.tsx` est ajouté
2. ✅ Pas besoin de modifier les pages vendeur existantes
3. ✅ Les redirections fonctionnent automatiquement
4. ✅ TypeScript : Tout est typé correctement

## Conclusion

Ces améliorations transforment complètement l'expérience de navigation :

**Avant** : Navigation fragmentée et restrictive
**Après** : Navigation unifiée et intelligente

**Résultat** :
- 🎯 Meilleure UX
- 🚀 Plus de fluidité
- 💡 Plus de cohérence
- ⚡ Plus de rapidité

Les utilisateurs peuvent maintenant naviguer librement entre les deux interfaces tout en conservant l'accès à leurs données communes (profil, paramètres, etc.).
