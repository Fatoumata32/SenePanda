# 🔴 Corrections Live Viewer - Résumé

## Problèmes résolus

### 1. Erreur Agora -7 (Not Initialized)
**Cause:** L'SDK Agora n'était pas complètement initialisé avant d'appeler `joinChannel()`

**Solutions appliquées:**
- Ajout d'un délai de **500ms** après `initialize()` dans le viewer et le broadcaster
- Ajout d'un délai de **1 seconde** avant `joinChannel()`
- Flag `isEngineInitialized` pour éviter la double initialisation
- Flag `isJoining` pour éviter les appels simultanés à `joinChannel()`
- Gestion automatique de l'erreur -7 avec réinitialisation de l'engine

### 2. Message "Live terminé" affiché incorrectement
**Cause:** Le viewer affichait "Le vendeur a terminé ce live" même pour les sessions déjà terminées au chargement

**Solutions appliquées:**
- Ajout de `initialStatusChecked` pour distinguer le chargement initial des changements en temps réel
- Ajout de `previousStatus` pour détecter les vrais changements de statut
- Si le live était déjà terminé au chargement → affichage silencieux de l'écran de fin
- Si le live se termine pendant le visionnage → Alert + redirection

### 3. Realtime Supabase ne fonctionnait pas
**Cause:** Sans policy RLS SELECT, les utilisateurs ne reçoivent pas les updates realtime

**Solutions appliquées:**
- Script SQL `FIX_LIVE_REALTIME.sql` avec:
  - Activation du realtime pour toutes les tables live
  - Policies RLS pour permettre la lecture publique des sessions live
  - Policies pour chat, viewers, reactions, featured products

### 4. Multiples sessions reçues par le viewer
**Cause:** Les subscriptions realtime pouvaient recevoir des updates d'autres sessions

**Solutions appliquées:**
- Noms de channel uniques avec timestamp: `live-status-viewer-${id}-${Date.now()}`
- Vérification de l'ID dans le payload: `if (payload.new.id !== id) return;`
- Filtrage explicite par session ID dans les hooks

---

## Actions requises

### ⚠️ OBLIGATOIRE: Exécuter le script SQL

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez le contenu de `FIX_LIVE_REALTIME.sql`
3. Exécutez le script
4. Vérifiez que les policies sont créées (résultat affiché à la fin)

### Tester les corrections

```bash
# Terminal 1: Démarrer l'app
npx expo start --clear

# Téléphone vendeur: 
# 1. Aller dans Ma Boutique > Mes Lives > Créer un live
# 2. Appuyer sur "Démarrer" 
# 3. Vérifier les logs: "BROADCASTER REJOINT LE CANAL"

# Téléphone viewer:
# 1. Voir le live en page d'accueil
# 2. Appuyer dessus pour rejoindre
# 3. Vérifier les logs: "joinChannel result: 0" (pas -7!)
# 4. Attendre "VIEWER REJOINT LE CANAL" puis "BROADCASTER DÉTECTÉ"
```

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `app/(tabs)/live-viewer/[id].tsx` | Flags d'init, délais, gestion statut initial |
| `app/seller/live-stream/[id].tsx` | Flag d'init, délais |
| `hooks/useLiveShopping.ts` | Noms de channel uniques, vérification ID |
| `FIX_LIVE_REALTIME.sql` | Script complet avec RLS policies |

---

## Logs à vérifier

### ✅ Broadcaster (vendeur)
```
🎥 [BROADCASTER] Configuration Agora...
🎥 [BROADCASTER] Initialize result: 0
✅ [BROADCASTER] Engine initialisé
✅ Broadcaster rejoint le canal avec succès
📡 Connection info: {"channelId":"live_xxx","localUid":123}
```

### ✅ Viewer
```
🎥 [VIEWER] Configuration Agora...
✅ [VIEWER] Engine initialisé
📡 TENTATIVE DE CONNEXION AU CANAL AGORA
📡 Canal: live_xxx
✅ joinChannel result: 0
✅✅✅ VIEWER REJOINT LE CANAL AVEC SUCCÈS ✅✅✅
🎉🎉🎉 BROADCASTER DÉTECTÉ! UID: 123 🎉🎉🎉
```

### ❌ Erreurs à surveiller
```
❌ Erreur -7: Engine non initialisé  → Le SDK n'est pas prêt
❌ Erreur 110: Connection failed     → Canal pas encore créé (temporaire)
❌ Erreur 17: Invalid channel name   → Nom de canal incorrect
```

---

## Architecture du flux

```
VENDEUR                                    VIEWER
   │                                          │
   │ setupAgoraEngine()                       │
   │ ↓                                        │
   │ initialize() + wait 500ms               │
   │ ↓                                        │
   │ isEngineInitialized = true              │
   │ ↓                                        │
   │ startLiveStream()                        │
   │ ↓                                        │
   │ joinChannel("live_xxx")                  │
   │ ↓                                        │
   │ UPDATE live_sessions SET status='live'   │
   │ ─────────────────────────────────────►   │
   │                              📡 Realtime │
   │                                          │ refreshSession()
   │                                          │ ↓
   │                                          │ session.status = 'live'
   │                                          │ ↓
   │                                          │ joinChannel("live_xxx")
   │                                          │ ↓
   │                              ◄───────────│ onUserJoined
   │ onUserJoined ────────────────►           │
   │                                          │ setRemoteUid(uid)
   │                                          │ ↓
   │                                          │ 🎥 Vidéo affichée!
```
