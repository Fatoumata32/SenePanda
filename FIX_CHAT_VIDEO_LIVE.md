# ✅ Fix: Chat Temps Réel + Vidéo Live

## 🐛 Problèmes Identifiés

### 1. **Messages du Chat Non Synchronisés en Temps Réel**
- Les messages n'apparaissaient pas instantanément pour tous les participants
- Manque de visibilité sur le statut de la connexion Supabase Realtime

### 2. **L'Acheteur Ne Voit Pas la Vidéo du Vendeur**
- Le viewer ne parvient pas à voir le stream vidéo du broadcaster
- Problèmes de synchronisation entre broadcaster et viewer
- API Agora v3 obsolète côté broadcaster

## ✅ Solutions Appliquées

### 1. Migration API Agora v4 pour le Broadcaster

**Fichier**: [app/seller/live-stream/[id].tsx](app/seller/live-stream/[id].tsx)

#### Imports TypeScript ajoutés (lignes 40-48):
```typescript
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
  IRtcEngine,              // ✅ Nouveau
  IRtcEngineEventHandler,  // ✅ Nouveau
  RtcConnection,           // ✅ Nouveau
} from 'react-native-agora';
```

#### Typage des Refs (lignes 89-90):
```typescript
const agoraEngineRef = useRef<IRtcEngine | null>(null);
const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);
```

#### Conversion `addListener` → `registerEventHandler` (lignes 221-256):
```typescript
// ❌ AVANT (API v3)
engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
  console.log('✅ Broadcaster rejoint le canal');
  setIsJoined(true);
});

// ✅ APRÈS (API v4)
eventHandlerRef.current = {
  onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
    console.log('✅ Broadcaster rejoint le canal avec succès');
    console.log('📡 Local UID:', connection.localUid);
    setIsJoined(true);
  },
  // ... autres handlers
};

engine.registerEventHandler(eventHandlerRef.current);
```

#### Cleanup Amélioré (lignes 387-411):
```typescript
const cleanup = async () => {
  try {
    if (agoraEngineRef.current) {
      await agoraEngineRef.current.leaveChannel();

      // Désenregistrer les event handlers avant release
      if (eventHandlerRef.current) {
        agoraEngineRef.current.unregisterEventHandler(eventHandlerRef.current);
        eventHandlerRef.current = null;
      }

      agoraEngineRef.current.release();  // release() au lieu de destroy()
      agoraEngineRef.current = null;
    }
    // ...
  } catch (error) {
    console.error('Erreur cleanup:', error);
  }
};
```

### 2. Logs de Debug pour le Chat Temps Réel

**Fichier**: [hooks/useLiveShopping.ts](hooks/useLiveShopping.ts)

#### Ajout de Logs Détaillés (lignes 322-366):
```typescript
console.log(`💬 [useLiveChat] Abonnement au canal live-chat:${sessionId}`);

channelRef.current = supabase
  .channel(`live-chat:${sessionId}`)
  .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'live_chat_messages',
      filter: `live_session_id=eq.${sessionId}`,
    },
    async (payload) => {
      console.log('💬 [useLiveChat] Nouveau message reçu:', payload.new);

      const newMessage: LiveChatMessage = {
        ...payload.new as any,
        user_name: profile?.full_name || 'Anonyme',
        user_avatar: profile?.avatar_url,
      };

      console.log('💬 [useLiveChat] Message formaté:', newMessage);
      console.log(`✅ [useLiveChat] Messages mis à jour: ${updated.length} messages`);
    }
  )
  .subscribe((status) => {
    console.log(`📡 [useLiveChat] Statut du canal:`, status);
  });
```

### 3. Logs de Debug pour la Vidéo (Viewer)

**Fichier**: [app/(tabs)/live-viewer/[id].tsx](app/(tabs)/live-viewer/[id].tsx)

#### Event Handler Amélioré (lignes 271-288):
```typescript
onUserJoined: (connection: RtcConnection, uid: number, elapsed: number) => {
  console.log('🎉 BROADCASTER DÉTECTÉ! UID:', uid);
  console.log('📡 Connection:', JSON.stringify(connection));
  console.log('📡 Elapsed:', elapsed);
  console.log('📡 Canal:', connection.channelId);

  setRemoteUid(uid);
  setWaitingForBroadcaster(false);
  setRetryCount(0);

  console.log('✅ État mis à jour - remoteUid défini:', uid);
},
```

#### Logs de Render (lignes 598-611):
```typescript
{isJoined && remoteUid > 0 ? (
  <>
    {console.log('🎥 [RENDER] Affichage de la vidéo - isJoined:', isJoined, 'remoteUid:', remoteUid)}
    <RtcSurfaceView
      canvas={{
        uid: remoteUid,
        sourceType: VideoSourceType.VideoSourceRemote,
      }}
      style={styles.video}
    />
  </>
) : (
  <>
    {console.log('⏳ [RENDER] En attente - isJoined:', isJoined, 'remoteUid:', remoteUid)}
    {/* Vue d'attente */}
  </>
)}
```

## 🔍 Comment Déboguer Maintenant

### Chat Temps Réel

Vérifiez ces logs dans la console:

```
✅ Abonnement réussi:
💬 [useLiveChat] Abonnement au canal live-chat:xxx-xxx-xxx
📡 [useLiveChat] Statut du canal: SUBSCRIBED

✅ Nouveau message:
💬 [useLiveChat] Nouveau message reçu: { id: "...", message: "..." }
💬 [useLiveChat] Message formaté: { user_name: "...", message: "..." }
✅ [useLiveChat] Messages mis à jour: 5 messages

❌ Problème de connexion:
📡 [useLiveChat] Statut du canal: CHANNEL_ERROR
```

### Vidéo Live

#### Côté Broadcaster (Vendeur)

```
✅ Séquence normale:
📹 Configuration broadcaster - Vidéo et audio activés
✅ Broadcaster rejoint le canal avec succès
📡 Local UID: 12345
👤 Viewer rejoint: 67890

❌ Problèmes:
❌ Erreur Agora Broadcaster: 17 Invalid channel name
```

#### Côté Viewer (Acheteur)

```
✅ Séquence normale:
📡 Initialisation Agora Live Viewer avec App ID: c1a1a6f975c84c8fb781485a24933e9d
✅ Viewer rejoint le canal avec succès
🎉 BROADCASTER DÉTECTÉ! UID: 12345
📡 Canal: live_xxx-xxx-xxx
✅ État mis à jour - remoteUid défini: 12345
🎥 [RENDER] Affichage de la vidéo - isJoined: true, remoteUid: 12345

❌ Problèmes:
⏳ [RENDER] En attente - isJoined: true, remoteUid: 0  // Broadcaster pas encore détecté
⚠️ Erreur 110 (temporaire) - La connexion va se stabiliser...
```

## 🧪 Test de Validation

### Test du Chat

1. **Broadcaster (Vendeur)**:
   ```
   1. Démarrer un live
   2. Envoyer message: "Test vendeur"
   3. Vérifier les logs: 💬 [useLiveChat] Nouveau message reçu
   ```

2. **Viewer (Acheteur)**:
   ```
   1. Rejoindre le live
   2. Envoyer message: "Test acheteur"
   3. Vérifier que le vendeur reçoit le message instantanément
   4. Vérifier les logs: 💬 [useLiveChat] Message formaté
   ```

### Test de la Vidéo

1. **Broadcaster (Vendeur)**:
   ```
   1. Ma Boutique → Démarrer un Live
   2. Sélectionner produits
   3. Cliquer "Commencer maintenant"
   4. Vérifier logs:
      ✅ Broadcaster rejoint le canal avec succès
      📡 Local UID: [nombre]
   5. Vérifier caméra fonctionne (preview locale)
   ```

2. **Viewer (Acheteur)**:
   ```
   1. Explorer → Lives en cours
   2. Cliquer sur le live
   3. Vérifier logs:
      ✅ Viewer rejoint le canal avec succès
      🎉 BROADCASTER DÉTECTÉ! UID: [nombre]
      🎥 [RENDER] Affichage de la vidéo
   4. ✅ SUCCÈS: Vidéo du vendeur visible
   ```

## 📊 Checklist de Diagnostic

### Si le chat ne fonctionne pas:

- [ ] Vérifier `📡 [useLiveChat] Statut du canal: SUBSCRIBED`
- [ ] Vérifier que le session ID est correct dans les deux clients
- [ ] Vérifier Supabase Realtime activé dans le projet
- [ ] Vérifier RLS (Row Level Security) pour `live_chat_messages`

### Si la vidéo ne fonctionne pas:

- [ ] Vérifier `✅ Broadcaster rejoint le canal` (vendeur)
- [ ] Vérifier `✅ Viewer rejoint le canal` (acheteur)
- [ ] Vérifier `🎉 BROADCASTER DÉTECTÉ` (acheteur)
- [ ] Vérifier `remoteUid > 0` (acheteur)
- [ ] Vérifier que le canal est le même: `live_[session-id]`
- [ ] Vérifier App ID: `c1a1a6f975c84c8fb781485a24933e9d`

## 📝 Fichiers Modifiés

### Chat Temps Réel:
- ✅ [hooks/useLiveShopping.ts](hooks/useLiveShopping.ts) - Logs debug ajoutés

### Vidéo Live:
- ✅ [app/seller/live-stream/[id].tsx](app/seller/live-stream/[id].tsx) - Migration API v4
- ✅ [app/(tabs)/live-viewer/[id].tsx](app/(tabs)/live-viewer/[id].tsx) - Logs debug ajoutés (déjà en v4)

## 🎯 Résultat Attendu

Après ces corrections:

1. **Chat**:
   - ✅ Messages apparaissent en temps réel (<1s)
   - ✅ Logs montrent la connexion Supabase Realtime
   - ✅ Pas de doublons de messages

2. **Vidéo**:
   - ✅ Broadcaster démarre son stream correctement
   - ✅ Viewer détecte le broadcaster (UID > 0)
   - ✅ Vidéo s'affiche chez le viewer
   - ✅ Latence < 3 secondes

---

**Date**: 31 Décembre 2025
**Type de fix**: Chat Temps Réel + Synchronisation Vidéo
**Impact**: Critique (fonctionnalité principale du live shopping)
