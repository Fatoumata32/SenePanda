# 🧪 Guide de Test Complet - Live Shopping

## 🎯 Objectif

Tester complètement le système de live shopping après les corrections:
- ✅ Chat temps réel entre vendeur et acheteurs
- ✅ Vidéo du vendeur visible par les acheteurs
- ✅ Réactions en temps réel
- ✅ Produits en vedette

## 📱 Configuration Requise

### Matériel Nécessaire
- 📱 **2 appareils physiques** (ou 1 physique + 1 émulateur)
  - Appareil 1: Vendeur (avec caméra)
  - Appareil 2: Acheteur
- 📶 Connexion Internet stable
- 🎥 Permissions caméra et micro accordées

### Comptes Utilisateurs
- 👤 Compte Vendeur (avec boutique configurée)
- 👤 Compte Acheteur (profil normal)

## 🚀 Test Étape par Étape

### Phase 1: Préparation du Live (Vendeur)

#### Étape 1.1: Créer une Session Live
```bash
1. Se connecter comme VENDEUR
2. Aller dans l'onglet "Ma Boutique"
3. Cliquer sur "Démarrer un Live"
4. Remplir:
   - Titre: "Test Live Shopping"
   - Description: "Test de la fonctionnalité"
5. Sélectionner 2-3 produits
6. Cliquer "Créer le live"
```

**✅ Résultat Attendu:**
- Live créé avec statut "preparation"
- Redirection vers `/seller/start-live`

#### Étape 1.2: Démarrer le Live
```bash
1. Sur la page de préparation
2. Vérifier que la preview caméra fonctionne
3. Cliquer "Commencer maintenant"
4. Attendre 4-5 secondes
```

**📊 Logs à Vérifier (Console Vendeur):**
```
📹 Configuration broadcaster - Vidéo et audio activés
📡 Démarrage du live - Canal: live_xxx-xxx-xxx
✅ Preview démarrée
🔗 Rejoindre le canal Agora...
✅ joinChannel appelé
✅ Broadcaster rejoint le canal avec succès
📡 Local UID: [nombre]
💾 Mise à jour de la session en BDD (passage à LIVE)
✅ Live démarré avec succès !
```

**✅ Résultat Attendu:**
- Alert "🔴 Live démarré !"
- Badge "LIVE" rouge qui pulse
- Preview vidéo visible
- Statut session = "live" en BDD

### Phase 2: Rejoindre le Live (Acheteur)

#### Étape 2.1: Trouver le Live
```bash
1. Se connecter comme ACHETEUR (autre appareil)
2. Aller dans l'onglet "Explorer" ou "Lives"
3. Voir le live en cours avec badge LIVE
4. Cliquer sur le live
```

**✅ Résultat Attendu:**
- Live apparaît dans la liste des lives actifs
- Thumbnail + titre + nom vendeur visibles
- Badge "🔴 LIVE" affiché

#### Étape 2.2: Voir la Vidéo du Vendeur
```bash
1. Attendre 2-3 secondes après avoir ouvert le live
2. La vidéo du vendeur devrait s'afficher
```

**📊 Logs à Vérifier (Console Acheteur):**
```
🎥 Configuration Agora Viewer...
📡 Initialisation Agora Live Viewer avec App ID: c1a1a6f975c84c8fb781485a24933e9d
📡 Rejoindre le canal: live_xxx-xxx-xxx
✅ Commande join envoyée avec succès
✅ Viewer rejoint le canal avec succès
📡 Local UID: [nombre]
🎉 BROADCASTER DÉTECTÉ! UID: [nombre]
📡 Connection: {...}
📡 Canal: live_xxx-xxx-xxx
✅ État mis à jour - remoteUid défini: [nombre]
🎥 [RENDER] Affichage de la vidéo - isJoined: true, remoteUid: [nombre]
```

**✅ Résultat Attendu:**
- ✅ Vidéo du vendeur visible en plein écran
- ✅ Pas de message "En attente du vendeur"
- ✅ Interface fluide et réactive

