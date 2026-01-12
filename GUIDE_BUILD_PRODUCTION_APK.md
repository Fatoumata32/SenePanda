# 📱 Guide Complet: Build APK Production SenePanda

## 🎯 Objectif

Créer une **APK de production** installable directement sur n'importe quel téléphone Android, sans dépendance à:
- ❌ Play Store
- ❌ Expo Go
- ❌ Réseau local
- ❌ QR Code
- ✅ Fonctionne avec 4G/5G/Wi-Fi partout dans le monde

---

## ⚠️ ÉTAPE 0: Prérequis (À FAIRE AVANT)

### 1. Créer un Compte Expo
```bash
# Si pas encore fait
npx expo login
```

### 2. Vérifier le Projet EAS
```bash
# Votre projet est déjà configuré avec:
# Project ID: efb67d51-196a-420e-9f69-b9500e680ebc
```

### 3. Configurer les Variables d'Environnement

**CRITIQUE**: Remplacez les valeurs dans `eas.json` ligne 38-40:

```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://VOTRE-PROJET-REEL.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "VOTRE-VRAIE-CLE-ANON-ICI"
}
```

Pour trouver ces valeurs:
1. Aller sur https://supabase.com/dashboard
2. Ouvrir votre projet SenePanda
3. Aller dans **Settings** → **API**
4. Copier:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 🚀 ÉTAPE 1: Générer l'APK de Production

### Commande Complète

```bash
# Build APK production (SANS credentials Play Store)
eas build --platform android --profile production --non-interactive
```

### Ce qui se passe:

1. **Upload du code** vers les serveurs Expo
2. **Build Android natif** avec toutes les dépendances (Agora, ZegoCloud, etc.)
3. **Signature automatique** de l'APK par EAS
4. **Génération de l'APK** (~50-200 MB)
5. **Mise en ligne** sur les serveurs Expo pour téléchargement

⏱️ **Durée**: 15-25 minutes

### Sortie Attendue

```
✔ Build complete!
📦 APK: https://expo.dev/artifacts/eas/XXXXX.apk
```

---

## 📥 ÉTAPE 2: Télécharger l'APK

### Méthode 1: Lien Direct (Recommandé)

```bash
# La commande EAS affiche un lien direct
# Exemple: https://expo.dev/artifacts/eas/abc123def456.apk
```

1. Copier le lien
2. L'envoyer par WhatsApp/Email/Telegram
3. Ou télécharger directement depuis votre navigateur

### Méthode 2: Dashboard Expo

1. Aller sur https://expo.dev
2. Se connecter
3. Ouvrir le projet **SenePanda**
4. Cliquer sur **Builds**
5. Trouver le build le plus récent
6. Cliquer sur **Download** → **APK**

---

## 📲 ÉTAPE 3: Installer l'APK sur Android

### Sur le Téléphone Cible

#### Option A: Téléchargement Direct
1. Sur le téléphone, ouvrir **Chrome** ou **Firefox**
2. Coller le lien de l'APK
3. Télécharger l'APK
4. Android affichera: "Ce type de fichier peut endommager votre appareil"
5. Cliquer sur **OK** pour continuer
6. Une fois téléchargé, cliquer sur la notification
7. Si demandé, autoriser "Installer des applications inconnues" pour Chrome/Firefox
8. Cliquer sur **Installer**

#### Option B: Transfer USB
1. Télécharger l'APK sur votre PC
2. Connecter le téléphone en USB
3. Copier l'APK dans le dossier **Downloads** du téléphone
4. Sur le téléphone, ouvrir l'application **Fichiers**
5. Aller dans **Downloads**
6. Cliquer sur le fichier **senepanda-1.0.0.apk**
7. Autoriser "Installer des applications inconnues" si demandé
8. Cliquer sur **Installer**

#### Option C: Transfer Sans Fil (ShareIt, Xender, etc.)
1. Utiliser une app de transfert de fichiers
2. Envoyer l'APK au téléphone cible
3. Ouvrir le fichier reçu
4. Installer

---

## ✅ ÉTAPE 4: Tester l'Installation

### 1. Premier Lancement

L'application doit:
- ✅ S'ouvrir sans crash
- ✅ Afficher l'écran d'accueil/splash
- ✅ Se connecter à Supabase (vérifier avec les logs)
- ✅ Permettre l'authentification

### 2. Tests Réseau

Tester avec:
- ✅ **Wi-Fi**: Connexion normale
- ✅ **4G**: Activer les données mobiles, désactiver Wi-Fi
- ✅ **5G**: Si disponible
- ✅ **Changement de réseau**: Passer de Wi-Fi à 4G pendant l'utilisation

### 3. Tests Fonctionnels

- ✅ Authentification (Phone + PIN)
- ✅ Navigation entre les onglets
- ✅ Recherche de produits
- ✅ Ajout au panier
- ✅ Live Shopping (caméra, microphone)
- ✅ PandaCoins (affichage et synchronisation)
- ✅ Paiements

---

## 🔧 Dépannage

### Problème 1: "L'application ne s'installe pas"

**Cause**: "Installer des applications inconnues" n'est pas activé

**Solution**:
1. Aller dans **Paramètres** → **Sécurité**
2. Activer **Sources inconnues** ou **Installer des applications inconnues**
3. Autoriser pour Chrome/Fichiers/l'app utilisée

### Problème 2: "L'application crash au démarrage"

