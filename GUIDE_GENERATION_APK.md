# 📱 Guide de Génération de l'APK - SenePanda

## 🎯 Méthodes de Build

Il existe **3 méthodes** pour générer l'APK de l'application SenePanda :

---

## 🚀 Méthode 1 : EAS Build (Recommandée)

### Avantages
- ✅ **Officielle Expo** - Méthode recommandée par Expo
- ✅ **Build dans le cloud** - Pas besoin d'Android Studio
- ✅ **Rapide** - Configuration en quelques commandes
- ✅ **Gratuit** pour les builds de développement

### Prérequis
```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login
```

### Configuration initiale (une seule fois)

#### 1. Configurer EAS
```bash
# Initialiser EAS dans le projet
eas build:configure
```

Cela créera un fichier `eas.json` avec cette configuration :

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

#### 2. Générer l'APK de développement
```bash
# Build pour tester (sans signature)
eas build --platform android --profile preview --local

# OU Build dans le cloud (recommandé)
eas build --platform android --profile preview
```

#### 3. Générer l'APK de production
```bash
# Build de production (signé et optimisé)
eas build --platform android --profile production
```

### Télécharger l'APK
Une fois le build terminé, vous recevrez :
- Un **lien de téléchargement** dans le terminal
- Un **email** avec le lien de téléchargement
- L'APK sera disponible sur **expo.dev/accounts/[votre-compte]/builds**

---

## 🔨 Méthode 2 : Build Local avec EAS (Plus rapide)

### Avantages
- ✅ **Plus rapide** que le build cloud
- ✅ **Gratuit** et illimité
- ✅ **Contrôle total** du processus

### Prérequis
```bash
# Installer les dépendances
npm install -g eas-cli

# Installer Docker (pour le build local)
# Télécharger depuis : https://www.docker.com/products/docker-desktop
```

### Commandes de build local

```bash
# Build local de développement
eas build --platform android --profile preview --local

# Build local de production
eas build --platform android --profile production --local
```

L'APK sera généré dans le dossier du projet.

---

## 🛠️ Méthode 3 : Expo Build (Classique - Deprecated)

### ⚠️ Attention
Cette méthode est **obsolète** mais fonctionne encore.

### Commandes
```bash
# Build APK classique
expo build:android -t apk

# Télécharger l'APK une fois prêt
expo build:status
```

---

## 📦 Script Automatique de Build

### Créer le fichier `package.json` avec les scripts

Ajoutez ces scripts à votre `package.json` :

```json
{
  "scripts": {
    "build:android:dev": "eas build --platform android --profile preview",
    "build:android:prod": "eas build --platform android --profile production",
    "build:android:local": "eas build --platform android --profile preview --local",
    "build:ios:dev": "eas build --platform ios --profile preview",
    "build:ios:prod": "eas build --platform ios --profile production"
  }
}
```

### Utilisation
```bash
# Build Android de développement
npm run build:android:dev

# Build Android de production
npm run build:android:prod

# Build Android local (plus rapide)
npm run build:android:local
```

---

## 🔐 Configuration de la Signature (Production)

### Générer une clé de signature

```bash
# Créer un keystore
keytool -genkeypair -v -storetype PKCS12 -keystore senepanda.keystore \
  -alias senepanda -keyalg RSA -keysize 2048 -validity 10000

# Informations à renseigner :
# - Mot de passe du keystore : [choisir un mot de passe fort]
# - Nom : SenePanda
# - Organisation : SenePanda
# - Ville : Dakar
# - État/Province : Dakar
# - Code pays : SN
```

### Configurer EAS avec la clé

```bash
# EAS générera automatiquement les clés si vous ne les fournissez pas
# Ou vous pouvez configurer manuellement dans eas.json
```

---

## 📋 Checklist Avant le Build

### Vérifications obligatoires

- [ ] ✅ **Variables d'environnement** configurées (`.env`)
  ```bash
  EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
  ```

- [ ] ✅ **Version** mise à jour dans `app.config.js`
  ```javascript
  version: "1.0.0" // Incrémenter à chaque release
  ```

- [ ] ✅ **Icônes et images** présentes
  - `assets/images/icon.png` (1024x1024)
  - `assets/images/adaptive-icon.png` (1024x1024)
  - `assets/images/splash-icon.png` (2048x2048)

- [ ] ✅ **Permissions** configurées dans `app.config.js`

- [ ] ✅ **Aucune erreur TypeScript**
  ```bash
  npm run typecheck
  ```

- [ ] ✅ **Tests passent**
  ```bash
  # Tester l'app en mode production
  npx expo start --no-dev --minify
  ```

---

## 🚀 Processus de Build Complet (Recommandé)