**❌ Si la vidéo ne s'affiche pas:**
```
Vérifier:
1. Log: "🎉 BROADCASTER DÉTECTÉ" présent?
   - ❌ Non → Le vendeur n'a peut-être pas démarré correctement
   - ✅ Oui → Vérifier remoteUid > 0

2. Log: "🎥 [RENDER] Affichage de la vidéo"
   - ❌ Non → Problème de state (isJoined ou remoteUid)
   - ✅ Oui → Problème d'affichage RtcSurfaceView

3. Vérifier que les deux utilisent le même canal
   - Vendeur: "live_xxx-xxx-xxx"
   - Acheteur: "live_xxx-xxx-xxx"
   - Doivent être IDENTIQUES
```

### Phase 3: Test du Chat en Temps Réel

#### Étape 3.1: Message du Vendeur
```bash
VENDEUR:
1. En bas de l'écran, taper "Bonjour tout le monde !"
2. Appuyer sur Envoyer (icône avion)
3. Vérifier que le message apparaît immédiatement
```

**📊 Logs à Vérifier (Console Vendeur):**
```
💬 [useLiveChat] Abonnement au canal live-chat:xxx-xxx-xxx
📡 [useLiveChat] Statut du canal: SUBSCRIBED
💬 [useLiveChat] Nouveau message reçu: { message: "Bonjour tout le monde !" }
✅ [useLiveChat] Messages mis à jour: 1 messages
```

#### Étape 3.2: Message de l'Acheteur
```bash
ACHETEUR:
1. En bas de l'écran, taper "Bonjour !"
2. Appuyer sur Envoyer
3. Vérifier que le message apparaît
```

**📊 Logs à Vérifier (Console Acheteur):**
```
💬 [useLiveChat] Nouveau message reçu: { message: "Bonjour !" }
💬 [useLiveChat] Message formatté: { user_name: "[Nom]", message: "Bonjour !" }
✅ [useLiveChat] Messages mis à jour: 2 messages
```

#### Étape 3.3: Synchronisation Temps Réel
```bash
1. VENDEUR envoie: "Message 1"
2. Vérifier que ACHETEUR le voit instantanément (<1 seconde)
3. ACHETEUR envoie: "Message 2"
4. Vérifier que VENDEUR le voit instantanément (<1 seconde)
```

**✅ Résultat Attendu:**
- ✅ Messages apparaissent en <1 seconde
- ✅ Ordre chronologique respecté
- ✅ Pas de doublons
- ✅ Nom d'utilisateur correct affiché
- ✅ Auto-scroll vers le dernier message

**❌ Si le chat ne fonctionne pas:**
```
1. Vérifier Log: "📡 [useLiveChat] Statut du canal: SUBSCRIBED"
   - Si "CHANNEL_ERROR" → Problème Supabase Realtime
   - Vérifier que Realtime est activé dans Supabase

2. Vérifier que sessionId est le même pour les deux
   - Console vendeur: "live-chat:xxx-xxx-xxx"
   - Console acheteur: "live-chat:xxx-xxx-xxx"

3. Vérifier RLS Supabase pour live_chat_messages
   - SELECT: permettre à tous les utilisateurs authentifiés
   - INSERT: permettre à tous les utilisateurs authentifiés
```

### Phase 4: Test des Réactions en Temps Réel

#### Étape 4.1: Envoyer une Réaction (Acheteur)
```bash
ACHETEUR:
1. Cliquer sur le bouton ❤️ (cœur)
2. Sentir la vibration haptique
3. Voir l'animation du cœur
```

**✅ Résultat Attendu:**
- ✅ Vibration haptique (Medium intensity)
- ✅ Animation spring fluide du cœur montant
- ✅ Réaction visible pendant ~2 secondes

#### Étape 4.2: Double-Tap pour Liker
```bash
ACHETEUR:
1. Double-taper rapidement sur la vidéo
2. Voir le grand cœur apparaître au centre
```

**✅ Résultat Attendu:**
- ✅ Grand cœur rouge (100px) au centre
- ✅ Animation scale de 0 à 1.5
- ✅ Fade out après ~1 seconde
- ✅ Réaction ❤️ envoyée automatiquement

