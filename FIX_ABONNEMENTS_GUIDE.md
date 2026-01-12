# 🔧 Guide - Activer les Abonnements

## ❌ Problème

Quand on clique sur "Choisir ce plan", rien ne se passe. La page des abonnements est vide ou ne charge pas.

## 🔍 Cause

Les tables de la base de données pour les abonnements n'ont pas été créées ou les plans par défaut n'ont pas été insérés.

## ✅ Solution - Exécuter les migrations SQL

### Étape 1 : Aller dans Supabase Dashboard

1. Ouvrez votre projet Supabase : https://app.supabase.com
2. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Créer la table subscription_plans

Copiez et exécutez ce SQL :

```sql
-- Migration: fix_subscription_plans_table.sql
-- Créer ou modifier la table subscription_plans

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Créer la nouvelle table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  max_products INTEGER NOT NULL DEFAULT 10,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  visibility_boost INTEGER NOT NULL DEFAULT 0,
  hd_photos BOOLEAN NOT NULL DEFAULT false,
  video_allowed BOOLEAN NOT NULL DEFAULT false,
  badge_name TEXT,
  support_level TEXT NOT NULL DEFAULT 'standard',
  advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  ai_analytics BOOLEAN NOT NULL DEFAULT false,
  sponsored_campaigns BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_order ON subscription_plans(display_order);

-- RLS (Row Level Security)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les plans actifs
CREATE POLICY "Public can view active plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Politique: Seuls les admins peuvent modifier
CREATE POLICY "Only admins can modify plans"
  ON subscription_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**Cliquez sur "Run" (ou Ctrl+Enter)**

### Étape 3 : Insérer les 4 plans par défaut

Copiez et exécutez ce SQL :

```sql
-- Migration: insert_default_subscription_plans.sql
-- Insertion des 4 plans d'abonnement

-- Supprimer les anciens plans (pour éviter les doublons)
TRUNCATE TABLE subscription_plans CASCADE;

-- Insérer les 4 plans d'abonnement
INSERT INTO subscription_plans (
  plan_type,
  name,
  description,
  price_monthly,
  price_yearly,
  currency,
  max_products,
  commission_rate,
  visibility_boost,
  hd_photos,
  video_allowed,
  badge_name,
  support_level,
  advanced_analytics,
  ai_analytics,
  sponsored_campaigns,
  display_order,
  is_active
) VALUES
  -- Plan Gratuit
  (
    'free',
    'Gratuit',
    'Pour débuter votre activité',
    0,
    0,
    'XOF',
    10,
    15.00,
    0,
    false,
    false,
    null,
    'standard',
    false,
    false,
    false,
    1,
    true
  ),
  -- Plan Starter (2500 F CFA/mois)
  (
    'starter',
    'Starter',
    'Pour les vendeurs actifs',
    2500,
    25000,
    'XOF',
    50,
    12.00,
    20,
    true,
    false,
    'Starter',
    'priority',
    true,
    false,
    false,
    2,
    true
  ),
  -- Plan Pro (5000 F CFA/mois)
  (
    'pro',
    'Pro',
    'Pour les professionnels',
    5000,
    50000,
    'XOF',
    200,
    10.00,
    50,
    true,
    true,
    'Pro Seller',
    'vip',
    true,
    true,
    true,
    3,
    true
  ),
  -- Plan Premium (10000 F CFA/mois)
  (
    'premium',
    'Premium',
    'Pour dominer le marché',
    10000,
    100000,
    'XOF',
    999999,
    7.00,
    100,
    true,
    true,
    'Premium Seller',
    'concierge',
    true,
    true,
    true,
    4,
    true
  );

-- Vérifier que tout est OK
SELECT
  plan_type,
  name,
  price_monthly || ' XOF' as prix_mensuel,
  max_products as produits_max,
  commission_rate || '%' as commission
FROM subscription_plans
ORDER BY display_order;
```

**Cliquez sur "Run"**

Vous devriez voir les 4 plans :
- ✅ Gratuit (0 XOF)
- ✅ Starter (2500 XOF)
- ✅ Pro (5000 XOF)
- ✅ Premium (10000 XOF)

### Étape 4 : Créer la table subscription_history

```sql
-- Table pour l'historique des abonnements
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_status ON subscription_history(status);

-- RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history"
  ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription history"
  ON subscription_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Cliquez sur "Run"**

### Étape 5 : Vérifier la colonne subscription_plan dans profiles

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'subscription_expires_at', 'is_premium');
```

Si les colonnes n'existent pas, exécutez :

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan);
```

## 🧪 Tester

1. Fermez et rouvrez l'application
2. Allez dans **Profil** → **Abonnement**
3. Vous devriez voir les 4 plans affichés
4. Cliquez sur "Choisir ce plan" sur un plan payant
5. Le modal de paiement doit s'ouvrir ✅

## 🎯 Flux complet

1. **Utilisateur clique** sur "Abonnement" dans Profil
2. **Page s'ouvre** avec les 4 plans (Free, Starter, Pro, Premium)
3. **Clic sur "Choisir ce plan"** (plan payant)
4. **Modal de paiement** s'ouvre
5. **Sélection méthode** : Orange Money, Wave, Free Money, Carte, Virement
6. **Entrée détails** : Numéro de téléphone si mobile money
7. **Clic sur "Payer"**
8. **Simulation paiement** (2,5 secondes)
9. **Succès** : ✅ "Paiement réussi !"
10. **Profil mis à jour** : Plan actif + date d'expiration

## ❌ Si ça ne marche toujours pas

### Vérifier dans la console de l'app :

```
Error loading data: ...
```

**Solutions** :
- Vérifiez que vous avez exécuté TOUTES les migrations
- Vérifiez la connexion internet
- Reconnectez-vous à l'app

### Vérifier dans Supabase :

```sql
-- Compter les plans
SELECT COUNT(*) FROM subscription_plans WHERE is_active = true;
```

**Résultat attendu** : 4

## 📊 Structure des prix

| Plan | Prix/mois | Prix/an | Produits max | Commission |
|------|-----------|---------|--------------|------------|
| Gratuit | 0 F | 0 F | 10 | 15% |
| Starter | 2500 F | 25000 F | 50 | 12% |
| Pro | 5000 F | 50000 F | 200 | 10% |
| Premium | 10000 F | 100000 F | Illimité | 7% |

## ✨ Fonctionnalités par plan

### Gratuit
- ❌ Photos HD
- ❌ Vidéos
- ❌ Badge
- ❌ Analytics avancées
- ❌ IA Analytics
- ❌ Campagnes sponsorisées

### Starter
- ✅ Photos HD
- ❌ Vidéos
- ✅ Badge "Starter"
- ✅ Analytics avancées
- ❌ IA Analytics
- ❌ Campagnes sponsorisées
- ✅ Support prioritaire

### Pro
- ✅ Photos HD
- ✅ Vidéos (30s max)
- ✅ Badge "Pro Seller"
- ✅ Analytics avancées
- ✅ IA Analytics
- ✅ Campagnes sponsorisées
- ✅ Support VIP

### Premium
- ✅ Photos HD
- ✅ Vidéos illimitées
- ✅ Badge "Premium Seller"
- ✅ Analytics avancées
- ✅ IA Analytics
- ✅ Campagnes sponsorisées
- ✅ Support concierge 24/7

---

**Après avoir exécuté ces migrations, les abonnements seront complètement fonctionnels !** 🎉
