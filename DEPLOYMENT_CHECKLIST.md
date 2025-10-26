# 🚀 CHECKLIST COMPLÈTE DE DÉPLOIEMENT - SENEPANDA

## 📋 PHASE 1: CONFIGURATION BASE DE DONNÉES (2-3h)

### Étape 1.1: Appliquer les migrations ✅
- [ ] Ouvrir https://supabase.com/dashboard
- [ ] Sélectionner votre projet SenePanda
- [ ] Aller dans **SQL Editor**
- [ ] Copier-coller le contenu de `supabase/APPLY_ALL_MIGRATIONS.sql`
- [ ] Cliquer sur **Run** ou **Ctrl+Enter**
- [ ] Vérifier qu'il n'y a pas d'erreurs (message: "Migrations appliquées avec succès! 🎉")

**⏱️ Temps estimé: 5 minutes**

### Étape 1.2: Vérifier les tables créées ✅
```sql
-- Exécutez cette requête pour vérifier
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tables attendues (18 tables):**
- [ ] categories
- [ ] profiles
- [ ] products
- [ ] orders
- [ ] order_items
- [ ] favorites
- [ ] reviews
- [ ] loyalty_points
- [ ] points_transactions
- [ ] rewards
- [ ] claimed_rewards
- [ ] referrals
- [ ] conversations
- [ ] messages
- [ ] flash_deals
- [ ] notifications
- [ ] storage.buckets
- [ ] storage.objects

**⏱️ Temps estimé: 2 minutes**

### Étape 1.3: Insérer les données de test ✅
- [ ] Dans SQL Editor, copier-coller `supabase/SEED_TEST_DATA.sql`
- [ ] Exécuter le script
- [ ] Vérifier que les catégories sont créées:
```sql
SELECT name, emoji FROM categories;
```

**Résultat attendu: 10 catégories avec emojis**

**⏱️ Temps estimé: 2 minutes**

### Étape 1.4: Configurer les RLS (Row Level Security) ✅
- [ ] Aller dans **Authentication** → **Policies**
- [ ] Vérifier que les policies sont activées pour chaque table
- [ ] Tester avec un utilisateur de test

**⏱️ Temps estimé: 10 minutes**

### Étape 1.5: Configurer Storage ✅
- [ ] Aller dans **Storage**
- [ ] Vérifier que 3 buckets existent:
  - [ ] `products` (public)
  - [ ] `profiles` (public)
  - [ ] `categories` (public)
- [ ] Tester l'upload d'une image

**⏱️ Temps estimé: 5 minutes**

---

## 📋 PHASE 2: CONFIGURATION ENVIRONNEMENT (30min)

### Étape 2.1: Variables d'environnement ✅
Créer/Vérifier le fichier `.env` à la racine du projet:

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme_ici
```

- [ ] Copier votre URL Supabase depuis le Dashboard
- [ ] Copier votre clé anonyme depuis Settings → API
- [ ] Redémarrer le serveur Expo après modification

**⏱️ Temps estimé: 5 minutes**

### Étape 2.2: Installer les dépendances ✅
```bash
cd C:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project
npm install
```

- [ ] Vérifier qu'il n'y a pas d'erreurs
- [ ] Toutes les dépendances installées

**⏱️ Temps estimé: 3-5 minutes**

### Étape 2.3: Build l'application ✅
```bash
npx expo start --clear
```

- [ ] Le serveur démarre sans erreur
- [ ] QR Code s'affiche
- [ ] Aucun warning critique

**⏱️ Temps estimé: 2 minutes**

---

## 📋 PHASE 3: CRÉATION DES DONNÉES DE TEST (1-2h)

### Étape 3.1: Créer des comptes utilisateurs ✅

**Créer 5 comptes via l'app:**

**Acheteur 1:**
- [ ] Email: `acheteur1@test.com` / Mot de passe: `Test123456!`
- [ ] Username: `acheteur_test1`
- [ ] Nom complet: `Marie Diop`

**Acheteur 2:**
- [ ] Email: `acheteur2@test.com` / Mot de passe: `Test123456!`
- [ ] Username: `acheteur_test2`
- [ ] Nom complet: `Amadou Fall`

**Vendeur 1:**
- [ ] Email: `vendeur1@test.com` / Mot de passe: `Test123456!`
- [ ] Username: `shop_mode`
- [ ] Nom complet: `Fatou Sall`
- [ ] Activer mode vendeur
- [ ] Nom boutique: `Mode & Style`
- [ ] Description: `Vêtements tendance et accessoires`

