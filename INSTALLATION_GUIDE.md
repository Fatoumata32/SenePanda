# Guide d'Installation - Système de Plans d'Abonnement

## Prérequis

- Application SenePanda fonctionnelle
- Accès à la base de données Supabase
- Node.js et npm installés
- Expo CLI configuré

## Installation en 3 Étapes

### Étape 1 : Migration de la Base de Données

Appliquez la migration SQL pour créer toutes les tables et fonctions nécessaires :

```bash
# Via psql (si vous avez accès direct)
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/create_seller_subscription_plans.sql

# OU via l'interface Supabase SQL Editor
# 1. Allez sur https://supabase.com/dashboard
# 2. Sélectionnez votre projet
# 3. Allez dans SQL Editor
# 4. Collez le contenu de create_seller_subscription_plans.sql
# 5. Exécutez la requête
```

**Vérification** :
```sql
-- Cette requête doit retourner 4 plans
SELECT plan_type, name, price_monthly FROM subscription_plans ORDER BY display_order;
```

Résultat attendu :
```
plan_type | name      | price_monthly
----------|-----------|---------------
free      | Gratuit   | 0
starter   | Starter   | 5000
pro       | Pro       | 15000
premium   | Premium   | 30000
```

### Étape 2 : Vérification des Types TypeScript

Les types ont déjà été ajoutés dans `types/database.ts`. Vérifiez qu'ils sont présents :

```bash
# Rechercher les types d'abonnement
grep -n "SubscriptionPlan" types/database.ts
```

Vous devriez voir :
- `SubscriptionPlanType`
- `SubscriptionStatus`
- `SubscriptionPlan`
- `SellerSubscription`
- `FeaturedProductRotation`
- `SubscriptionHistory`

### Étape 3 : Mettre à Jour les Profils Existants

Si vous avez déjà des vendeurs dans votre base :

```sql
-- Assigner le plan gratuit à tous les vendeurs existants
UPDATE profiles
SET
  subscription_plan = 'free',
  subscription_expires_at = NULL,
  subscription_auto_renew = false
WHERE is_seller = true AND subscription_plan IS NULL;
```

## Test du Système

### Test 1 : Vérifier que l'application compile

```bash
npm run typecheck
```

Aucune erreur TypeScript ne devrait apparaître.

### Test 2 : Tester l'interface utilisateur

```bash
# Démarrer l'app
npm run dev
```

Puis naviguez vers :
1. Profil → (Si vendeur) → Plans d'Abonnement
2. Page d'accueil → Devrait afficher "Produits Mis en Avant"

### Test 3 : Tester les fonctions SQL

```bash
# Exécuter le script de test
psql -h your-supabase-host -U postgres -d postgres -f scripts/test-subscription-system.sql
```

Ce script va :
1. ✅ Afficher les 4 plans
2. ✅ Simuler un upgrade vers Starter
3. ✅ Vérifier les limites de produits
4. ✅ Calculer le MRR (Monthly Recurring Revenue)

## Configuration Optionnelle

### Personnaliser les Prix

Éditez `supabase/migrations/create_seller_subscription_plans.sql` :

```sql
-- Modifier les prix selon votre marché
INSERT INTO subscription_plans (..., price_monthly, ...) VALUES
  (..., 0, ...),      -- Free
  (..., 5000, ...),   -- Starter - Ajustez ici
  (..., 15000, ...),  -- Pro - Ajustez ici
  (..., 30000, ...)   -- Premium - Ajustez ici
```

Puis ré-exécutez la migration.

### Personnaliser les Avantages

Dans la même migration, ajustez :

```sql
-- Commission rates
commission_rate: 20, 15, 10, 7

-- Max products
max_products: 5, 25, 100, 999999

-- Visibility boost
visibility_boost: 0, 20, 50, 100
```

### Configurer les Paiements (À implémenter)

Le système actuel simule les paiements. Pour intégrer un vrai système :

1. **Wave Money (Sénégal)** :
   ```typescript
   // À ajouter dans seller/subscription-plans.tsx
   import { initiateWavePayment } from '@/lib/wave';

   const handlePayment = async (plan) => {
     const paymentUrl = await initiateWavePayment({
       amount: plan.price_monthly,
       description: `Abonnement ${plan.name}`,
     });
     Linking.openURL(paymentUrl);
   };
   ```

2. **Orange Money (Afrique)** :
   ```typescript
   import { initiateOrangePayment } from '@/lib/orange';
   ```

