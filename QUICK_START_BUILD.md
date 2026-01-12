# ⚡ Quick Start - Build Production APK

## 🎯 En 3 Commandes

```bash
# 1. Se connecter à Expo
npx expo login

# 2. Modifier eas.json lignes 38-40 avec vos credentials Supabase
# → Voir CONFIG_PRODUCTION.md pour les détails

# 3. Builder l'APK
eas build --platform android --profile production --non-interactive
```

**C'est tout! ✅**

---

## 📝 Ce Qu'il Faut Modifier

### Fichier: `eas.json` (lignes 38-40)

**REMPLACER**:
```json
"EXPO_PUBLIC_SUPABASE_URL": "https://YOUR-PROJECT.supabase.co"
"EXPO_PUBLIC_SUPABASE_ANON_KEY": "YOUR-ANON-KEY-HERE"
```

**PAR vos vraies valeurs** de https://supabase.com/dashboard → Settings → API

---

## ⏱️ Temps Total: ~30 minutes

- Configuration: 2 min
- Build (automatique): 20 min
- Téléchargement: 1 min
- Installation test: 2 min

---

## 📥 Après le Build

Le terminal affichera:

```
✔ Build complete!
📦 https://expo.dev/artifacts/eas/abc123xyz.apk
```

**→ Copier ce lien et l'envoyer par WhatsApp/Email**

Ou télécharger l'APK depuis https://expo.dev

---

## 📲 Installation sur Android

1. Ouvrir le lien sur le téléphone Android (Chrome)
2. Télécharger l'APK
3. Installer (autoriser "Sources inconnues" si demandé)
4. Ouvrir l'app

---

## 📚 Documentation Complète

- **[README_BUILD_PRODUCTION.md](README_BUILD_PRODUCTION.md)** - Vue d'ensemble
- **[CONFIG_PRODUCTION.md](CONFIG_PRODUCTION.md)** - Configuration Supabase
- **[CHECKLIST_BUILD_PRODUCTION.md](CHECKLIST_BUILD_PRODUCTION.md)** - Checklist détaillée
- **[BUILD_COMMANDS.md](BUILD_COMMANDS.md)** - Référence des commandes

---

## ✅ Checklist Ultra-Rapide

- [ ] `npx expo login` fait
- [ ] `eas.json` modifié (lignes 38-40)
- [ ] Valeurs Supabase réelles (pas "YOUR-PROJECT")
- [ ] `eas build --platform android --profile production` lancé
- [ ] APK téléchargée
- [ ] APK installée et testée sur Android

---

**Questions? → Lire [README_BUILD_PRODUCTION.md](README_BUILD_PRODUCTION.md)**

**Date**: 2026-01-05
