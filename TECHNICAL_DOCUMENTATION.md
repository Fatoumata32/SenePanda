# 📘 Documentation Technique - SenePanda V2.0

**Pour:** Développeurs rejoignant le projet
**Version:** 2.0.0
**Date:** Décembre 2024 - Janvier 2025
**Plateforme:** React Native + Expo + Supabase

---

## 📋 Table des Matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Architecture générale](#3-architecture-générale)
4. [Structure du projet](#4-structure-du-projet)
5. [Fonctionnalités principales](#5-fonctionnalités-principales)
6. [Base de données (Supabase)](#6-base-de-données-supabase)
7. [Authentification](#7-authentification)
8. [Système d'abonnement](#8-système-dabonnement)
9. [Live Shopping](#9-live-shopping)
10. [Système de paiement](#10-système-de-paiement)
11. [Configuration et variables d'environnement](#11-configuration-et-variables-denvironnement)
12. [Guide de démarrage](#12-guide-de-démarrage)
13. [Déploiement](#13-déploiement)
14. [Conventions de code](#14-conventions-de-code)
15. [Références importantes](#15-références-importantes)

---

## 1. Vue d'ensemble du projet

### 🎯 Qu'est-ce que SenePanda ?

**SenePanda** est une marketplace e-commerce multi-vendeurs destinée au marché sénégalais, avec des fonctionnalités avancées de commerce en direct (Live Shopping).

### Principales caractéristiques

- **Marketplace multi-vendeurs** : Acheteurs et vendeurs sur une même plateforme
- **Live Shopping** : Vente en direct via streaming vidéo (premium)
- **Système d'abonnement** : 4 plans (Free, Starter, Pro, Premium)
- **Système de points** : Gamification avec récompenses
- **Paiement Mobile Money** : Orange Money, Wave, Free Money
- **Géolocalisation** : Vendeurs à proximité
- **Multi-rôle** : Un utilisateur peut être acheteur ET vendeur

### Objectifs business

- Simplifier le commerce en ligne au Sénégal
- Permettre aux vendeurs de vendre en direct
- Réduire les frictions dans le processus d'achat
- Fidéliser via un système de points

---

## 2. Stack Technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React Native** | 0.81.5 | Framework mobile |
| **Expo** | ~54.0.30 | Toolchain et build |
| **Expo Router** | ~6.0.21 | Navigation basée fichiers |
| **TypeScript** | ~5.9.2 | Typage statique |
| **React** | 19.1.0 | Bibliothèque UI |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Supabase** | 2.86.0 | BaaS (Auth, DB, Storage) |
| **PostgreSQL** | 15+ | Base de données |
| **Edge Functions** | - | Serverless functions |
| **Realtime** | - | Synchronisation temps réel |

### Services tiers

| Service | Usage |
|---------|-------|
| **Agora SDK** | Live streaming vidéo HD |
| **Meilisearch** | Recherche rapide de produits |
| **Cloudflare R2** | Stockage images/médias |
| **Wave API** | Paiements mobile money |

### Librairies principales

```json
{
  "@supabase/supabase-js": "^2.86.0",
  "react-native-agora": "^4.5.3",
  "agora-react-native-rtm": "^2.2.6",
  "expo-camera": "~17.0.10",
  "expo-location": "~19.0.8",
  "expo-notifications": "~0.32.15",
  "expo-local-authentication": "~17.0.8",
  "meilisearch": "^0.54.0"
}
```

---

## 3. Architecture Générale

### Schéma d'architecture

```
┌─────────────────────────────────────────────────┐
│           APPLICATION MOBILE (React Native)      │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Acheteurs   │  │   Vendeurs   │            │
│  └──────────────┘  └──────────────┘            │
│         │                  │                     │
│         └──────────┬───────┘                     │
│                    │                             │
└────────────────────┼─────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   EXPO ROUTER (Nav)   │
         └───────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│    SUPABASE     │    │  AGORA SDK      │
│  (Backend)      │    │  (Live Stream)  │
│                 │    │                 │
│ • Auth          │    │ • Video HD      │
│ • PostgreSQL    │    │ • RTM Chat      │
│ • Storage       │    │ • 166h/mois     │
│ • Realtime      │    └─────────────────┘
│ • Edge Funcs    │
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         SERVICES EXTERNES               │
│                                         │
│  • Wave (Paiements)                    │
│  • Meilisearch (Recherche)             │
│  • Cloudflare R2 (Stockage)            │
└─────────────────────────────────────────┘
```

### Pattern architectural

- **Architecture en couches** : Séparation claire UI / Logic / Data
- **Context API** : Gestion d'état global (Auth, Cart, Notifications)
- **Custom Hooks** : Logique réutilisable encapsulée
- **Atomic Design** : Composants réutilisables (atoms → organisms)

### Flux de données

```
User Action → Component → Custom Hook → Supabase Client → PostgreSQL
                  ↓
             Context Update
                  ↓
            UI Re-render
```

---

## 4. Structure du Projet

### Arborescence principale

```
project/
├── 📁 app/                          # Pages (Expo Router)
│   ├── (tabs)/                      # Navigation tabs
│   │   ├── _layout.tsx              # Layout tabs principal
│   │   ├── home.tsx                 # 🏠 Page d'accueil
│   │   ├── explore.tsx              # 🔍 Exploration produits
│   │   ├── profile.tsx              # 👤 Profil utilisateur
│   │   └── lives.tsx                # 📹 Lives actifs
│   ├── seller/                      # Espace vendeur
│   │   ├── _layout.tsx              # Layout vendeur
│   │   ├── my-shop.tsx              # Ma Boutique
│   │   ├── add-product.tsx          # Ajouter produit
│   │   ├── products.tsx             # Liste produits
│   │   ├── subscription-plans.tsx   # Plans d'abonnement
│   │   ├── start-live.tsx           # Démarrer live
│   │   └── my-lives.tsx             # Mes sessions live
│   ├── auth/                        # Authentification
│   │   └── phone-auth.tsx           # Auth par téléphone
│   ├── checkout.tsx                 # Page paiement
│   ├── cart.tsx                     # Panier d'achat
│   └── simple-auth.tsx              # Auth simplifiée
│
├── 📁 components/                   # Composants réutilisables
│   ├── ActiveLiveSessions.tsx       # Sessions live actives
│   ├── ProductCard.tsx              # Carte produit
│   ├── LocationBanner.tsx           # Bannière localisation
│   ├── PointsDashboard.tsx          # Dashboard points
│   ├── profile/                     # Composants profil
│   │   ├── SettingsModal.tsx        # Modal paramètres
│   │   └── StatsCard.tsx            # Carte statistiques
│   ├── seller/                      # Composants vendeur
│   │   └── ProductPerformance.tsx   # Performance produits
│   └── subscription/                # Composants abonnement
│       └── PaymentMethodSelector.tsx
│
├── 📁 hooks/                        # Custom Hooks
│   ├── useLiveShopping.ts           # Hook live shopping
│   ├── useSubscriptionAccess.ts     # Vérification abonnement
│   ├── useSubscriptionLimits.ts     # Limites abonnement
│   ├── useDailyLogin.ts             # Connexion quotidienne
│   ├── useSmartLocation.ts          # Géolocalisation
│   ├── useCart.ts                   # Gestion panier
│   ├── useBonusSystem.ts            # Système de bonus
│   └── useProfileSubscriptionSync.ts # Sync abonnement
│
├── 📁 contexts/                     # Context Providers
│   ├── CartContext.tsx              # État panier
│   ├── OnboardingContext.tsx        # État onboarding
│   ├── NotificationContext.tsx      # Notifications
│   └── NavigationContext.tsx        # Navigation
│
├── 📁 lib/                          # Utilitaires et configs
│   ├── supabase.ts                  # Client Supabase
│   ├── agoraConfig.ts               # Config Agora
│   ├── payment.ts                   # Service paiement
│   ├── wavePayment.ts               # Intégration Wave
│   ├── smartGeolocation.ts          # Géolocalisation
│   └── reputationSystem.ts          # Système réputation
│
├── 📁 utils/                        # Fonctions utilitaires
│   └── subscriptionAccess.ts        # Logique abonnement
│
├── 📁 constants/                    # Constantes
│   └── Colors.ts                    # Palette de couleurs
│
├── 📁 types/                        # Types TypeScript
│   ├── database.types.ts            # Types Supabase auto
│   └── index.ts                     # Types custom
│
├── 📁 supabase/                     # Backend Supabase
│   ├── migrations/                  # Migrations SQL
│   │   ├── 20251011232345_create_marketplace_schema.sql
│   │   ├── add_subscription_plan_to_profiles.sql
│   │   ├── add_geolocation_system.sql
│   │   ├── add_live_notifications.sql
│   │   └── ...
│   └── functions/                   # Edge Functions
│       └── wave-webhook/
│           └── index.ts
│
├── 📁 assets/                       # Assets statiques
│   ├── images/
│   └── fonts/
│
├── 📄 package.json                  # Dépendances
├── 📄 app.config.js                 # Config Expo
├── 📄 tsconfig.json                 # Config TypeScript
├── 📄 .env                          # Variables d'environnement
└── 📄 README.md                     # Documentation générale
```

### Conventions de nommage

- **Composants** : PascalCase (ex: `ProductCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (ex: `useCart.ts`)
- **Utils** : camelCase (ex: `subscriptionAccess.ts`)
- **Constants** : UPPER_SNAKE_CASE (ex: `MAX_PRODUCTS`)
- **Types** : PascalCase (ex: `Product`, `User`)

---

## 5. Fonctionnalités Principales

### 5.1 Acheteurs

#### Page d'accueil (`app/(tabs)/home.tsx`)
- Hero section avec CTA "Acheter" / "Vendre"
- Catégories populaires
- Flash deals avec compte à rebours
- Sessions live actives
- Produits recommandés
- Bannière de localisation

**Hooks utilisés:**
```typescript
import { useLiveShopping } from '@/hooks/useLiveShopping';
import { useSmartLocation } from '@/hooks/useSmartLocation';
```

#### Exploration (`app/(tabs)/explore.tsx`)
- Navigation par catégories
- Filtres (prix, note, distance)
- Tri (récents, populaires, prix croissant/décroissant)
- Recherche avec Meilisearch
- Recherche vocale (Expo Speech Recognition)

#### Panier (`app/cart.tsx`)
- Ajout/suppression d'articles
- Modification quantités
- Calcul total avec frais
- Validation avant checkout

**Context:**
```typescript
import { useCart } from '@/contexts/CartContext';
```

#### Système de points (`app/my-benefits.tsx`)
- Affichage du solde de points
- Niveaux : Bronze, Argent, Or, Platine
- Historique des transactions
- Récompenses disponibles

**Sources de points:**
- Connexion quotidienne : +10 pts
- Achat : +1% du montant
- Avis produit : +20 pts (avec photo)
- Parrainage : +100 pts

---

### 5.2 Vendeurs

#### Ma Boutique (`app/seller/my-shop.tsx`)

**Fonctionnalités:**
- Édition du profil boutique (nom, description, téléphone)
- Upload logo boutique
- Personnalisation du thème :
  - Choix de 6 gradients prédéfinis
  - OU création gradient custom (couleur primaire + secondaire + angle)
- Affichage des 4 derniers produits
- Mode édition/visualisation

**Code clé:**
```typescript
// État du thème
const [selectedGradient, setSelectedGradient] = useState<string>('sunset');
const [customGradient, setCustomGradient] = useState({
  primaryColor: '#FF6B6B',
  secondaryColor: '#4ECDC4',
  angle: 135
});

// Sauvegarde dans Supabase
await supabase
  .from('profiles')
  .update({
    shop_gradient_theme: selectedGradient,
    shop_custom_gradient: customGradient
  })
  .eq('id', user.id);
```

#### Gestion des produits (`app/seller/products.tsx`)

**CRUD complet:**
- Lister tous les produits du vendeur
- Ajouter un nouveau produit
- Modifier un produit existant
- Supprimer un produit
- Toggle statut actif/inactif

**Vérification des limites:**
```typescript
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

const { canAddProduct, productLimit, currentCount } = useSubscriptionLimits();

if (!canAddProduct) {
  alert(`Limite atteinte: ${currentCount}/${productLimit} produits`);
  return;
}
```

**Limites par plan:**
- FREE: 0 produits (boutique cachée)
- STARTER: 50 produits max
- PRO: 200 produits max
- PREMIUM: Illimité

#### Live Shopping (`app/seller/start-live.tsx`)

**Fonctionnalités (PREMIUM uniquement):**
- Création de session live
- Sélection de produits à mettre en avant
- Titre et description de la session
- Streaming vidéo HD via Agora
- Chat en temps réel (Agora RTM)
- Limite: 166 heures/mois

**Technologies:**
```typescript
import { RtcEngine, RtmEngine } from 'react-native-agora';
import { agoraConfig } from '@/lib/agoraConfig';

// Configuration Agora
const config = {
  appId: process.env.EXPO_PUBLIC_AGORA_APP_ID,
  channel: `live_${sessionId}`,
  token: agoraToken
};
```

---

### 5.3 Live Shopping

#### Visualisation (`app/(tabs)/live-viewer/[id].tsx`)

**Acheteurs peuvent:**
- Regarder le stream en direct
- Voir les produits présentés
- Ajouter au panier pendant le live
- Envoyer des messages dans le chat
- Voir le nombre de spectateurs

**Hook principal:**
```typescript
import { useLiveShopping } from '@/hooks/useLiveShopping';

const { activeSessions, loading, error } = useLiveShopping();
```

**Structure session:**
```typescript
interface LiveSession {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended';
  viewer_count: number;
  featured_products: string[]; // IDs produits
  agora_channel: string;
  started_at: string;
  ended_at?: string;
}
```

---

## 6. Base de Données (Supabase)

### Tables principales

#### `profiles`
Informations utilisateur étendues

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'buyer', -- 'buyer', 'seller', 'both'
  preferred_role TEXT, -- Rôle préféré

  -- Boutique vendeur
  shop_name TEXT,
  shop_description TEXT,
  shop_logo_url TEXT,
  shop_phone TEXT,
  shop_address TEXT,
  shop_gradient_theme TEXT DEFAULT 'sunset',
  shop_custom_gradient JSONB,

  -- Abonnement
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'premium'
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,

  -- Points et réputation
  points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  reputation_score DECIMAL(3,2) DEFAULT 5.00,

  -- Localisation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  country TEXT DEFAULT 'Sénégal',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Row Level Security (RLS):**
```sql
-- Lecture publique des profils vendeurs actifs
CREATE POLICY "Public can view active seller profiles"
  ON profiles FOR SELECT
  USING (
    role IN ('seller', 'both')
    AND subscription_status = 'active'
  );

-- Modification uniquement par le propriétaire
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### `products`
Catalogue de produits

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),

  category TEXT NOT NULL,
  images TEXT[], -- URLs des images
  video_url TEXT,

  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'draft', 'archived'

  -- SEO & Performance
  views INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Vues SQL pour filtrage:**
```sql
-- Produits visibles uniquement si vendeur actif
CREATE VIEW active_seller_products AS
SELECT p.*
FROM products p
INNER JOIN profiles seller ON p.seller_id = seller.id
WHERE
  p.status = 'active'
  AND seller.subscription_status = 'active'
  AND (
    seller.subscription_expires_at IS NULL
    OR seller.subscription_expires_at > NOW()
  );
```

#### `live_sessions`
Sessions de live shopping

```sql
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended'

  agora_channel TEXT UNIQUE,
  agora_token TEXT,

  viewer_count INTEGER DEFAULT 0,
  featured_products UUID[] DEFAULT '{}',

  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculé automatiquement

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger pour calculer durée:**
```sql
CREATE OR REPLACE FUNCTION calculate_live_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_session_duration_trigger
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_live_duration();
```

#### `orders`
Commandes

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),

  items JSONB NOT NULL, -- [{product_id, quantity, price}]
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',

  shipping_address JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `daily_login_streak`
Suivi connexions quotidiennes

```sql
CREATE TABLE daily_login_streak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) UNIQUE,

  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  total_logins INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Fonctions SQL importantes

#### Vérification abonnement actif
```sql
CREATE OR REPLACE FUNCTION is_seller_subscription_active(seller_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_data RECORD;
BEGIN
  SELECT subscription_status, subscription_expires_at
  INTO profile_data
  FROM profiles
  WHERE id = seller_id;

  RETURN (
    profile_data.subscription_status = 'active'
    AND (
      profile_data.subscription_expires_at IS NULL
      OR profile_data.subscription_expires_at > NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;
```

#### Vérification limite produits
```sql
CREATE OR REPLACE FUNCTION can_seller_add_product(seller_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_products INTEGER;
  seller_plan TEXT;
BEGIN
  -- Récupérer le plan actuel
  SELECT subscription_plan INTO seller_plan
  FROM profiles
  WHERE id = seller_id;

  -- Définir la limite selon le plan
  max_products := CASE seller_plan
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 200
    WHEN 'premium' THEN 999999 -- Illimité
    ELSE 0
  END;

  -- Compter les produits actifs
  SELECT COUNT(*) INTO current_count
  FROM products
  WHERE seller_id = seller_id AND status = 'active';

  RETURN current_count < max_products;
END;
$$ LANGUAGE plpgsql;
```

#### Attribution points connexion quotidienne
```sql
CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS TABLE(points_awarded INTEGER, new_streak INTEGER) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_streak_record RECORD;
  v_points INTEGER := 10; -- Points de base
  v_bonus_points INTEGER := 0;
BEGIN
  -- Récupérer ou créer l'enregistrement de streak
  SELECT * INTO v_streak_record
  FROM daily_login_streak
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Premier login
    INSERT INTO daily_login_streak (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, v_today, 1);

    UPDATE profiles SET points = points + v_points WHERE id = p_user_id;
    RETURN QUERY SELECT v_points, 1;
  ELSE
    -- Vérifier si c'est un nouveau jour
    IF v_streak_record.last_login_date < v_today THEN
      -- Calculer nouveau streak
      IF v_streak_record.last_login_date = v_today - INTERVAL '1 day' THEN
        -- Streak continue
        v_streak_record.current_streak := v_streak_record.current_streak + 1;

        -- Bonus pour milestones
        IF v_streak_record.current_streak = 7 THEN v_bonus_points := 50;
        ELSIF v_streak_record.current_streak = 30 THEN v_bonus_points := 200;
        ELSIF v_streak_record.current_streak = 90 THEN v_bonus_points := 500;
        END IF;
      ELSE
        -- Streak cassée
        v_streak_record.current_streak := 1;
      END IF;

      -- Mettre à jour
      UPDATE daily_login_streak
      SET
        current_streak = v_streak_record.current_streak,
        longest_streak = GREATEST(longest_streak, v_streak_record.current_streak),
        last_login_date = v_today,
        total_logins = total_logins + 1
      WHERE user_id = p_user_id;

      -- Ajouter points
      v_points := v_points + v_bonus_points;
      UPDATE profiles SET points = points + v_points WHERE id = p_user_id;

      RETURN QUERY SELECT v_points, v_streak_record.current_streak;
    ELSE
      -- Déjà connecté aujourd'hui
      RETURN QUERY SELECT 0, v_streak_record.current_streak;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Migrations

**Emplacement:** `supabase/migrations/`

**Ordre d'exécution recommandé:**
1. `20251011232345_create_marketplace_schema.sql` - Schéma de base
2. `add_subscription_plan_to_profiles.sql` - Système d'abonnement
3. `add_geolocation_system.sql` - Géolocalisation
4. `add_seller_reputation_system.sql` - Réputation vendeurs
5. `add_live_notifications.sql` - Notifications live
6. `add_product_views.sql` - Tracking vues produits

**Application:**
```bash
# Via Supabase Dashboard
1. Aller sur https://supabase.com
2. SQL Editor → New Query
3. Copier/coller le contenu de la migration
4. Run

# Via CLI (alternative)
supabase db push
```

---

## 7. Authentification

### Système multi-rôle

SenePanda utilise un système d'authentification flexible où un utilisateur peut être:
- **Acheteur uniquement** (`role: 'buyer'`)
- **Vendeur uniquement** (`role: 'seller'`)
- **Les deux** (`role: 'both'`)

### Flux d'authentification

#### Inscription (`app/simple-auth.tsx`)

```typescript
import { supabase } from '@/lib/supabase';

// Inscription avec email/mot de passe
const handleSignUp = async (email: string, password: string, phone: string) => {
  // 1. Créer le compte Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. Créer le profil utilisateur
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user!.id,
      email,
      phone,
      role: 'buyer', // Par défaut
      subscription_plan: 'free',
      points: 50, // Bonus de bienvenue
    });

  if (profileError) throw profileError;

  // 3. Enregistrer première connexion
  await supabase.rpc('record_daily_login', { p_user_id: authData.user!.id });
};
```

#### Connexion

```typescript
const handleSignIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Enregistrer la connexion quotidienne
  await supabase.rpc('record_daily_login', { p_user_id: data.user.id });
};
```

#### Vérification authentification

**Hook personnalisé:**
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

### Sélection de rôle

**Composant:** `app/role-selection.tsx`

```typescript
const handleRoleSelection = async (selectedRole: 'buyer' | 'seller') => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('profiles')
    .update({
      role: selectedRole,
      preferred_role: selectedRole
    })
    .eq('id', user.id);

  // Rediriger selon le rôle
  if (selectedRole === 'seller') {
    router.push('/seller/setup');
  } else {
    router.push('/(tabs)/home');
  }
};
```

### Basculement de rôle

**Composant:** `components/RoleSwitchButton.tsx`

Permet aux utilisateurs avec `role: 'both'` de basculer entre interface acheteur et vendeur.

```typescript
const toggleRole = async () => {
  const newRole = currentRole === 'buyer' ? 'seller' : 'buyer';

  await supabase
    .from('profiles')
    .update({ preferred_role: newRole })
    .eq('id', user.id);

  setCurrentRole(newRole);
  router.push(newRole === 'seller' ? '/seller' : '/(tabs)/home');
};
```

---

## 8. Système d'Abonnement

### Plans disponibles

| Plan | Prix/mois | Produits | Live Shopping | Commission | Bonus Points |
|------|-----------|----------|---------------|------------|--------------|
| **FREE** | 0 FCFA | 0 | ❌ | - | x1 |
| **STARTER** | 5,000 FCFA | 50 | ❌ | 15% | x1.2 |
| **PRO** | 15,000 FCFA | 200 | ❌ | 10% | x1.5 |
| **PREMIUM** | 35,000 FCFA | ∞ | ✅ 166h/mois | 5% | x2 |

### Hook de vérification (`hooks/useSubscriptionAccess.ts`)

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSubscriptionAccess() {
  const [isActive, setIsActive] = useState(false);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_expires_at')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const isSubscriptionActive =
        profile.subscription_status === 'active' &&
        (!profile.subscription_expires_at ||
         new Date(profile.subscription_expires_at) > new Date());

      setIsActive(isSubscriptionActive);
      setPlan(profile.subscription_plan);
      setLoading(false);
    }

    checkAccess();

    // Écouter changements en temps réel
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          checkAccess(); // Rafraîchir
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { isActive, plan, loading };
}
```

### Hook de limites (`hooks/useSubscriptionLimits.ts`)

```typescript
export function useSubscriptionLimits() {
  const { plan } = useSubscriptionAccess();
  const [currentCount, setCurrentCount] = useState(0);

  const limits = {
    free: { products: 0, liveHours: 0 },
    starter: { products: 50, liveHours: 0 },
    pro: { products: 200, liveHours: 0 },
    premium: { products: 999999, liveHours: 166 }
  };

  const canAddProduct = currentCount < limits[plan].products;
  const canStartLive = plan === 'premium';

  return {
    canAddProduct,
    canStartLive,
    productLimit: limits[plan].products,
    liveHoursLimit: limits[plan].liveHours,
    currentCount
  };
}
```

### Synchronisation temps réel (`hooks/useProfileSubscriptionSync.ts`)

Écoute les changements d'abonnement validés par l'admin et met à jour l'UI instantanément.

```typescript
export function useProfileSubscriptionSync() {
  const [syncStatus, setSyncStatus] = useState('synced');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          setSyncStatus('syncing');

          // Afficher notification si abonnement activé
          if (
            payload.new.subscription_status === 'active' &&
            payload.old.subscription_status !== 'active'
          ) {
            Alert.alert(
              'Abonnement activé!',
              `Votre plan ${payload.new.subscription_plan.toUpperCase()} est maintenant actif.`
            );
          }

          setSyncStatus('synced');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { syncStatus };
}
```

---

## 9. Live Shopping

### Configuration Agora (`lib/agoraConfig.ts`)

```typescript
export const agoraConfig = {
  appId: process.env.EXPO_PUBLIC_AGORA_APP_ID!,

  // Génération de token (côté serveur)
  async generateToken(channelName: string, uid: number): Promise<string> {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/agora/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, uid })
      }
    );

    const { token } = await response.json();
    return token;
  }
};
```

### Démarrage d'une session (`app/seller/start-live.tsx`)

```typescript
import { RtcEngine } from 'react-native-agora';

const startLiveSession = async () => {
  // 1. Vérifier l'abonnement premium
  const { canStartLive } = useSubscriptionLimits();
  if (!canStartLive) {
    Alert.alert('Abonnement requis', 'Le Live Shopping nécessite le plan Premium');
    return;
  }

  // 2. Créer la session dans Supabase
  const channelName = `live_${Date.now()}`;
  const { data: session, error } = await supabase
    .from('live_sessions')
    .insert({
      seller_id: user.id,
      title: liveTitle,
      description: liveDescription,
      agora_channel: channelName,
      featured_products: selectedProductIds,
      status: 'scheduled',
      scheduled_for: new Date()
    })
    .select()
    .single();

  if (error) throw error;

  // 3. Générer token Agora
  const token = await agoraConfig.generateToken(channelName, user.id);

  // 4. Initialiser le moteur Agora
  const engine = await RtcEngine.createWithContext({
    appId: agoraConfig.appId,
    channelProfile: ChannelProfile.LiveBroadcasting
  });

  await engine.setClientRole(ClientRole.Broadcaster);
  await engine.enableVideo();
  await engine.startPreview();

  // 5. Rejoindre le canal
  await engine.joinChannel(token, channelName, null, 0);

  // 6. Mettre à jour le statut
  await supabase
    .from('live_sessions')
    .update({
      status: 'live',
      started_at: new Date(),
      agora_token: token
    })
    .eq('id', session.id);
};
```

### Visualisation (`app/(tabs)/live-viewer/[id].tsx`)

```typescript
const joinAsViewer = async (sessionId: string) => {
  // 1. Récupérer les infos de la session
  const { data: session } = await supabase
    .from('live_sessions')
    .select('*, profiles(*)')
    .eq('id', sessionId)
    .single();

  if (!session || session.status !== 'live') {
    Alert.alert('Session indisponible');
    return;
  }

  // 2. Générer token viewer
  const token = await agoraConfig.generateToken(
    session.agora_channel,
    viewerId
  );

  // 3. Initialiser engine
  const engine = await RtcEngine.createWithContext({
    appId: agoraConfig.appId,
    channelProfile: ChannelProfile.LiveBroadcasting
  });

  await engine.setClientRole(ClientRole.Audience); // Spectateur

  // 4. Rejoindre le canal
  await engine.joinChannel(token, session.agora_channel, null, viewerId);

  // 5. Incrémenter le compteur de spectateurs
  await supabase.rpc('increment_viewer_count', { session_id: sessionId });
};
```

### Hook personnalisé (`hooks/useLiveShopping.ts`)

```typescript
export function useLiveShopping() {
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger sessions actives
    async function fetchActiveSessions() {
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          profiles:seller_id (
            id,
            shop_name,
            shop_logo_url,
            avatar_url
          )
        `)
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      if (!error && data) {
        setActiveSessions(data);
      }
      setLoading(false);
    }

    fetchActiveSessions();

    // Écouter nouvelles sessions en temps réel
    const channel = supabase
      .channel('live-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
          filter: 'status=eq.live'
        },
        () => {
          fetchActiveSessions(); // Rafraîchir
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { activeSessions, loading };
}
```

---

## 10. Système de Paiement

### Méthodes supportées (`lib/payment.ts`)

```typescript
export const paymentMethods = {
  ORANGE_MONEY: {
    id: 'orange_money',
    name: 'Orange Money',
    icon: 'smartphone',
    minAmount: 0,
    maxAmount: 2000000, // 2M FCFA
    fees: 0,
    processingTime: 'Instantané'
  },
  WAVE: {
    id: 'wave',
    name: 'Wave',
    icon: 'zap',
    minAmount: 0,
    maxAmount: 5000000, // 5M FCFA
    fees: 0,
    processingTime: 'Instantané'
  },
  FREE_MONEY: {
    id: 'free_money',
    name: 'Free Money',
    icon: 'smartphone',
    minAmount: 0,
    maxAmount: 1000000, // 1M FCFA
    fees: 0,
    processingTime: 'Instantané'
  },
  CARD: {
    id: 'card',
    name: 'Carte Bancaire',
    icon: 'credit-card',
    minAmount: 500,
    maxAmount: 10000000,
    fees: 2.5, // %
    processingTime: 'Instantané'
  }
};
```

### Validation numéro téléphone

```typescript
export function validatePhoneNumber(phone: string, provider: string): boolean {
  // Formats sénégalais
  const patterns = {
    orange_money: /^(77|78)\d{7}$/,
    wave: /^(70|76|77|78)\d{7}$/,
    free_money: /^76\d{7}$/
  };

  const pattern = patterns[provider];
  return pattern ? pattern.test(phone.replace(/\s/g, '')) : false;
}
```

### Intégration Wave (`lib/wavePayment.ts`)

```typescript
export class WavePayment {
  private apiKey: string;
  private baseUrl = 'https://api.wave.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initiatePayment(params: {
    amount: number;
    currency: string;
    phone: string;
    description: string;
  }) {
    const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: params.amount * 100, // Convertir en centimes
        currency: params.currency,
        client_reference: `order_${Date.now()}`,
        redirect_url: 'senepanda://payment/success',
        error_url: 'senepanda://payment/error',
        payment_method: {
          type: 'mobile_money',
          phone: params.phone
        },
        metadata: {
          description: params.description
        }
      })
    });

    const data = await response.json();
    return data;
  }

  async checkPaymentStatus(checkoutId: string) {
    const response = await fetch(
      `${this.baseUrl}/checkout/sessions/${checkoutId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );

    const data = await response.json();
    return data.payment_status; // 'pending', 'success', 'failed'
  }
}
```

### Flux de paiement (`app/checkout.tsx`)

```typescript
const processPayment = async () => {
  try {
    setProcessing(true);

    // 1. Créer commande
    const { data: order } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        items: cartItems,
        subtotal: cartTotal,
        total: cartTotal + shippingCost,
        payment_method: selectedMethod,
        payment_status: 'pending'
      })
      .select()
      .single();

    // 2. Initier paiement selon méthode
    let paymentResult;

    if (selectedMethod === 'wave') {
      const wave = new WavePayment(process.env.EXPO_PUBLIC_WAVE_API_KEY);
      paymentResult = await wave.initiatePayment({
        amount: order.total,
        currency: 'XOF',
        phone: paymentPhone,
        description: `Commande #${order.id.slice(0, 8)}`
      });

      // 3. Rediriger vers Wave
      await WebBrowser.openBrowserAsync(paymentResult.wave_launch_url);

      // 4. Attendre callback
      // (géré par webhook Wave → supabase/functions/wave-webhook)

    } else if (selectedMethod === 'orange_money') {
      // Implémentation Orange Money API
      // ...
    }

    // 5. Attribuer points d'achat
    const pointsEarned = Math.floor(order.total * 0.01); // 1%
    await supabase
      .from('profiles')
      .update({
        points: supabase.raw(`points + ${pointsEarned}`),
        total_points: supabase.raw(`total_points + ${pointsEarned}`)
      })
      .eq('id', user.id);

    // 6. Vider le panier
    clearCart();

    router.push('/order-success');

  } catch (error) {
    Alert.alert('Erreur de paiement', error.message);
  } finally {
    setProcessing(false);
  }
};
```

---

## 11. Configuration et Variables d'Environnement

### Fichier `.env`

```bash
# SUPABASE
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Serveur uniquement

