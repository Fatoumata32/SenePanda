# GUIDE DEVELOPPEUR - SENEPANDA

Bienvenue dans le projet SenePanda !

Ce document vous guide vers la bonne documentation selon votre besoin.

---

## VOUS VOULEZ QUOI ?

### 1. Comprendre le projet en 5 minutes

**Lisez:** `TECH_STACK_RESUME.md`

Résumé ultra-condensé avec:
- Stack technique
- Fonctionnalités clés
- Architecture
- Commandes rapides
- Limites par plan

**Temps:** 5 minutes

---

### 2. Vue d'ensemble des outils et technologies

**Lisez:** `OUTILS_ET_TECHNOLOGIES.md`

Document simple listant:
- Toutes les technologies utilisées (versions)
- Bibliothèques principales
- Hooks personnalisés (25+)
- Composants principaux
- Base de données et fonctions SQL
- Variables d'environnement
- Commandes essentielles

**Temps:** 15 minutes

---

### 3. Documentation technique complète

**Lisez:** `TECHNICAL_DOCUMENTATION.md`

Documentation exhaustive avec:
- Architecture détaillée
- Code examples complets
- Schémas visuels
- Explications approfondies (15 sections)
- Guide de démarrage pas à pas
- Conventions de code

**Temps:** 1-2 heures (à lire en plusieurs fois)

---

### 4. Version texte pure (sans emojis)

**Lisez:** `DOCUMENTATION_TECHNIQUE_TEXTE.md`

Identique au document précédent mais:
- Format texte pur
- Pas d'emojis
- Pas de tableaux complexes
- Idéal pour impression

**Temps:** 1-2 heures

---

## PAR FONCTIONNALITE

### Live Shopping

**Fichiers à consulter:**
- `LIVE_SHOPPING_INSTALLATION.md` - Setup complet Agora
- `ACTIVATION_LIVE_SHOPPING.md` - Activation
- `QUICK_START_LIVE.md` - Démarrage rapide
- `GUIDE_PREMIER_LIVE.md` - Guide utilisateur

**Code:**
- `app/seller/start-live.tsx`
- `app/(tabs)/live-viewer/[id].tsx`
- `hooks/useLiveShopping.ts`
- `lib/agoraConfig.ts`

---

### Système d'abonnement

**Fichiers:**
- `README_ABONNEMENTS.md` - Documentation complète
- `ABONNEMENT_SIMPLIFIE.md` - Version simplifiée
- `README_FLUX_ABONNEMENT.md` - Flux complet

**Code:**
- `app/seller/subscription-plans.tsx`
- `hooks/useSubscriptionAccess.ts`
- `hooks/useSubscriptionLimits.ts`
- `utils/subscriptionAccess.ts`

---

### Système de points

**Fichiers:**
- `GUIDE_POINTS_BONUS.md` - Guide complet

**Code:**
- `hooks/useDailyLogin.ts`
- `hooks/useBonusSystem.ts`
- `components/PointsDashboard.tsx`
- `components/DailyLoginTracker.tsx`

**SQL:**
- Fonction `record_daily_login()`
- Table `daily_login_streak`

---

### Paiements

**Fichiers:**
- `INTEGRATION_WAVE_PAYMENT.md` - Intégration Wave
- `WAVE_QUICK_START.md` - Démarrage rapide

**Code:**
- `lib/payment.ts`
- `lib/wavePayment.ts`
- `app/checkout.tsx`
- `components/subscription/PaymentMethodSelector.tsx`

---

### Géolocalisation

**Fichiers:**
- `GUIDE_LOCALISATION.md` - Guide complet
- `GEOLOCALISATION_GUIDE.md` - Version détaillée

**Code:**
- `hooks/useSmartLocation.ts`
- `lib/smartGeolocation.ts`
- `components/LocationBanner.tsx`
- `components/NearbySellersGrid.tsx`

---

### Notifications

**Fichiers:**
- `SETUP_NOTIFICATIONS.md` - Configuration
- `QUICK_FIX_NOTIFICATIONS.md` - Fix rapide

**Code:**
- `hooks/useLiveNotifications.ts`
- `hooks/usePushNotifications.ts`
- `contexts/NotificationContext.tsx`

---

## BASE DE DONNEES

### Migrations SQL

**Localisation:** `supabase/migrations/`

