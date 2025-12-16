# 🔴 Problème: Expo ne démarre pas

## Symptôme
Metro Bundler reste bloqué sur `"Waiting on http://localhost:8081"` et ne compile jamais l'application.

## Erreurs TypeScript Corrigées ✅
Toutes les erreurs TypeScript ont été corrigées (voir FIX_TYPESCRIPT_ERRORS.md):
- profile.tsx
- my-shop.tsx
- subscription-plans.tsx
- useShareReputation.ts

**Vérification:** `npm run typecheck` ✅ SUCCÈS

## Problème Actuel
Metro Bundler ne termine pas son initialisation.

---

## 🛠️ Solutions à Essayer

### Solution 1: Tuer tous les processus Node et redémarrer
```bash
# Tuer tous les processus node
taskkill //F //IM node.exe

# Nettoyer le cache
rmdir /s /q .expo
rmdir /s /q node_modules\.cache

# Redémarrer
npx expo start
```

### Solution 2: Utiliser un port différent
```bash
npx expo start --port 19000
```

### Solution 3: Désactiver Fast Refresh temporairement
Dans `app.config.js`, ajoutez:
```javascript
module.exports = {
  // ...
  developmentClient: {
    silenceNativeWarnings: true,
  },
}
```

### Solution 4: Vérifier les dépendances problématiques
```bash
# Réinstaller les dépendances
npm install

# Ou forcer la réinstallation
rm -rf node_modules package-lock.json
npm install
```

### Solution 5: Vérifier le fichier .env
Le fichier `.env` montre `injecting env (0)`, ce qui signifie qu'aucune variable n'est chargée.

**Vérifiez que le fichier `.env` n'a PAS de ligne vide en première ligne.**

Actuellement:
```
1→  (LIGNE VIDE) ❌
2→EXPO_PUBLIC_SUPABASE_URL=...
3→EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Devrait être:
```
1→EXPO_PUBLIC_SUPABASE_URL=...
2→EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Solution 6: Désactiver watchman (si installé)
```bash
npx expo start --no-dev --minify
```

### Solution 7: Mode tunnel pour Expo
```bash
npx expo start --tunnel
```

---

## 🔍 Diagnostic Avancé

### Vérifier si Metro écoute vraiment
```bash
netstat -ano | findstr "8081"
```

### Vérifier les logs Metro en détail
Ouvrir manuellement le terminal et lancer:
```bash
npx expo start --verbose
```

### Vérifier les erreurs cachées
```bash
npx expo-doctor
```

---

## 📱 Test rapide avec un projet vide

Créer un nouveau projet Expo temporaire pour tester:
```bash
cd ..
npx create-expo-app test-app
cd test-app
npx expo start
```

Si le projet test fonctionne, le problème vient de la configuration du projet principal.

---

## ⚡ Solution Rapide Recommandée

```bash
# 1. Tuer tous les processus
taskkill //F //IM node.exe

# 2. Nettoyer complètement
rmdir /s /q .expo
rmdir /s /q node_modules\.cache
del /f /q metro.config.js.backup 2>nul

# 3. Corriger le .env (retirer la ligne vide en haut)
# Ouvrir .env et s'assurer que la ligne 1 contient EXPO_PUBLIC_SUPABASE_URL

# 4. Réinstaller les dépendances proprement
npm ci

# 5. Redémarrer
npx expo start --clear
```

---

## 🚨 Si Rien ne Fonctionne

### Option A: Utiliser Expo Go
```bash
npx expo start --go
```

### Option B: Build pour tester
```bash
npx expo prebuild
npx expo run:android
# OU
npx expo run:ios
```

### Option C: Downgrade React Native
Vérifier la compatibilité des versions dans `package.json`:
```json
{
  "expo": "^54.0.13",
  "react-native": "0.76.5"
}
```

---

## 📊 État Actuel

- ✅ TypeScript: Aucune erreur
- ✅ Dépendances: Installées
- ❌ Metro Bundler: Bloqué sur "Waiting on http://localhost:8081"
- ⚠️ .env: Ligne vide en première position (0 variables chargées)

---

## 💡 Cause Probable

Le Metro Bundler semble attendre indéfiniment sans compiler. Cela peut être causé par:

1. **Ligne vide dans .env** - Metro attend le chargement des variables d'environnement
2. **Cache corrompu** - Le cache Metro ou Expo est dans un état invalide
3. **Processus zombie** - Un ancien processus Node bloque le port
4. **Watchman** - Si installé, peut causer des problèmes de synchronisation
5. **Fichier corrompu** - Un fichier dans le projet empêche la compilation

---

**Prochaine Étape Recommandée:**

1. **Corriger le fichier .env** (retirer la ligne vide)
2. **Tuer tous les processus Node**
3. **Relancer avec `npx expo start`**

Si le problème persiste, essayer `npx expo start --tunnel` pour diagnostiquer si c'est un problème de réseau local.

