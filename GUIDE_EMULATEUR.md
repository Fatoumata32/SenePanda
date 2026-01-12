# 🔧 Guide de Dépannage - Émulateur

## 🎯 Problème : Émulateur ne fonctionne pas

---

## ✅ SOLUTION RAPIDE (2 minutes)

### Étape 1 : Tuer les processus en cours

```bash
# Windows PowerShell
netstat -ano | findstr :8081
# Notez le PID (ex: 15688)

taskkill //F //PID 15688
```

### Étape 2 : Nettoyer le cache

```bash
# Supprimer les caches
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

# Relancer
npx expo start --clear
```

---

## 📱 Options pour Tester l'Application

### Option 1 : Expo Go sur Téléphone (RECOMMANDÉ)

**Avantages :**
- ✅ Le plus simple et rapide
- ✅ Pas besoin d'émulateur
- ✅ Performances réelles

**Instructions :**
1. Télécharger **Expo Go** :
   - Android : https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS : https://apps.apple.com/app/expo-go/id982107779

2. Lancer Expo :
   ```bash
   npx expo start
   ```

3. Scanner le QR code avec :
   - **Android :** App Expo Go
   - **iOS :** App Appareil photo → ouvrir dans Expo Go

---

### Option 2 : Émulateur Android

**Prérequis :**
- Android Studio installé
- Un AVD (Android Virtual Device) créé

**Instructions :**

1. **Démarrer l'émulateur Android Studio**
   - Ouvrir Android Studio
   - Tools → AVD Manager
   - Cliquer sur ▶️ Play sur votre émulateur

2. **Vérifier que l'émulateur est détecté**
   ```bash
   adb devices
   # Devrait afficher : emulator-5554    device
   ```

3. **Lancer Expo**
   ```bash
   npx expo start
   ```

4. **Dans le terminal Expo, appuyer sur `a`**
   - Ou cliquer sur "Run on Android device/emulator"

---

### Option 3 : Simulateur iOS (Mac uniquement)

**Prérequis :**
- macOS
- Xcode installé

**Instructions :**

1. **Ouvrir le simulateur**
   ```bash
   open -a Simulator
   ```

2. **Lancer Expo**
   ```bash
   npx expo start
   ```

3. **Dans le terminal Expo, appuyer sur `i`**
   - Ou cliquer sur "Run on iOS simulator"

---

### Option 4 : Web Browser

**Le plus simple pour tester rapidement**

```bash
npx expo start
```

Puis appuyer sur `w` ou cliquer "Open in web browser"

**Note :** Certaines fonctionnalités natives (GPS, caméra) ne fonctionneront pas.

---

## 🚨 Problèmes Courants

### Problème 1 : Port 8081 déjà utilisé

**Erreur :**
```
Port 8081 is being used by another process
```

**Solution :**
```bash
# Trouver le processus
netstat -ano | findstr :8081

# Tuer le processus (remplacer PID)
taskkill //F //PID <PID>

# Relancer
npx expo start --clear
```

---

### Problème 2 : Émulateur Android ne se connecte pas

**Solutions :**

**A. Vérifier ADB**
```bash
adb devices

# Si vide, redémarrer ADB
adb kill-server
adb start-server
```

**B. Redémarrer l'émulateur**
- Fermer complètement l'émulateur
- Relancer depuis Android Studio

**C. Utiliser un port différent**
```bash
npx expo start --port 8082
```

---

### Problème 3 : QR Code ne s'affiche pas

**Solution :**
```bash
# Forcer le mode LAN
npx expo start --lan

# Ou mode tunnel (plus lent mais fonctionne toujours)
npx expo start --tunnel
```

---

### Problème 4 : "Unable to resolve module"

**Erreur :**
```
error: Error: Unable to resolve module @/...
```

**Solution :**
```bash
# Nettoyer complètement
rm -rf node_modules
rm package-lock.json
npm install
npx expo start --clear
```

---

### Problème 5 : Packages incompatibles

**Erreur visible :**
```
The following packages should be updated for best compatibility
```

**Solution :**
```bash
# Mettre à jour les packages Expo
npx expo install --fix

# Ou manuellement
npm install expo@latest expo-router@latest
```

---

## 🔥 RÉINITIALISATION COMPLÈTE

Si rien ne fonctionne, réinitialisation totale :