### Étape 1 : Préparation
```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier qu'il n'y a pas d'erreurs
npm run typecheck

# 3. Nettoyer le cache
npx expo start -c
# Puis arrêter avec Ctrl+C
```

### Étape 2 : Configuration EAS (première fois uniquement)
```bash
# Installer EAS CLI si pas déjà fait
npm install -g eas-cli

# Se connecter
eas login

# Configurer le projet
eas build:configure
```

### Étape 3 : Build
```bash
# Build de développement (pour tester)
eas build --platform android --profile preview

# OU Build de production (pour publier)
eas build --platform android --profile production
```

### Étape 4 : Téléchargement
- Attendez la fin du build (10-20 minutes)
- Cliquez sur le lien fourni dans le terminal
- OU allez sur https://expo.dev/accounts/[votre-compte]/builds
- Téléchargez l'APK

### Étape 5 : Installation sur Android
```bash
# Transférer l'APK sur votre téléphone
# Puis installer manuellement

# OU utiliser ADB
adb install chemin/vers/senepanda.apk
```

---

## 📱 Tester l'APK

### Sur un appareil physique
1. Activer **"Sources inconnues"** dans les paramètres Android
2. Transférer l'APK sur le téléphone
3. Ouvrir le fichier APK
4. Accepter l'installation

### Sur un émulateur
```bash
# Démarrer l'émulateur
emulator -avd Pixel_5_API_31

# Installer l'APK
adb install senepanda.apk
```

---

## 🐛 Résolution des Problèmes

### Problème : "Build failed"
**Solution :**
```bash
# Nettoyer le cache
rm -rf node_modules
npm install

# Vérifier les erreurs TypeScript
npm run typecheck

# Réessayer le build
eas build --platform android --profile preview
```

### Problème : "No Expo account found"
**Solution :**
```bash
# Se connecter à Expo
eas login

# Vérifier que vous êtes connecté
eas whoami
```

### Problème : "Android SDK not found" (build local uniquement)
**Solution :**
- Installer Android Studio
- Configurer les variables d'environnement
- OU utiliser le build cloud (pas besoin de SDK)

---

## 📊 Taille de l'APK

### Optimisations recommandées

#### 1. Activer ProGuard (Minification)
```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

#### 2. Retirer les dépendances inutilisées
```bash
npm prune --production
```

#### 3. Optimiser les images
- Utiliser WebP au lieu de PNG
- Compresser les images
- Utiliser des icônes vectorielles (SVG)

### Taille attendue
- **APK non optimisé :** ~50-80 MB
- **APK optimisé :** ~30-50 MB
- **AAB (App Bundle) :** ~25-40 MB (recommandé pour le Play Store)

---

## 🏪 Publier sur Google Play Store

### Générer un AAB (App Bundle)
```bash
# Build AAB au lieu de APK
eas build --platform android --profile production
# Le format AAB sera automatiquement utilisé
```

### Préparer la publication
1. **Créer un compte développeur** Google Play (25$ one-time)
2. **Préparer les assets** :
   - Screenshots (2-8 images)
   - Icône haute résolution (512x512)
   - Bannière
   - Description de l'app

3. **Uploader l'AAB** sur Google Play Console
4. **Remplir les informations** de l'application
5. **Soumettre pour review**

---

## 📝 Scripts Utiles

### Script PowerShell de build automatique

Créer `build-android.ps1` :

```powershell
# Build automatique Android
Write-Host "🚀 Début du build SenePanda Android..." -ForegroundColor Green

# Vérifier les erreurs TypeScript
Write-Host "📝 Vérification TypeScript..." -ForegroundColor Yellow
npm run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreurs TypeScript détectées. Corrigez-les avant de continuer." -ForegroundColor Red
    exit 1
}

# Nettoyer le cache
Write-Host "🧹 Nettoyage du cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

# Lancer le build
Write-Host "📦 Lancement du build EAS..." -ForegroundColor Yellow
eas build --platform android --profile production

Write-Host "✅ Build terminé !" -ForegroundColor Green
Write-Host "📱 L'APK sera bientôt disponible sur expo.dev" -ForegroundColor Cyan
```

Utilisation :
```powershell
.\build-android.ps1
```

---

## 🎯 Résumé - Commande Rapide

### Pour générer l'APK maintenant :

```bash
# 1. Installer EAS (si pas déjà fait)
npm install -g eas-cli

# 2. Se connecter
eas login

# 3. Configurer (première fois uniquement)
eas build:configure

# 4. Build !
eas build --platform android --profile preview
```

**C'est tout !** 🎉

L'APK sera disponible dans ~15-20 minutes via le lien fourni.

---

**Date :** 7 décembre 2025
**App :** SenePanda v1.0.0
**Package :** com.senepanda.app