# AGORA (Live Shopping)
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate # Serveur uniquement

# CLOUDFLARE R2 (Stockage)
EXPO_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=senepanda-media

# MEILISEARCH (Recherche)
EXPO_PUBLIC_MEILISEARCH_HOST=https://your-instance.meilisearch.com
EXPO_PUBLIC_MEILISEARCH_API_KEY=your_search_api_key
MEILISEARCH_ADMIN_KEY=your_admin_key # Serveur uniquement

# WAVE (Paiement)
EXPO_PUBLIC_WAVE_API_KEY=wave_sn_prod_xxxxx
WAVE_SECRET_KEY=your_wave_secret # Serveur uniquement
```

### Configuration Expo (`app.config.js`)

```javascript
export default {
  expo: {
    name: "SenePanda",
    slug: "senepanda",
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "senepanda",
    userInterfaceStyle: "automatic",

    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FF6B6B"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.senepanda.app"
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FF6B6B"
      },
      package: "com.senepanda.app",
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },

    plugins: [
      "expo-router",
      "expo-camera",
      "expo-location",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 34,
            targetSdkVersion: 34
          }
        }
      ]
    ],

    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "your-eas-project-id"
      }
    }
  }
};
```

---

## 12. Guide de Démarrage

### Prérequis

- Node.js >= 18
- npm ou yarn
- Git
- Compte Supabase
- Compte Expo (pour build)
- Android Studio ou Xcode (pour émulateur)

### Installation

```bash
# 1. Cloner le repository
git clone <repository-url>
cd project

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 4. Lancer le serveur de développement
npx expo start

