# 🚀 Quick Start - Test du Live Shopping

## ⚡ Test Rapide (5 minutes)

### Prérequis
- 📱 2 appareils avec l'app installée
- 👤 2 comptes: 1 vendeur + 1 acheteur
- 📶 Connexion Internet stable

### Étape 1: Démarrer le Serveur (1 min)
```bash
cd c:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project
npx expo start --clear
```

### Étape 2: Vendeur Lance le Live (2 min)
```
1. Ouvrir l'app sur appareil 1
2. Se connecter comme VENDEUR
3. Onglet "Ma Boutique"
4. Bouton "Démarrer un Live"
5. Titre: "Test Live"
6. Sélectionner 2 produits
7. "Créer le live"
8. "Commencer maintenant"
9. ✅ Attendre alert "🔴 Live démarré !"
```

### Étape 3: Acheteur Rejoint (1 min)
```
1. Ouvrir l'app sur appareil 2
2. Se connecter comme ACHETEUR
3. Onglet "Explorer" ou "Lives"
4. Cliquer sur le live avec badge LIVE
5. ✅ Vérifier: Vidéo du vendeur visible
```

### Étape 4: Test Chat (1 min)
```
VENDEUR:
1. Taper "Bonjour !" → Envoyer
2. ✅ Vérifier message apparaît

ACHETEUR:
1. Taper "Salut !" → Envoyer
2. ✅ Vérifier vendeur reçoit le message
3. ✅ Vérifier délai < 1 seconde
```

### Étape 5: Test Interactions
```
ACHETEUR:
1. Cliquer bouton ❤️
   ✅ Sentir vibration
   ✅ Voir animation

2. Double-taper sur vidéo
   ✅ Grand cœur apparaît

3. Cliquer icône 🛒
   ✅ Panneau produits slide vers haut
```

---

## 📊 Checklist Express

### ✅ Succès Total
- [x] Vidéo vendeur visible < 3s
- [x] Chat synchronisé < 1s
- [x] Réactions avec vibrations
- [x] Double-tap fonctionne
- [x] Panneau produits fluide

### ❌ Problèmes Possibles

#### Vidéo ne s'affiche pas
```bash
# Console acheteur - Chercher:
🎉 BROADCASTER DÉTECTÉ! UID: [nombre]
🎥 [RENDER] Affichage de la vidéo

# Si absent:
1. Vendeur: Vérifier badge LIVE rouge pulse
2. Acheteur: Fermer et rouvrir le live
3. Vérifier même session ID dans les deux consoles
```

#### Chat ne synchronise pas
```bash
# Console - Chercher:
📡 [useLiveChat] Statut du canal: SUBSCRIBED

# Si "CHANNEL_ERROR":
1. Vérifier Supabase Realtime activé
2. Vérifier RLS table live_chat_messages
```

---

## 🔍 Logs à Surveiller

### Console Vendeur (Broadcaster)
```
✅ Succès:
📹 Configuration broadcaster - Vidéo et audio activés
✅ Broadcaster rejoint le canal avec succès
📡 Local UID: 12345
✅ Live démarré avec succès !

❌ Erreur:
❌ Erreur Agora Broadcaster: 17 Invalid channel name
```

### Console Acheteur (Viewer)
```
✅ Succès:
✅ Viewer rejoint le canal avec succès
🎉 BROADCASTER DÉTECTÉ! UID: 12345
🎥 [RENDER] Affichage de la vidéo - isJoined: true, remoteUid: 12345

❌ Erreur:
⏳ [RENDER] En attente - isJoined: true, remoteUid: 0
```

---

## 🎬 Commandes Utiles

### Redémarrer Proprement
```bash
# Ctrl+C dans le terminal
# Puis:
npx expo start --clear
```

### Voir Logs en Temps Réel
```bash
# Appareils Android:
adb logcat | grep -E "LiveChat|Agora|RENDER"

# Ou dans Expo:
# Appuyer sur 'j' pour ouvrir debugger
```

### Build Development (Si Expo Go ne fonctionne pas)
```bash
eas build --profile development --platform android
# Installer le fichier .apk sur les appareils
```

---

## 📱 Config Appareils

### Permissions Requises
```
✅ Caméra (vendeur)
✅ Microphone (vendeur)
✅ Internet
```

### Vérifier Permissions
```bash
# Android
Settings → Apps → VotreApp → Permissions
```

---

## ⚙️ Config Agora

### Infos Actuelles
```
App ID: c1a1a6f975c84c8fb781485a24933e9d
Certificate: ae54b69729dd48ebbd7b064acd5ec0de
API Version: v4
```

### Fichier Config
```bash
# lib/agoraConfig.ts
export const AGORA_APP_ID = 'c1a1a6f975c84c8fb781485a24933e9d';
export const AGORA_APP_CERTIFICATE = 'ae54b69729dd48ebbd7b064acd5ec0de';
```

---

## 🆘 Aide Rapide

### Problème Build
```bash
# Nettoyer tout:
rm -rf node_modules
npm install
npx expo start --clear
```

### Problème Agora "Module non lié"
```bash
# Vous êtes sur Expo Go
# Solution: Build Development
eas build --profile development --platform android
```

### Supabase Realtime Offline
```bash
# Dashboard Supabase:
Settings → API → Realtime: Enable
```

---

## 📚 Documentation Complète

Pour plus de détails:
- 📖 **Tests Complets**: `TEST_LIVE_COMPLET.md`
- 🔧 **Debug Chat/Vidéo**: `FIX_CHAT_VIDEO_LIVE.md`
- 📝 **Résumé Corrections**: `RESUME_CORRECTIONS_LIVE.md`

---

## 💡 Tips

### Performance
```
✅ Fermer apps inutiles
✅ Wifi stable (pas 4G si possible)
✅ Batterie > 50%
✅ Pas de VPN actif
```

### Debugging
```
✅ Console ouverte pendant test
✅ Noter les logs d'erreur
✅ Screenshot si problème
✅ Tester sur réseau stable
```

---

**Temps Total**: ~5 minutes
**Difficulté**: ⭐⭐☆☆☆ (Facile)
**Prérequis**: 2 appareils + 2 comptes

🎉 **Bonne chance avec votre test!**
