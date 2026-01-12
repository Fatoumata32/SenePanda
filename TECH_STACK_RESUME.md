# SENEPANDA - RESUME TECHNIQUE

Version 2.0.0 | Janvier 2025

---

## EN BREF

**Nom:** SenePanda
**Type:** Marketplace e-commerce multi-vendeurs avec Live Shopping
**Cible:** Marché sénégalais
**Plateformes:** iOS, Android (React Native + Expo)

---

## STACK TECHNIQUE

**Frontend:**
React Native 0.81.5 + Expo 54.0.30 + TypeScript 5.9.2

**Backend:**
Supabase 2.86.0 (PostgreSQL 15+, Auth, Storage, Realtime)

**Live Streaming:**
Agora SDK 4.5.3 + Agora RTM 2.2.6

**Paiements:**
Wave API (Orange Money, Wave, Free Money)

**Recherche:**
Meilisearch 0.54.0

**Stockage:**
Cloudflare R2

---

## FONCTIONNALITES CLES

**Acheteurs:**
- Navigation et recherche produits
- Panier et paiement Mobile Money
- Système de points (Bronze → Platine)
- Visualisation lives HD
- Notifications push
- Badges et achievements

**Vendeurs:**
- Gestion boutique personnalisable
- CRUD produits avec limites par plan
- Live Shopping (Premium: 166h/mois)
- Système de réputation
- Statistiques de ventes

**Abonnements:**
- Free: 0 produits, boutique cachée
- Starter: 50 produits, commission 15%
- Pro: 200 produits, commission 10%
- Premium: Illimité, Live Shopping, commission 5%

---

## ARCHITECTURE

```
React Native App
    ↓
Expo Router (Navigation)
    ↓
├─ Supabase (Backend)
│  ├─ PostgreSQL (BDD)
│  ├─ Auth (JWT)
│  ├─ Storage (Images)
│  └─ Realtime (Sync)
│
├─ Agora (Live Streaming)
│  ├─ Video HD
│  └─ Chat RTM
│
└─ Services externes
   ├─ Wave (Paiements)
   ├─ Meilisearch (Recherche)
   └─ Cloudflare R2 (CDN)
```

---

## STRUCTURE PROJET

```
project/
├── app/              → Pages (routing fichiers)
├── components/       → Composants réutilisables
├── hooks/            → 25+ custom hooks
├── contexts/         → États globaux
├── lib/              → Config et utilitaires
├── supabase/         → Migrations SQL + Edge Functions
└── .env              → Variables d'environnement
```

---

## HOOKS PRINCIPAUX (25+)

**Live:** useLiveShopping, useLiveNotifications
**Abonnement:** useSubscriptionAccess, useSubscriptionLimits
**Points:** useDailyLogin, useBonusSystem
**Localisation:** useSmartLocation, useUserLocation
**Notifications:** usePushNotifications
**Commerce:** useCart, useProductViews

---

## BASE DE DONNEES

**Tables principales:**
profiles, products, orders, live_sessions, daily_login_streak, subscription_plans, notifications, user_follows

**Fonctions SQL clés:**
- is_seller_subscription_active()
- can_seller_add_product()
- record_daily_login()
- get_user_notifications()
- increment_viewer_count()

---

## VARIABLES D'ENVIRONNEMENT

**Obligatoires:**
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_AGORA_APP_ID
- EXPO_PUBLIC_WAVE_API_KEY

**Serveur uniquement:**
- SUPABASE_SERVICE_ROLE_KEY
- AGORA_APP_CERTIFICATE
- WAVE_SECRET_KEY
- CLOUDFLARE_R2_SECRET_ACCESS_KEY

---

## COMMANDES RAPIDES

```bash
# Installation
npm install

# Dev
npx expo start

# Dev avec cache clean
npx expo start --clear

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Edge Function
supabase functions deploy wave-webhook

# Types Supabase
supabase gen types typescript --project-id <id> > types/database.types.ts
```

---

## SYSTEME DE POINTS

