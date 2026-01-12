# Vérification du Système d'Abonnement

## ✅ Étapes de Vérification

### 1. Vérifier la Structure de la Table

Exécutez cette requête dans Supabase SQL Editor:

```sql
-- Vérifier que toutes les colonnes existent
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'subscription_plans'
ORDER BY ordinal_position;
```

**Résultat attendu**: Vous devez voir toutes ces colonnes:
- id (uuid)
- plan_type (text)
- name (text)
- description (text)
- price_monthly (numeric)
- price_yearly (numeric)
- currency (text)
- max_products (integer)
- commission_rate (numeric)
- visibility_boost (integer)
- hd_photos (boolean)
- video_allowed (boolean)
- badge_name (text)
- support_level (text)
- advanced_analytics (boolean)
- ai_analytics (boolean)
- sponsored_campaigns (boolean)
- display_order (integer)
- is_active (boolean)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### 2. Vérifier les 4 Plans

```sql
-- Afficher tous les plans
SELECT
  plan_type,
  name,
  price_monthly,
  price_yearly,
  max_products,
  commission_rate,
  display_order,
  is_active
FROM subscription_plans
ORDER BY display_order;
```

**Résultat attendu**: 4 lignes
1. **free** - 0 FCFA, 5 produits, commission 15%, display_order=0
2. **starter** - 3,000 FCFA/mois, 50 produits, commission 12%, display_order=1
3. **pro** - 7,000 FCFA/mois, 200 produits, commission 10%, display_order=2
4. **premium** - 15,000 FCFA/mois, illimité, commission 7%, display_order=3

### 3. Vérifier les Politiques RLS

```sql
-- Vérifier les politiques
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'subscription_plans';
```

**Résultat attendu**:
- Une politique "Subscription plans are viewable by everyone" pour SELECT

### 4. Vérifier les Index

```sql
-- Vérifier les index
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'subscription_plans';
```

**Résultat attendu**: Au moins 3 index:
- idx_subscription_plans_plan_type
- idx_subscription_plans_display_order
- idx_subscription_plans_is_active

### 5. Test de Requête Applicative

```sql
-- Simuler la requête de l'app (plans payants uniquement)
SELECT
  plan_type,
  name,
  description,
  price_monthly,
  price_yearly
FROM subscription_plans
WHERE is_active = true
AND plan_type != 'free'
ORDER BY display_order;
```

**Résultat attendu**: 3 plans (Starter, Pro, Premium)
Le plan "free" ne doit PAS apparaître dans cette requête.

### 6. Vérifier qu'un Utilisateur Test a le Plan Gratuit

```sql
-- Remplacez USER_ID par un vrai ID utilisateur
SELECT
  id,
  full_name,
  subscription_plan,
  is_seller
FROM profiles
WHERE id = 'USER_ID';
```

**Résultat attendu**: subscription_plan = 'free' pour les nouveaux utilisateurs

## 🎯 Checklist de Validation

Cochez chaque élément après vérification:

- [ ] Table `subscription_plans` existe avec 21 colonnes
- [ ] 4 plans présents (free, starter, pro, premium)
- [ ] Plan gratuit a display_order=0
- [ ] Plans payants ont display_order 1, 2, 3
- [ ] Prix annuel = prix mensuel × 12
- [ ] Politiques RLS configurées
- [ ] Index créés pour performances
- [ ] Requête filtrée (sans free) retourne 3 plans
- [ ] Nouveaux utilisateurs ont subscription_plan='free'

## ❌ Si Quelque Chose Ne Fonctionne Pas

### Problème: Table vide après migration

**Solution**:
```sql
-- Vérifier s'il y a des données
SELECT COUNT(*) FROM subscription_plans;

-- Si 0, réexécutez la section INSERT du fichier setup_complete_abonnements.sql
```

### Problème: Colonnes manquantes

**Solution**: Réexécutez tout le fichier `setup_complete_abonnements.sql` qui commence par:
```sql
DROP TABLE IF EXISTS subscription_plans CASCADE;
```

### Problème: Le plan "free" apparaît dans l'app

**Vérification**: Le fichier `app/seller/subscription-plans.tsx` doit contenir:
```typescript
const paidPlans = (plansData || []).filter(p => p.plan_type !== 'free');
```

Et utiliser `paidPlans` dans le rendering, pas `plansData`.

## 📱 Test dans l'Application Mobile

1. **Ouvrir l'app** et aller dans "Abonnements"
2. **Vérifier** que seulement 3 plans s'affichent (Starter, Pro, Premium)
3. **Vérifier** les prix:
   - Starter: 3,000 FCFA/mois ou 30,000 FCFA/an
   - Pro: 7,000 FCFA/mois ou 70,000 FCFA/an
   - Premium: 15,000 FCFA/mois ou 150,000 FCFA/an
4. **Vérifier** que le plan gratuit n'apparaît nulle part dans l'interface

## 🎉 Succès!

Si toutes les vérifications passent, votre système d'abonnement est correctement configuré et prêt à l'emploi!

**Prochaines étapes**:
- Tester le flux de paiement Wave
- Vérifier l'upgrade/downgrade de plan
- Tester les limites de produits par plan