**Cause**: Variables d'environnement incorrectes

**Solution**:
1. Vérifier que `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` sont corrects dans `eas.json`
2. Rebuild l'APK avec les bonnes valeurs

### Problème 3: "Impossible de se connecter à Supabase"

**Cause**: L'application ne peut pas contacter Supabase

**Solution**:
1. Vérifier que l'URL Supabase est accessible depuis le téléphone (ouvrir dans le navigateur)
2. Vérifier que le téléphone a bien Internet
3. Vérifier les Row Level Security (RLS) policies dans Supabase

### Problème 4: "Le build EAS échoue"

**Causes possibles**:
- Dépendances incompatibles
- Erreurs TypeScript
- Problèmes de configuration

**Solution**:
```bash
# Nettoyer et réessayer
npm cache clean --force
rm -rf node_modules
npm install
eas build --platform android --profile production --clear-cache
```

---

## 📊 Commandes Utiles

### Vérifier les Builds Précédents
```bash
eas build:list
```

### Annuler un Build en Cours
```bash
eas build:cancel
```

### Build avec Logs Verbeux
```bash
eas build --platform android --profile production --non-interactive --verbose
```

### Télécharger une APK depuis un Build ID
```bash
eas build:download --id <BUILD_ID>
```

---

## 🎁 Profils de Build Disponibles

### 1. `production` (APK - Distribution Interne)
```bash
eas build --platform android --profile production
```
- ✅ APK signée
- ✅ Sans Play Store
- ✅ Installable directement
- ✅ Variables de prod

### 2. `production-aab` (AAB - Play Store)
```bash
eas build --platform android --profile production-aab
```
- ✅ Format Google Play
- ❌ Non installable directement
- ✅ Optimisé pour le store

### 3. `preview` (APK - Test Rapide)
```bash
eas build --platform android --profile preview
```
- ✅ Build plus rapide
- ✅ Pour tester rapidement
- ⚠️ Pas optimisé pour prod

---

## 🌍 Distribution à Grande Échelle

### Méthode 1: Lien Direct
- Partager le lien Expo (`https://expo.dev/artifacts/...`)
- ✅ Simple
- ⚠️ Expire après 30 jours

### Méthode 2: Hébergement Propre
```bash
# Télécharger l'APK
eas build:download --id <BUILD_ID> --output senepanda.apk

# Uploader sur votre serveur/cloud
# Exemple: AWS S3, Google Cloud Storage, Firebase Hosting
```

### Méthode 3: QR Code
1. Générer un QR code pointant vers l'APK
2. Imprimer ou partager le QR code
3. Les utilisateurs scannent et installent

### Méthode 4: Google Play (Distribution Officielle)
```bash
# 1. Build AAB
eas build --platform android --profile production-aab

# 2. Télécharger l'AAB
eas build:download --id <BUILD_ID>

# 3. Upload manuel sur Google Play Console
# Ou automatique:
eas submit --platform android
```

---

## 📝 Checklist Avant Distribution

- [ ] Variables Supabase correctes dans `eas.json`
- [ ] Test de l'APK sur au moins 3 téléphones différents
- [ ] Test avec Wi-Fi + 4G
- [ ] Test authentification
- [ ] Test Live Shopping (caméra + micro)
- [ ] Test paiement
- [ ] Test PandaCoins synchronisation
- [ ] Version correcte dans `app.config.js` (actuellement `1.0.0`)
- [ ] Icône et splash screen corrects
- [ ] Permissions Android toutes listées

---

## 🔐 Sécurité

### Ce qui est SÛRE à inclure dans l'APK:
- ✅ `EXPO_PUBLIC_SUPABASE_URL`
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Ces valeurs sont **publiques** et **prévues** pour être dans le code client.

### Ce qui NE DOIT JAMAIS être dans l'APK:
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (clé secrète backend)
- ❌ Clés API privées (Stripe secret key, etc.)
- ❌ Passwords ou secrets

**Protection**: Utilisez les **Row Level Security (RLS)** policies dans Supabase pour sécuriser vos données, pas l'obscurcissement de clés.

---

## 🚀 Commande Finale Complète

```bash
# 1. Vérifier que tout est prêt
npm install
npm run typecheck

# 2. Builder l'APK de production
eas build --platform android --profile production --non-interactive

# 3. Attendre la fin (~15-25 min)

# 4. Télécharger l'APK
# Le lien sera affiché dans la console

# 5. Tester sur un téléphone

# 6. Distribuer! 🎉
```

---

## 📞 Support

Si vous rencontrez des problèmes:

1. **Logs EAS Build**: Regarder les logs détaillés sur https://expo.dev
2. **Logs App**: Utiliser `adb logcat` sur un téléphone connecté
3. **Logs Supabase**: Vérifier les logs dans le dashboard Supabase

---

## 🎉 Résultat Final

Après avoir suivi ce guide, vous aurez:

✅ Une APK de production (~50-200 MB)
✅ Installable sur n'importe quel Android (5.0+)
✅ Fonctionnant avec 4G/5G/Wi-Fi
✅ Sans dépendance Expo Go
✅ Connectée à votre vrai Supabase production
✅ Prête pour distribution interne ou publique

**Durée totale**: ~30 minutes (dont 20 min de build)

---

**Créé le**: 2026-01-05
**Version**: 1.0.0
**Framework**: Expo ~54.0.30 + React Native 0.81.5
**Backend**: Supabase
