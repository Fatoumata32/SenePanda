# ✅ Checklist de Déploiement - SenePanda V2.0

## 📋 Avant le Déploiement

### 1. Vérification du Code
- [x] Tous les fichiers TypeScript compilent sans erreur
- [x] Aucun warning TypeScript critique
- [x] Tests unitaires passent (si implémentés)
- [x] Code reviews effectuées
- [x] Documentation à jour

### 2. Base de Données
- [ ] Backup de la base de données de production créé
- [ ] Script SQL testé en environnement de staging
- [ ] RLS policies vérifiées
- [ ] Index créés et testés
- [ ] Fonctions SQL testées avec données réelles

### 3. Environnement
- [x] Variables d'environnement configurées (.env)
- [ ] Secrets Supabase à jour
- [ ] Edge Functions déployées (reset-pin)
- [ ] Storage buckets configurés (shop-images)
- [ ] Permissions storage configurées

---

## 🚀 Déploiement Étape par Étape

### Phase 1 : Base de Données (15 minutes)

#### Étape 1.1 : Backup
```bash
# Dans Supabase Dashboard
Database > Backups > Create Backup
# Nommer : "pre-v2-deployment-2025-01-XX"
```
- [ ] Backup créé
- [ ] Backup téléchargé localement
- [ ] Backup vérifié (fichier non corrompu)

#### Étape 1.2 : Déployer SQL
```bash
cd C:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project

# Option 1 : Via Supabase CLI
npx supabase db push supabase/DEPLOY_ALL_FEATURES.sql

# Option 2 : Via Dashboard
# Copier contenu de DEPLOY_ALL_FEATURES.sql
# Database > SQL Editor > Coller et Exécuter
```
- [ ] Script exécuté sans erreur
- [ ] Message de succès affiché
- [ ] Toutes les fonctions créées
- [ ] Tous les triggers créés
- [ ] Toutes les vues créées

#### Étape 1.3 : Vérifications SQL
```sql
-- Vérifier les fonctions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%seller%' OR routine_name LIKE '%daily%';

-- Doit retourner :
-- - record_daily_login
-- - is_seller_subscription_active
-- - get_seller_product_count
-- - can_seller_add_product
-- - award_purchase_points
-- - award_review_points

-- Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'daily_login_streak';

-- Vérifier les vues
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'active_seller_products';

-- Vérifier les triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'enforce_product_limit';
```
- [ ] Toutes les fonctions présentes
- [ ] Table daily_login_streak créée
- [ ] Vue active_seller_products créée
- [ ] Trigger enforce_product_limit actif

---

### Phase 2 : Application (20 minutes)

#### Étape 2.1 : Build de Production
```bash
cd C:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project

# Nettoyer le cache
npm run clean
# ou
rm -rf .expo node_modules/.cache

# Installer les dépendances
npm install

# Build
npm run build
# ou
npx expo export
```
- [ ] Build réussi sans erreur
- [ ] Bundle créé
- [ ] Assets optimisés
- [ ] Sourcemaps générés

#### Étape 2.2 : Déployer l'App
```bash
# Option 1 : EAS Build (Expo)
npx eas build --platform all --profile production

# Option 2 : Déploiement Web
npx expo export:web
# Puis upload vers serveur
```
- [ ] Build Android réussi
- [ ] Build iOS réussi (si applicable)
- [ ] Version web déployée
- [ ] URLs de production fonctionnelles

---

### Phase 3 : Tests Post-Déploiement (30 minutes)

#### Étape 3.1 : Tests Fonctionnels Critiques

**Test 1 : Inscription Nouveau Utilisateur**
```
1. Ouvrir l'app
2. Créer compte : +221 77 999 99 99 / PIN: 9999
3. Nom: Test / Prénom: Déploiement
4. ✅ Vérifier compte créé
5. ✅ Vérifier +10 points (connexion quotidienne)
```
- [ ] Inscription réussie
- [ ] Points attribués automatiquement
- [ ] Profil créé dans profiles

