# 🎥 Guide de Configuration Vidéo Live avec Agora

## 🎯 Vue d'ensemble

Le système de vidéo live est maintenant **100% intégré** avec Agora.io ! Les vendeurs peuvent streamer en direct et les acheteurs peuvent regarder en temps réel avec chat et réactions.

## ✅ Déjà Installé

- ✅ `react-native-agora` - SDK vidéo
- ✅ `agora-react-native-rtm` - Messagerie temps réel
- ✅ Configuration complète
- ✅ Écran vendeur (broadcaster)
- ✅ Écran acheteur (audience)

## 🔑 Étape 1 : Obtenir un App ID Agora (GRATUIT)

### 1. Créer un compte Agora

1. Allez sur **https://console.agora.io/**
2. Cliquez sur **"Sign Up"** (Gratuit)
3. Vérifiez votre email

### 2. Créer un projet

1. Dans le dashboard, cliquez sur **"Project Management"**
2. Cliquez sur **"Create"**
3. Nom du projet : **"SenePanda Live Shopping"**
4. Mode : **"Testing Mode"** (pour commencer)
5. Cliquez sur **"Submit"**

### 3. Copier l'App ID

1. Votre nouveau projet apparaît
2. Cliquez sur l'icône 👁️ pour révéler l'App ID
3. **Copiez** l'App ID

### 4. Configurer dans l'app

Ouvrez `lib/agoraConfig.ts` et remplacez :

```typescript
export const AGORA_APP_ID = 'VOTRE_APP_ID_ICI'; // Collez votre App ID
```

**C'est tout ! 🎉**

## 🎁 Plan Gratuit Agora

- ✅ **10,000 minutes/mois GRATUIT**
- ✅ Illimité en nombre de canaux
- ✅ Support HD 1080p
- ✅ Ultra low latency (< 400ms)
- ✅ Pas de carte de crédit requise

Pour SenePanda :
- 10,000 min = **~166 heures de live/mois**
- = **~5.5 heures par jour**
- Largement suffisant pour commencer ! 🚀

## 📱 Configuration Android

### 1. Permissions dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

### 2. Build et testez :

```bash
npm run android
```

## 🍎 Configuration iOS

### 1. Permissions dans `ios/YourApp/Info.plist` :

```xml
<key>NSCameraUsageDescription</key>
<string>Nous avons besoin d'accès à votre caméra pour le live shopping</string>
<key>NSMicrophoneUsageDescription</key>
<string>Nous avons besoin d'accès à votre micro pour le live shopping</string>
```

### 2. Installer les pods :

```bash
cd ios && pod install && cd ..
```

### 3. Build et testez :

```bash
npm run ios
```

## 🎬 Fonctionnalités Vidéo Implémentées

### Pour le Vendeur (`app/seller/live-stream/[id].tsx`)

#### Contrôles vidéo :
- ✅ **Démarrer/Arrêter** le live
- ✅ **Mute/Unmute** le micro
- ✅ **Activer/Désactiver** la caméra
- ✅ **Changer de caméra** (avant/arrière)
- ✅ **Qualité HD** 720x1280 @30fps

#### Fonctionnalités live :
- ✅ **Compteur de spectateurs** en temps réel
- ✅ **Chat intégré** avec les spectateurs
- ✅ **Réactions animées** (❤️🔥👏⭐🛒)
- ✅ **Stats en direct** (vues, ventes, réactions)
- ✅ **Produits en vedette** affichables

### Pour l'Acheteur (`app/live/[id].tsx`)

#### Visionnage :
- ✅ **Stream HD** du vendeur
- ✅ **Ultra low latency** (< 400ms)
- ✅ **Auto-reconnect** si perte de connexion
- ✅ **Compteur de spectateurs**

#### Interactions :
- ✅ **Chat en temps réel**
- ✅ **Réactions** (❤️🔥👏⭐🛒)
- ✅ **Voir les produits** en vedette
- ✅ **Ajouter au panier** pendant le live
- ✅ **Prix spéciaux** exclusifs au live

## 🎯 Workflow Complet

### 1. Vendeur crée un live

```
app/seller/start-live.tsx
├─ Titre, description
├─ Sélection des produits
├─ Prix spéciaux (optionnel)
└─ [Démarrer maintenant] ou [Programmer]
```

### 2. Vendeur démarre le stream

```
app/seller/live-stream/[id].tsx
├─ Initialise Agora Engine
├─ Active caméra + micro
├─ Configure en mode Broadcaster
├─ Rejoint le canal Agora
├─ Démarre la session en DB
└─ 🔴 LIVE !
```

