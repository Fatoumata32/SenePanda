# 🚀 Build APK - Guide Rapide

## ⚡ Méthode la Plus Rapide

### Option 1 : Script Automatique (Recommandé)
```powershell
# Lancer le script interactif
.\build-android.ps1
```

Le script va :
- ✅ Vérifier EAS CLI (et l'installer si nécessaire)
- ✅ Vérifier TypeScript
- ✅ Nettoyer le cache
- ✅ Vous demander le type de build
- ✅ Lancer le build

---

### Option 2 : Commandes NPM
```bash
# Build de développement (APK)
npm run build:android:dev

# Build de production (APK optimisé)
npm run build:android:prod

# Build local (plus rapide si Docker installé)
npm run build:android:local
```

---

### Option 3 : Commandes EAS Directes
```bash
# 1. Installer EAS (si pas déjà fait)
npm install -g eas-cli

# 2. Se connecter
eas login

# 3. Build !
eas build --platform android --profile preview
```

---

## 📥 Où Télécharger l'APK ?

Après le build, vous aurez **3 façons** de récupérer l'APK :

1. **Lien dans le terminal** - Cliquez sur le lien fourni
2. **Email** - Vérifiez votre boîte mail
3. **Expo Dashboard** - https://expo.dev/accounts/[votre-compte]/builds

---

## ⏱️ Temps de Build

- **Build cloud :** 10-20 minutes
- **Build local :** 5-10 minutes (nécessite Docker)

---

## 🐛 Problèmes ?

### "eas: command not found"
```bash
npm install -g eas-cli
```

### "No Expo account found"
```bash
eas login
```

### Build échoue
```bash
# Nettoyer et réessayer
rm -rf node_modules/.cache .expo
npm run typecheck
eas build --platform android --profile preview
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez : **`GUIDE_GENERATION_APK.md`**

---

## 🎯 Résumé Ultra-Rapide

```bash
# Installation (une seule fois)
npm install -g eas-cli
eas login
eas build:configure

# Build APK
eas build --platform android --profile preview
```

**C'est tout !** 🎉

---

**App :** SenePanda v1.0.0
**Package :** com.senepanda.app