**Vendeur 2:**
- [ ] Email: `vendeur2@test.com` / Mot de passe: `Test123456!`
- [ ] Username: `tech_shop`
- [ ] Nom complet: `Ousmane Ndiaye`
- [ ] Activer mode vendeur
- [ ] Nom boutique: `Tech Paradise`
- [ ] Description: `Électronique et gadgets`

**Vendeur 3:**
- [ ] Email: `vendeur3@test.com` / Mot de passe: `Test123456!`
- [ ] Username: `beauty_corner`
- [ ] Nom complet: `Aissatou Ba`
- [ ] Activer mode vendeur
- [ ] Nom boutique: `Beauty Corner`
- [ ] Description: `Cosmétiques et produits de beauté`

**⏱️ Temps estimé: 15 minutes**

### Étape 3.2: Créer des produits (Vendeur 1 - Mode) ✅

Se connecter avec `vendeur1@test.com`:

- [ ] **Produit 1:** Robe Africaine Wax
  - Prix: 25000 XOF
  - Stock: 15
  - Catégorie: Mode & Vêtements
  - Description: Robe traditionnelle en wax authentique

- [ ] **Produit 2:** Boubou Homme Brodé
  - Prix: 35000 XOF
  - Stock: 10
  - Catégorie: Mode & Vêtements

- [ ] **Produit 3:** Sac à Main Cuir
  - Prix: 18000 XOF
  - Stock: 8

- [ ] **Produit 4:** Sandales Artisanales
  - Prix: 12000 XOF
  - Stock: 20

- [ ] **Produit 5:** Écharpe en Soie
  - Prix: 8000 XOF
  - Stock: 25

**⏱️ Temps estimé: 20 minutes**

### Étape 3.3: Créer des produits (Vendeur 2 - Tech) ✅

Se connecter avec `vendeur2@test.com`:

- [ ] **Produit 1:** iPhone 13 Pro - Comme neuf
  - Prix: 350000 XOF
  - Stock: 3

- [ ] **Produit 2:** Casque Bluetooth JBL
  - Prix: 18000 XOF
  - Stock: 12

- [ ] **Produit 3:** Chargeur Sans Fil
  - Prix: 8500 XOF
  - Stock: 20

- [ ] **Produit 4:** Écouteurs AirPods Pro
  - Prix: 95000 XOF
  - Stock: 5

- [ ] **Produit 5:** Powerbank 20000mAh
  - Prix: 15000 XOF
  - Stock: 15

**⏱️ Temps estimé: 20 minutes**

### Étape 3.4: Créer des produits (Vendeur 3 - Beauté) ✅

Se connecter avec `vendeur3@test.com`:

- [ ] **Produit 1:** Parfum Chanel N°5
  - Prix: 75000 XOF
  - Stock: 6

- [ ] **Produit 2:** Crème Hydratante Visage
  - Prix: 12000 XOF
  - Stock: 25

- [ ] **Produit 3:** Maquillage Kit Complet
  - Prix: 28000 XOF
  - Stock: 10

- [ ] **Produit 4:** Huile d'Argan Bio
  - Prix: 9500 XOF
  - Stock: 18

- [ ] **Produit 5:** Savon Noir Africain
  - Prix: 3500 XOF
  - Stock: 40

**⏱️ Temps estimé: 20 minutes**

---

## 📋 PHASE 4: TESTS FONCTIONNELS (2-3h)

### 4.1: Authentification ✅

**Test Inscription:**
- [ ] Créer un nouveau compte
- [ ] Vérifier que le profil est créé
- [ ] Vérifier le code de parrainage généré
- [ ] Vérifier les 50 points de bienvenue (si configuré)

**Test Connexion:**
- [ ] Se connecter avec email/mot de passe
- [ ] Se déconnecter
- [ ] Se reconnecter

**Test Profil:**
- [ ] Modifier le nom complet
- [ ] Modifier le username
- [ ] Ajouter une bio
- [ ] Ajouter un avatar (upload image)

**⏱️ Temps estimé: 15 minutes**

### 4.2: Navigation & Marketplace ✅

**Page Accueil:**
- [ ] Affichage des catégories avec emojis
- [ ] Affichage des produits récents
- [ ] Scroll fluide
- [ ] Recherche fonctionne

**Page Produit:**
- [ ] Détails produit s'affichent
- [ ] Images chargent correctement
- [ ] Prix affiché
- [ ] Stock visible
- [ ] Avis affichés

**Recherche:**
- [ ] Recherche par texte fonctionne
- [ ] Filtres par catégorie
- [ ] Tri par prix (croissant/décroissant)

**⏱️ Temps estimé: 20 minutes**

### 4.3: Panier & Commandes ✅

