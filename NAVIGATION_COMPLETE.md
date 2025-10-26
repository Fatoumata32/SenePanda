# Navigation Complète - SenePanda

## 🎯 Vue d'ensemble

Après la création de la boutique, l'utilisateur arrive sur un **écran de succès** avec plusieurs options de navigation pour explorer et utiliser l'application.

## 📱 Flux de Navigation

### 1. Devenir Vendeur

**Point de départ**: Profil → "Créer ma boutique"

```
Profile (Client)
    └─> Bouton "Créer ma boutique"
        └─> /seller/setup (redirige automatiquement)
            └─> /seller/shop-wizard (Wizard 3 étapes + preview temps réel)
                ├─> Étape 1: Infos de base (nom, description)
                ├─> Étape 2: Design (logos emoji + gradients OU URL personnalisée)
                └─> Étape 3: Contact (téléphone, pays)
                    └─> Bouton "Créer ma boutique"
                        └─> /seller/shop-success?shopId={userId}
```

### 2. Écran de Succès (shop-success.tsx)

**Après création de la boutique**, l'utilisateur voit:

```
┌────────────────────────────────────────┐
│          ✨ Félicitations!             │
│   Votre boutique a été créée           │
├────────────────────────────────────────┤
│     [Preview de la boutique]           │
│      Logo + Bannière + Nom             │
├────────────────────────────────────────┤
│ Que voulez-vous faire maintenant?      │
│                                        │
│ 📦 [Ajouter des produits]             │ ← Action principale
│    Commencez à vendre                  │
│                                        │
│ 👁️ [Voir ma boutique]                 │
│    Vue client de votre boutique        │
│                                        │
│ 🏪 [Explorer]                          │
│    Découvrir autres boutiques          │
│                                        │
│ 👤 [Mon profil]                        │
│    Gérer profil et paramètres          │
└────────────────────────────────────────┘
```

### 3. Navigation depuis Profil (Vendeur)

**Une fois vendeur**, le profil affiche:

```
Profile (Vendeur)
├─> 🏪 Ma Boutique (shop_name)
│   └─> /seller/shop-settings
│       ├─> Modifier bannière
│       ├─> Modifier logo
│       ├─> Modifier infos
│       └─> Sauvegarder
│
├─> 📦 Mes produits
│   └─> /seller/products
│       ├─> Liste des produits
│       ├─> Modifier produit
│       ├─> Supprimer produit
│       └─> Bouton "Ajouter produit"
│           └─> /seller/add-product
│
└─> 🛍️ Mes commandes
    └─> /orders (historique achats)
```

### 4. Navigation depuis Explorer

**Clients et vendeurs** peuvent:

```
Explorer
├─> Rechercher produits
├─> Filtrer par catégorie
├─> Cliquer sur produit
│   └─> /product/{id}
│       ├─> Voir détails
│       ├─> Voir boutique vendeur
│       │   └─> /shop/{sellerId}
│       │       ├─> Voir tous produits
│       │       ├─> Contact (téléphone)
│       │       └─> Localisation
│       └─> Ajouter au panier
│
└─> Cliquer sur badge boutique (sur ProductCard)
    └─> /shop/{sellerId}
```

## 🔄 Chemins de Navigation Clés

### Pour Ajouter un Produit

```
Méthode 1: Depuis écran de succès
shop-success → Bouton "Ajouter produits" → /seller/add-product

Méthode 2: Depuis profil
Profile → Mes produits → Bouton "+" → /seller/add-product

Méthode 3: Depuis liste produits
/seller/products → Bouton "Ajouter" → /seller/add-product
```

### Pour Voir sa Boutique (Vue Client)

```
Méthode 1: Depuis écran de succès
shop-success → Bouton "Voir ma boutique" → /shop/{userId}

Méthode 2: Depuis profil
Profile → Ma Boutique → Paramètres → Retour → Profil → Lien boutique

Méthode 3: Depuis Explorer (ses propres produits)
Explorer → Mon produit → Badge boutique → /shop/{userId}
```

### Pour Modifier sa Boutique

```
Profile → Ma Boutique → Paramètres boutique → /seller/shop-settings
├─> Changer bannière
├─> Changer logo
├─> Modifier nom/description
└─> Sauvegarder
```

## 🎨 Fonctionnalités de Design

### Logo & Bannière

**3 Options disponibles**:

1. **Presets** (par défaut)
   - 20 logos emoji (🛍️ 🏪 🏬 etc.)
   - 20 bannières gradient
   - Sélection visuelle dans wizard

2. **URL personnalisée**
   - Bouton "+ URL personnalisée"
   - Coller lien image
   - Preview temps réel
   - Exemples: Unsplash, Pexels, CDN

3. **Upload local** (dans shop-settings)
   - Depuis galerie
   - Depuis caméra
   - Upload vers Supabase Storage

### Images Produits

**3 Méthodes d'ajout**:

```
add-product.tsx
├─> 📷 Bouton "Ajouter" → Alert
│   ├─> Galerie
│   ├─> Prendre photo
│   └─> Lien URL (Alert.prompt)
│
└─> 🔗 Champ visible "Ou ajouter par lien URL:"
    ├─> TextInput (coller URL)
    └─> Bouton "+" (ajouter)
```

**Limite**: 5 images max par produit

## 🗺️ Structure des Routes

```
app/
├─> (tabs)/
│   ├─> index.tsx         # Accueil
│   ├─> explore.tsx       # Explorer produits
│   ├─> cart.tsx          # Panier
│   └─> profile.tsx       # Profil (Auth + Vendeur)
│
├─> seller/
│   ├─> setup.tsx         # Redirige → shop-wizard
│   ├─> shop-wizard.tsx   # Création boutique (3 steps + preview)
│   ├─> shop-success.tsx  # Écran succès après création ✨
│   ├─> shop-settings.tsx # Paramètres boutique
│   ├─> products.tsx      # Liste produits vendeur
│   └─> add-product.tsx   # Ajouter/modifier produit
│
├─> shop/
│   └─> [id].tsx          # Boutique publique (vue client)
│
├─> product/
│   └─> [id].tsx          # Détails produit
│
└─> orders.tsx            # Historique commandes
```

## ✅ Boutons et Actions

### Écran de Succès (shop-success.tsx)

| Bouton | Route | Icône | Couleur |
|--------|-------|-------|---------|
| Ajouter des produits | `/seller/add-product` | 📦 | Orange (Principal) |
| Voir ma boutique | `/shop/{shopId}` | 👁️ | Bleu |
| Explorer | `/(tabs)/explore` | 🏪 | Vert |
| Mon profil | `/(tabs)/profile` | 👤 | Violet |

### Profil (profile.tsx)

**Client Simple**:
- Bouton: "Créer ma boutique" → `/seller/setup`

**Vendeur**:
- Card "Ma Boutique" → `/seller/shop-settings`
- Card "Mes produits" → `/seller/products`
- Card "Mes commandes" → `/orders`

### Wizard (shop-wizard.tsx)

**Footer Navigation**:
- Étape 1: [Suivant →]
- Étape 2: [← Retour] [Suivant →]
- Étape 3: [← Retour] [Créer ma boutique]

## 🔄 Synchronisation des Données

### Après Création Boutique

```javascript
// shop-wizard.tsx
await supabase.from('profiles').update({
  is_seller: true,
  shop_name: ...,
  shop_description: ...,
  shop_logo_url: customLogoUrl || selectedLogo.id,
  shop_banner_url: customBannerUrl || selectedBanner.id,
  phone: ...,
  country: ...,
})

// Puis redirection
router.replace(`/seller/shop-success?shopId=${user.id}`);
```

### Affichage Boutique

```javascript
// shop/[id].tsx
const isLogoUrl = shop.shop_logo_url?.startsWith('http');
const isBannerUrl = shop.shop_banner_url?.startsWith('http');

if (isLogoUrl) {
  // Afficher Image avec URL
} else {
  // Afficher preset emoji/gradient
}
```

## 📊 États de l'Application

### Client Non Connecté
- Voir: Explorer, Produits, Boutiques publiques
- Action bloquée: Ajouter au panier → Redirect Login

### Client Connecté
- Tout voir + Panier + Commandes
- Profil: Option "Devenir vendeur"

### Vendeur
- Tout client + Gestion boutique + Produits
- Profil: "Ma Boutique" + "Mes produits"
- Écran succès après création

## 🎯 Parcours Utilisateur Typique

### Nouveau Vendeur

```
1. Inscription/Connexion
   └─> Profile
       └─> "Créer ma boutique"
           └─> Wizard (3 steps)
               └─> Écran succès
                   └─> "Ajouter des produits" ← Suggestion
                       └─> add-product
                           └─> Ajouter 5 images (URLs/upload)
                           └─> Publier
                               └─> Explorer (voir son produit)
                                   └─> Cliquer badge boutique
                                       └─> Vue publique boutique ✨
```

### Client qui Découvre

```
1. Ouvrir app (pas connecté)
   └─> Explorer
       └─> Voir produit
           └─> Cliquer badge boutique
               └─> Boutique publique
                   ├─> Voir tous produits
                   ├─> Appeler vendeur
                   └─> Voir localisation
```

## 🚀 Résumé

**Améliorations apportées**:

1. ✅ Écran de succès dédié avec 4 options claires
2. ✅ Navigation fluide post-création
3. ✅ Redirection automatique setup → wizard
4. ✅ Preview temps réel dans wizard
5. ✅ Support URLs partout (logos, bannières, produits)
6. ✅ Badge boutique cliquable sur produits
7. ✅ Boutiques publiques accessibles à tous
8. ✅ Synchronisation complète des données

**Tous les boutons fonctionnent maintenant et l'app est complètement synchronisée!** 🎉