# 5. Options de test
# - Appuyez sur 'a' pour Android
# - Appuyez sur 'i' pour iOS
# - Scannez le QR code avec Expo Go
```

### Configuration Supabase

```bash
# 1. Créer un projet sur https://supabase.com

# 2. Exécuter les migrations (dans l'ordre)
# Via Supabase Dashboard → SQL Editor

# Script 1: Schéma de base
supabase/migrations/20251011232345_create_marketplace_schema.sql

# Script 2: Abonnements
supabase/migrations/add_subscription_plan_to_profiles.sql

# Script 3: Géolocalisation
supabase/migrations/add_geolocation_system.sql

# Script 4: Live Shopping
supabase/migrations/add_live_notifications.sql

# 3. Configurer Storage
# Dashboard → Storage → New Bucket
# Nom: product-images
# Public: true

# 4. Configurer Realtime
# Dashboard → Database → Replication
# Activer pour: profiles, products, live_sessions
```

### Lancer en développement

```bash
# Démarrer avec cache clean
npx expo start --clear

# Mode développement avec tunnel (pour test sur device physique)
npx expo start --tunnel

# Lancer sur émulateur Android
npx expo run:android

# Lancer sur simulateur iOS (macOS uniquement)
npx expo run:ios
```

### Tester l'application

**Créer un compte de test:**
```sql
-- Dans Supabase SQL Editor
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at
) VALUES (
  'test@senepanda.sn',
  crypt('TestPassword123', gen_salt('bf')),
  NOW()
) RETURNING id;