#### Étape 4.3: Tester Autres Réactions
```bash
ACHETEUR:
1. 🔥 Fire → Vibration Heavy
2. 👏 Clap → Vibration Light
3. ⭐ Star → Vibration Light
4. 🛒 Cart → Vibration Light
```

**✅ Résultat Attendu:**
- ✅ Chaque réaction a une vibration différente
- ✅ Animations fluides avec spring
- ✅ Pas de lag

### Phase 5: Test des Produits en Vedette

#### Étape 5.1: Afficher les Produits (Acheteur)
```bash
ACHETEUR:
1. Cliquer sur l'icône 🛒 (panier) en bas à droite
2. Le panneau produits doit slider vers le haut
```

**✅ Résultat Attendu:**
- ✅ Animation slide fluide (300px translateY)
- ✅ Spring animation (friction: 8, tension: 40)
- ✅ Fade in avec opacity
- ✅ Liste des produits en vedette visible

#### Étape 5.2: Fermer les Produits
```bash
ACHETEUR:
1. Cliquer sur "✕" dans le panneau produits
2. Le panneau doit slider vers le bas
```

**✅ Résultat Attendu:**
- ✅ Animation slide inverse (vers le bas)
- ✅ Fade out
- ✅ Retour fluide

### Phase 6: Test de Performance

#### Étape 6.1: Envoi Multiple de Messages
```bash
1. ACHETEUR envoie 20 messages rapidement
2. VENDEUR envoie 20 messages rapidement
```

**✅ Résultat Attendu:**
- ✅ Tous les messages apparaissent
- ✅ Pas de freeze de l'interface
- ✅ FlatList scroll fluide (60 FPS)
- ✅ Limite à 50 messages appliquée

#### Étape 6.2: Scroll Manuel du Chat
```bash
ACHETEUR:
1. Scroller manuellement vers le haut dans le chat
2. Attendre 3 secondes
3. Un nouveau message arrive
```

**✅ Résultat Attendu:**
- ✅ Auto-scroll désactivé pendant le scroll manuel
- ✅ Auto-scroll réactivé après 3 secondes d'inactivité
- ✅ Pas de jump désagréable

### Phase 7: Test de Déconnexion/Reconnexion

#### Étape 7.1: Vendeur Quitte Temporairement
```bash
VENDEUR:
1. Minimiser l'app (Home button)
2. Attendre 5 secondes
3. Revenir dans l'app
```

**📊 Logs à Vérifier (Console Acheteur):**
```
👤 Vendeur quitté: [UID] raison: [reason]
⏳ [RENDER] En attente - isJoined: true, remoteUid: 0
```

**✅ Résultat Attendu:**
- ✅ Message "En attente du vendeur..." s'affiche
- ✅ Connexion rétablie automatiquement au retour
- ✅ Vidéo reprend

#### Étape 7.2: Acheteur Quitte et Rejoint
```bash
ACHETEUR:
1. Cliquer sur "←" (retour)
2. Rejoindre immédiatement le live
```

**✅ Résultat Attendu:**
- ✅ Reconnexion rapide (<3 secondes)
- ✅ Historique des 50 derniers messages chargé
- ✅ Vidéo reprend

### Phase 8: Terminer le Live

#### Étape 8.1: Vendeur Termine
```bash
VENDEUR:
1. Cliquer sur l'icône téléphone rouge (Terminer)
2. Confirmer "Terminer le live"
```

**📊 Logs à Vérifier (Console Vendeur):**
```
🔴 Arrêt du live...
🔴 Cleanup: Terminer le live
```

**✅ Résultat Attendu:**
- ✅ Statut session passe à "ended" en BDD
- ✅ Canal Agora fermé
- ✅ Redirection vers "Mes Lives"

#### Étape 8.2: Acheteur Voit la Fin
```bash
ACHETEUR:
1. Automatiquement, voir l'écran "Live terminé"
2. Message: "Ce live shopping est maintenant terminé"
```