```bash
# 1. Tuer tous les processus
tasklist | findstr node
tasklist | findstr expo
# Tuer tous les PID trouvés

# 2. Supprimer tous les caches
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist %TEMP%\metro-* rmdir /s /q %TEMP%\metro-*
if exist %TEMP%\react-native-* rmdir /s /q %TEMP%\react-native-*

# 3. Réinstaller
rm -rf node_modules
rm package-lock.json
npm install

# 4. Relancer
npx expo start --clear
```

---

## 📊 Commandes Utiles

### Expo Dev Tools

```bash
# Démarrer normalement
npx expo start

# Nettoyer le cache
npx expo start --clear

# Mode LAN (pour appareils sur même réseau)
npx expo start --lan

# Mode Tunnel (fonctionne partout, plus lent)
npx expo start --tunnel

# Choisir un port spécifique
npx expo start --port 8082

# Mode développement Android
npx expo start --android

# Mode développement iOS
npx expo start --ios

# Mode web
npx expo start --web
```

### Raccourcis Terminal Expo

Une fois Expo démarré, dans le terminal :

- `a` - Ouvrir sur Android
- `i` - Ouvrir sur iOS
- `w` - Ouvrir sur Web
- `r` - Recharger l'app
- `m` - Basculer menu
- `c` - Afficher logs
- `d` - Afficher outils dev

---

## 🎯 Ma Recommandation

**Pour développement quotidien :**
```bash
npx expo start
```
Puis scanner le QR code avec **Expo Go** sur votre téléphone.

**Pourquoi ?**
- ✅ Performances réelles
- ✅ Toutes les fonctionnalités natives marchent (GPS, caméra, etc.)
- ✅ Pas de problèmes d'émulateur
- ✅ Hot reload rapide

---

## 🔍 Vérifier que tout fonctionne

### Checklist Avant de Tester

- [ ] Node.js installé (`node --version`)
- [ ] Expo installé (`npx expo --version`)
- [ ] Dépendances installées (`npm install`)
- [ ] .env configuré avec clés Supabase
- [ ] Port 8081 libre
- [ ] Expo Go installé sur téléphone OU émulateur démarré

### Test Minimal

```bash
# 1. Lancer Expo
npx expo start

# 2. Vérifier dans le terminal :
# ✅ "Logs for your project will appear below"
# ✅ QR code visible
# ✅ "Metro waiting on..."

# 3. Scanner le QR code ou appuyer sur 'a'/'i'

# 4. L'app devrait se charger
```

---

## 📱 Expo Go - Installation

### Android

1. Ouvrir Play Store
2. Chercher "Expo Go"
3. Installer
4. Ouvrir l'app
5. Scanner le QR code depuis le terminal

### iOS

1. Ouvrir App Store
2. Chercher "Expo Go"
3. Installer
4. Ouvrir l'app Appareil photo
5. Scanner le QR code
6. Cliquer "Ouvrir dans Expo Go"

---

## 🆘 Logs de Débogage

### Voir les logs détaillés

```bash
# Logs Metro Bundler
npx expo start --clear

# Logs ADB (Android)
adb logcat | grep "ReactNative"

# Logs en temps réel
npx expo start --clear --verbose
```

### Fichiers de log

- Expo logs : `.expo/`
- Metro cache : `node_modules/.cache/`
- Système : `%TEMP%/expo-*`

---

## ✅ État Actuel de Votre Projet

**Serveur Expo :** ✅ Démarré sur http://localhost:8081

**Packages à mettre à jour (optionnel) :**
```bash
npm install expo@~54.0.25
npm install expo-camera@~17.0.9
npm install expo-linking@~8.0.9
npm install expo-router@~6.0.15
npm install expo-splash-screen@~31.0.11
npm install expo-web-browser@~15.0.9
```

Ou simplement :
```bash
npx expo install --fix
```

---

## 🎉 Prochaines Étapes

1. **Si vous utilisez Expo Go (téléphone) :**
   - Scanner le QR code qui apparaît dans votre terminal
   - L'app devrait se charger

2. **Si vous utilisez un émulateur :**
   - Démarrer l'émulateur Android/iOS
   - Appuyer sur `a` (Android) ou `i` (iOS) dans le terminal Expo

3. **Tester l'application :**
   - Vérifier que tout fonctionne
   - Exécuter le script SQL dans Supabase
   - Profiter de toutes les nouvelles fonctionnalités !

---

**Le serveur Expo tourne ! Scanner le QR code pour commencer ! 📱**
