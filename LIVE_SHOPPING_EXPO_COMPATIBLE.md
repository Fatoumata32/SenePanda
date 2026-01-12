# Live Shopping - Version Compatible Expo Go

## ⚠️ Problème avec react-native-agora

`react-native-agora` nécessite un **build natif** et ne fonctionne **PAS** avec Expo Go.

## 🔄 Solutions

### Option 1 : Build EAS (Recommandé pour Production)

**Avantages** :
- ✅ Streaming vidéo professionnel avec Agora
- ✅ Qualité optimale
- ✅ Fonctionnalités complètes

**Commandes** :
```bash
# 1. Installer EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configurer
eas build:configure

# 4. Build development
eas build --profile development --platform android

# 5. Installer le build sur votre appareil
# Le build sera disponible dans votre compte EAS
```

**Durée** : ~20-30 minutes pour le premier build

### Option 2 : Version Simplifiée sans Agora (Développement Rapide)

Pour tester rapidement sans build, on peut utiliser une version simplifiée :

**Alternative 1 - Simuler le Live** :
- Utiliser `expo-camera` pour la caméra
- `expo-av` pour l'enregistrement
- Envoyer des "snapshots" au lieu de streaming temps réel
- Chat en temps réel via Supabase Realtime

**Alternative 2 - Utiliser expo-camera + WebRTC** :
- Package compatible : `react-native-webrtc` (avec config Expo)
- Moins performant qu'Agora mais fonctionne

## 🚀 Solution Recommandée

### Pour le Développement Immédiat

**1. Désactiver temporairement le live streaming Agora** :

Modifier les fichiers live pour vérifier si Agora est disponible :

```typescript
// Dans useLiveShopping.ts
const isAgoraAvailable = Platform.OS !== 'web' && !__DEV__;

if (!isAgoraAvailable) {
  // Utiliser version simplifiée
  return useLiveShoppingSimple();
}
```

**2. Créer une version "Demo" du live** :

- Interface identique
- Utilise la caméra locale sans streaming
- Chat fonctionnel via Supabase
- "Simulateur" de viewers

### Pour la Production

**Builder avec EAS** pour avoir toutes les fonctionnalités.

## 📝 Configuration EAS pour Agora

Ajouter à `eas.json` :

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 🔧 Fix Temporaire

Créer un wrapper qui détecte l'environnement :

```typescript
// lib/agoraWrapper.ts
import { Platform } from 'react-native';

let AgoraEngine;

try {
  if (!__DEV__) {
    AgoraEngine = require('react-native-agora').default;
  }
} catch (e) {
  console.log('Agora not available - using fallback');
}

export const isAgoraAvailable = !!AgoraEngine;
export { AgoraEngine };
```

## 📱 Tester Sans Build

Pour tester l'app SANS le live shopping :

1. **Désactiver temporairement les imports Agora**
2. **Cacher le bouton LIVE** si pas de build natif
3. **Afficher un message** "Fonctionnalité disponible dans la version complète"

## ✅ Prochaines Étapes

**Immédiat** (Expo Go) :
1. Désactiver temporairement Agora
2. Tester le reste de l'app
3. Développer les autres fonctionnalités

**Production** (Build EAS) :
1. `eas build --profile development --platform android`
2. Installer le build sur un appareil réel
3. Tester le live shopping complet
4. Deploy sur stores

## 💡 Recommandation

Pour le moment, **continue le développement** des autres fonctionnalités en désactivant temporairement Agora. Quand tu seras prêt pour le live shopping, lance un build EAS.

La plupart de l'app fonctionne sans problème avec Expo Go !