**Test 2 : Connexion Utilisateur Existant**
```
1. Se déconnecter
2. Se reconnecter avec +221 77 999 99 99 / 9999
3. ✅ Vérifier connexion
4. ✅ Vérifier points augmentés (+10)
```
- [ ] Connexion réussie
- [ ] Points quotidiens fonctionnent

**Test 3 : Abonnement - Blocage FREE**
```
1. Connecté avec compte FREE
2. Aller dans "Vendeur" > "Mes Produits"
3. Cliquer "Ajouter un produit"
4. ✅ Doit afficher : "Abonnement requis"
5. ✅ Proposer voir abonnements
```
- [ ] Accès bloqué correctement
- [ ] Message d'erreur affiché
- [ ] Redirection vers abonnements proposée

**Test 4 : Abonnement - Souscription**
```
1. Cliquer "Voir les abonnements"
2. Choisir plan STARTER (Mensuel)
3. Cliquer "Choisir ce plan"
4. ✅ Vérifier modal de confirmation
5. Cliquer "Envoyer la demande"
6. ✅ Vérifier message succès
7. ✅ Vérifier status "En attente"
```
- [ ] Flux de souscription fluide
- [ ] Aucune demande de preuve de paiement
- [ ] Message de confirmation clair

**Test 5 : Validation Admin**
```sql
-- Dans Supabase SQL Editor
UPDATE profiles
SET
  subscription_plan = 'starter',
  subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE phone = '+22177999999';
```
- [ ] Requête exécutée
- [ ] Profil mis à jour

**Test 6 : Accès Vendeur Activé**
```
1. Rafraîchir l'app (Pull to refresh)
2. Aller dans "Mes Produits"
3. ✅ Vérifier accès autorisé
4. ✅ Vérifier limite : 0/50 produits
5. Cliquer "Ajouter un produit"
6. ✅ Formulaire s'ouvre
```
- [ ] Accès autorisé
- [ ] Limite affichée
- [ ] Peut ajouter produit

**Test 7 : Ajouter Produit**
```
1. Remplir formulaire produit
2. Titre: "Produit Test V2"
3. Prix: 5000 FCFA
4. Stock: 10
5. Soumettre
6. ✅ Produit ajouté
7. ✅ Compteur : 1/50
```
- [ ] Produit créé
- [ ] Compteur mis à jour
- [ ] Produit visible dans liste

**Test 8 : Visibilité Boutique**
```
1. Se déconnecter
2. Naviguer vers page d'accueil
3. ✅ Vérifier produit "Produit Test V2" visible
4. Cliquer sur le produit
5. ✅ Vérifier détails affichés
```
- [ ] Produit visible publiquement
- [ ] Détails accessibles
- [ ] Vendeur identifié

**Test 9 : Expiration Abonnement**
```sql
-- Expirer l'abonnement
UPDATE profiles
SET subscription_expires_at = NOW() - INTERVAL '1 day'
WHERE phone = '+22177999999';
```
```
1. Rafraîchir l'app
2. Vérifier produit "Produit Test V2"
3. ✅ Doit être masqué (pas dans active_seller_products)
4. Aller dans "Mes Produits"
5. ✅ Message : "Abonnement expiré"
```
- [ ] Produit masqué automatiquement
- [ ] Message expiration affiché
- [ ] Accès bloqué

**Test 10 : Points Bonus**
```sql
-- Simuler achat
INSERT INTO orders (user_id, total_amount, status, created_at)
VALUES ('user-id-here', 10000, 'completed', NOW())
RETURNING id;

-- Attribuer points
SELECT award_purchase_points('user-id-here', 'order-id-from-above');

-- Vérifier
SELECT total_points FROM profiles WHERE id = 'user-id-here';
```
- [ ] Points achat fonctionnent (+100 pts pour 10000 FCFA)
- [ ] Total points mis à jour
- [ ] Multiplicateur appliqué si premium

---

### Phase 4 : Monitoring (Continu)

#### Étape 4.1 : Configurer Alertes
```
Supabase Dashboard > Database > Monitoring
```

