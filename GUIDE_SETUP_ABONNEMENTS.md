# Guide de Configuration des Abonnements SenePanda

## 📋 Résumé

Ce guide vous explique comment configurer le système d'abonnement avec :
- **1 plan gratuit** (Free) - Pour les nouveaux utilisateurs
- **3 plans payants** (Starter, Pro, Premium) - Affichés pour la vente

## 🔧 Étapes d'installation

### Étape 1 : Créer/Mettre à jour la structure de la table

Exécutez ce fichier dans votre Dashboard Supabase (SQL Editor) :

```
supabase/migrations/fix_subscription_plans_table.sql
```

**Ce fichier :**
- ✅ Crée la table `subscription_plans` si elle n'existe pas
- ✅ Ajoute toutes les colonnes nécessaires (`price_monthly`, `price_yearly`, etc.)
- ✅ Configure les politiques RLS
- ✅ Crée la table `subscription_history` pour l'historique

### Étape 2 : Insérer les plans d'abonnement

Après l'étape 1, exécutez ce fichier :

```
supabase/migrations/insert_default_subscription_plans.sql
```

**Ce fichier :**
- ✅ Supprime les anciens plans (TRUNCATE)
- ✅ Insère 4 plans :
  - **Free** (gratuit, caché dans l'interface)
  - **Starter** - 3,000 FCFA/mois (30,000 FCFA/an)
  - **Pro** - 7,000 FCFA/mois (70,000 FCFA/an)
  - **Premium** - 15,000 FCFA/mois (150,000 FCFA/an)

## 📊 Plans d'abonnement

### Plan Gratuit (Free)
- **Prix** : 0 FCFA
- **Produits max** : 5
- **Commission** : 15%
- **Visibilité** : Standard (0%)
- **Photos HD** : ❌
- **Vidéos** : ❌
- **Support** : Standard
- **Affiché dans l'interface** : ❌ (caché, uniquement pour nouveaux utilisateurs)

### Plan Starter
- **Prix** : 3,000 FCFA/mois | 30,000 FCFA/an
- **Produits max** : 50
- **Commission** : 12%
- **Visibilité** : +20%
- **Photos HD** : ✅
- **Vidéos** : ❌
- **Badge** : "Starter"
- **Support** : Prioritaire
- **Analytics avancées** : ✅

### Plan Pro
- **Prix** : 7,000 FCFA/mois | 70,000 FCFA/an
- **Produits max** : 200
- **Commission** : 10%
- **Visibilité** : +50%
- **Photos HD** : ✅
- **Vidéos** : ✅
- **Badge** : "Pro Seller"
- **Support** : VIP
- **Analytics avancées** : ✅
- **AI Analytics** : ✅
- **Campagnes sponsorisées** : ✅

### Plan Premium
- **Prix** : 15,000 FCFA/mois | 150,000 FCFA/an
- **Produits max** : Illimités
- **Commission** : 7%
- **Visibilité** : +100%
- **Photos HD** : ✅
- **Vidéos** : ✅
- **Badge** : "Premium Seller"
- **Support** : Concierge 24/7
- **Analytics avancées** : ✅
- **AI Analytics** : ✅
- **Campagnes sponsorisées** : ✅

## ✅ Vérification

Après avoir exécuté les migrations, vérifiez :

```sql
-- Vérifier les plans créés
SELECT plan_type, name, price_monthly, price_yearly, display_order
FROM subscription_plans
ORDER BY display_order;

-- Devrait afficher 4 plans :
-- free (0), starter (1), pro (2), premium (3)
```

## 🔄 Fonctionnement dans l'app

1. **Nouveaux utilisateurs** : Obtiennent automatiquement le plan "free"
2. **Page des abonnements** : Affiche uniquement les 3 plans payants (Starter, Pro, Premium)
3. **Upgrade** : Les utilisateurs peuvent passer de "free" à un plan payant
4. **Downgrade** : Impossible de revenir au plan gratuit (il est caché)

## 🐛 En cas d'erreur

Si vous avez l'erreur `column "price_monthly" does not exist` :
1. Vérifiez que vous avez bien exécuté `fix_subscription_plans_table.sql` AVANT `insert_default_subscription_plans.sql`
2. Si nécessaire, supprimez la table et recommencez :
   ```sql
   DROP TABLE IF EXISTS subscription_plans CASCADE;
   ```
   Puis réexécutez les deux migrations dans l'ordre.

## 📝 Corrections appliquées

- ✅ Prix annuel corrigé : 12 mois au lieu de 10
- ✅ Système de synchronisation simplifié (uniquement `profiles.subscription_plan`)
- ✅ Plan gratuit restauré mais caché dans l'interface
- ✅ 3 plans payants affichés pour la vente
