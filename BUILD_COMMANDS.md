# ⚡ Commandes Build Rapides - SenePanda

## 🎯 Build Production APK (Le Plus Important)

```bash
# Build APK production - Distribution directe
eas build --platform android --profile production --non-interactive
```

**Résultat**: APK installable directement sur Android
**Durée**: 15-25 minutes
**Distribution**: Lien direct ou téléchargement

---

## 📋 Configuration Requise AVANT le Build

### 1. Éditer `eas.json` (lignes 38-40)

```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://VOTRE-PROJET.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "VOTRE-CLE-ANON"
}
```

Trouver ces valeurs:
- Dashboard Supabase → Settings → API
- Project URL = `EXPO_PUBLIC_SUPABASE_URL`
- anon/public key = `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. Se Connecter à Expo

```bash
npx expo login
```

---

## 🔧 Autres Commandes Utiles

### Voir tous les builds
```bash
eas build:list
```

### Télécharger une APK spécifique
```bash
eas build:download --id <BUILD_ID>
```

### Annuler un build en cours
```bash
eas build:cancel
```

### Build avec cache nettoyé
```bash
eas build --platform android --profile production --clear-cache
```

---

## 📱 Builds Alternatifs

### Build Preview (Test Rapide)
```bash
eas build --platform android --profile preview
```
- Plus rapide
- Pour tester rapidement
- Pas optimisé pour production

### Build AAB pour Google Play
```bash
eas build --platform android --profile production-aab
```
- Format requis par Google Play Store
- Non installable directement

---

## ✅ Checklist Pré-Build

- [ ] Variables Supabase configurées dans `eas.json`
- [ ] `npx expo login` effectué
- [ ] `npm install` à jour
- [ ] Pas d'erreurs TypeScript: `npm run typecheck`

---

## 🚀 Workflow Complet

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier les erreurs
npm run typecheck

# 3. Se connecter à Expo
npx expo login

# 4. Builder
eas build --platform android --profile production --non-interactive

# 5. Attendre et noter le lien de l'APK
# Exemple: https://expo.dev/artifacts/eas/abc123.apk

# 6. Télécharger et installer sur un téléphone Android
```

---

## 📥 Installation sur Android

### Méthode 1: Lien Direct
1. Copier le lien de l'APK
2. Ouvrir sur le téléphone Android (Chrome)
3. Télécharger
4. Installer (autoriser "Sources inconnues" si demandé)

### Méthode 2: USB
1. Télécharger l'APK sur PC
2. Connecter téléphone en USB
3. Copier l'APK dans le dossier Downloads du téléphone
4. Ouvrir l'APK depuis l'application Fichiers
5. Installer

---

## ⏱️ Temps Estimés

- Configuration initiale: **5 minutes**
- Build APK: **15-25 minutes**
- Download + Installation: **2-5 minutes**
- **Total**: ~30 minutes

---

## 🔗 Liens Utiles

- Dashboard EAS: https://expo.dev
- Supabase Dashboard: https://supabase.com/dashboard
- Documentation EAS Build: https://docs.expo.dev/build/introduction/

---

**Commande la plus importante à retenir**:
```bash
eas build --platform android --profile production --non-interactive
```
