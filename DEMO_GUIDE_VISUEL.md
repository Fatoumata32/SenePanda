# 🎨 Guide Interactif - Démonstration Visuelle

## 📱 Aperçu du Design

### 🎯 Tooltip Principal

```
┌─────────────────────────────────────────┐
│  ╔═══════════════════════════════════╗  │
│  ║  [X]                   GRADIENT   ║  │
│  ║                                   ║  │
│  ║         ┌─────────┐               ║  │
│  ║         │  3/11   │  ← Indicateur ║  │
│  ║         └─────────┘               ║  │
│  ║                                   ║  │
│  ║   Ventes Flash ⚡                  ║  │
│  ║   (Titre en gras, blanc)          ║  │
│  ║                                   ║  │
│  ║   Ne manquez pas nos offres       ║  │
│  ║   limitées avec des réductions    ║  │
│  ║   incroyables                     ║  │
│  ║   (Description, blanc transparent)║  │
│  ║                                   ║  │
│  ║   ● ● ● ▬ ● ● ● ● ● ● ●          ║  │
│  ║   ↑ Dots de progression           ║  │
│  ║                                   ║  │
│  ║  ┌────────┐ ┌──────┐ ┌─────────┐ ║  │
│  ║  │Précédent│ │Passer│ │ Suivant │ ║  │
│  ║  └────────┘ └──────┘ └─────────┘ ║  │
│  ║   (Semi)     (Trans)   (Blanc)   ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│         ╔═════════════╗                 │
│         ║ ELEMENT     ║ ← Spotlight     │
│         ║ HIGHLIGHTED ║    (pulse)      │
│         ╚═════════════╝                 │
│                                         │
│  [Fond semi-transparent noir 85%]      │
└─────────────────────────────────────────┘
```

## 🎨 Palette de Couleurs