**✅ Résultat Attendu:**
- ✅ Icône Sparkles affichée
- ✅ Message clair
- ✅ Bouton "Retour à l'accueil" fonctionnel

## 📊 Checklist Complète

### Vidéo
- [ ] Vendeur voit sa preview avant de démarrer
- [ ] Acheteur voit la vidéo du vendeur en <3 secondes
- [ ] Vidéo fluide sans freeze
- [ ] Latence acceptable (<3 secondes)
- [ ] Reconnexion automatique après interruption

### Chat
- [ ] Messages apparaissent en temps réel (<1 seconde)
- [ ] Ordre chronologique respecté
- [ ] Pas de doublons
- [ ] Noms d'utilisateurs corrects
- [ ] Auto-scroll intelligent
- [ ] Scroll manuel respecté

### Réactions
- [ ] Feedback haptique fonctionnel
- [ ] Animations fluides (spring)
- [ ] Double-tap pour liker fonctionne
- [ ] Intensités haptiques différenciées

### Produits
- [ ] Panneau slide avec animation fluide
- [ ] Liste des produits visible
- [ ] Fermeture fluide

### Performance
- [ ] Pas de lag avec 50 messages
- [ ] FlatList scroll fluide
- [ ] Mémoire stable
- [ ] Pas de crash

## 🐛 Problèmes Courants et Solutions

### Problème 1: "Vidéo ne s'affiche pas"

**Symptômes:**
- Acheteur voit "En attente du vendeur..." indéfiniment
- Log: `⏳ [RENDER] En attente - isJoined: true, remoteUid: 0`

**Solutions:**
```bash
1. Vérifier que le vendeur a bien démarré (badge LIVE rouge pulse)
2. Vérifier les logs vendeur:
   ✅ "Broadcaster rejoint le canal avec succès"
3. Vérifier même canal:
   - Vendeur: live_[session-id]
   - Acheteur: live_[session-id]
4. Redémarrer le live (vendeur termine et redémarre)
```

### Problème 2: "Chat ne synchronise pas"

**Symptômes:**
- Messages n'apparaissent pas chez l'autre utilisateur
- Log: `CHANNEL_ERROR`

**Solutions:**
```bash
1. Vérifier Supabase Realtime activé:
   - Dashboard Supabase → Settings → API
   - Realtime: Enable

2. Vérifier RLS:
   - Table: live_chat_messages
   - Policy SELECT: enable for authenticated
   - Policy INSERT: enable for authenticated

3. Vérifier session ID identique:
   - Console vendeur et acheteur doivent afficher le même ID
```

### Problème 3: "Erreur 110 Agora"

**Symptômes:**
- Log: `⚠️ Erreur 110 (temporaire)`

**Solutions:**
```bash
✅ NORMAL - Cette erreur est temporaire
- Elle survient pendant l'initialisation
- Se résout automatiquement
- Pas d'action requise
```

### Problème 4: "Double-tap ne fonctionne pas"

**Symptômes:**
- Rien ne se passe au double-tap sur la vidéo

**Solutions:**
```bash
1. Vérifier que vous tapez RAPIDEMENT (< 300ms entre taps)
2. Vérifier que TouchableOpacity entoure bien la vidéo
3. Tester sur appareil physique (l'émulateur peut avoir du lag)
```

## 📈 Métriques de Succès

### Performance Cible
- 🎥 **Latence vidéo**: < 3 secondes
- 💬 **Latence chat**: < 1 seconde
- 🎯 **FPS**: 60 FPS constant
- 📱 **Mémoire**: < 200 MB
- 🔋 **Batterie**: Consommation raisonnable

### Qualité d'Expérience
- ✅ **Vidéo**: Fluide, pas de freeze
- ✅ **Chat**: Instantané, pas de doublons
- ✅ **Réactions**: Animations fluides
- ✅ **Interface**: Réactive, pas de lag

---

**Date**: 31 Décembre 2025
**Version**: v1.0 - Post-fix Chat + Vidéo
**Statut**: ✅ Prêt pour test complet