**Ajouter au panier:**
- [ ] Ajouter 3 produits au panier
- [ ] Modifier les quantités
- [ ] Supprimer un produit
- [ ] Total calculé correctement

**Passer commande:**
- [ ] Remplir adresse de livraison
- [ ] Remplir téléphone
- [ ] Choisir mode de paiement
- [ ] Valider la commande
- [ ] Vérifier que le stock est décrémenté

**Suivi commande:**
- [ ] Voir la commande dans "Mes commandes"
- [ ] Statut: "En attente"
- [ ] Détails complets affichés

**⏱️ Temps estimé: 25 minutes**

### 4.4: Vendeur - Gestion ✅

**Se connecter en vendeur:**
- [ ] Voir "Ma Boutique" dans le profil
- [ ] Accéder au tableau de bord vendeur

**Gestion produits:**
- [ ] Créer un nouveau produit
- [ ] Modifier un produit existant
- [ ] Désactiver un produit
- [ ] Supprimer un produit

**Gestion commandes:**
- [ ] Voir les commandes reçues
- [ ] Changer le statut: "En préparation"
- [ ] Changer le statut: "Expédiée"
- [ ] Changer le statut: "Livrée"

**Statistiques:**
- [ ] Voir le nombre de ventes
- [ ] Voir le chiffre d'affaires
- [ ] Voir le panier moyen

**⏱️ Temps estimé: 30 minutes**

### 4.5: Favoris ✅

- [ ] Ajouter 5 produits aux favoris
- [ ] Voir la page "Mes Favoris"
- [ ] Retirer un favori
- [ ] Ajouter au panier depuis favoris

**⏱️ Temps estimé: 10 minutes**

### 4.6: Avis & Notations ✅

**Après une commande livrée:**
- [ ] Laisser un avis 5 étoiles
- [ ] Ajouter un commentaire
- [ ] Vérifier que l'avis apparaît sur le produit
- [ ] Vérifier les 50 points gagnés

**⏱️ Temps estimé: 10 minutes**

### 4.7: Points de Fidélité ✅

**Gagner des points:**
- [ ] Vérifier les points après achat (1pt/1000 XOF)
- [ ] Vérifier les points après avis (+50 pts)
- [ ] Voir l'historique des transactions

**Niveau:**
- [ ] Vérifier le niveau actuel (Bronze/Argent/Or/Platine)
- [ ] Voir la progression vers niveau suivant

**Page Mes Avantages:**
- [ ] Voir le badge de niveau
- [ ] Voir le solde de points
- [ ] Astuce du jour affichée
- [ ] Stats affichées

**⏱️ Temps estimé: 15 minutes**

### 4.8: Récompenses ✅

**Boutique récompenses:**
- [ ] Voir le catalogue de récompenses
- [ ] Filtrer par catégorie
- [ ] Voir son solde de points

**Échanger des points:**
- [ ] Sélectionner une récompense
- [ ] Vérifier qu'on a assez de points
- [ ] Échanger (ex: Bon 500 XOF = 50 points)
- [ ] Vérifier que les points sont débités
- [ ] Vérifier que la récompense apparaît dans "Récompenses actives"

**Utiliser une récompense:**
- [ ] Voir les récompenses actives
- [ ] Appliquer sur une commande (si implémenté)

**⏱️ Temps estimé: 15 minutes**

### 4.9: Parrainage ✅

**Parrainer un ami:**
- [ ] Accéder à la page Parrainage
- [ ] Voir son code de parrainage
- [ ] Copier le code
- [ ] Partager le lien (simuler)

**Être parrainé:**
- [ ] Créer un nouveau compte
- [ ] Entrer un code de parrainage
- [ ] Vérifier que le parrain gagne 200 points
- [ ] Vérifier que le parrainage apparaît dans la liste

**⏱️ Temps estimé: 15 minutes**

### 4.10: Chat ✅

**Contacter un vendeur:**
- [ ] Depuis une page produit, cliquer "Contacter"
- [ ] Envoyer un message
- [ ] Recevoir une réponse (se connecter en vendeur)
- [ ] Vérifier les notifications

**Conversations:**
- [ ] Voir toutes les conversations
- [ ] Badge non lu
- [ ] Marquer comme lu

**⏱️ Temps estimé: 15 minutes**

### 4.11: Flash Deals ✅

**Créer un flash deal (vendeur):**
- [ ] Sélectionner un produit
- [ ] Définir réduction (ex: 30%)
- [ ] Définir durée (24h)
- [ ] Stock limité (ex: 5 unités)
- [ ] Activer le deal

**Acheter un flash deal:**
- [ ] Voir les flash deals en accueil
- [ ] Badge "PROMO -30%"
- [ ] Prix barré + nouveau prix
- [ ] Acheter le produit