-- Créer le profil
INSERT INTO profiles (
  id,
  email,
  phone,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  points
) VALUES (
  '<id-from-previous-query>',
  'test@senepanda.sn',
  '771234567',
  'Utilisateur Test',
  'both',
  'premium',
  'active',
  1000
);
```

---

## 13. Déploiement

### Build Android (APK)

```bash
# 1. Installer EAS CLI
npm install -g eas-cli

# 2. Login EAS
eas login

# 3. Configurer le projet
eas build:configure

# 4. Build APK (preview)
eas build --platform android --profile preview

# 5. Build Production
eas build --platform android --profile production

# 6. Télécharger l'APK
# Lien fourni dans la console après le build
```

### Build iOS

```bash
# Build pour TestFlight
eas build --platform ios --profile preview

# Build Production (nécessite Apple Developer Account)
eas build --platform ios --profile production
```

### Déploiement Edge Functions

```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link au projet
supabase link --project-ref your-project-ref

# 4. Déployer une fonction
supabase functions deploy wave-webhook

# 5. Définir les secrets
supabase secrets set WAVE_SECRET_KEY=your_secret_key
```

### Configuration Production

**Variables d'environnement:**
```bash
# Fichier .env.production
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
EXPO_PUBLIC_AGORA_APP_ID=your_production_agora_id
# ... autres variables
```

**EAS Build:**
```json
// eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://prod.supabase.co"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

