# 🔧 Fix: Erreurs de Schéma BDD

## 🐛 Problèmes Identifiés

Vous avez 2 erreurs liées au schéma de la base de données:

### 1. Colonne `currency` manquante dans `products`
```
Could not find the 'currency' column of 'products' in the schema cache
```

### 2. Relation manquante `user_subscriptions` ↔ `subscription_plans`
```
Could not find a relationship between 'user_subscriptions' and 'subscription_plans'
```

## ✅ Solution Complète

### Exécutez Cette Migration SQL

1. **Ouvrez Supabase Dashboard** → **SQL Editor**

2. **Exécutez le script** [`fix_all_schema_issues.sql`](supabase/migrations/fix_all_schema_issues.sql)

   Ou copiez-collez ce script rapide:

```sql
-- 1. Ajouter currency à products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA' NOT NULL;

UPDATE products
SET currency = 'FCFA'
WHERE currency IS NULL;

-- 2. Créer user_subscriptions (pour compatibilité)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS pour user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Synchroniser les abonnements existants
INSERT INTO user_subscriptions (user_id, plan_id, status, ends_at, is_approved)
SELECT
  p.id,
  sp.id,
  p.subscription_status,
  p.subscription_expires_at,
  true
FROM profiles p
LEFT JOIN subscription_plans sp ON sp.plan_type = p.subscription_plan
WHERE p.subscription_plan IS NOT NULL
  AND p.subscription_plan != 'free'
  AND p.subscription_status = 'active'
ON CONFLICT (user_id) DO NOTHING;
```

3. **Redémarrez l'application**
   - Fermez complètement l'app SenePanda
   - Réouvrez l'app
   - Les erreurs devraient disparaître

## 📋 Ce Que Fait Cette Migration

### 1. **Ajoute `currency` à `products`**
- Colonne avec valeur par défaut `'FCFA'`
- Permet de stocker la devise du produit
- Corrige l'erreur lors de l'ajout de produits

### 2. **Crée `user_subscriptions`**
- Table pour stocker les abonnements actifs
- Relation avec `subscription_plans` via `plan_id`
- Chaque utilisateur ne peut avoir qu'un abonnement actif (contrainte UNIQUE)

### 3. **Synchronise les données**
- Crée automatiquement des entrées dans `user_subscriptions`
- Pour tous les utilisateurs ayant déjà un plan actif dans `profiles`
- Assure la cohérence entre ancien et nouveau système

### 4. **Configure RLS (Row Level Security)**
- Les utilisateurs ne voient que leurs propres abonnements
- Sécurité renforcée

## 🔍 Vérification

Après avoir exécuté la migration, vérifiez:

```sql
-- 1. Vérifier currency dans products
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'currency';
-- Devrait retourner 1 ligne

-- 2. Vérifier user_subscriptions existe
SELECT COUNT(*) FROM user_subscriptions;
-- Devrait retourner le nombre d'abonnements actifs

-- 3. Vérifier la relation
SELECT
  us.id,
  us.user_id,
  sp.name as plan_name,
  us.status
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
LIMIT 5;
-- Devrait afficher les abonnements avec le nom du plan
```

## 🎯 Résultat Attendu

Après la migration et le redémarrage de l'app:

- ✅ **Ajout de produits fonctionne** (plus d'erreur `currency`)
- ✅ **Hook `useSubscriptionSync` fonctionne** (relation créée)
- ✅ **Page abonnements se charge** sans erreur
- ✅ **Live Shopping accessible** si vous avez Premium/Pro

## 🆘 Si Ça Ne Fonctionne Pas

### Erreur persiste après migration?

1. **Vérifiez que la migration s'est bien exécutée**:
```sql
SELECT * FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'currency';
```

2. **Videz le cache Supabase** dans l'app:
   - Fermez l'app
   - Supprimez les données de l'app (Settings → Apps → SenePanda → Clear Data)
   - Réouvrez l'app

3. **Redémarrez le serveur Expo**:
```bash
npm start -- --clear
```

### Erreur `user_subscriptions` persiste?

Le hook `useSubscriptionSync` est legacy. Si vous utilisez le nouveau système basé sur `profiles.subscription_plan`, vous pouvez:

1. **Option A**: Garder les deux systèmes (migration fait ça)
2. **Option B**: Supprimer complètement `useSubscriptionSync` du code

Pour l'option B, cherchez et supprimez les imports:
```typescript
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
```

Et utilisez uniquement:
```typescript
import { useProfileSubscriptionSync } from '@/hooks/useProfileSubscriptionSync';
```

## 📝 Fichiers Concernés

- [`supabase/migrations/fix_all_schema_issues.sql`](supabase/migrations/fix_all_schema_issues.sql) - Migration complète
- [`supabase/migrations/fix_products_currency_column.sql`](supabase/migrations/fix_products_currency_column.sql) - Fix currency seulement
- [`hooks/useSubscriptionSync.ts`](hooks/useSubscriptionSync.ts) - Hook legacy qui cause l'erreur

## ✅ Checklist

- [ ] Migration SQL exécutée dans Supabase
- [ ] Colonne `currency` existe dans `products`
- [ ] Table `user_subscriptions` créée
- [ ] Abonnements existants synchronisés
- [ ] App fermée puis réouverte
- [ ] Erreurs disparues
- [ ] Ajout de produit fonctionne
- [ ] Page abonnements se charge

---

**Date**: 2026-01-11
**Status**: 🔧 À appliquer