**⏱️ Temps estimé: 15 minutes**

### 4.12: Notifications ✅

- [ ] Nouvelle commande (vendeur)
- [ ] Commande expédiée (acheteur)
- [ ] Nouveau message chat
- [ ] Points gagnés
- [ ] Nouveau parrainage
- [ ] Marquer comme lu

**⏱️ Temps estimé: 10 minutes**

---

## 📋 PHASE 5: TESTS DE PERFORMANCE (1h)

### 5.1: Chargement des pages ✅
- [ ] Accueil charge en < 2 secondes
- [ ] Produits chargent en < 1 seconde
- [ ] Images optimisées

### 5.2: Navigation fluide ✅
- [ ] Aucun lag lors du scroll
- [ ] Transitions smoothes
- [ ] Animations fluides

### 5.3: Recherche rapide ✅
- [ ] Résultats en < 1 seconde
- [ ] Filtres instantanés

**⏱️ Temps estimé: 30 minutes**

---

## 📋 PHASE 6: TESTS MULTI-PLATEFORMES (1h)

### 6.1: Android ✅
- [ ] Tester sur Expo Go
- [ ] Toutes les fonctionnalités OK
- [ ] UI correcte

### 6.2: iOS (si disponible) ✅
- [ ] Tester sur Expo Go
- [ ] Toutes les fonctionnalités OK
- [ ] UI correcte

### 6.3: Web (optionnel) ✅
```bash
npx expo export --platform web
```
- [ ] Build web réussi
- [ ] Navigation fonctionne

**⏱️ Temps estimé: 30 minutes**

---

## 📋 PHASE 7: SÉCURITÉ & OPTIMISATION (30min)

### 7.1: Sécurité ✅
- [ ] Vérifier les RLS policies actives
- [ ] Tester qu'un utilisateur ne peut pas modifier les données d'un autre
- [ ] Vérifier que les clés API sont dans .env (pas en dur)

### 7.2: Optimisation ✅
- [ ] Compression des images
- [ ] Index SQL créés
- [ ] Cache activé si possible

**⏱️ Temps estimé: 30 minutes**

---

## 📋 PHASE 8: BUILD PRODUCTION (1h)

### 8.1: Configuration EAS Build ✅
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 8.2: Build Android APK ✅
```bash
eas build --platform android --profile preview
```
- [ ] Build réussi
- [ ] Télécharger l'APK
- [ ] Installer et tester

### 8.3: Build iOS (si applicable) ✅
```bash
eas build --platform ios --profile preview
```

**⏱️ Temps estimé: 30-60 minutes**

---

## 🎉 CHECKLIST FINALE

### Avant le lancement:
- [ ] Toutes les migrations appliquées
- [ ] Données de test créées
- [ ] Tous les tests fonctionnels passés
- [ ] Performance acceptable
- [ ] Sécurité vérifiée
- [ ] Build production créé
- [ ] Documentation utilisateur prête
- [ ] Support/FAQ préparé

### Documentation:
- [ ] Guide utilisateur (acheteur)
- [ ] Guide vendeur
- [ ] FAQ
- [ ] Conditions d'utilisation
- [ ] Politique de confidentialité

### Marketing:
- [ ] Screenshots de l'app
- [ ] Vidéo démo
- [ ] Description Play Store/App Store
- [ ] Page landing (optionnel)

---

## 📊 TEMPS TOTAL ESTIMÉ

- **Phase 1** (Base de données): 2-3h
- **Phase 2** (Configuration): 30min
- **Phase 3** (Données test): 1-2h
- **Phase 4** (Tests fonctionnels): 2-3h
- **Phase 5** (Performance): 1h
- **Phase 6** (Multi-plateformes): 1h
- **Phase 7** (Sécurité): 30min
- **Phase 8** (Build): 1h

**TOTAL: 8-12 heures** (peut être réparti sur 2-3 jours)

---

## ✅ STATUT GLOBAL

- [ ] **READY FOR BETA** (80%+ complété)
- [ ] **READY FOR PRODUCTION** (100% complété)

---

## 🆘 EN CAS DE PROBLÈME

### Support:
- Documentation Expo: https://docs.expo.dev
- Documentation Supabase: https://supabase.com/docs
- GitHub Issues du projet

### Commandes utiles:
```bash
# Nettoyer le cache
npx expo start --clear

# Réinitialiser
rm -rf node_modules
npm install

# Logs détaillés
npx expo start --dev-client

# Vérifier TypeScript
npm run typecheck
```

---

**Bonne chance pour le déploiement! 🚀**
