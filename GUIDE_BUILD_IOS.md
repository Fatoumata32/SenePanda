# 📱 GUIDE DE BUILD iOS - SENEPANDA

Version: 1.0.0
Date: Janvier 2025
Plateforme: iOS (iPhone & iPad)

---

## 📋 TABLE DES MATIÈRES

1. Prérequis
2. Configuration du compte Apple
3. Build pour tests (Preview)
4. Build pour production (App Store)
5. Installation sur iPhone
6. Troubleshooting
7. Coûts et limitations

---

## 1. PRÉREQUIS

### ✅ Compte requis

**Compte Expo** (gratuit)
- Créer sur [expo.dev](https://expo.dev)
- Vous avez déjà un Project ID: `efb67d51-196a-420e-9f69-b9500e680ebc`

**Compte Apple Developer** (99$/an)
- Nécessaire pour:
  - Distribuer sur l'App Store
  - Installer sur vrais iPhones (pas simulateur)
  - TestFlight (beta testing)
- Créer sur [developer.apple.com](https://developer.apple.com)

### ✅ Logiciels nécessaires

```bash
# Installer EAS CLI   
npm install -g eas-cli

# Vérifier installation
eas --version
# Devrait afficher: eas-cli/x.x.x

# Se connecter à Expo
eas login
# Entrer vos identifiants expo.dev
```

### ✅ Configuration actuelle

Votre projet est déjà configuré avec:
- ✅ Bundle ID: `com.senepanda.app`
- ✅ Nom: SenePanda
- ✅ Version: 1.0.0
- ✅ Icône: `./assets/images/icon.png`
- ✅ Permissions: Caméra, Micro, Localisation

---

## 2. CONFIGURATION DU COMPTE APPLE

### Étape 1: Créer un App ID

1. Aller sur [developer.apple.com/account](https://developer.apple.com/account)
2. Cliquer sur **Certificates, IDs & Profiles**
3. Cliquer sur **Identifiers** → **+** (nouveau)
4. Choisir **App IDs** → Continue
5. Remplir:
   - **Description**: SenePanda
   - **Bundle ID**: `com.senepanda.app` (EXACT)
   - **Capabilities** à activer:
     - ✅ Push Notifications
     - ✅ Associated Domains
     - ✅ Sign in with Apple (si utilisé)
6. Continue → Register

### Étape 2: Créer l'app sur App Store Connect

1. Aller sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Cliquer sur **My Apps** → **+** → **New App**
3. Remplir:
   - **Platform**: iOS
   - **Name**: SenePanda
   - **Primary Language**: French
   - **Bundle ID**: `com.senepanda.app`
   - **SKU**: senepanda-001 (unique)
   - **User Access**: Full Access
4. Create

---

## 3. BUILD POUR TESTS (PREVIEW)

### Option A: Simulateur iOS (Mac uniquement)

**Pour tester sur le simulateur Xcode (gratuit, pas de compte Apple requis)**

```bash
# Build pour simulateur
eas build --platform ios --profile preview

# Questions posées:
# ✓ Generate a new Apple Distribution Certificate? → Yes
# ✓ Generate a new Apple Provisioning Profile? → Yes

# Le build prend 15-20 minutes
# Vous recevrez un lien de téléchargement
```

**Installation sur simulateur:**
```bash
# 1. Télécharger le fichier .tar.gz depuis le lien
# 2. Extraire pour obtenir .app
# 3. Glisser-déposer le .app dans le simulateur Xcode
```

### Option B: TestFlight (vrais iPhones)

**Pour distribuer à des testeurs avec compte Apple Developer**

```bash
# Build pour TestFlight
eas build --platform ios --profile production

# Questions posées:
# ✓ Log in to your Apple account? → Yes (entrer email Apple Developer)
# ✓ Select a team → Choisir votre équipe
# ✓ Generate a new Apple Distribution Certificate? → Yes
# ✓ Generate a new Apple Provisioning Profile? → Yes

# Build prend 15-20 minutes
# Le build sera automatiquement uploadé sur TestFlight
```

**Ajouter des testeurs:**
1. App Store Connect → TestFlight
2. Cliquer sur votre app **SenePanda**
3. **Internal Testing** ou **External Testing**
4. Ajouter testeurs par email
5. Ils reçoivent invitation TestFlight

---

## 4. BUILD POUR PRODUCTION (APP STORE)

### Étape 1: Préparer les assets

**Screenshots requis (à créer):**
- iPhone 6.7" (iPhone 15 Pro Max): 1290 x 2796 px
- iPhone 6.5" (iPhone 11 Pro Max): 1284 x 2778 px
- iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 px
- iPad Pro 12.9": 2048 x 2732 px

**Icône app:**
- 1024 x 1024 px
- Format PNG sans transparence
- Déjà configuré: `./assets/images/icon.png`

### Étape 2: Créer le build de production

```bash
# Build production
eas build --platform ios --profile production

# Options supplémentaires:
# --auto-submit : Soumet automatiquement à l'App Store
# --no-wait : Continue sans attendre la fin du build

# Exemple avec auto-submit:
eas build --platform ios --profile production --auto-submit
```

### Étape 3: Soumettre à l'App Store

**Si pas utilisé --auto-submit:**

```bash
# Soumettre manuellement
eas submit --platform ios

# Ou via App Store Connect:
```

1. App Store Connect → My Apps → SenePanda
2. **+ Version or Platform** → iOS
3. Version: 1.0.0
4. Remplir les informations:

**App Information:**
- **Name**: SenePanda
- **Subtitle**: Marketplace Live Shopping au Sénégal
- **Category**: Shopping
- **Secondary Category**: Social Networking

**Pricing:**
- **Price**: Free
- **Availability**: Sénégal (ou tous les pays)

**App Privacy:**
- Déclarer les données collectées:
  - ✅ Location (pour vendeurs à proximité)
  - ✅ Camera/Photos (pour Live Shopping)
  - ✅ Contact Info (email, téléphone)
  - ✅ Purchase History

**Version Information:**
- **Screenshots**: Uploader 3-5 screenshots par taille
- **Description**:
```
SenePanda est la première marketplace sénégalaise avec Live Shopping intégré.

🛍️ FONCTIONNALITÉS PRINCIPALES:
• Acheter et vendre des produits en toute sécurité
• Live Shopping: Présentations produits en direct
• Paiement Mobile Money (Orange, Wave, Free)
• Géolocalisation des vendeurs
• Système de points et récompenses
• Chat en temps réel pendant les lives

📺 LIVE SHOPPING:
Regardez des vendeurs présenter leurs produits en direct comme dans un marché traditionnel. Posez vos questions, réagissez et achetez directement pendant le live.

💰 PAIEMENTS LOCAUX:
Orange Money, Wave, Free Money et carte bancaire pour un paiement facile et sécurisé.

🎁 SYSTÈME DE POINTS:
Gagnez des points à chaque achat, connexion quotidienne et interaction. Débloquez des badges exclusifs.

📍 VENDEURS À PROXIMITÉ:
Trouvez facilement les vendeurs près de chez vous grâce à la géolocalisation.

Rejoignez la communauté SenePanda dès aujourd'hui ! 🐼
```

- **Keywords**: marketplace,shopping,senegal,live,video,mobile money,wave,orange money,ecommerce
- **Support URL**: https://senepanda.com/support
- **Marketing URL**: https://senepanda.com
- **What's New**: Première version de SenePanda avec Live Shopping

5. **Submit for Review**

---

## 5. INSTALLATION SUR IPHONE

### Méthode 1: TestFlight (Recommandé)

**Pour testeurs internes/externes:**

1. Testeur reçoit email d'invitation
2. Télécharge **TestFlight** depuis App Store
3. Ouvre le lien d'invitation
4. Installe **SenePanda**
5. Lance l'app

**Limites TestFlight:**
- Max 10,000 testeurs externes
- Max 100 testeurs internes
- Build expire après 90 jours

### Méthode 2: Simulateur (Mac uniquement)

```bash
# 1. Lancer simulateur Xcode
open -a Simulator

# 2. Télécharger le .tar.gz du build
# 3. Extraire pour obtenir SenePanda.app
tar -xzf senepanda-build.tar.gz

# 4. Installer sur simulateur
xcrun simctl install booted /path/to/SenePanda.app

# 5. Lancer
xcrun simctl launch booted com.senepanda.app
```

### Méthode 3: App Store (Production)

1. App approuvée par Apple Review (7-14 jours)
2. Disponible sur App Store
3. Rechercher "SenePanda"
4. Télécharger gratuitement

---

## 6. TROUBLESHOOTING

### ❌ Erreur: "Apple account not found"

**Solution:**
```bash
# Se connecter à Apple
eas credentials

# Choisir iOS → Apple ID → Add new
# Entrer email et mot de passe Apple Developer
```

### ❌ Erreur: "Bundle identifier is already in use"

**Cause:** Un autre développeur a déjà enregistré `com.senepanda.app`

**Solution:**
```javascript
// Changer dans app.config.js
ios: {
  bundleIdentifier: "com.votrenomsociete.senepanda"
}
```

Puis recréer l'App ID sur developer.apple.com

### ❌ Erreur: "Provisioning profile doesn't include signing certificate"

**Solution:**
```bash
# Supprimer credentials existantes
eas credentials

# iOS → Distribution Certificate → Remove
# iOS → Provisioning Profile → Remove

# Rebuild pour régénérer
eas build --platform ios --profile production --clear-cache
```

### ❌ Build échoue avec "Agora SDK not found"

**Cause:** react-native-agora nécessite configuration native

**Solution 1 - Development Build:**
```bash
# Créer un development build
eas build --platform ios --profile development

# Installer sur iPhone via câble USB
```

**Solution 2 - Retirer temporairement:**
```javascript
// Dans package.json, commenter:
// "react-native-agora": "^4.5.3",

// Rebuild
npm install
eas build --platform ios --profile production
```

### ❌ Erreur: "Apple Developer account required"

**Cause:** Vous n'avez pas de compte Apple Developer actif

**Solutions:**
1. **Payer 99$/an** pour compte Developer
2. **Utiliser Expo Go** (limitations, pas de modules natifs)
3. **Development build local** (Mac + Xcode requis)

### ❌ App rejetée par Apple Review

**Raisons fréquentes:**
- **2.1 Crash au lancement**: Tester avec TestFlight avant
- **4.0 Spam**: App incomplète ou placeholder
- **5.1.1 Paiements**: Vérifier conformité Mobile Money

**Solution:**
1. Lire le message de rejet
2. Corriger le problème
3. Re-soumettre avec notes explicatives

---

## 7. COÛTS ET LIMITATIONS

### Coûts

| Service | Prix | Fréquence |
|---------|------|-----------|
| **Compte Expo** | Gratuit | - |
| **Compte Apple Developer** | 99 USD | /an |
| **EAS Build (Expo)** | Gratuit* | - |

*Gratuit jusqu'à certaines limites, puis plans payants

### Limitations

**Expo Go (gratuit):**
- ❌ Pas de modules natifs (Agora SDK)
- ❌ Pas de customisation poussée
- ✅ Test rapide sans build

**Development Build (gratuit avec compte Apple):**
- ✅ Tous les modules natifs
- ✅ Customisation complète
- ⚠️ Nécessite Mac + Xcode pour build local

**TestFlight:**
- ✅ Distribution facile
- ⚠️ Max 90 jours par build
- ⚠️ Max 10,000 testeurs

**App Store:**
- ✅ Distribution mondiale
- ⚠️ Délai review 7-14 jours
- ⚠️ Frais annuels 99 USD

---

## 8. COMMANDES RAPIDES

```bash
# Build preview (simulateur)
npm run build:ios:dev
# OU
eas build --platform ios --profile preview

# Build production (TestFlight + App Store)
npm run build:ios:prod
# OU
eas build --platform ios --profile production

# Build avec auto-submit App Store
eas build --platform ios --profile production --auto-submit

# Vérifier statut du build
eas build:list

# Voir les credentials
eas credentials

# Soumettre à l'App Store (après build)
eas submit --platform ios
```

---

## 9. CHECKLIST AVANT BUILD

### Avant premier build:

- [ ] Compte Expo créé et connecté (`eas login`)
- [ ] Compte Apple Developer actif (99$/an)
- [ ] App ID créé sur developer.apple.com
- [ ] App créée sur App Store Connect
- [ ] Variables d'environnement configurées (.env)
- [ ] Icône app prête (1024x1024 PNG)
- [ ] Permissions iOS vérifiées (app.config.js)

### Avant build production:

- [ ] Version incrémentée dans app.config.js
- [ ] Screenshots préparés (toutes tailles)
- [ ] Description App Store rédigée
- [ ] Keywords définis
- [ ] Politique de confidentialité publiée
- [ ] Conditions d'utilisation publiées
- [ ] Support email/site configuré
- [ ] App testée via TestFlight
- [ ] Tous les crashs résolus

---

## 10. NEXT STEPS RECOMMANDÉS

### 1. Build de test (aujourd'hui)
```bash
# Créer un build simulateur pour tester
eas build --platform ios --profile preview

# Temps estimé: 20 minutes
# Coût: Gratuit
```

### 2. TestFlight (cette semaine)
```bash
# Créer build pour vrais iPhones
eas build --platform ios --profile production

# Ajouter 5-10 testeurs
# Collecter feedback
```

### 3. App Store (semaine prochaine)
```bash
# Préparer assets (screenshots, description)
# Soumettre pour review
# Attendre approbation (7-14 jours)
```

---

## 📞 SUPPORT

**Questions sur EAS:**
- Docs: https://docs.expo.dev/build/introduction/
- Forum: https://forums.expo.dev/

**Questions sur App Store:**
- Apple Developer Forums: https://developer.apple.com/forums/
- App Store Connect Help: https://help.apple.com/app-store-connect/

**Questions SenePanda:**
- Tech: tech@senepanda.com
- Docs: Voir DOCUMENTATION_TECHNIQUE_TEXTE.md

---

## ✅ READY TO BUILD!

Votre projet est **prêt pour le build iOS**. Configuration vérifiée:

✅ Bundle ID: com.senepanda.app
✅ Permissions: Caméra, Micro, Localisation
✅ EAS configuré avec Project ID
✅ Scripts de build définis

**Commande pour démarrer:**
```bash
eas build --platform ios --profile preview
```

Bonne chance avec votre build ! 🚀📱
