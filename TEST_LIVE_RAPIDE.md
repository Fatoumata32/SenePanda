# ✅ Test Rapide du Live Shopping

## 🔧 Configuration Agora Mise à Jour

✅ **App ID**: `c1a1a6f975c84c8fb781485a24933e9d`
✅ **Certificate**: `ae54b69729dd48ebbd7b064acd5ec0de`

## 🚀 Test en 5 Étapes

### 1. Recharger l'App (OBLIGATOIRE)

**Dans le terminal Expo**:
```bash
# Appuyez sur 'r' pour reload
r
```

**OU sur l'appareil**:
- Secouez → "Reload"
- OU fermez l'app et rouvrez

### 2. Créer un Live (Compte Vendeur)

```
1. Se connecter en tant que vendeur
2. Profil → "Ma Boutique"
3. Bouton "🔴 Démarrer un Live"
4. Sélectionner 1-2 produits
5. Titre: "Test Live Shopping"
6. Créer la session
```

**Résultat attendu**:
- ✅ Session créée avec status `scheduled`
- ✅ Redirection vers la page de préparation

### 3. Démarrer le Stream (Vendeur)

```
1. Dans la session créée
2. Bouton "Commencer le Live"
3. Autoriser caméra + micro
```

**Résultat attendu**:
- ✅ Caméra se lance
- ✅ Status passe à `live`
- ✅ Vous voyez votre vidéo

**Logs attendus**:
```
📡 Initialisation Agora Broadcaster...
✅ Broadcaster rejoint le canal
```

### 4. Rejoindre en tant que Spectateur (Compte Acheteur)

```
1. Se connecter avec un autre compte (acheteur)
2. Onglet "Explorer" (🔍)
3. Scroller jusqu'à "🔴 Lives en cours"
4. Cliquer sur le live
```

**Résultat attendu**:
- ✅ Navigation vers la page live
- ✅ "En attente du vendeur..." OU vidéo si déjà démarré
- ✅ Compteur de viewers s'incrémente

**Logs attendus**:
```
📡 Initialisation Agora Live Viewer avec App ID: c1a1a6f975c84c8fb781485a24933e9d
🎥 Configuration Agora Viewer...
✅ Viewer rejoint le canal avec succès
🎉 BROADCASTER DÉTECTÉ! UID: [numéro]
```

### 5. Tester les Fonctionnalités

**Chat**:
- Taper un message → Envoyer
- ✅ Doit apparaître chez les spectateurs

**Réactions**:
- Cliquer ❤️, 🔥, 👏, ⭐, 🛒
- ✅ Animation montante sur l'écran

**Produits**:
- Cliquer icône 🛍️
- ✅ Panneau produits s'ouvre
- ✅ "Acheter" ouvre le modal de commande

## 🐛 Si Ça Ne Fonctionne Pas

### Erreur: "This screen doesn't exist"

**Solution**:
```bash
# Nettoyer le cache et recharger
npx expo start --clear
```

Puis **recharger l'app** (Shake → Reload)

### Erreur: Écran blanc / Crash

**Vérifier dans les logs**:
- ❌ `Cannot find module 'react-native-agora'`
  - Solution: `npm install react-native-agora`
- ❌ `TypeError: undefined is not an object`
  - Solution: Vérifier que Agora est bien importé

### Erreur: "Permission refusée"

**Android**:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**iOS**:
```xml
<!-- ios/YourApp/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>Accès caméra pour le live shopping</string>
<key>NSMicrophoneUsageDescription</key>
<string>Accès micro pour le live shopping</string>
```

### Erreur Agora 110: "Connection failed"

**Cause**: Le broadcaster n'a pas encore démarré le stream

**Solution**:
- Normal pour les spectateurs qui arrivent avant le vendeur
- L'app réessaie automatiquement toutes les 3s (max 15 fois)
- Démarrer le live côté vendeur

### Erreur Agora 17: "Invalid channel name"

**Cause**: Nom du canal incorrect

**Debug**:
```typescript
// Vérifier dans les logs
console.log('📡 Rejoindre le canal:', channelName);
// Doit être: live_[uuid-de-la-session]
```

## 📊 Checklist de Validation

Cochez au fur et à mesure:

### Configuration
- [x] App ID configuré: `c1a1a6f975c84c8fb781485a24933e9d`
- [x] Certificate configuré: `ae54b69729dd48ebbd7b064acd5ec0de`
- [ ] App rechargée après modifications

### Vendeur (Broadcaster)
- [ ] Peut créer une session live
- [ ] Peut démarrer le stream
- [ ] Caméra fonctionne
- [ ] Voit sa propre vidéo
- [ ] Peut envoyer des messages
- [ ] Voit le nombre de viewers

### Acheteur (Viewer)
- [ ] Voit les lives en cours dans Explorer
- [ ] Peut rejoindre un live
- [ ] Voit la vidéo du vendeur
- [ ] Peut envoyer des messages dans le chat
- [ ] Peut réagir (❤️🔥👏⭐🛒)
- [ ] Peut voir les produits en vedette
- [ ] Peut acheter pendant le live

### Performance
- [ ] Latence < 3 secondes
- [ ] Pas de freeze vidéo
- [ ] Chat en temps réel
- [ ] Pas de crash

## 🎯 Résultat Attendu Final

Après ces 5 étapes, vous devriez avoir:

1. ✅ Un live actif avec le vendeur qui stream
2. ✅ Des spectateurs qui voient la vidéo
3. ✅ Un chat fonctionnel
4. ✅ Des réactions animées
5. ✅ Un panneau produits interactif

## 📸 Screenshots Attendus

### Vendeur (Broadcaster)
```
┌─────────────────────────────────┐
│  ← Ma Boutique                  │
├─────────────────────────────────┤
│                                 │
│   [VOTRE CAMÉRA EN DIRECT]      │
│                                 │
│   🔴 LIVE  👁️ 3 viewers         │
│                                 │
├─────────────────────────────────┤
│ Chat:                           │
│ 👤 User1: Bonjour!              │
│ 👤 User2: Super produit! ❤️     │
├─────────────────────────────────┤
│ [Terminer le Live]              │
└─────────────────────────────────┘
```

### Acheteur (Viewer)
```
┌─────────────────────────────────┐
│  ← Explorer                     │
├─────────────────────────────────┤
│                                 │
│   [VIDÉO DU VENDEUR]            │
│                                 │
│   🔴 LIVE  👁️ 3                │
│   Vendeur: Modou Tgiam          │
│                                 │
├─────────────────────────────────┤
│ ❤️ 🔥 👏 ⭐ 🛒  [🛍️] [💬]      │
│                                 │
│ Chat:                           │
│ │ 👤 Vous: Disponible en bleu? │
│ └─ [Envoyer]                    │
└─────────────────────────────────┘
```

## 🔗 Fichiers Modifiés

- ✅ [lib/agoraConfig.ts](lib/agoraConfig.ts) - App ID + Certificate
- ✅ [app/(tabs)/live-viewer/[id].tsx](app/(tabs)/live-viewer/[id].tsx) - API Agora v4
- ✅ [app/live/[id].tsx](app/live/[id].tsx) - API Agora v4

## 📞 Support

Si le problème persiste après ces étapes:

1. Copier **tous les logs** du terminal
2. Faire une **capture d'écran** de l'erreur
3. Indiquer l'**étape exacte** où ça bloque

---

**Dernière mise à jour**: 31 Décembre 2025
**App ID**: `c1a1a6f975c84c8fb781485a24933e9d`
**Certificate**: `ae54b69729dd48ebbd7b064acd5ec0de`