**Alerte 1 : Abonnements expirés**
```sql
SELECT COUNT(*)
FROM profiles
WHERE subscription_plan != 'free'
  AND subscription_expires_at < NOW()
  AND subscription_expires_at > NOW() - INTERVAL '7 days';
```
- [ ] Alerte configurée
- [ ] Seuil : > 10 vendeurs
- [ ] Notification : Email admin

**Alerte 2 : Erreurs de trigger**
```
Vérifier les logs Supabase pour :
"Vous avez atteint la limite de produits"
```
- [ ] Alerte configurée
- [ ] Seuil : > 50 erreurs/heure
- [ ] Notification : Slack

#### Étape 4.2 : Dashboard Métriques
```
Créer dashboard Supabase pour :
- Nombre total vendeurs actifs
- Abonnements par plan
- Points distribués par jour
- Produits créés par jour
```
- [ ] Dashboard créé
- [ ] Métriques temps réel
- [ ] Graphiques configurés

---

## 📊 Métriques à Surveiller

### Jour 1 (J+0)
- [ ] Aucune erreur critique
- [ ] Temps réponse API < 300ms
- [ ] Taux d'erreur < 0.5%
- [ ] 0 rollback nécessaire

### Semaine 1 (J+7)
- [ ] Taux conversion abonnement : > 15%
- [ ] Temps souscription moyen : < 2 min
- [ ] Tickets support abonnement : < 20
- [ ] Satisfaction utilisateurs : > 4/5

### Mois 1 (J+30)
- [ ] Nouveaux vendeurs : +30%
- [ ] Revenus récurrents : +40%
- [ ] Rétention J30 : > 40%
- [ ] Points distribués : > 100,000

---

## 🚨 Plan de Rollback

### Si Problème Critique Détecté

#### Rollback Base de Données
```bash
# 1. Restaurer le backup
Supabase Dashboard > Database > Backups
> Sélectionner "pre-v2-deployment-2025-01-XX"
> Restore

# 2. Vérifier restauration
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM products;

# 3. Confirmer fonctions supprimées
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%seller%';
```
- [ ] Backup restauré
- [ ] Données vérifiées
- [ ] État stable

#### Rollback Application
```bash
# Revenir à version précédente
npx eas channel:update production --branch=v1.9

# ou rebuild version précédente
npx eas build --platform all --profile production
```
- [ ] Version précédente déployée
- [ ] Utilisateurs notifiés
- [ ] Post-mortem planifié

---

## ✅ Validation Finale

### Checklist Complète
- [ ] Base de données déployée ✅
- [ ] Application déployée ✅
- [ ] Tous les tests passent ✅
- [ ] Monitoring actif ✅
- [ ] Équipe formée ✅
- [ ] Documentation à jour ✅
- [ ] Plan de rollback prêt ✅
- [ ] Communication utilisateurs envoyée ✅

### Sign-off
```
Déploiement effectué par : __________________
Date : ________________
Heure : ______________
Environnement : Production
Version : 2.0.0
Status : ✅ SUCCÈS / ❌ ROLLBACK
```

---

## 🎉 Post-Déploiement

### Actions Immédiates
1. [ ] Annoncer nouvelles fonctionnalités (email, push, in-app)
2. [ ] Surveiller métriques pendant 4h
3. [ ] Répondre aux questions support
4. [ ] Célébrer avec l'équipe ! 🎊

### Semaine Suivante
1. [ ] Analyser adoption fonctionnalités
2. [ ] Recueillir feedback utilisateurs
3. [ ] Identifier bugs mineurs
4. [ ] Planifier hotfixes si nécessaire

### Mois Suivant
1. [ ] Rapport ROI complet
2. [ ] Analyse métriques business
3. [ ] Planifier Phase 3 (localisation, zoom, etc.)
4. [ ] Post-mortem et leçons apprises

---

**📝 Notes :**
- Garder ce document à jour pendant le déploiement
- Cocher les cases au fur et à mesure
- Noter tout problème rencontré
- Documenter les solutions appliquées

**🆘 En cas d'urgence :**
- Slack : #tech-urgences
- Contact : admin@senepanda.com
- Téléphone : +221 XX XXX XX XX
