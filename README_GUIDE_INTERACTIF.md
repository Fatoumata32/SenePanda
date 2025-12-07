# 🎯 Guide Interactif - Mode d'emploi Rapide

## 🚀 Qu'est-ce que c'est ?

Un système de guide interactif intelligent qui **accueille automatiquement les nouveaux utilisateurs** et leur montre comment utiliser l'application en **11 étapes engageantes**.

## ✨ Fonctionnalités clés

### 🎨 Design Premium
- **Tooltips avec gradient doré-orange** - Design attrayant et moderne
- **Animations fluides** - Transitions douces et effet pulse
- **Overlay semi-transparent** - Met en valeur les éléments importants
- **Indicateurs de progression** - Dots + compteur (X/11)

### 🧠 Intelligence
- **Détection automatique** - S'affiche uniquement pour les nouveaux utilisateurs
- **Sauvegarde de progression** - AsyncStorage
- **Navigation flexible** - Suivant, Précédent, Passer
- **Non-intrusif** - L'utilisateur peut toujours ignorer

### 📱 11 Étapes du Parcours

1. 👋 **Bienvenue** - Introduction générale
2. 🔍 **Recherche intelligente** - Recherche vocale et textuelle
3. 📦 **Catégories** - Explorer les produits
4. ⚡ **Ventes Flash** - Offres limitées
5. ❤️ **Favoris** - Sauvegarder les produits
6. 🛒 **Panier & Commandes** - Gestion du panier
7. 👤 **Profil** - Informations personnelles
8. 🎁 **Programme de Fidélité** - Système de points
9. 🤝 **Parrainage** - Inviter des amis
10. 🏪 **Devenir Vendeur** - Créer sa boutique
11. 🚀 **Terminé** - Félicitations!

## 🎮 Comment tester ?

### Méthode 1 : Via les Paramètres (Recommandé)
1. Ouvrir l'app
2. Aller dans **Profil** → **Paramètres** (⚙️)
3. Section **Assistance**
4. Cliquer sur **"Revoir le guide interactif"** 📖
5. Confirmer → Le guide démarre!

### Méthode 2 : Supprimer les données (Nouveau utilisateur)
```bash
# Android
adb shell pm clear com.votreapp

# iOS Simulator
# Device → Erase All Content and Settings
```

### Méthode 3 : Code (Pour les développeurs)
```typescript
import { useOnboarding } from '@/contexts/OnboardingContext';

const { resetOnboarding, startOnboarding } = useOnboarding();

// Réinitialiser et lancer
await resetOnboarding();
startOnboarding();
```

## 📝 Structure du Code

```
contexts/
  └── OnboardingContext.tsx         # Contexte global + 11 étapes définies

components/onboarding/
  ├── OnboardingTooltip.tsx         # Composant visuel (tooltip + overlay)
  ├── OnboardingWrapper.tsx         # Wrapper pour les écrans
  └── index.ts                      # Export

app/
  └── _layout.tsx                   # Provider ajouté ✅

app/settings/
  └── index.tsx                     # Bouton "Revoir le guide" ajouté ✅
```

## 🔧 Personnalisation

### Modifier les étapes
Éditer `contexts/OnboardingContext.tsx` :

```typescript
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'mon-etape',
    title: 'Titre de l\'étape 📱',
    description: 'Description détaillée...',
    screen: 'home', // 'home', 'profile', 'cart', etc.
    position: 'center', // 'top', 'bottom', 'center'
    target: 'element-id', // optionnel
    order: 0,
  },
  // ...
];
```

### Modifier les couleurs
Le tooltip utilise `Gradients.goldOrange` et `Colors.white`.
Pour changer, éditer `components/onboarding/OnboardingTooltip.tsx:127`.

### Modifier les animations
Dans `OnboardingTooltip.tsx` :
- `fadeAnim` : Opacité (0 → 1)
- `scaleAnim` : Échelle (0.8 → 1)
- `pulseAnim` : Pulse (1 → 1.1 → 1)

## 🎯 Expérience Utilisateur

### Premier lancement
1. Utilisateur ouvre l'app
2. Splash screen → Onboarding initial (slides)
3. **Guide interactif démarre automatiquement** (1s de délai)
4. L'utilisateur peut:
   - **Suivre** les 11 étapes (bouton "Suivant")
   - **Revenir en arrière** (bouton "Précédent")
   - **Passer** le guide (bouton "Passer" ou X)

### Lancée suivantes
- Le guide ne s'affiche plus (sauvegardé dans AsyncStorage)
- Accessible via Paramètres → "Revoir le guide interactif"

## 📊 Détails Techniques

### AsyncStorage
- **Clé** : `@onboarding_completed`
- **Valeur** : `'true'` (complété) ou vide (nouveau)

### Navigation
Le guide suit l'utilisateur à travers les écrans définis dans chaque étape.

### Performance
- ✅ Animations natives (useNativeDriver: true)
- ✅ Pas de re-renders inutiles
- ✅ Composants optimisés

### Accessibilité
- ✅ `accessibilityLabel` sur tous les boutons
- ✅ `accessibilityRole="button"`
- ✅ Textes lisibles (contraste élevé)

## 🐛 Debugging

### Le guide ne s'affiche pas
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Vérifier le statut
const status = await AsyncStorage.getItem('@onboarding_completed');
console.log('Onboarding completed:', status);

// Réinitialiser
await AsyncStorage.removeItem('@onboarding_completed');
```

### Vérifier l'étape actuelle
```typescript
const { currentStep, currentStepIndex, isActive } = useOnboarding();
console.log('Active:', isActive);
console.log('Step:', currentStepIndex, currentStep?.title);
```

## 🎁 Bénéfices

### Pour l'utilisateur
✅ Découverte rapide des fonctionnalités
✅ Expérience guidée et intuitive
✅ Design moderne et attrayant
✅ Peut passer à tout moment

### Pour le business
✅ Meilleure rétention (onboarding efficace)
✅ Réduction du taux d'abandon
✅ Augmentation de l'engagement
✅ Meilleure compréhension des features

## 🚀 Prochaines améliorations possibles

- [ ] **Analytics** - Tracker les étapes complétées
- [ ] **A/B Testing** - Tester différents parcours
- [ ] **Guide contextuel** - Basé sur les actions utilisateur
- [ ] **Tooltips interactifs** - Avec gestes (swipe, tap)
- [ ] **Multi-langues** - Support i18n
- [ ] **Guide vendeur** - Parcours spécifique pour vendeurs
- [ ] **Vidéos courtes** - Pour certaines étapes clés
- [ ] **Gamification** - Badges pour avoir complété le guide

## 💡 Conseils d'utilisation

1. **Premier test** : Réinitialisez vos données app pour voir l'expérience complète
2. **Modifications** : Changez les textes dans `OnboardingContext.tsx`
3. **Couleurs** : Adaptez les couleurs dans `OnboardingTooltip.tsx`
4. **Analytics** : Ajoutez des événements dans `nextStep()`, `skipOnboarding()`, etc.

## 📞 Support

En cas de problème:
1. Vérifier la console pour les erreurs
2. Vérifier AsyncStorage (`@onboarding_completed`)
3. S'assurer que `OnboardingProvider` est bien dans `_layout.tsx`
4. Tester avec `resetOnboarding()` puis `startOnboarding()`

---

**Créé avec ❤️ pour améliorer l'expérience utilisateur de ShopExpress**

🎯 **Mission** : Rendre l'application facile à utiliser pour tous !