3. **Stripe (International)** :
   ```typescript
   import { initiateStripeSubscription } from '@/lib/stripe';
   ```

## Maintenance

### Vérifier les Abonnements Expirés

Créez un cron job qui s'exécute quotidiennement :

```sql
-- Marquer les abonnements expirés
UPDATE seller_subscriptions
SET status = 'expired'
WHERE expires_at < now() AND status = 'active';

-- Rétrograder les profils vers Free
UPDATE profiles p
SET
  subscription_plan = 'free',
  subscription_expires_at = NULL
FROM seller_subscriptions ss
WHERE p.id = ss.seller_id
  AND ss.status = 'expired'
  AND p.subscription_plan != 'free';
```

### Générer des Rapports

```sql
-- Rapport mensuel des revenus
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_subscriptions,
  SUM(amount_paid) as revenue
FROM seller_subscriptions
WHERE created_at >= now() - interval '6 months'
GROUP BY month
ORDER BY month DESC;

-- Top vendeurs par plan
SELECT
  p.shop_name,
  prof.subscription_plan,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_amount) as total_revenue
FROM profiles prof
JOIN products p ON p.seller_id = prof.id
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE prof.is_seller = true
GROUP BY p.shop_name, prof.subscription_plan
ORDER BY total_revenue DESC
LIMIT 20;
```

## Dépannage

### Problème : Les plans ne s'affichent pas

**Solution** :
```sql
-- Vérifier que les plans existent
SELECT * FROM subscription_plans WHERE is_active = true;

-- Vérifier les permissions RLS
SELECT * FROM pg_policies WHERE tablename = 'subscription_plans';
```

### Problème : Impossible d'ajouter des produits

**Solution** :
```sql
-- Vérifier la limite de produits
SELECT
  p.shop_name,
  prof.subscription_plan,
  sp.max_products,
  COUNT(prod.id) as current_products
FROM profiles prof
JOIN subscription_plans sp ON sp.plan_type = prof.subscription_plan
JOIN products prod ON prod.seller_id = prof.id
LEFT JOIN profiles p ON p.id = prof.id
WHERE prof.id = 'SELLER_UUID'
GROUP BY p.shop_name, prof.subscription_plan, sp.max_products;
```

### Problème : L'upgrade ne fonctionne pas

**Solution** :
```sql
-- Vérifier les logs
SELECT * FROM subscription_history
WHERE seller_id = 'SELLER_UUID'
ORDER BY created_at DESC;

-- Tester manuellement la fonction
SELECT upgrade_seller_plan(
  'SELLER_UUID'::uuid,
  'starter'::subscription_plan_type,
  5000,
  'TEST_TXN'
);
```

## Support

### Documentation Complète

- `SUBSCRIPTION_SYSTEM.md` - Vue d'ensemble technique
- `PRICING_LOGIC.md` - Logique de tarification pour les vendeurs
- `scripts/test-subscription-system.sql` - Script de test complet

### Contact

Pour toute question technique :
1. Consultez les fichiers de documentation
2. Exécutez les scripts de test
3. Vérifiez les logs Supabase
4. Créez une issue sur GitHub (si applicable)

## Checklist de Déploiement

Avant de mettre en production :

- [ ] Migration SQL appliquée avec succès
- [ ] Types TypeScript sans erreurs
- [ ] Tests UI effectués (écran des plans fonctionne)
- [ ] Tests SQL effectués (script de test exécuté)
- [ ] Paiements configurés (ou simulation active)
- [ ] Cron job créé pour gérer les expirations
- [ ] Rapports de revenue testés
- [ ] Documentation partagée avec l'équipe
- [ ] Support formé sur le nouveau système
- [ ] Communication aux vendeurs envoyée

## Félicitations ! 🎉

Votre système de plans d'abonnement est maintenant opérationnel !

Les vendeurs peuvent :
- ✅ Voir les plans disponibles
- ✅ S'abonner à un plan
- ✅ Bénéficier de la mise en valeur automatique
- ✅ Économiser sur les commissions

La plateforme peut :
- ✅ Générer des revenus récurrents
- ✅ Offrir une expérience équitable
- ✅ Motiver les vendeurs à améliorer leur qualité
- ✅ Croître de manière durable

---

**Date de création** : Octobre 2025
**Version** : 1.0.0
**Auteur** : Équipe SenePanda
