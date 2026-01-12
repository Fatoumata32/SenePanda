# ✅ Fix: Lazy Loading pour ZegoCloud dans Expo Go

## 🎯 Problème Résolu

**Erreur:**
```
ERROR [TypeError: Cannot read property 'create' of undefined]
ERROR [TypeError: Cannot read property 'prefix' of null]
```

**Cause:** Expo Router charge **tous les fichiers** du dossier `app/` au démarrage, y compris les fichiers ZegoCloud qui importent des modules natifs incompatibles avec Expo Go.

## 💡 Solution: Déplacer + Lazy Loading

### Étape 1: Déplacement des Fichiers ZegoCloud

Les fichiers ZegoCloud ont été déplacés **hors du dossier `app/`** pour qu'Expo Router ne les charge pas automatiquement:

```
Avant:
app/(tabs)/live-viewer/zego-viewer.tsx  ❌ Chargé au démarrage
app/seller/live-stream/zego-host.tsx    ❌ Chargé au démarrage

Après:
components/live-streaming/ZegoViewer.tsx  ✅ Chargé à la demande
components/live-streaming/ZegoHost.tsx    ✅ Chargé à la demande
```

### Étape 2: Lazy Loading Dynamique

Les wrappers chargent ZegoCloud **uniquement** quand on est en build natif:

```typescript
// Expo Go → Redirection immédiate (pas de chargement ZegoCloud)
if (isExpoGo) {
  router.replace({ pathname: '/(tabs)/live-viewer/[id]', params: { id } });
}

// Build Natif → Import dynamique
else {
  import('@/components/live-streaming/ZegoViewer')
    .then((module) => {
      setZegoComponent(() => module.default);
    })
    .catch(() => {
      // Fallback vers Agora en cas d'erreur
      router.replace({ pathname: '/(tabs)/live-viewer/[id]', params: { id } });
    });
}
```

---

## 📂 Structure des Fichiers

```
components/
└── live-streaming/
    ├── ZegoViewer.tsx    ← Spectateur (ZegoCloud)
    └── ZegoHost.tsx      ← Vendeur (ZegoCloud)

app/
├── (tabs)/
│   └── live-viewer/
│       ├── [id].tsx                    ← Spectateur (Agora - Expo Go)
│       └── zego-viewer-wrapper.tsx     ← Wrapper intelligent
└── seller/
    └── live-stream/
        ├── [id].tsx                    ← Vendeur (Agora - Expo Go)
        └── zego-host-wrapper.tsx       ← Wrapper intelligent
```

---

## 🔄 Flux de Fonctionnement

### Dans Expo Go

```
1. Utilisateur clique "Démarrer live"
2. → zego-host-wrapper.tsx chargé
3. → Détecte: Constants.appOwnership === 'expo'
4. → Redirige IMMÉDIATEMENT vers /seller/live-stream/[id]
5. → Interface Agora s'affiche
6. ✅ Pas d'erreur ZegoCloud (jamais chargé)
```

### Dans Build Natif

```
1. Utilisateur clique "Démarrer live"
2. → zego-host-wrapper.tsx chargé
3. → Détecte: Build natif
4. → import('@/components/live-streaming/ZegoHost')
5. → ZegoHost.tsx chargé dynamiquement
6. → Interface ZegoCloud s'affiche
7. ✅ Streaming HD ZegoCloud
```

---

## ✅ Résultat

### Expo Go
- ✅ Pas d'erreur au démarrage
- ✅ Pas d'import ZegoCloud
- ✅ Interface Agora fonctionnelle
- ✅ Development rapide

### Build Natif
- ✅ ZegoCloud chargé uniquement quand nécessaire
- ✅ Streaming HD
- ✅ Toutes les fonctionnalités avancées
- ✅ Production optimale

---

## 🧪 Test

```bash
# Redémarrer le serveur Metro
npx expo start -c

# Scanner avec Expo Go
# → Pas d'erreur ZegoCloud
# → Live fonctionne avec Agora

# Build Android
npm run build:android:dev
# → ZegoCloud chargé dynamiquement
# → Streaming HD
```

---

## 🎯 Points Clés

1. **Expo Router** charge tous les fichiers du dossier `app/` au démarrage
2. **ZegoCloud** ne peut pas être chargé dans Expo Go (modules natifs)
3. **Solution:** Déplacer ZegoCloud hors de `app/` et utiliser `import()` dynamique
4. **Wrappers** détectent l'environnement et chargent le bon composant
5. **Fallback** vers Agora en cas d'erreur

---

**Date:** 2026-01-12
**Status:** ✅ Fonctionnel dans Expo Go et Build Natif
**Méthode:** Lazy Loading + Dynamic Import