**Ordre d'exécution:**
1. `20251011232345_create_marketplace_schema.sql`
2. `add_subscription_plan_to_profiles.sql`
3. `add_geolocation_system.sql`
4. `add_seller_reputation_system.sql`
5. `add_live_notifications.sql`
6. `add_product_views.sql`

**Guides:**
- `supabase/README_MIGRATIONS.md` - Comment appliquer
- `supabase/QUICK_START.md` - Démarrage rapide

---

## PROBLEMES ET SOLUTIONS

### Erreurs SQL

**Lisez:** `FIX_TOUTES_ERREURS.md`

Corrige automatiquement:
- Colonnes manquantes
- Erreurs RLS
- Fonctions SQL
- Doublons

---

### Build échoue

**Guides:**
- `GUIDE_GENERATION_APK.md` - Build Android
- `BUILD_EXPO_CLASSIC.md` - Build classique
- `FIX_TYPESCRIPT_ERRORS.md` - Erreurs TypeScript

---

### App ne démarre pas

**Solutions:**
1. `npx expo start --clear`
2. Supprimer `.expo` et `node_modules/.cache`
3. `npm install`
4. Vérifier `.env`

**Guide:** `EXPO_NOT_STARTING.md`

---

### Problèmes Supabase

**Guides:**
- `supabase/README_FIXES.md` - Fixes courants
- `TROUBLESHOOTING_ADMIN.md` - Problèmes admin
- `DEBUG_GUIDE.md` - Débogage général

---

## DEPLOIEMENT

### Checklist complète

**Lisez:** `CHECKLIST_DEPLOIEMENT.md`

Étapes détaillées:
- Préparation
- Tests
- Build
- Déploiement
- Post-déploiement

---

### Quick Start

**Lisez:** `QUICK_START.md`

Déploiement rapide en 3 minutes:
- Scripts SQL à exécuter
- Tests rapides
- Vérifications

---

### Production

**Guides:**
- `DEPLOIEMENT_FINAL.md` - Guide complet
- `GUIDE_DEPLOIEMENT_RESET_PIN.md` - Edge Functions
- `DEPLOY_EDGE_FUNCTION.md` - Déploiement fonctions

---

## DEMARRAGE RAPIDE

### Première fois sur le projet

**1. Lisez dans cet ordre:**
1. `TECH_STACK_RESUME.md` (5 min)
2. `OUTILS_ET_TECHNOLOGIES.md` (15 min)
3. `README.md` (10 min)

**2. Installation:**
```bash
git clone <repo>
cd project
npm install
cp .env.example .env
# Éditer .env avec vos clés
```

**3. Supabase:**
- Créer projet sur supabase.com
- Exécuter migrations dans l'ordre
- Configurer Storage (bucket: product-images)
- Activer Realtime

**4. Lancer:**
```bash
npx expo start --clear
```

**Temps total:** 1 heure

---

### Développement feature spécifique

**Live Shopping:**
1. Lire `LIVE_SHOPPING_INSTALLATION.md`
2. Configurer Agora (clés API)
3. Tester avec compte Premium

**Abonnements:**
1. Lire `README_ABONNEMENTS.md`
2. Créer compte test avec chaque plan
3. Tester limites

**Paiements:**
1. Lire `WAVE_QUICK_START.md`
2. Configurer Wave sandbox
3. Tester flux complet

---

## ARCHITECTURE

### Vue globale

```
APP MOBILE (React Native + Expo)
    │
    ├─ Navigation (Expo Router)
    │   ├─ app/(tabs)/ → Acheteurs
    │   └─ app/seller/ → Vendeurs
    │
    ├─ State Management
    │   ├─ Context API (global)
    │   └─ Custom Hooks (logique)
    │
    └─ Backend
        ├─ Supabase (BDD, Auth, Storage)
        ├─ Agora (Live Streaming)
        ├─ Wave (Paiements)
        └─ Meilisearch (Recherche)
```

**Pattern:** MVC avec séparation claire
- **Model:** Supabase + SQL functions
- **View:** Components React Native
- **Controller:** Custom Hooks

---

## CONVENTIONS DE CODE

**Fichiers:**
- Composants: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase + use (`useCart.ts`)
- Utils: camelCase (`payment.ts`)

**TypeScript:**
- Interfaces pour données
- Types pour unions
- Typage strict activé

**Styling:**
- StyleSheet.create
- Couleurs dans `constants/Colors.ts`
- Spacing cohérent

