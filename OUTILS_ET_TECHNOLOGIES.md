# OUTILS ET TECHNOLOGIES - SENEPANDA

Version: 2.0.0
Date: Janvier 2025

---

## FRONTEND MOBILE

**React Native 0.81.5**
Framework pour développer des applications mobiles iOS et Android avec JavaScript.

**Expo 54.0.30**
Plateforme de développement et build pour React Native.

**Expo Router 6.0.21**
Système de navigation basé sur les fichiers.

**TypeScript 5.9.2**
Langage avec typage statique pour JavaScript.

**React 19.1.0**
Bibliothèque JavaScript pour construire des interfaces utilisateur.

---

## BACKEND ET BASE DE DONNEES

**Supabase 2.86.0**
Backend-as-a-Service incluant:
- PostgreSQL 15+ (base de données)
- Authentication (gestion utilisateurs)
- Storage (stockage fichiers)
- Realtime (synchronisation temps réel)
- Edge Functions (serverless)

---

## STREAMING VIDEO

**Agora SDK 4.5.3**
Streaming vidéo haute définition pour le Live Shopping.

**Agora RTM 2.2.6**
Messagerie temps réel pour le chat pendant les lives.

---

## PAIEMENTS

**Wave API**
Intégration paiements Mobile Money au Sénégal.

**Support:**
- Orange Money
- Wave
- Free Money
- Carte bancaire

---

## RECHERCHE

**Meilisearch 0.54.0**
Moteur de recherche rapide pour les produits.

---

## STOCKAGE MEDIA

**Cloudflare R2**
Stockage et distribution d'images et vidéos.

---

## BIBLIOTHEQUES EXPO

**expo-camera 17.0.10**
Accès caméra pour les sessions live.

**expo-location 19.0.8**
Géolocalisation des vendeurs.

**expo-notifications 0.32.15**
Notifications push.

**expo-local-authentication 17.0.8**
Authentification biométrique.

**expo-image-picker 17.0.10**
Sélection d'images depuis la galerie.

**expo-av 16.0.8**
Lecture audio et vidéo.

---

## AUTRES BIBLIOTHEQUES

**axios 1.13.2**
Requêtes HTTP.

**react-native-gesture-handler 2.28.0**
Gestion des gestes tactiles.

**react-native-reanimated 4.1.1**
Animations performantes.

**react-native-svg 15.12.1**
Affichage de graphiques vectoriels.

---

## OUTILS DE DEVELOPPEMENT

**Node.js 18+**
Environnement d'exécution JavaScript.

**npm / yarn**
Gestionnaire de paquets.

**Git**
Contrôle de version.

**Android Studio**
Emulateur Android.

**Xcode (macOS)**
Simulateur iOS.

**EAS CLI**
Build et déploiement Expo.

**Supabase CLI**
Gestion base de données et Edge Functions.

---

## SERVICES TIERS

**Expo Application Services (EAS)**
Build cloud pour iOS et Android.

**Agora Console**
Gestion des clés API streaming.

**Cloudflare Dashboard**
Configuration stockage R2.

**Meilisearch Cloud**
Instance de recherche hébergée.

---

## ARCHITECTURE

**Pattern MVC**
Séparation Model (Supabase) - View (Components) - Controller (Hooks).

**Context API**
Gestion état global (panier, auth, notifications).

**Custom Hooks**
Logique métier réutilisable.

**Atomic Design**
Composants réutilisables du simple au complexe.

---

## VARIABLES D'ENVIRONNEMENT

Variables nécessaires dans le fichier .env:

**Supabase:**
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

**Agora:**
- EXPO_PUBLIC_AGORA_APP_ID
- AGORA_APP_CERTIFICATE

**Cloudflare R2:**
- EXPO_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_R2_ACCESS_KEY_ID
- CLOUDFLARE_R2_SECRET_ACCESS_KEY
- CLOUDFLARE_R2_BUCKET_NAME

**Meilisearch:**
- EXPO_PUBLIC_MEILISEARCH_HOST
- EXPO_PUBLIC_MEILISEARCH_API_KEY
- MEILISEARCH_ADMIN_KEY

**Wave:**
- EXPO_PUBLIC_WAVE_API_KEY
- WAVE_SECRET_KEY

---

## COMMANDES ESSENTIELLES

**Installation:**
```
npm install
```

**Démarrage développement:**
```
npx expo start
```

**Build Android:**
```
eas build --platform android --profile production
```

**Build iOS:**
```
eas build --platform ios --profile production
```

**Déployer Edge Function:**
```
supabase functions deploy wave-webhook
```

**Générer types TypeScript depuis Supabase:**
```
supabase gen types typescript --project-id <id> > types/database.types.ts
```

---

## FONCTIONNALITES PRINCIPALES

**Pour les acheteurs:**
- Navigation produits
- Recherche avec Meilisearch
- Panier d'achat
- Paiement Mobile Money
- Système de points et récompenses
- Visualisation lives
- Notifications push pour les lives
- Badges et achievements

**Pour les vendeurs:**
- Gestion boutique personnalisable
- CRUD produits complet
- Abonnements (Free, Starter, Pro, Premium)
- Live Shopping avec streaming HD (Premium uniquement)
- Statistiques et performance des ventes
- Système de réputation vendeur

**Système d'abonnement:**
- Free: 0 produits, boutique cachée
- Starter: 50 produits max, commission 15%
- Pro: 200 produits max, commission 10%
- Premium: Illimité + Live Shopping, commission 5%

**Live Shopping:**
- Streaming vidéo HD via Agora
- Chat temps réel (RTM)
- 166 heures de streaming par mois (Premium)
- Sélection de produits à afficher pendant le live
- Notifications push pour nouvelles sessions
- Compteur de spectateurs en temps réel

