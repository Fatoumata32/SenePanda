# 🐛 Debug du Guide Interactif

## Problème: Le guide ne fonctionne pas

### ✅ Checklist de vérification

#### 1. Vérifier que le OnboardingProvider est bien chargé

Ajoutez ce code temporaire dans `app/_layout.tsx` après la ligne 143:

```typescript
// DEBUG: Vérifier que le provider est chargé
console.log('✅ OnboardingProvider is loaded');
```

#### 2. Vérifier que le bouton apparaît

Dans `app/(tabs)/home.tsx`, cherchez la ligne 366:
```typescript
<OnboardingDebugButton />
```

Si elle existe, le bouton devrait apparaître. Sinon, ajoutez-la juste avant `</SafeAreaView>`.

#### 3. Tester manuellement le contexte

Créez un fichier de test `TestOnboarding.tsx`:

```typescript
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function TestOnboarding() {
  const {
    isOnboardingComplete,
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    startOnboarding,
    resetOnboarding,
  } = useOnboarding();

  const handleTest = async () => {
    console.log('🧪 Test du guide...');
    await resetOnboarding();
    console.log('✅ Reset done');
    setTimeout(() => {
      console.log('▶️ Starting...');
      startOnboarding();
    }, 500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Onboarding</Text>

      <Text>Completed: {isOnboardingComplete ? 'Yes' : 'No'}</Text>
      <Text>Active: {isActive ? 'Yes' : 'No'}</Text>
      <Text>Step: {currentStepIndex} / {totalSteps}</Text>
      <Text>Current: {currentStep?.title || 'None'}</Text>

      <Button title="Start Guide" onPress={handleTest} />
      <Button title="Reset" onPress={resetOnboarding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

#### 4. Vérifier AsyncStorage

Testez dans la console Metro:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Vérifier la valeur
AsyncStorage.getItem('@onboarding_completed').then(value => {
  console.log('Onboarding status:', value);
});

// Forcer le reset
AsyncStorage.removeItem('@onboarding_completed').then(() => {
  console.log('Reset done!');
});
```

#### 5. Vérifier les imports

Dans `app/_layout.tsx`, ligne 14:
```typescript
import { OnboardingProvider } from '@/contexts/OnboardingContext';
```

Vérifiez qu'il n'y a pas d'erreur d'import en regardant la console.

#### 6. Vérifier que le Provider enveloppe bien l'app

Dans `app/_layout.tsx`, autour de la ligne 143:
```typescript
<OnboardingProvider>
  <AuthGuard>
    {/* ... */}
  </AuthGuard>
</OnboardingProvider>
```

### 🔍 Solutions par symptôme

#### Le bouton n'apparaît pas
1. Rechargez l'app (Cmd+R / Ctrl+R)
2. Vérifiez que vous êtes sur la page Home
3. Regardez en bas à droite de l'écran
4. Vérifiez la console pour erreurs

#### Le bouton apparaît mais rien ne se passe
1. Ouvrez la console Metro
2. Cliquez sur le bouton
3. Regardez les logs
4. Vérifiez s'il y a des erreurs

#### L'alert apparaît mais le guide ne démarre pas
```typescript
// Dans OnboardingDebugButton.tsx, ajoutez des logs:
const handlePress = async () => {
  console.log('🔘 Button pressed');
  console.log('isActive:', isActive);

  if (isActive) {
    console.log('⚠️ Already active');
    Alert.alert('Guide en cours', 'Le guide interactif est déjà actif!');
    return;
  }

  Alert.alert(
    'Guide Interactif 🎯',
    'Voulez-vous (re)lancer le guide interactif?',
    [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Lancer',
        onPress: async () => {
          console.log('▶️ Launching guide...');
          await resetOnboarding();
          console.log('✅ Reset done');
          router.push('/(tabs)/home' as any);
          console.log('📍 Navigated to home');
          setTimeout(() => {
            console.log('🚀 Starting onboarding...');
            startOnboarding();
          }, 500);
        },
      },
    ]
  );
};
```

#### Le tooltip n'apparaît pas
1. Vérifiez que `isActive` est `true`
2. Vérifiez que `currentStep` n'est pas `null`
3. Regardez la console pour erreurs de rendu

### 🛠️ Fix rapide

Si rien ne fonctionne, essayez cette version simplifiée du bouton:

```typescript
// Dans home.tsx, remplacez OnboardingDebugButton par:
import { useOnboarding } from '@/contexts/OnboardingContext';
import { TouchableOpacity, Text } from 'react-native';

// Dans le composant:
const { resetOnboarding, startOnboarding } = useOnboarding();

// Dans le JSX, avant </SafeAreaView>:
<TouchableOpacity
  style={{
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#FF8C00',
    padding: 20,
    borderRadius: 50,
  }}
  onPress={async () => {
    console.log('TEST BUTTON PRESSED');
    await resetOnboarding();
    setTimeout(() => startOnboarding(), 500);
  }}
>
  <Text style={{ color: 'white' }}>TEST</Text>
</TouchableOpacity>
```

### 📱 Test complet

1. **Arrêter l'app complètement**
2. **Supprimer les caches**:
   ```bash
   # Dans le terminal
   rm -rf .expo
   rm -rf node_modules/.cache
   ```
3. **Relancer**:
   ```bash
   npm start -- --clear
   ```
4. **Ouvrir la console Metro**
5. **Tester le bouton**

### 🔍 Logs à surveiller

Quand tout fonctionne, vous devriez voir:
```
✅ OnboardingProvider is loaded
🔘 Button pressed
▶️ Launching guide...
✅ Reset done
📍 Navigated to home
🚀 Starting onboarding...
[OnboardingContext] Starting onboarding
[OnboardingTooltip] Rendering step 1/11
```

Si vous ne voyez pas ces logs, partagez ce que vous voyez!