**Git:**
- Branches: `feature/nom-feature`
- Commits: Messages clairs en français
- Ne jamais commit `.env`

---

## HOOKS PERSONNALISES (25+)

**Catégories:**

**Live Shopping (2):**
- useLiveShopping
- useLiveNotifications

**Abonnement (5):**
- useSubscriptionAccess
- useSubscriptionLimits
- useSubscriptionPlan
- useSubscriptionSync
- useProfileSubscriptionSync

**Points (2):**
- useDailyLogin
- useBonusSystem

**Localisation (3):**
- useSmartLocation
- useUserLocation
- useLocation

**Notifications (2):**
- usePushNotifications
- useLiveNotifications

**Réputation (2):**
- useSellerReputation
- useShareReputation

**Commerce (3):**
- useCart
- useProductViews
- useProductRecommendations

**Autres (6):**
- useOnboarding
- useAnalytics
- useNetworkStatus
- useThemeColors
- useAuth
- useApiCall

---

## COMPOSANTS PRINCIPAUX

**Live Shopping:**
- ActiveLiveSessions
- LiveIcon (animé)

**Points:**
- PointsDashboard
- DailyLoginTracker
- AchievementBadge

**Vendeur:**
- SellerReputationBadge
- ShareReputationButton
- ProductPerformance

**Localisation:**
- LocationBanner
- LocationPicker
- NearbySellersGrid
- DeliveryEstimateCard

**Paiement:**
- PaymentMethodSelector
- BillingToggle

---

## BASE DE DONNEES

**Tables (8):**
1. profiles
2. products
3. orders
4. live_sessions
5. daily_login_streak
6. subscription_plans
7. notifications
8. user_follows

**Fonctions SQL (7):**
1. is_seller_subscription_active()
2. can_seller_add_product()
3. record_daily_login()
4. calculate_live_duration()
5. get_user_notifications()
6. mark_notifications_read()
7. increment_viewer_count()

---

## TESTS

### Créer compte test

**SQL (dans Supabase):**
```sql
-- Créer user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@senepanda.sn', crypt('Test123!', gen_salt('bf')), NOW())
RETURNING id;

-- Créer profil
INSERT INTO profiles (id, email, phone, role, subscription_plan, points)
VALUES ('<id>', 'test@senepanda.sn', '771234567', 'both', 'premium', 1000);
```

### Tester fonctionnalités

**Plan Free:**
- Vérifier boutique cachée
- Tenter ajouter produit (doit échouer)

**Plan Premium:**
- Ajouter produits (illimité)
- Démarrer live
- Vérifier 166h disponibles

**Points:**
- Se connecter quotidiennement
- Vérifier +10 points
- Tester série 7j (+50)

---

## RESSOURCES EXTERNES

**Documentation:**
- Expo: docs.expo.dev
- Supabase: supabase.com/docs
- Agora: docs.agora.io
- React Native: reactnative.dev
- TypeScript: typescriptlang.org/docs

**Communauté:**
- Discord Expo
- Supabase Discord
- Stack Overflow

---

## CONTACT ET SUPPORT

**Équipe technique:**
tech@senepanda.com

**Questions business:**
business@senepanda.com

**Bug reports:**
Créer issue sur GitHub

---

## CHECKLIST NOUVEAU DEVELOPPEUR

**Jour 1:**
- [ ] Lire TECH_STACK_RESUME.md
- [ ] Lire OUTILS_ET_TECHNOLOGIES.md
- [ ] Cloner le repo
- [ ] Installer dépendances
- [ ] Configurer .env
- [ ] Lancer l'app en dev

**Semaine 1:**
- [ ] Lire TECHNICAL_DOCUMENTATION.md
- [ ] Créer compte Supabase
- [ ] Appliquer migrations
- [ ] Créer compte test
- [ ] Tester toutes les fonctionnalités
- [ ] Lire le code (app/, components/, hooks/)

**Semaine 2:**
- [ ] Comprendre architecture
- [ ] Tester chaque plan d'abonnement
- [ ] Tester Live Shopping
- [ ] Tester paiements (sandbox)
- [ ] Faire un build local

**Prêt à contribuer !** 🚀

---

**Version:** 2.0.0
**Dernière MAJ:** Janvier 2025
**Statut:** Production Ready

Bon développement sur SenePanda !