---

## 14. Conventions de Code

### TypeScript

```typescript
// ✅ BON: Interfaces pour les types de données
interface Product {
  id: string;
  title: string;
  price: number;
  seller_id: string;
}

// ✅ BON: Types pour les unions et alias
type PaymentMethod = 'orange_money' | 'wave' | 'card';

// ✅ BON: Typage des fonctions
async function fetchProduct(id: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  return data;
}
```

### Composants React

```typescript
// ✅ BON: Typage des props
interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showFavorite?: boolean;
}

export function ProductCard({
  product,
  onPress,
  showFavorite = true
}: ProductCardProps) {
  // ...
}

// ✅ BON: Utilisation de memo pour performance
export const ProductCard = memo(function ProductCard(props: ProductCardProps) {
  // ...
});
```

### Hooks personnalisés

```typescript
// ✅ BON: Préfixe "use", typage retour
export function useProducts(categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ...

  return { products, loading, error };
}
```

### Gestion d'erreurs

```typescript
// ✅ BON: Try-catch avec messages clairs
try {
  const result = await dangerousOperation();
} catch (error) {
  console.error('[ProductCard] Failed to load:', error);
  Alert.alert(
    'Erreur',
    'Impossible de charger le produit. Veuillez réessayer.'
  );
}

// ✅ BON: Vérifications nullish
const productTitle = product?.title ?? 'Sans titre';
```

