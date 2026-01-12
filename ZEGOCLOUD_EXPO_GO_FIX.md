# ✅ FIX - ZEGOCLOUD ne fonctionne pas dans Expo Go

**Date:** 31 décembre 2025
**Problème:** Erreur "Cannot read property 'prefix' of null" lors de l'import ZEGOCLOUD dans Expo Go

---

## 🔍 DIAGNOSTIC

### Erreur observée

```
ERROR [TypeError: Cannot read property 'prefix' of null]
Android Bundling failed
Unable to resolve "./components/ZegoMenuBarButtonName"
```

### Cause racine

**ZEGOCLOUD utilise du code natif (native modules) qui ne peut PAS fonctionner dans Expo Go.**

Expo Go est un environnement sandbox limité qui ne supporte que les modules Expo officiels. ZEGOCLOUD nécessite:
- Linking natif (iOS/Android)
- Modules C++/Swift/Kotlin
- Permissions natives avancées

---

## ✅ SOLUTION APPLIQUÉE

### Approche hybride : Agora (dev) + ZEGOCLOUD (prod)

| Environnement | SDK Utilisé | Raison |
|---------------|-------------|--------|
| **Expo Go (développement)** | **Agora** | Fonctionne sans build natif |
| **Build natif (production)** | **ZEGOCLOUD** | Meilleure performance, UI pré-construite |

### Fichiers modifiés

1. **[lib/liveStreamConfig.ts](lib/liveStreamConfig.ts)** (créé)
   - Détection automatique de l'environnement
   - Configuration hybride Agora/ZEGOCLOUD
   ```typescript
   export const isExpoGo = Constants.appOwnership === 'expo';
   export const getCurrentProvider = (): LiveProvider => {
     return isExpoGo ? 'agora' : 'zegocloud';
   };
   ```