**Système de points:**
- Connexion quotidienne: +10 points
- Achats: +1% du montant
- Avis produit: +20 points (avec photo)
- Parrainage: +100 points
- Séries de connexion: bonus jusqu'à +500 points
- Niveaux: Bronze, Argent, Or, Platine

**Badges et Achievements:**
- Système de badges débloquables
- Barre de progression pour chaque achievement
- Animations et effets visuels
- Badges pour différentes actions (achats, connexions, parrainage)

---

## STRUCTURE FICHIERS

```
project/
├── app/                    # Pages (Expo Router)
├── components/             # Composants réutilisables
├── hooks/                  # Custom hooks
├── contexts/               # Context providers
├── lib/                    # Config et utilitaires
├── utils/                  # Fonctions utilitaires
├── constants/              # Constantes
├── types/                  # Types TypeScript
├── supabase/               # Backend
│   ├── migrations/         # Scripts SQL
│   └── functions/          # Edge Functions
├── assets/                 # Images et fonts
├── package.json            # Dépendances
├── app.config.js           # Config Expo
├── tsconfig.json           # Config TypeScript
└── .env                    # Variables d'environnement
```

---

## BASES DE DONNEES PRINCIPALES

**Tables Supabase:**
- profiles (utilisateurs et profils vendeurs)
- products (catalogue produits)
- orders (commandes et transactions)
- live_sessions (sessions live shopping)
- daily_login_streak (suivi connexions quotidiennes)
- subscription_plans (plans d'abonnement disponibles)
- notifications (notifications utilisateurs)
- user_follows (abonnements aux vendeurs)

**Fonctions SQL importantes:**
- is_seller_subscription_active() - Vérifie si abonnement actif
- can_seller_add_product() - Vérifie limite produits
- record_daily_login() - Enregistre connexion et attribue points
- calculate_live_duration() - Calcule durée session live
- get_user_notifications() - Récupère notifications utilisateur
- mark_notifications_read() - Marque notifications comme lues
- increment_viewer_count() - Incrémente compteur spectateurs live

---

## COMPOSANTS PRINCIPAUX

**Composants Live Shopping:**
- ActiveLiveSessions.tsx - Affiche sessions live actives
- components/icons/LiveIcon.tsx - Icône animée pour lives

**Composants Points et Récompenses:**
- PointsDashboard.tsx - Tableau de bord des points
- DailyLoginTracker.tsx - Suivi connexions quotidiennes
- AchievementBadge.tsx - Badge avec progression et animations
- Badge.tsx - Badge simple

**Composants Vendeur:**
- SellerReputationBadge.tsx - Badge de réputation vendeur
- ShareReputationButton.tsx - Bouton partage réputation
- ProductPerformance.tsx - Statistiques produits

**Composants Notifications:**
- Notifications via expo-notifications
- Notifications locales et push

**Composants Panier et Paiement:**
- PaymentMethodSelector.tsx - Sélection méthode paiement
- BillingToggle.tsx - Basculer mensuel/annuel

**Composants Localisation:**
- LocationBanner.tsx - Bannière de localisation
- LocationPicker.tsx - Sélecteur de localisation
- NearbySellersGrid.tsx - Vendeurs à proximité
- DeliveryEstimateCard.tsx - Estimation livraison

---

## HOOKS PERSONNALISES

**Live Shopping:**
- useLiveShopping.ts - Gestion sessions live
- useLiveNotifications.ts - Notifications live en temps réel

**Abonnements:**
- useSubscriptionAccess.ts - Vérification accès premium
- useSubscriptionLimits.ts - Gestion limites par plan
- useSubscriptionPlan.ts - Informations plan actuel
- useSubscriptionSync.ts - Synchronisation temps réel
- useProfileSubscriptionSync.ts - Sync profil et abonnement

**Points et Gamification:**
- useDailyLogin.ts - Connexion quotidienne et points
- useBonusSystem.ts - Système de bonus

**Localisation:**
- useSmartLocation.ts - Géolocalisation intelligente
- useUserLocation.ts - Localisation utilisateur
- useLocation.ts - Hook de localisation générique

**Notifications:**
- usePushNotifications.ts - Notifications push système
- useLiveNotifications.ts - Notifications live spécifiques

**Réputation:**
- useSellerReputation.ts - Système réputation vendeur
- useShareReputation.ts - Partage de réputation

**Commerce:**
- useCart.ts - Gestion panier d'achat
- useProductViews.ts - Tracking vues produits
- useProductRecommendations.ts - Recommandations produits

**Autres:**
- useOnboarding.ts - Gestion onboarding
- useAnalytics.ts - Tracking analytics
- useNetworkStatus.ts - Statut réseau
- useThemeColors.ts - Gestion thème couleurs

---

## SECURITE

**Row Level Security (RLS)**
Activé sur toutes les tables Supabase.

**Authentication**
JWT tokens gérés par Supabase Auth.

**Variables sensibles**
Stockées dans .env, jamais commitées.

**API Keys**
Séparées entre public (EXPO_PUBLIC_*) et privées.

---

## DEPLOIEMENT

**Production Android:**
Google Play Store via EAS Build.

**Production iOS:**
App Store via EAS Build et TestFlight.

**Backend:**
Supabase Cloud (managed PostgreSQL).

**Edge Functions:**
Déployées sur Supabase Edge Runtime.

**Media:**
Cloudflare R2 avec CDN global.

---

## SUPPORT ET RESSOURCES

**Documentation officielle:**
- Expo: docs.expo.dev
- Supabase: supabase.com/docs
- Agora: docs.agora.io
- React Native: reactnative.dev

**Contact:**
- Technique: tech@senepanda.com
- Business: business@senepanda.com