### 3. Acheteurs rejoignent

```
app/live/[id].tsx
├─ Initialise Agora Engine
├─ Configure en mode Audience
├─ Rejoint le canal Agora
├─ Reçoit le stream du vendeur
├─ Peut chatter & réagir
└─ Peut acheter les produits
```

## 🔒 Sécurité en Production

### Token Authentication (Recommandé)

En production, utilisez des tokens pour sécuriser vos canaux :

#### 1. Backend (Node.js exemple) :

```javascript
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

app.post('/api/generate-agora-token', async (req, res) => {
  const { channelName, uid, role } = req.body;

  const appId = 'YOUR_APP_ID';
  const appCertificate = 'YOUR_APP_CERTIFICATE';
  const expirationTimeInSeconds = 3600; // 1 heure

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
    privilegeExpiredTs
  );

  res.json({ token });
});
```

#### 2. Frontend (mise à jour) :

```typescript
// lib/agoraConfig.ts
export const generateAgoraToken = async (
  channelName: string,
  uid: number,
  role: 'publisher' | 'subscriber'
): Promise<string> => {
  const response = await fetch('https://votre-api.com/generate-agora-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelName, uid, role })
  });

  const data = await response.json();
  return data.token;
};
```

## 📊 Analytics & Monitoring

### Dashboard Agora

Le dashboard Agora.io offre :
- 📈 **Usage en temps réel**
- 👥 **Nombre de participants**
- 🌍 **Répartition géographique**
- ⚡ **Qualité du réseau**
- 💰 **Coûts estimés**

### Dans votre app

Vous pouvez tracker :
- Durée moyenne des lives
- Pic de spectateurs
- Taux de conversion (vues → achats)
- Engagement (messages, réactions)

## 🚀 Optimisations pour l'Afrique

### Configuration optimisée incluse :

```typescript
// Déjà dans le code
VIDEO_PROFILE = {
  width: 720,        // HD adapté au mobile
  height: 1280,      // Portrait mode
  frameRate: 30,     // Fluide sans surcharge
  bitrate: 2000,     // 2 Mbps optimal pour 4G
};

AUDIO_PROFILE = {
  sampleRate: 48000, // Haute qualité
  channels: 2,       // Stéréo
  bitrate: 128,      // Équilibre qualité/bande passante
};
```

### Mode de secours automatique :

Agora ajuste automatiquement la qualité selon la connexion :
- 🟢 **4G/WiFi** : HD 720p
- 🟡 **3G** : SD 480p
- 🔴 **2G/Lent** : Audio uniquement

## 🎉 Test en Dev

### Sans App ID configuré :

L'app fonctionne **sans** vidéo :
- ✅ Chat fonctionne
- ✅ Réactions fonctionnent
- ✅ Produits affichés
- ❌ Pas de vidéo (placeholder affiché)

### Avec App ID configuré :

Tout fonctionne ! 🎉

## 💡 Prochaines Améliorations

- [ ] **Replay automatique** des lives passés
- [ ] **Clips highlights** (moments forts)
- [ ] **Multi-caméra** (changer d'angle)
- [ ] **Filtres beauté** en temps réel
- [ ] **Partage d'écran** pour démos produits
- [ ] **Co-streaming** (inviter d'autres vendeurs)
- [ ] **Streaming sur plusieurs plateformes** (TikTok, Instagram)

## 🆘 Troubleshooting

### "Cannot create engine"
→ Vérifiez que l'App ID est correct dans `agoraConfig.ts`

### "Permission denied"
→ Vérifiez les permissions caméra/micro dans les paramètres de l'app

### "No video showing"
→ Vérifiez que le vendeur a bien démarré son stream

### "Poor video quality"
→ Vérifiez la connexion internet (4G minimum recommandé)

### "Audio echoing"
→ Agora gère l'AEC automatiquement, redémarrez l'app

## 📞 Support

- **Documentation Agora** : https://docs.agora.io/
- **Community** : https://www.agora.io/en/community/
- **Support** : support@agora.io

## 🎊 Félicitations !

Vous avez maintenant un **système de Live Shopping vidéo complet** !

Les vendeurs Premium peuvent :
- 🎥 Streamer en HD
- 💬 Chatter en temps réel
- 🎁 Vendre leurs produits
- 📊 Voir les stats live

C'est la **killer feature** qui fait passer SenePanda au niveau supérieur ! 🚀