2. **[components/ActiveLiveSessions.tsx:52](components/ActiveLiveSessions.tsx#L52)**
   - Navigation vers `[id].tsx` (Agora)
   - Commenté: Pour build natif, changer vers `zego-viewer`

3. **[app/seller/start-live.tsx:207](app/seller/start-live.tsx#L207)**
   - Navigation vers `/seller/live-stream/[id]` (Agora)
   - Commenté: Pour build natif, changer vers `zego-stream`

4. **[app/seller/my-lives.tsx:147](app/seller/my-lives.tsx#L147)** (2 endroits)
   - Navigation vers `/seller/live-stream/[id]` (Agora)
   - Commenté: Pour build natif, changer vers `zego-stream`

### Packages installés

```json
{
  "@zegocloud/zego-uikit-prebuilt-live-streaming-rn": "2.7.4",
  "@zegocloud/zego-uikit-rn": "2.18.8"
}
```

**Note:** Version 2.7.4 (et non 2.8.2) car la 2.8.2 a un bug de fichier manquant.

---

## 🧪 COMMENT TESTER

### En développement (Expo Go)

```bash
# Utilise Agora automatiquement
npm run dev

# Scannez le QR code avec Expo Go
# Créer un live → Fonctionne avec Agora ✅
```

**Résultat attendu:** Live fonctionne avec l'ancienne interface Agora

### En production (Build natif)

**Étape 1: Déplacer les fichiers ZEGOCLOUD dans app/**

⚠️ **IMPORTANT:** Les fichiers ZEGOCLOUD ont été déplacés hors de `app/` pour éviter le crash dans Expo Go.

```bash
# Créer les dossiers de destination
mkdir -p "app/(tabs)/live-viewer"
mkdir -p "app/seller/live-stream"

# Déplacer les fichiers
mv components/zegocloud/zego-viewer.tsx "app/(tabs)/live-viewer/"
mv components/zegocloud/zego-stream.tsx "app/seller/live-stream/"
```

**Étape 2: Changer les routes vers ZEGOCLOUD**

Modifier manuellement 4 lignes :
```typescript
// components/ActiveLiveSessions.tsx:52
pathname: '/(tabs)/live-viewer/zego-viewer',

// app/seller/start-live.tsx:207
pathname: '/seller/live-stream/zego-stream',

// app/seller/my-lives.tsx:147 et :377
pathname: '/seller/live-stream/zego-stream',
```

**Étape 3: Builder l'app**

```bash
# Android
npm run build:android:dev

# iOS
npm run build:ios:dev
```

**Étape 4: Installer et tester**

```bash
# Installer le .apk/.ipa sur appareil physique
# Créer un live → Fonctionne avec ZEGOCLOUD ✅
```

**Résultat attendu:** Live fonctionne avec la nouvelle interface ZEGOCLOUD (plus moderne)

---

## 📊 COMPARAISON AGORA VS ZEGOCLOUD

| Fonctionnalité | Agora (Expo Go) | ZEGOCLOUD (Build Natif) |
|----------------|-----------------|-------------------------|
| **Fonctionne dans Expo Go** | ✅ OUI | ❌ NON |
| **Qualité vidéo** | Excellente | Excellente |
| **Latence** | ~200ms | ~150ms |
| **UI pré-construite** | ❌ Non (custom) | ✅ Oui |
| **Chat intégré** | ❌ Non (Supabase) | ✅ Oui (optionnel) |
| **Code nécessaire** | ~300 lignes | ~50 lignes |
| **Minutes gratuites** | 10,000/mois | 10,000/mois |
| **Recommandation** | Dev uniquement | Production |

---

## 🚨 PROBLÈMES CONNUS ET SOLUTIONS

### Problème 1: "Cannot read property 'prefix' of null"

**Cause:** Import de ZEGOCLOUD dans Expo Go

**Solution (DÉJÀ APPLIQUÉE):**
- Revenir à Agora pour Expo Go
- ZEGOCLOUD reste disponible pour build natif
- Utiliser `liveStreamConfig.ts` pour détecter l'environnement

### Problème 2: "Module not found: ./components/ZegoMenuBarButtonName"

**Cause:** Bug dans ZEGOCLOUD v2.8.2

**Solution (DÉJÀ APPLIQUÉE):**
```bash
npm install @zegocloud/zego-uikit-prebuilt-live-streaming-rn@2.7.4
```

### Problème 3: "Les lives ne sont pas visibles pour les acheteurs"

**Cause:** Problème de statut du live (cf. [FIX_LIVE_STATUS_UPDATE.md](FIX_LIVE_STATUS_UPDATE.md))

**Solution:**
- Le fix du statut est indépendant du SDK utilisé
- Fonctionne avec Agora ET ZEGOCLOUD

---

## 🎯 WORKFLOW RECOMMANDÉ

### Phase 1: Développement (ACTUEL) ✅

**Environnement:** Expo Go
**SDK:** Agora
**Commande:** `npm run dev`

**Avantages:**
- Pas besoin de rebuild
- Hot reload instantané
- Test rapide des fonctionnalités

**Inconvénients:**
- UI custom Agora (moins moderne)
- Plus de code à maintenir

### Phase 2: Test Pre-Production

**Environnement:** Build natif dev
**SDK:** ZEGOCLOUD
**Commande:** `npm run build:android:dev`

**Étapes:**
1. Changer les 4 routes vers ZEGOCLOUD
2. Builder l'app
3. Tester sur appareil physique

**Avantages:**
- Tester ZEGOCLOUD avant prod
- UI moderne
- Moins de bugs potentiels

### Phase 3: Production

**Environnement:** Build natif prod
**SDK:** ZEGOCLOUD
**Commande:** `npm run build:android:prod`

**Étapes:**
1. Routes déjà configurées pour ZEGOCLOUD
2. Builder la version production
3. Upload sur Play Store / App Store

**Avantages:**
- Expérience utilisateur optimale
- Code simplifié
- Meilleure performance

---

## 📖 FICHIERS DE RÉFÉRENCE

### Configuration
- [lib/liveStreamConfig.ts](lib/liveStreamConfig.ts) - Détection environnement
- [lib/zegoConfig.ts](lib/zegoConfig.ts) - Configuration ZEGOCLOUD
- [lib/agoraConfig.ts](lib/agoraConfig.ts) - Configuration Agora

### Composants Agora (Expo Go)
- [app/(tabs)/live-viewer/[id].tsx](app/(tabs)/live-viewer/[id].tsx) - Viewer Agora
- [app/seller/live-stream/[id].tsx](app/seller/live-stream/[id].tsx) - Vendeur Agora

### Composants ZEGOCLOUD (Build Natif)
**⚠️ IMPORTANT:** Déplacés hors du dossier `app/` pour éviter le chargement dans Expo Go

- [components/zegocloud/zego-viewer.tsx](components/zegocloud/zego-viewer.tsx) - Viewer ZEGOCLOUD
- [components/zegocloud/zego-stream.tsx](components/zegocloud/zego-stream.tsx) - Vendeur ZEGOCLOUD

**Raison:** Expo analyse tous les fichiers dans `app/` au démarrage, même ceux non utilisés. Cela causait l'erreur "prefix of null" car ZEGOCLOUD était importé alors qu'il ne fonctionne pas dans Expo Go.

### Navigation
- [components/ActiveLiveSessions.tsx](components/ActiveLiveSessions.tsx) - Clic sur live
- [app/seller/start-live.tsx](app/seller/start-live.tsx) - Créer live
- [app/seller/my-lives.tsx](app/seller/my-lives.tsx) - Rejoindre live

### Documentation
- [MIGRATION_ZEGOCLOUD.md](MIGRATION_ZEGOCLOUD.md) - Guide migration complet
- [FIX_LIVE_STATUS_UPDATE.md](FIX_LIVE_STATUS_UPDATE.md) - Fix statut live
- [AMELIORATIONS_CHAT_LIVE.md](AMELIORATIONS_CHAT_LIVE.md) - Chat optimisé

---

## ✅ CHECKLIST DE VÉRIFICATION

### Expo Go (Développement) ✅

- [x] App démarre sans erreur "prefix of null"
- [x] Agora utilisé automatiquement
- [x] Créer un live fonctionne
- [x] Démarrer le live fonctionne
- [x] Statut passe à 'live' en BDD
- [x] Acheteurs voient le live dans "🔥 Lives Shopping"
- [x] Chat fonctionne
- [x] Réactions fonctionnent

### Build Natif (Production) ⏳

- [ ] Changer les 4 routes vers ZEGOCLOUD
- [ ] Build Android réussit
- [ ] Build iOS réussit
- [ ] ZEGOCLOUD UI s'affiche
- [ ] Vidéo fonctionne
- [ ] Chat fonctionne
- [ ] Réactions fonctionnent
- [ ] Performance > Agora

---

## 🎉 RÉSUMÉ

**Problème initial:** ZEGOCLOUD ne fonctionne pas dans Expo Go

**Solution finale:** Approche hybride
- ✅ **Expo Go:** Agora (développement rapide)
- ✅ **Build natif:** ZEGOCLOUD (production optimale)

**État actuel:** Configuré pour Agora (Expo Go) ✅

**Prochaine étape:** Quand prêt pour production, changer vers ZEGOCLOUD en modifiant 4 lignes

**Le live shopping fonctionne maintenant dans Expo Go ! 🎉**
