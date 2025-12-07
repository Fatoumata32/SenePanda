# 🎯 Guide Utilisateur Interactif - ShopExpress

## 📖 Vue d'ensemble

Ce système de guide interactif permet aux nouveaux utilisateurs de découvrir toutes les fonctionnalités de l'application de manière intuitive et engageante.

## ✨ Fonctionnalités principales

### 🎨 Design Moderne & Attractif
- **Tooltips avec gradient** : Design premium avec dégradés colorés
- **Animations fluides** : Transitions douces et effet pulse sur les éléments ciblés
- **Overlay semi-transparent** : Met en valeur les éléments importants
- **Indicateurs de progression** : Points et compteur d'étapes

### 🧠 Intelligence & Flexibilité
- **Détection automatique** : S'affiche uniquement pour les nouveaux utilisateurs
- **Navigation contextuelle** : Suit l'utilisateur à travers les différents écrans
- **Sauvegarde de progression** : Se souvient de l'état d'avancement
- **Bouton "Passer"** : L'utilisateur peut toujours ignorer le guide

### 📱 11 Étapes Interactives

1. **Bienvenue** 👋 - Introduction générale
2. **Recherche intelligente** 🔍 - Recherche vocale et textuelle
3. **Catégories** 📦 - Explorer les produits par catégorie
4. **Ventes Flash** ⚡ - Offres limitées dans le temps
5. **Favoris** ❤️ - Sauvegarder les produits préférés
6. **Panier & Commandes** 🛒 - Gestion du panier
7. **Profil** 👤 - Informations personnelles
8. **Programme de Fidélité** 🎁 - Système de points
9. **Parrainage** 🤝 - Inviter des amis
10. **Devenir Vendeur** 🏪 - Créer sa boutique
11. **Terminé** 🚀 - Message de félicitations

## 🏗️ Architecture Technique

### Contexte Global (OnboardingContext)
```typescript
- isOnboardingComplete: boolean
- currentStep: OnboardingStep | null
- currentStepIndex: number
- totalSteps: number
- isActive: boolean
- startOnboarding()
- nextStep()
- previousStep()
- skipOnboarding()
- completeOnboarding()
- resetOnboarding()
```

### Composants

#### OnboardingTooltip
Affiche le tooltip avec:
- Titre et description de l'étape
- Indicateur de progression (X/Y)
- Points de progression visuels
- Boutons de navigation (Précédent, Passer, Suivant)
- Bouton de fermeture
- Animation pulse sur l'élément ciblé

#### OnboardingWrapper
Wrapper pour gérer l'affichage du guide sur chaque écran:
- Détecte l'écran actif
- Affiche le tooltip si l'étape correspond à l'écran
- Gère le contexte automatiquement

## 🚀 Utilisation

### 1. Installation (déjà fait)
Le système est déjà intégré dans `app/_layout.tsx` avec le `OnboardingProvider`.

### 2. Ajouter le guide à une page
```typescript
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper';

export default function MyScreen() {
  return (
    <OnboardingWrapper screenName="my-screen">
      {/* Votre contenu */}
    </OnboardingWrapper>
  );
}
```

### 3. Réinitialiser le guide (pour tester)
```typescript
import { useOnboarding } from '@/contexts/OnboardingContext';

const { resetOnboarding } = useOnboarding();

// Dans un bouton de test
<Button onPress={resetOnboarding} title="Recommencer le guide" />
```

## 🎯 Expérience Utilisateur

### Premier lancement
1. L'utilisateur ouvre l'app pour la première fois
2. Après le splash screen et l'onboarding initial
3. Le guide interactif démarre automatiquement (1 seconde de délai)
4. L'utilisateur peut suivre les 11 étapes ou passer le guide

### Navigation
- **Suivant** : Passe à l'étape suivante
- **Précédent** : Retourne à l'étape précédente
- **Passer** : Ignore le guide et marque comme terminé
- **Fermer (X)** : Même effet que "Passer"

### Sauvegarde
- Le statut est sauvegardé dans AsyncStorage
- Clé: `@onboarding_completed`
- Une fois terminé, le guide ne s'affiche plus jamais

## 🎨 Personnalisation

### Modifier les étapes
Éditer `contexts/OnboardingContext.tsx` :
```typescript
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'unique-id',
    title: 'Titre de l\'étape',
    description: 'Description détaillée',
    screen: 'nom-de-l-ecran', // home, profile, etc.
    position: 'center', // top, bottom, center
    target: 'element-id', // optionnel
    order: 0,
  },
  // ...
];
```

### Modifier les couleurs
Les couleurs utilisent les constantes:
- `Colors.*` pour les couleurs de base
- `Gradients.primary` pour le gradient du tooltip

### Modifier les animations
Dans `OnboardingTooltip.tsx`, ajuster:
- `fadeAnim` : Opacité (0 → 1)
- `scaleAnim` : Échelle (0.8 → 1)
- `pulseAnim` : Effet pulse (1 → 1.1 → 1)

## 📊 Bénéfices

### Pour l'utilisateur
✅ Découverte facile des fonctionnalités
✅ Expérience guidée et intuitive
✅ Peut passer le guide à tout moment
✅ Design moderne et attrayant

### Pour le business
✅ Meilleure rétention des nouveaux utilisateurs
✅ Réduction du taux d'abandon
✅ Augmentation de l'engagement
✅ Meilleure compréhension des features

## 🔧 Maintenance

### Ajouter une nouvelle fonctionnalité
1. Ajouter une étape dans `ONBOARDING_STEPS`
2. Définir le `screen`, `title`, `description`
3. Optionnel: Ajouter un `target` pour highlight
4. L'ordre détermine la séquence

### Déboguer
```typescript
// Vérifier l'état actuel
const { currentStep, currentStepIndex, isActive } = useOnboarding();
console.log('Step:', currentStep?.id, 'Index:', currentStepIndex, 'Active:', isActive);

// Forcer le redémarrage
await AsyncStorage.removeItem('@onboarding_completed');
```

## 🎯 Prochaines améliorations possibles

- [ ] Analytics pour tracker les étapes complétées
- [ ] A/B testing de différents parcours
- [ ] Guide contextuel basé sur les actions de l'utilisateur
- [ ] Tooltips interactifs avec gestes (swipe, tap)
- [ ] Support multi-langues
- [ ] Guide avancé pour les vendeurs
- [ ] Vidéos courtes pour certaines étapes
- [ ] Gamification (badges pour avoir complété le guide)

## 📝 Notes techniques

- Utilise AsyncStorage pour la persistance
- Compatible Android & iOS
- Performance optimisée (animations natives)
- Accessibilité: labels et rôles ARIA
- Type-safe avec TypeScript
- Pas de dépendances externes lourdes

---

**Créé avec ❤️ pour ShopExpress**
