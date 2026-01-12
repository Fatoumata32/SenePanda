# 🚀 Commandes à Exécuter MAINTENANT - Build Production APK

## ✅ Configuration Terminée!

Vos credentials Supabase ont été configurés:
- **URL**: `https://inhzfdujhuihtuykmwm.supabase.co`
- **Anon Key**: Configurée dans `eas.json` et `.env.production`

---

## 📋 Étapes à Suivre

### Étape 1: Vérifier l'Installation EAS CLI

```bash
# Installer EAS CLI si pas déjà fait
npm install -g eas-cli

# Vérifier la version
eas --version
```

### Étape 2: Se Connecter à Expo

```bash
npx expo login
```

**Ou si vous avez déjà un compte**:
```bash
# Entrez votre email et mot de passe Expo
# Si vous n'avez pas de compte, créez-en un sur https://expo.dev
```

### Étape 3: Vérifier les Dépendances

```bash
# S'assurer que les dépendances sont installées
npm install
```

### Étape 4: Vérifier qu'il n'y a pas d'erreurs TypeScript

```bash
npm run typecheck
```

**Attendu**: Pas d'erreurs critiques (les warnings sont OK)

### Étape 5: Lancer le Build Production 🚀

```bash
eas build --platform android --profile production --non-interactive
```

**Ce qui va se passer**:
1. Votre code sera uploadé vers les serveurs Expo
2. Le build Android natif sera créé (~15-25 minutes)
3. L'APK sera signée automatiquement
4. Un lien de téléchargement sera généré

**Pendant l'attente**:
- ☕ Prenez un café
- 📱 Préparez un téléphone Android pour tester
- Le terminal affichera la progression

---

## 📥 Après le Build (15-25 minutes)

### Le terminal affichera:

```
✔ Build complete!
📱 Install and run on device: https://expo.dev/artifacts/...apk
```

### Récupérer l'APK:

**Option 1: Lien Direct**
- Copier le lien affiché dans le terminal
- Format: `https://expo.dev/artifacts/eas/XXXXX.apk`
- Envoyer ce lien par WhatsApp/Email

**Option 2: Dashboard Expo**
1. Aller sur https://expo.dev
2. Se connecter
3. Ouvrir le projet "SenePanda"
4. Cliquer sur **Builds**
5. Télécharger l'APK du build le plus récent

---

## 📲 Installation sur Android

### Sur le Téléphone

1. **Ouvrir le lien sur Chrome** (téléphone Android)
2. **Télécharger l'APK** (Chrome dira "Fichier dangereux" → Cliquer OK)
3. **Ouvrir la notification** de téléchargement terminé
4. **Autoriser "Sources inconnues"** si demandé:
   - Paramètres → Sécurité → Activer "Installer des applications inconnues"
5. **Installer** l'APK
6. **Ouvrir** l'application

### Ou via USB:

1. Télécharger l'APK sur votre PC
2. Connecter le téléphone en USB
3. Copier l'APK dans le dossier Downloads du téléphone
4. Sur le téléphone: Fichiers → Downloads → Cliquer sur l'APK
5. Installer

---

## ✅ Tests à Effectuer Après Installation

### Test 1: Démarrage
- [ ] L'app s'ouvre sans crash
- [ ] Le splash screen s'affiche
- [ ] L'écran de connexion apparaît

### Test 2: Connexion Supabase
- [ ] Entrer un numéro de téléphone
- [ ] Recevoir le code de vérification
- [ ] Se connecter avec succès

### Test 3: Navigation
- [ ] Accueil → Liste des produits
- [ ] Explorer → Recherche fonctionne
- [ ] Profil → Affichage correct

### Test 4: PandaCoins (Important!)
- [ ] Le solde s'affiche dans le profil
- [ ] Tester l'ajout de coins (via Supabase SQL Editor):

```sql
-- Dans Supabase SQL Editor
SELECT award_coins(
    'VOTRE-USER-ID',  -- Remplacer par votre vrai user ID
    50,
    'test',
    'Test synchronisation production',
    NULL
);
```

- [ ] Vérifier que le solde se met à jour automatiquement (sans refresh!)

### Test 5: Réseau
- [ ] Tester avec Wi-Fi
- [ ] Désactiver Wi-Fi, tester avec 4G
- [ ] L'app fonctionne dans les deux cas

---

## 🐛 En Cas de Problème

### Problème: "Build failed"

**Vérifier**:
```bash
# Nettoyer le cache et rebuilder
eas build --platform android --profile production --clear-cache
```

### Problème: "L'app crash au démarrage"

**Vérifier**:
1. Que les credentials Supabase dans `eas.json` sont corrects
2. Que l'URL Supabase est accessible (ouvrir dans Chrome)
3. Les logs: Connecter le téléphone en USB et exécuter:
```bash
adb logcat | grep SenePanda
```

### Problème: "Connexion Supabase échoue"

**Vérifier**:
1. Les Row Level Security (RLS) policies dans Supabase
2. Que les tables ont les bonnes permissions
3. Exécuter les migrations SQL si nécessaire

---

## 📊 Commandes Utiles

### Voir tous vos builds
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

### Voir les détails d'un build
```bash
eas build:view <BUILD_ID>
```

---

## 🎉 Checklist Finale

- [x] Credentials Supabase configurés dans `eas.json`
- [x] Credentials Supabase configurés dans `.env.production`
- [ ] `npx expo login` effectué
- [ ] `npm install` effectué
- [ ] `npm run typecheck` passé (ou warnings seulement)
- [ ] `eas build --platform android --profile production` lancé
- [ ] Build terminé avec succès
- [ ] APK téléchargée
- [ ] APK installée sur Android
- [ ] Tests de base passés
- [ ] Test PandaCoins synchronisation OK
- [ ] Test réseau 4G + Wi-Fi OK

---

## 📤 Distribution

### Une fois que tout fonctionne:

1. **Partager le lien APK** par WhatsApp/Email/SMS
2. **Ou uploader l'APK** sur votre serveur/cloud
3. **Créer un guide simple** pour les utilisateurs finaux

### Pour les utilisateurs finaux:

```
📲 Installation SenePanda

1. Cliquer sur ce lien: [LIEN-APK]
2. Télécharger l'APK
3. Installer (autoriser "Sources inconnues")
4. Ouvrir l'app
5. Se connecter avec votre numéro de téléphone

Support: [VOTRE-EMAIL/TELEPHONE]
```

---

## 🚀 COMMENCEZ MAINTENANT!

```bash
# 1. Se connecter à Expo
npx expo login

# 2. Installer les dépendances
npm install

# 3. Builder l'APK
eas build --platform android --profile production --non-interactive
```

**⏱️ Temps total: ~30 minutes (dont 20 min automatiques)**

---

**Date**: 2026-01-05
**Configuration**: ✅ Terminée
**Projet**: SenePanda
**URL Supabase**: https://inhzfdujhuihtuykmwm.supabase.co
**Profil Build**: production
**Format**: APK (distribution directe)
