# Plan d'Amélioration UX - Application SenePanda

## Problèmes Identifiés

### 1. Page Profil
- ❌ Design trop simple et pas moderne
- ❌ Trop de champs d'édition visibles en même temps
- ❌ Manque de visuels attractifs
- ❌ Expérience utilisateur confuse

### 2. Upload d'Images
- ❌ Ne fonctionne pas actuellement
- ❌ Pas de feedback visuel
- ❌ Pas de preview

### 3. Page Explorer
- ❌ Ne fonctionne pas
- ❌ Manque de catégories visuelles
- ❌ Pas de recherche efficace

### 4. Wizard de Boutique
- ❌ Pas de preview en temps réel
- ❌ Manque de guidage visuel
- ❌ Expérience non intuitive

## Solutions Proposées

### 1. ✅ Nouvelle Page Profil Moderne

**Design Cards** :
```
┌─────────────────────────────────┐
│     [Photo de Profil]           │
│      Jean Dupont                │
│      @jeandupont                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  📧 Informations Personnelles   │
│  ────────────────────────────   │
│  Email: jean@example.com        │
│  Téléphone: +225 XX XX XX XX    │
│  [Modifier]                     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🛍️  Mes Commandes              │
│  ────────────────────────────   │
│  12 commandes passées           │
│  [Voir tout]                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🏪 Ma Boutique                 │
│  ────────────────────────────   │
│  ✅ Boutique Artisanat Dakar    │
│  45 produits • 120 ventes       │
│  [Gérer la boutique]            │
└─────────────────────────────────┘
```

### 2. ✅ Upload d'Images Amélioré

**Fonctionnalités** :
- Preview immédiat de l'image sélectionnée
- Cropping intégré
- Progress bar pendant l'upload
- Confirmation visuelle après upload
- Support glisser-déposer (web)

**Flux utilisateur** :
```
1. Clic sur zone d'upload
2. Choix: Galerie ou Caméra
3. Sélection image
4. Prévisualisation avec option recadrage
5. Upload avec barre de progression
6. Confirmation avec icône ✓
```

### 3. ✅ Page Explorer Modernisée

**Layout en Grid** :
```
┌──────────────────────────────────┐
│  🔍 Rechercher...                │
└──────────────────────────────────┘

┌─────────  Catégories  ──────────┐
│  🎨  🏺  👗  🎪  🏠  📚         │
│ Art  Deco Mode Fest Maison Livres│
└──────────────────────────────────┘

┌─────────  Produits  ────────────┐
│ ┌────┐ ┌────┐ ┌────┐           │
│ │    │ │    │ │    │           │
│ │ 📸 │ │ 📸 │ │ 📸 │           │
│ └────┘ └────┘ └────┘           │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │    │ │    │ │    │           │
│ │ 📸 │ │ 📸 │ │ 📸 │           │
│ └────┘ └────┘ └────┘           │
└──────────────────────────────────┘
```

### 4. ✅ Wizard Boutique avec Preview

**Écran divisé** :
```
┌─────────────┬───────────────────┐
│  Formulaire │  Preview Temps    │
│             │  Réel             │
│             │                   │
│ Nom:        │  ┌──────────────┐ │
│ [_______]   │  │ [Logo]       │ │
│             │  │              │ │
│ Description:│  │ Nom Boutique │ │
│ [_______]   │  │ Description  │ │
│ [_______]   │  └──────────────┘ │
│             │                   │
│ Logo:       │  ★★★★☆            │
│ [Upload]    │  12 produits     │
│             │                   │
│ [< Retour]  │  [Suivant >]     │
└─────────────┴───────────────────┘
```

## Fichiers à Créer/Modifier

### Nouveaux Composants

1. **`components/ImageUploader.tsx`**
   - Upload avec preview
   - Cropping
   - Progress bar

2. **`components/ProfileCard.tsx`**
   - Card moderne pour infos profil
   - Actions rapides

3. **`components/ShopPreview.tsx`**
   - Preview en temps réel de la boutique
   - Mise à jour instantanée

4. **`components/ProductCard.tsx`**
   - Card produit moderne
   - Animations
   - Actions rapides

### Pages à Moderniser

1. **`app/(tabs)/profile.tsx`**
   - Design en cards
   - Navigation par sections
   - Actions rapides

2. **`app/(tabs)/explore.tsx`**
   - Grid de produits
   - Filtres visuels
   - Catégories en icônes

3. **`app/seller/shop-wizard.tsx`**
   - Layout split-screen
   - Preview en temps réel
   - Guidage visuel

## Palette de Couleurs Moderne

```
Primary:   #F59E0B (Amber)
Secondary: #8B5CF6 (Purple)
Success:   #10B981 (Green)
Error:     #EF4444 (Red)
Info:      #3B82F6 (Blue)

Background: #F9FAFB
Surface:    #FFFFFF
Border:     #E5E7EB
Text:       #111827
TextMuted:  #6B7280
```

## Typographie

```
Titles:  font-weight: 700
Headers: font-weight: 600
Body:    font-weight: 400
Caption: font-weight: 400, opacity: 0.6

Size Scale:
- XL: 32px
- L:  24px
- M:  18px
- S:  16px
- XS: 14px
- XXS: 12px
```

## Animations

```typescript
// Micro-interactions
- Button press: Scale 0.95
- Card tap: Scale 0.98
- Success: Bounce + ✓
- Error: Shake + ❌

// Transitions
- Page: Slide 300ms ease
- Modal: Fade 200ms ease
- Card: Scale 250ms spring
```

## Priorités d'Implémentation

### Phase 1 (Urgent)
1. ✅ Créer lib/image-upload.ts
2. 🔄 Fixer l'upload d'images
3. 🔄 Moderniser page Profile
4. 🔄 Améliorer page Explorer

### Phase 2 (Important)
5. Wizard boutique avec preview
6. Composants réutilisables
7. Animations et transitions

### Phase 3 (Nice to have)
8. Notifications push
9. Mode sombre
10. Internationalisation

## Métriques de Succès

- ✅ Upload d'images fonctionne à 100%
- ✅ Page profile chargement < 1s
- ✅ Explorer affiche produits en < 2s
- ✅ Wizard complété en < 2 min
- ✅ 0 erreur utilisateur

## Voulez-vous que je commence par :

A. Moderniser la page Profil avec le nouveau design
B. Fixer l'upload d'images en premier
C. Créer le wizard boutique avec preview
D. Améliorer la page Explorer

Quelle option préférez-vous en priorité ?
