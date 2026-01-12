# ✅ Checklist Build Production APK - SenePanda

## 📋 AVANT DE COMMENCER

### ⚠️ CRITIQUE: Configuration Supabase

- [ ] Ouvrir https://supabase.com/dashboard
- [ ] Sélectionner le projet SenePanda
- [ ] Aller dans **Settings** → **API**
- [ ] Copier **Project URL** (exemple: `https://xyzabc.supabase.co`)
- [ ] Copier **anon public** (commence par `eyJ...`)
- [ ] Ouvrir le fichier `eas.json` dans le projet
- [ ] Remplacer ligne 39: `"EXPO_PUBLIC_SUPABASE_URL": "https://VOTRE-URL.supabase.co"`
- [ ] Remplacer ligne 40: `"EXPO_PUBLIC_SUPABASE_ANON_KEY": "VOTRE-CLE-ICI"`
- [ ] Sauvegarder `eas.json`

**❌ NE PAS utiliser les valeurs par défaut "YOUR-PROJECT" et "YOUR-ANON-KEY-HERE"**

---

## 🔧 PRÉPARATION

### Installation et Vérification

- [ ] Ouvrir un terminal dans le dossier du projet
- [ ] Exécuter: `npm install`
- [ ] Exécuter: `npm run typecheck` (doit passer sans erreurs)
- [ ] Exécuter: `npx expo login`
- [ ] Entrer vos identifiants Expo (email + mot de passe)

---

## 🚀 BUILD

### Lancer le Build Production

- [ ] Exécuter: `eas build --platform android --profile production --non-interactive`
- [ ] Attendre le message: "Queued build"
- [ ] Noter l'URL du build (exemple: `https://expo.dev/builds/abc-123`)
- [ ] Attendre 15-25 minutes ⏱️

### Pendant l'Attente

Vous pouvez:
- ☕ Prendre un café
- 📊 Vérifier le dashboard Supabase
- 📱 Préparer le téléphone de test
- 📄 Lire la documentation Live Shopping

### Fin du Build

- [ ] Terminal affiche: "✔ Build complete!"
- [ ] Copier le lien de l'APK (exemple: `https://expo.dev/artifacts/eas/xyz789.apk`)
- [ ] OU aller sur https://expo.dev → Builds → Télécharger l'APK

---

## 📥 TÉLÉCHARGEMENT

### Option A: Dashboard Expo

- [ ] Aller sur https://expo.dev
- [ ] Se connecter
- [ ] Ouvrir le projet SenePanda
- [ ] Cliquer sur **Builds**
- [ ] Trouver le build le plus récent (statut: "Finished")
- [ ] Cliquer sur **Download** → **Application (.apk)**
- [ ] Sauvegarder le fichier (exemple: `senepanda-1.0.0.apk`)

### Option B: Lien Direct

- [ ] Copier le lien affiché dans le terminal
- [ ] Ouvrir dans le navigateur
- [ ] Télécharger le fichier APK

---

## 📲 INSTALLATION SUR ANDROID

### Sur le Téléphone de Test

#### Méthode 1: Téléchargement Direct

- [ ] Sur le téléphone Android, ouvrir Chrome
- [ ] Coller le lien de l'APK
- [ ] Télécharger (Chrome dira "Ce fichier peut être dangereux" → **OK**)
- [ ] Une fois téléchargé, notification apparaît → Cliquer dessus
- [ ] Si demandé: Autoriser "Installer des applications inconnues" pour Chrome
- [ ] Cliquer sur **Installer**
- [ ] Attendre l'installation (5-10 secondes)
- [ ] Cliquer sur **Ouvrir**

#### Méthode 2: Transfert USB

- [ ] Connecter le téléphone au PC avec un câble USB
- [ ] Sélectionner "Transfert de fichiers" sur le téléphone
- [ ] Copier le fichier APK dans le dossier **Download** du téléphone
- [ ] Sur le téléphone, ouvrir l'application **Fichiers**
- [ ] Aller dans **Téléchargements**
- [ ] Cliquer sur le fichier APK
- [ ] Autoriser "Installer des applications inconnues" si demandé
- [ ] Installer

---

## ✅ TESTS DE VALIDATION

### Test 1: Premier Lancement

- [ ] L'app s'ouvre sans crash
- [ ] Le splash screen s'affiche
- [ ] L'écran de connexion apparaît
- [ ] Pas de message d'erreur dans les 10 premières secondes

### Test 2: Authentification

- [ ] Entrer un numéro de téléphone (format: +221 XX XXX XX XX)
- [ ] Recevoir le code de vérification
- [ ] Entrer le code
- [ ] Créer ou entrer le PIN
- [ ] Arriver sur l'écran d'accueil

### Test 3: Navigation

- [ ] Cliquer sur **Accueil** → Affichage des produits
- [ ] Cliquer sur **Explorer** → Recherche fonctionne
- [ ] Cliquer sur **Lives** → Liste des lives actifs
- [ ] Cliquer sur **Profil** → Affichage des infos utilisateur

