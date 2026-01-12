# ⚡ Quick Fix - Guide Interactif

## 🎯 Solution Rapide (2 minutes)

### Étape 1: Ouvrir l'app et aller sur Home
### Étape 2: Chercher le bouton orange en bas à droite
### Étape 3: Si vous ne le voyez pas → Rechargez (Cmd+R ou Ctrl+R)

## 🔍 Débug rapide

### Ouvrez la console Metro et regardez les logs

Quand vous cliquez sur le bouton, vous devriez voir:
```
[OnboardingDebugButton] 🔘 Button pressed
[OnboardingContext] 🚀 Starting onboarding...
[OnboardingTooltip] 💬 Rendering step: 1 / 11
```

Si vous voyez "already completed", tapez dans la console:
```javascript
import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
  AsyncStorage.removeItem('@onboarding_completed').then(() => console.log('Reset!'));
});
```

Puis rechargez l'app (R).

## 📞 Besoin d'aide?

Partagez les logs de votre console qui commencent par `[Onboarding...]`
