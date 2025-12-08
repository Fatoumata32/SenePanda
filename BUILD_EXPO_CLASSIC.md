# 🚀 Build APK - Méthode Alternative (Expo Classic)

## ⚡ Solution de Secours si EAS Build Échoue

Si EAS Build échoue avec des erreurs Gradle, utilisez **Expo Classic Build** qui est plus stable.

---

## 📱 Méthode 1 : Expo Go (Le Plus Rapide)

### Pour Tester l'App Sans Générer d'APK

```bash
# 1. Installer Expo Go sur votre téléphone Android
# Télécharger depuis Google Play Store : "Expo Go"

# 2. Démarrer l'app en développement
npm run dev

# 3. Scanner le QR code avec Expo Go
```

**Avantages :**
- ✅ Aucun build nécessaire
- ✅ Test instantané sur votre téléphone
- ✅ Rechargement automatique des modifications

---

## 📦 Méthode 2 : Expo Classic Build (APK Standalone)

### Prérequis
```bash
# Installer expo-cli classic
npm install -g expo-cli
```

### Build APK avec Expo Classic
```bash
# 1. Se connecter
expo login

# 2. Build APK
expo build:android -t apk

# 3. Attendre 10-20 minutes

# 4. Télécharger l'APK
expo build:status
# Cliquez sur le lien fourni
```

---

## 🔧 Méthode 3 : EAS Build avec Configuration Simplifiée

### Modifier eas.json pour simplifier

Créer un nouveau profil plus simple :

```json
{
  "build": {
    "preview-simple": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "withoutCredentials": true
      }
    }
  }
}
```

### Relancer le build
```bash
eas build --platform android --profile preview-simple
```

---

## 🐛 Correction des Erreurs Gradle Communes

### Erreur 1 : "Gradle build failed"

**Solution :**
```bash
# Nettoyer complètement
rm -rf android
rm -rf node_modules
npm install

# Régénérer les fichiers Android
npx expo prebuild --clean

# Réessayer
eas build --platform android --profile preview
```

### Erreur 2 : "SDK Version Mismatch"

**Solution :**
Modifier `eas.json` :
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "image": "latest"
      }
    }
  }
}
```

### Erreur 3 : "Out of Memory"

**Solution :**
Ajouter dans `eas.json` :
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "resourceClass": "large"
      }
    }
  }
}
```

---

## 💡 Méthode 4 : Build Local Complet

Si vous avez Android Studio installé :

```bash
# 1. Générer les fichiers natifs
npx expo prebuild

# 2. Ouvrir Android Studio
# Fichier > Ouvrir > Sélectionner le dossier "android"

# 3. Dans Android Studio :
# Build > Build Bundle(s) / APK(s) > Build APK(s)

# 4. L'APK sera dans :
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Recommandation selon votre Situation

### Pour Tester Rapidement (Recommandé)
👉 **Expo Go** - Aucun build, test instantané

### Pour Distribution Interne
👉 **Expo Classic Build** - Plus stable, moins de problèmes

### Pour Production
👉 **EAS Build** - Une fois les erreurs corrigées

---

## 📋 Checklist de Dépannage

Si le build échoue, vérifier :

- [ ] ✅ Connexion internet stable
- [ ] ✅ Compte Expo vérifié (email confirmé)
- [ ] ✅ Variables d'environnement dans `.env`
- [ ] ✅ Pas d'erreurs TypeScript (`npm run typecheck`)
- [ ] ✅ Dépendances à jour (`npm install`)
- [ ] ✅ Cache nettoyé (`rm -rf node_modules/.cache .expo`)

---

## 🚀 Commandes Rapides

### Pour Expo Go (Test Rapide)
```bash
npm run dev
# Scannez le QR code avec Expo Go
```

### Pour APK avec Expo Classic
```bash
expo build:android -t apk
```

### Pour Debug EAS Build
```bash
# Voir les logs détaillés
eas build --platform android --profile preview --local
```

---

## 📞 Support

- **Logs du build :** https://expo.dev/accounts/malick9999/projects/senepanda/builds
- **Documentation Expo :** https://docs.expo.dev/build/setup/
- **Forum Expo :** https://forums.expo.dev/

---

**Si rien ne fonctionne, utilisez Expo Go pour tester l'app !**

C'est la méthode la plus rapide et la plus fiable pour tester.