**Gain:**
- Connexion quotidienne: +10 pts
- Achats: +1% du montant
- Avis avec photo: +20 pts
- Parrainage: +100 pts
- Série 7j: +50 pts
- Série 30j: +200 pts
- Série 90j: +500 pts

**Niveaux:**
- Bronze: 0-999 pts
- Argent: 1000-4999 pts
- Or: 5000-14999 pts
- Platine: 15000+ pts

---

## LIVE SHOPPING

**Caractéristiques:**
- Streaming HD 1080p
- Chat temps réel
- Sélection produits
- Compteur spectateurs
- Notifications push
- 166h/mois (Premium)

**Technologies:**
- Agora RTC (vidéo)
- Agora RTM (chat)
- Supabase Realtime (sync)

---

## PAIEMENTS SUPPORTES

**Mobile Money:**
- Orange Money (0-2M FCFA)
- Wave (0-5M FCFA)
- Free Money (0-1M FCFA)

**Autres:**
- Carte bancaire (500-10M FCFA, +2.5%)
- Virement bancaire (10K-100M FCFA)

---

## SECURITE

- Row Level Security (RLS) sur toutes les tables
- JWT tokens via Supabase Auth
- Variables sensibles dans .env
- API keys publiques vs privées (EXPO_PUBLIC_*)
- HTTPS uniquement
- Validation côté client ET serveur

---

## DEPLOIEMENT

**Mobile:**
- Android: Google Play via EAS Build
- iOS: App Store via EAS Build + TestFlight

**Backend:**
- Supabase Cloud (PostgreSQL managed)
- Edge Functions sur Supabase Edge Runtime

**Media:**
- Cloudflare R2 + CDN global

---

## NOTIFICATIONS

**Types:**
- live_started (nouvelle session)
- product_live (produit en avant)
- live_ended (fin session)
- order_update (commande)
- subscription_active (abonnement validé)

**Delivery:**
- Push notifications (Expo)
- Notifications locales
- Realtime via Supabase

---

## BADGES ET ACHIEVEMENTS

**Types:**
- Badges d'achat (1ère commande, 10 commandes, etc.)
- Badges de connexion (streak 7j, 30j, 90j)
- Badges de parrainage (1 ami, 5 amis, 10 amis)
- Badges de niveau (Bronze, Argent, Or, Platine)

**Composant:** AchievementBadge.tsx avec animations

---

## LIMITES PAR PLAN

| Plan | Produits | Live | Commission | Points |
|------|----------|------|------------|--------|
| Free | 0 | Non | - | x1 |
| Starter | 50 | Non | 15% | x1.2 |
| Pro | 200 | Non | 10% | x1.5 |
| Premium | ∞ | 166h/mois | 5% | x2 |

---

## DOCUMENTATION

**Guides complets:**
- TECHNICAL_DOCUMENTATION.md (1900 lignes)
- DOCUMENTATION_TECHNIQUE_TEXTE.md (version texte)
- OUTILS_ET_TECHNOLOGIES.md (ce document détaillé)
- README.md (vue d'ensemble)

**Guides spécifiques:**
- GUIDE_POINTS_BONUS.md
- LIVE_SHOPPING_INSTALLATION.md
- README_ABONNEMENTS.md
- GUIDE_LOCALISATION.md

---

## SUPPORT

**Technique:** tech@senepanda.com
**Business:** business@senepanda.com

**Docs officielles:**
- Expo: docs.expo.dev
- Supabase: supabase.com/docs
- Agora: docs.agora.io
- React Native: reactnative.dev

---

## METRIQUES CLES

**Performance:**
- Temps chargement: < 2s
- Streaming latency: < 500ms
- Sync Realtime: < 100ms

**Business:**
- Conversion abonnement: 17%+
- Temps souscription: < 2min
- Rétention J30: 44%+
- Support tickets: < 75/mois

---

**Prêt pour production** ✓
**Compatible Expo Go** ✓ (sauf Live Shopping)
**Multi-plateforme** ✓ (iOS, Android)
**Temps réel** ✓ (Supabase Realtime)