### Test 4: PandaCoins

- [ ] Le solde de PandaCoins s'affiche dans le profil
- [ ] Pas de "0 coins" si l'utilisateur en a déjà
- [ ] Tester: Ajouter des coins via Supabase (fonction `award_coins`)
- [ ] Vérifier que le solde se met à jour automatiquement (sans refresh)

### Test 5: Réseau

- [ ] Tester avec **Wi-Fi** uniquement → Fonctionne ✅
- [ ] Désactiver Wi-Fi, activer **4G** → Fonctionne ✅
- [ ] Passer de Wi-Fi à 4G pendant l'utilisation → Pas de crash ✅

### Test 6: Live Shopping (Important)

- [ ] Aller dans "Ma Boutique" (si vendeur)
- [ ] Cliquer sur "Démarrer un Live"
- [ ] Autoriser caméra et microphone
- [ ] La caméra s'active
- [ ] Le live démarre sans erreur
- [ ] Arrêter le live → Fonctionne

### Test 7: Permissions

Au premier lancement, l'app doit demander:
- [ ] Localisation
- [ ] Caméra (quand on utilise Live Shopping)
- [ ] Microphone (quand on utilise Live Shopping)
- [ ] Stockage (quand on upload une photo)

---

## 🐛 DÉPANNAGE

### Problème: "Impossible d'installer"

**Solution**:
- [ ] Aller dans **Paramètres** → **Sécurité**
- [ ] Activer **Installer des applications inconnues**
- [ ] Autoriser pour Chrome ou Fichiers

### Problème: "L'app crash au démarrage"

**Cause probable**: Variables Supabase incorrectes

**Solution**:
- [ ] Vérifier `eas.json` lignes 39-40
- [ ] S'assurer que les URLs et clés sont correctes
- [ ] Rebuilder: `eas build --platform android --profile production`

### Problème: "Connexion à Supabase échoue"

**Solution**:
- [ ] Vérifier que l'URL Supabase est accessible (ouvrir dans Chrome)
- [ ] Vérifier que le téléphone a bien Internet
- [ ] Vérifier les RLS policies dans Supabase

### Problème: "Le build EAS échoue"

**Solution**:
- [ ] Nettoyer le cache: `eas build --clear-cache`
- [ ] Supprimer node_modules: `rm -rf node_modules`
- [ ] Réinstaller: `npm install`
- [ ] Rebuilder

---

## 📊 MÉTRIQUES DE SUCCÈS

### Installation

- [ ] APK installée sur au moins 3 téléphones différents
- [ ] Tailles de l'APK: 50-200 MB (normal)
- [ ] Temps d'installation: 5-15 secondes

### Performance

- [ ] Temps de démarrage: < 5 secondes
- [ ] Navigation fluide (pas de lag)
- [ ] Recherche réactive (< 1 seconde)

### Connexion

- [ ] Fonctionne avec Wi-Fi ✅
- [ ] Fonctionne avec 4G ✅
- [ ] Fonctionne avec 5G ✅
- [ ] Pas de dépendance réseau local ✅

---

## 🎉 BUILD RÉUSSIE SI...

- [x] APK générée et téléchargée
- [x] Installation réussie sur Android
- [x] L'app s'ouvre sans crash
- [x] Authentification fonctionne
- [x] Navigation fonctionne
- [x] PandaCoins se synchronisent en temps réel
- [x] Live Shopping démarre (caméra + micro)
- [x] Fonctionne avec 4G et Wi-Fi

**🎊 Félicitations! Votre APK de production est prête à être distribuée!**

---

## 📤 DISTRIBUTION

### Distribution Interne (< 100 personnes)

- [ ] Partager le lien direct de l'APK par WhatsApp/Email
- [ ] Créer un QR code pointant vers l'APK
- [ ] Envoyer des instructions d'installation

### Distribution Large (> 100 personnes)

- [ ] Uploader l'APK sur votre propre serveur/cloud
- [ ] Ou publier sur Google Play Store (nécessite build AAB)

---

## 🔄 MISES À JOUR FUTURES

### Pour publier une nouvelle version:

1. [ ] Modifier `version` dans `app.config.js` (exemple: `1.0.0` → `1.0.1`)
2. [ ] Faire les modifications de code nécessaires
3. [ ] Rebuilder: `eas build --platform android --profile production`
4. [ ] Redistribuer la nouvelle APK

**Note**: Les utilisateurs devront désinstaller l'ancienne version et installer la nouvelle (sauf si vous utilisez EAS Update ou Google Play).

---

**Temps Total Estimé**:
- Configuration: 5 minutes
- Build: 20 minutes
- Tests: 15 minutes
- **Total**: ~40 minutes

**Date de création**: 2026-01-05
**Version du guide**: 1.0