### Tooltip
- **Fond** : Gradient Gold-Orange (`#FFD700` → `#FFA500` → `#FF8C00`)
- **Texte titre** : Blanc (#FFFFFF), Gras, 24px
- **Texte description** : Blanc 90% opacité, 16px
- **Indicateur** : Badge blanc transparent
- **Dots actif** : Blanc, large (24px)
- **Dots inactif** : Blanc 40%, petit (8px)

### Boutons
- **Primaire (Suivant)** : Fond blanc, texte orange, gras
- **Secondaire (Précédent)** : Fond blanc 20%, texte blanc
- **Tertiaire (Passer)** : Transparent, texte blanc 80%

### Overlay
- **Fond** : Noir 85% (#000000)
- **Spotlight** : Bordure blanche 30%, pulse

## 🎬 Animations

### 1. Entrée du Tooltip
```
Étape 1: Fade In (0 → 1) - 300ms
Étape 2: Scale (0.8 → 1) - Spring animation
Durée totale: ~400ms
```

### 2. Effet Pulse (Spotlight)
```
Loop infini:
  Scale: 1 → 1.1 (1000ms)
  Scale: 1.1 → 1 (1000ms)
```

### 3. Transition entre étapes
```
Étape actuelle disparaît (fade out)
↓
Nouvelle étape apparaît (fade in + scale)
↓
Pulse démarre sur nouvel élément
```

## 📐 Dimensions & Espacement

### Tooltip
- **Largeur** : `SCREEN_WIDTH - 40px` (20px margin de chaque côté)
- **Border radius** : 20px
- **Padding intérieur** : 24px

### Positions
- **Top** : 120px du haut
- **Bottom** : 120px du bas
- **Center** : `SCREEN_HEIGHT / 2 - 200px`

### Bouton Close
- **Taille** : 36x36px
- **Position** : Top-right (12px, 12px)
- **Border radius** : 18px (cercle)

### Spacing
- **Entre titre et description** : 12px
- **Entre description et dots** : 24px
- **Entre dots et boutons** : 24px
- **Gap entre dots** : 8px
- **Gap entre boutons** : 12px

## 🎯 Parcours Utilisateur

### Flux Complet
```
App Launch
    ↓
Splash Screen (2s)
    ↓
Onboarding Slides (si nouveau)
    ↓
[GUIDE INTERACTIF DÉMARRE]
    ↓
┌─────────────────────────┐
│ Étape 1: Bienvenue      │ (Center, écran home)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 2: Recherche      │ (Top, écran home)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 3: Catégories     │ (Top, écran home)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 4: Ventes Flash   │ (Top, écran home)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 5: Favoris        │ (Bottom, écran favorites)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 6: Panier         │ (Bottom, écran cart)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 7: Profil         │ (Bottom, écran profile)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 8: Points         │ (Top, écran profile)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 9: Parrainage     │ (Top, écran profile)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 10: Vendeur       │ (Top, écran profile)
└─────────────────────────┘
    ↓ [Suivant]
┌─────────────────────────┐
│ Étape 11: Terminé! 🚀   │ (Center, écran home)
└─────────────────────────┘
    ↓ [Terminer]
Guide terminé!
AsyncStorage: @onboarding_completed = 'true'
```

## 🎮 Interactions Utilisateur

### Actions disponibles à chaque étape

```
┌─────────────────────────────────────┐
│              TOOLTIP                │
│  [X] ← Fermer et terminer le guide │
│                                     │
│     Contenu de l'étape...           │
│                                     │
│  [Précédent] [Passer] [Suivant]    │
│       ↑          ↑         ↑        │
│    Étape-1   Terminer  Étape+1     │
└─────────────────────────────────────┘
```

### Comportements
1. **Suivant** → Passe à l'étape suivante
2. **Précédent** → Revient à l'étape précédente (désactivé sur étape 1)
3. **Passer** → Termine le guide immédiatement
4. **X** → Même effet que "Passer"
5. **Tap en dehors** → Rien (overlay bloque)

## 🖼️ Mockup des Étapes Clés

### Étape 1 - Bienvenue (Center)
```
┌───────────────────────────────────────┐
│                                       │
│                                       │
│        ┌─────────────────┐            │
│        │                 │            │
│        │   1/11          │            │
│        │                 │            │
│        │ Bienvenue sur   │            │
│        │ ShopExpress! 👋 │            │
│        │                 │            │
│        │ Découvrez...    │            │
│        │                 │            │
│        │ ● ○ ○ ○ ○...   │            │
│        │                 │            │
│        │    [Suivant]    │            │
│        └─────────────────┘            │
│                                       │
│                                       │
└───────────────────────────────────────┘
```

### Étape 4 - Ventes Flash (Top)
```
┌───────────────────────────────────────┐
│ ┌─────────────────────────────────┐   │
│ │  4/11                           │   │
│ │  Ventes Flash ⚡                 │   │
│ │  Ne manquez pas...              │   │
│ │  ○ ○ ○ ● ○ ○ ○ ○ ○ ○ ○         │   │
│ │  [Préc.] [Passer] [Suivant]    │   │
│ └─────────────────────────────────┘   │
│           ↓ (Spotlight)                │
│ ╔═══════════════════════════════════╗ │
│ ║  ⚡ VENTES FLASH                  ║ │
│ ║  [Produit 1] [Produit 2]...      ║ │
│ ╚═══════════════════════════════════╝ │
│                                       │
│    [Autres produits...]               │
└───────────────────────────────────────┘
```

### Étape 11 - Terminé (Center)
```
┌───────────────────────────────────────┐
│                                       │
│                                       │
│        ┌─────────────────┐            │
│        │                 │            │
│        │   11/11         │            │
│        │                 │            │
│        │  C'est parti! 🚀│            │
│        │                 │            │
│        │  Vous êtes prêt │            │
│        │  à profiter...  │            │
│        │                 │            │
│        │ ○ ○ ○ ○ ○...●  │            │
│        │                 │            │
│        │   [Terminer]    │            │
│        └─────────────────┘            │
│                                       │
│                                       │
└───────────────────────────────────────┘
```

## 📊 Stats & Métriques

### Performance
- **Taille bundle** : ~15KB (3 fichiers)
- **Mémoire** : Négligeable (contexte léger)
- **Animations** : 60 FPS (native driver)

### Timing
- **Délai initial** : 1s après connexion
- **Animation entrée** : 400ms
- **Animation pulse** : 2s par cycle
- **Transition étapes** : 300ms

## 🎯 Points Forts du Design

✅ **Visibilité** : Gradient gold-orange attire l'œil
✅ **Clarté** : Texte blanc sur gradient coloré = excellent contraste
✅ **Progression** : Dots + compteur = toujours savoir où on est
✅ **Flexibilité** : 3 boutons pour 3 actions (retour, skip, suivant)
✅ **Non-intrusif** : Bouton X visible et accessible
✅ **Professionnel** : Animations fluides, design soigné
✅ **Engageant** : Effet pulse attire l'attention sur les éléments

## 🔄 Comparaison avec autres onboardings

| Feature | Notre Guide | Onboarding classique | Coach Marks typiques |
|---------|-------------|----------------------|----------------------|
| Auto-start | ✅ | ✅ | ❌ |
| Navigation flexible | ✅ (3 boutons) | ❌ (1 bouton) | ❌ |
| Progression visuelle | ✅ (dots + count) | ⚠️ (dots seulement) | ❌ |
| Design moderne | ✅ (gradient) | ⚠️ (flat) | ⚠️ |
| Animations | ✅ (pulse + fade) | ⚠️ (fade only) | ❌ |
| Spotlight | ✅ | ❌ | ✅ |
| Peut passer | ✅ | ⚠️ | ⚠️ |
| Relançable | ✅ (settings) | ❌ | ❌ |

## 💡 Conseils de Design

### Do's ✅
- Garder les textes courts (1-2 phrases max)
- Utiliser des emojis pour rendre vivant
- Montrer la progression clairement
- Permettre de passer à tout moment
- Design cohérent avec l'app

### Don'ts ❌
- Ne pas bloquer l'utilisateur
- Ne pas avoir trop d'étapes (max 15)
- Ne pas utiliser de jargon technique
- Ne pas cacher le bouton "Passer"
- Ne pas répéter le guide à chaque fois

---

**Design optimisé pour l'engagement et la rétention utilisateur** 🎨