### Styling

```typescript
// ✅ BON: StyleSheet avec types
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  }
});

// ✅ BON: Utilisation de constantes pour couleurs
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8
  }
});
```

---

## 15. Références Importantes

### Documentation projet

| Document | Description |
|----------|-------------|
| `README.md` | Vue d'ensemble générale |
| `START_ICI.md` | Démarrage ultra-rapide |
| `SOMMAIRE_COMPLET.md` | Navigation documentation |
| `QUICK_START.md` | Guide déploiement rapide |
| `CHECKLIST_DEPLOIEMENT.md` | Checklist complète |

### Guides fonctionnels

| Guide | Sujet |
|-------|-------|
| `GUIDE_POINTS_BONUS.md` | Système de points |
| `LIVE_SHOPPING_INSTALLATION.md` | Setup Live Shopping |
| `GUIDE_LOCALISATION.md` | Géolocalisation |
| `README_ABONNEMENTS.md` | Système d'abonnement |

### Fichiers SQL importants

| Fichier | Usage |
|---------|-------|
| `supabase/COMPLETE_FIX_ALL.sql` | Script complet de setup |
| `supabase/migrations/add_subscription_plan_to_profiles.sql` | Abonnements |
| `supabase/migrations/add_geolocation_system.sql` | Géolocalisation |

### Ressources externes

- **Expo Documentation:** https://docs.expo.dev
- **Supabase Documentation:** https://supabase.com/docs
- **Agora Documentation:** https://docs.agora.io
- **React Native:** https://reactnative.dev
- **TypeScript:** https://www.typescriptlang.org/docs

### Contact support

- **Email technique:** tech@senepanda.com
- **Email business:** business@senepanda.com
- **Documentation:** Ce fichier + dossier docs/

---

## 🎉 Félicitations !

Vous avez maintenant toutes les informations nécessaires pour comprendre et contribuer au projet SenePanda.

**Prochaines étapes recommandées:**

1. ✅ Lire `README.md` pour contexte général
2. ✅ Suivre "Guide de Démarrage" (Section 12)
3. ✅ Explorer le code dans `app/` et `components/`
4. ✅ Tester les fonctionnalités principales
5. ✅ Lire les guides spécifiques selon vos besoins

**Besoin d'aide ?**
- Consultez la documentation dans le projet
- Lisez les commentaires dans le code
- Contactez l'équipe technique

---

**Version:** 2.0.0
**Dernière mise à jour:** Janvier 2025
**Auteur:** Équipe SenePanda

**Bon développement ! 🚀**
