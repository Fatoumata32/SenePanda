# Correction des problèmes de connexion Agora Live Viewer

## Problèmes identifiés

### 1. Erreur -7 (Not Initialized)
Le SDK Agora n'était pas complètement initialisé avant les appels à `joinChannel`.

### 2. Appels multiples à joinChannel
Les boucles de polling et de reconnexion causaient des appels répétitifs à `joinChannel` qui corrompaient l'état de l'engine.

### 3. Confusion entre sessions
Le viewer recevait des updates de plusieurs sessions différentes via le realtime Supabase.

## Corrections appliquées

### Viewer (`app/(tabs)/live-viewer/[id].tsx`)

1. **Flags de protection**
   - `isEngineInitialized` : évite la double initialisation de l'engine
   - `isJoining` : évite les appels simultanés à `joinChannel`

2. **Délais d'initialisation**
   - Attente de 500ms après `engine.initialize()` 
   - Attente de 1s supplémentaire avant `joinChannel`

3. **Gestion de l'erreur -7**
   - Détection de l'erreur dans `onError` et dans le résultat de `joinChannel`
   - Réinitialisation automatique de l'engine en cas d'erreur -7

4. **Réduction du polling**
   - Reconnexion : toutes les 10s (au lieu de 5s), max 6 tentatives
   - Statut session : toutes les 5s (au lieu de 3s)

5. **Vérification des IDs de session**
   - Double vérification dans les listeners realtime pour ignorer les sessions non demandées

### Broadcaster (`app/seller/live-stream/[id].tsx`)

1. **Flag `isEngineInitialized`** pour éviter la double initialisation
2. **Attente de 500ms** après `initialize()` 
3. **Reset du flag** dans `cleanup()`

### Hook (`hooks/useLiveShopping.ts`)

1. **Nom de canal unique** avec timestamp pour éviter les conflits
2. **Vérification de l'ID** dans les payloads realtime

## Comment tester

1. **Démarrer le serveur**
```bash
npx expo start --clear
```

2. **Sur le téléphone vendeur** :
   - Aller dans "Mes Lives"
   - Créer ou ouvrir un live
   - Appuyer sur "Commencer le live"
   - Vérifier les logs : `✅ [BROADCASTER] Engine initialisé`

3. **Sur le téléphone viewer** :
   - Rejoindre le live depuis la page d'accueil
   - Vérifier les logs :
     - `✅ Engine initialisé avec succès`
     - `joinChannel result: 0` (PAS -7)
     - `✅✅✅ VIEWER REJOINT LE CANAL AVEC SUCCÈS ✅✅✅`
     - `🎉🎉🎉 BROADCASTER DÉTECTÉ!`

## Codes d'erreur Agora courants

| Code | Signification | Action |
|------|---------------|--------|
| 0 | Succès | - |
| -2 | Invalid argument | Vérifier les paramètres |
| -3 | Not ready | Attendre que l'engine soit prêt |
| -7 | Not initialized | Réinitialiser l'engine |
| 17 | Invalid channel name | Vérifier le nom du canal |
| 110 | Connection failed | Réessayer après un délai |

## Configuration Supabase Realtime

Si le realtime ne fonctionne pas, exécutez dans Supabase SQL Editor :

```sql
-- Activer le realtime pour live_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

-- Vérifier
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## Flux de connexion attendu

```
[Viewer] Permissions accordées
[Viewer] Configuration Agora...
[Viewer] Initialize result: 0
[Viewer] Engine initialisé avec succès
[Viewer] Attente avant joinChannel...
[Viewer] TENTATIVE DE CONNEXION AU CANAL AGORA
[Viewer] joinChannel result: 0
[Viewer] ✅✅✅ VIEWER REJOINT LE CANAL AVEC SUCCÈS ✅✅✅
[Viewer] 🎉🎉🎉 BROADCASTER DÉTECTÉ! UID: xxxxx 🎉🎉🎉
[Viewer] 🎥🎥🎥 PREMIÈRE FRAME VIDÉO REÇUE!
```
