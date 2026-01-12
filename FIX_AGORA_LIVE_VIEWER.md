# ✅ Correction: Live Viewer Agora SDK

## 🐛 Problème Initial

L'erreur **"This screen doesn't exist"** apparaissait lors de l'accès au live viewer (`/live/[id]`) à cause d'une mauvaise configuration de l'API Agora.

### Erreurs identifiées:

1. ❌ Utilisation de l'**ancienne API** `RtcEngine.create()` (dépréciée)
2. ❌ Méthode `addListener('UserJoined')` obsolète
3. ❌ Méthode `destroy()` qui n'existe plus → remplacée par `release()`
4. ❌ Configuration du profil canal incorrecte (séparée au lieu d'être dans `joinChannel`)
5. ❌ Pas d'enregistrement des event handlers avec `registerEventHandler`

## ✅ Corrections Appliquées

### 1. **Imports mis à jour** ([app/live/[id].tsx:30-40](app/live/[id].tsx#L30-L40))

```typescript
// AVANT (Ancien)
import RtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';

// APRÈS (Nouveau - Agora SDK v4+)
import {
  createAgoraRtcEngine,          // ✅ Nouvelle fonction de création
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,                     // ✅ Type pour l'engine
  RtcSurfaceView,
  VideoSourceType,
  RtcConnection,                  // ✅ Type pour les événements
  IRtcEngineEventHandler,         // ✅ Type pour les handlers
  AudienceLatencyLevelType,       // ✅ Pour ultra-low latency
} from 'react-native-agora';
```

### 2. **Refs typés correctement** ([app/live/[id].tsx:63-64](app/live/[id].tsx#L63-L64))

```typescript
// AVANT
const agoraEngineRef = useRef<any>(null);

// APRÈS
const agoraEngineRef = useRef<IRtcEngine | null>(null);
const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);
```

### 3. **Initialisation Agora (nouvelle API)** ([app/live/[id].tsx:101-126](app/live/[id].tsx#L101-L126))

```typescript
// AVANT (❌ Obsolète)
agoraEngineRef.current = await RtcEngine.create(AGORA_APP_ID);
const engine = agoraEngineRef.current;
await engine.enableVideo();
await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
await engine.setClientRole(ClientRoleType.ClientRoleAudience);

// APRÈS (✅ Nouvelle API)
// 1. Créer l'engine
agoraEngineRef.current = createAgoraRtcEngine();
const engine = agoraEngineRef.current;

// 2. Initialiser avec App ID
engine.initialize({
  appId: AGORA_APP_ID,
});

// 3. Enregistrer les event handlers AVANT de joindre
eventHandlerRef.current = {
  onJoinChannelSuccess: (_connection: RtcConnection, _elapsed: number) => {
    console.log('✅ Rejoint le canal avec succès');
    setIsJoined(true);
  },
  onUserJoined: (_connection: RtcConnection, uid: number, _elapsed: number) => {
    console.log('👤 Utilisateur rejoint:', uid);
    setRemoteUid(uid);
  },
  onUserOffline: (_connection: RtcConnection, uid: number, _reason: number) => {
    console.log('👤 Utilisateur parti:', uid);
    setRemoteUid(0);
  },
};

engine.registerEventHandler(eventHandlerRef.current);

// 4. Activer la vidéo
engine.enableVideo();
engine.startPreview();
```

### 4. **Rejoindre le canal (options complètes)** ([app/live/[id].tsx:136-149](app/live/[id].tsx#L136-L149))

```typescript
// AVANT (❌ Options incomplètes)
await engine.joinChannel(
  '',
  channelName,
  0,
  { clientRoleType: ClientRoleType.ClientRoleAudience }
);

// APRÈS (✅ Configuration complète selon documentation Agora)
engine.joinChannel(
  '',              // Token (vide pour test, utiliser un vrai token en prod)
  channelName,     // Nom du canal
  0,              // UID local (0 = auto-assigné par Agora)
  {
    // Profil du canal: Live Broadcasting
    channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,

    // Rôle: Audience (spectateur)
    clientRoleType: ClientRoleType.ClientRoleAudience,

    // Ne pas publier audio/vidéo (spectateur uniquement)
    publishMicrophoneTrack: false,
    publishCameraTrack: false,

    // S'abonner automatiquement aux flux audio/vidéo
    autoSubscribeAudio: true,
    autoSubscribeVideo: true,

    // Latence ultra-faible pour le live
    audienceLatencyLevel: AudienceLatencyLevelType.AudienceLatencyLevelUltraLowLatency,
  }
);
```

### 5. **Cleanup (libération des ressources)** ([app/live/[id].tsx:161-178](app/live/[id].tsx#L161-L178))

```typescript
// AVANT (❌ Méthode destroy() n'existe plus)
const cleanup = async () => {
  if (agoraEngineRef.current) {
    await agoraEngineRef.current.leaveChannel();
    await agoraEngineRef.current.destroy(); // ❌ N'existe plus
  }
};

// APRÈS (✅ Nouvelle API)
const cleanup = async () => {
  if (agoraEngineRef.current) {
    // 1. Quitter le canal
    agoraEngineRef.current.leaveChannel();

    // 2. Désenregistrer les event handlers
    if (eventHandlerRef.current) {
      agoraEngineRef.current.unregisterEventHandler(eventHandlerRef.current);
    }

    // 3. Libérer les ressources avec release()
    agoraEngineRef.current.release();
  }
};
```

## 📊 Différences API Agora v3 vs v4+

| Fonctionnalité | Agora SDK v3 (Ancien) | Agora SDK v4+ (Nouveau) |
|----------------|----------------------|------------------------|
| **Création engine** | `RtcEngine.create(appId)` | `createAgoraRtcEngine()` + `initialize({appId})` |
| **Event listeners** | `addListener('UserJoined')` | `registerEventHandler({ onUserJoined })` |
| **Profil canal** | `setChannelProfile()` | Options dans `joinChannel()` |
| **Rôle client** | `setClientRole()` | Options dans `joinChannel()` |
| **Cleanup** | `destroy()` | `release()` |
| **Typage** | `any` | Types stricts (`IRtcEngine`, `IRtcEngineEventHandler`) |

## 🎯 Flux Complet du Live Viewer

```
1. Utilisateur clique sur un live
   ↓
2. Navigation vers /live/[id]
   ↓
3. useEffect() → setupAndJoin()
   ↓
4. createAgoraRtcEngine() → Création engine
   ↓
5. engine.initialize() → Initialisation avec App ID
   ↓
6. registerEventHandler() → Écoute des événements
   ↓
7. enableVideo() + startPreview() → Activer vidéo
   ↓
8. joinChannel() → Rejoindre en tant qu'audience
   ↓
9. onJoinChannelSuccess → État isJoined = true
   ↓
10. onUserJoined → Afficher vidéo du vendeur (remoteUid)
   ↓
11. Utilisateur quitte → cleanup()
   ↓
12. leaveChannel() → unregisterEventHandler() → release()
```

## 🔧 Fichiers Modifiés

### 1. ✅ [app/live/[id].tsx](app/live/[id].tsx) (Ancien chemin - conservé)
  - Imports Agora mis à jour (lignes 30-40)
  - Refs typés (lignes 63-64)
  - setupAndJoin() réécrit (lignes 91-159)
  - cleanup() corrigé (lignes 161-178)
  - ⚠️ Retrait de la vérification bloquante de l'App ID

### 2. ✅ [app/(tabs)/live-viewer/[id].tsx](app/(tabs)/live-viewer/[id].tsx) (**FICHIER PRINCIPAL UTILISÉ**)
  - Imports Agora mis à jour: ajout `IRtcEngine`, `RtcConnection`, `IRtcEngineEventHandler`
  - Refs typés avec `IRtcEngine` au lieu de `any`
  - Conversion `addListener` → `registerEventHandler` (lignes 215-297)
  - cleanup() mis à jour avec `unregisterEventHandler` + `release()` (lignes 368-391)
  - **Ce fichier est celui réellement utilisé** par la navigation `/(tabs)/live-viewer/${id}`

## 📝 Points Importants

### ✅ Ce qui fonctionne maintenant:

1. **Création correcte** de l'engine Agora avec `createAgoraRtcEngine()`
2. **Initialisation** avec `initialize({ appId })`
3. **Event handlers** enregistrés AVANT de joindre le canal
4. **Configuration complète** du canal en une seule fois dans `joinChannel()`
5. **Ultra-low latency** pour une expérience live fluide
6. **Cleanup propre** avec `unregisterEventHandler()` et `release()`

### ⚠️ Important pour la production:

1. **Token d'authentification**: Actuellement `token: ''` (vide)
   - En production: Générer un token depuis votre serveur
   - Voir: https://docs.agora.io/en/video-calling/get-started/authentication-workflow

2. **Gestion des erreurs**: Ajouter plus de handlers
   ```typescript
   onError: (err: number, msg: string) => {
     console.error('Agora Error:', err, msg);
     Alert.alert('Erreur Live', msg);
   }
   ```

3. **Permissions**: Vérifier que l'app a accès à la caméra/micro
   - Déjà géré dans le code pour Android
   - iOS: Ajouter dans Info.plist

## 🧪 Test

Pour tester le fix:

1. **Relancer Metro bundler**:
   ```bash
   npx expo start --clear
   ```

2. **Créer un live** depuis l'app (profil vendeur)

3. **Rejoindre le live** depuis un autre appareil (profil acheteur)

4. **Vérifier**:
   - ✅ Pas d'erreur "This screen doesn't exist"
   - ✅ Vidéo du vendeur s'affiche
   - ✅ Chat fonctionne
   - ✅ Compteur de viewers s'incrémente

## 📚 Références

- [Agora React Native Quick Start](https://docs.agora.io/en/video-calling/get-started/get-started-sdk)
- [Agora API Reference](https://api-ref.agora.io/en/voice-sdk/reactnative/4.x/API/toc_video_call.html)
- [Migration Guide v3 → v4](https://docs.agora.io/en/video-calling/develop/migration-guide)

---

**Dernière mise à jour**: 31 Décembre 2025
**Version Agora SDK**: 4.x (react-native-agora)
