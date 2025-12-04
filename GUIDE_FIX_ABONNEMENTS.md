# 🔧 Guide de Correction des Erreurs d'Abonnement

**Date:** 30 Novembre 2025
**Statut:** ✅ Prêt à exécuter

---

## 📋 Résumé des Problèmes Identifiés

Après analyse complète du système d'abonnement, voici les problèmes détectés :

### 1. ❌ Colonnes Manquantes dans la Table `profiles`

La fonction `approve_subscription_request` tente d'utiliser la colonne `subscription_starts_at` qui n'existe pas dans la table `profiles`.

**Colonnes manquantes :**
- `subscription_starts_at` - Date de début de l'abonnement
- `subscription_status` - Statut de l'abonnement (active, pending, rejected, expired)
- `subscription_requested_plan` - Plan demandé en attente
- `subscription_requested_at` - Date de la demande
- `subscription_billing_period` - Période de facturation (monthly, yearly)

### 2. ⚠️ Indices de Performance Manquants

Les tables n'ont pas tous les indices nécessaires pour optimiser les requêtes.

### 3. 📊 Vue Admin Incomplète

La vue `pending_subscription_requests` pourrait être améliorée avec plus d'informations.

---

## ✅ Solution Complète

Un script SQL complet a été créé : `supabase/FIX_SUBSCRIPTION_ERRORS.sql`

Ce script :
- ✅ Ajoute toutes les colonnes manquantes
- ✅ Crée/met à jour toutes les fonctions nécessaires
- ✅ Configure les policies RLS correctement
- ✅ Ajoute les indices de performance
- ✅ Initialise les données existantes
- ✅ Affiche un rapport détaillé

---

## 🚀 Instructions d'Application

### Étape 1: Ouvrir Supabase Dashboard

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**

### Étape 2: Exécuter le Script de Correction

1. Cliquez sur **New Query**
2. Copiez tout le contenu du fichier `supabase/FIX_SUBSCRIPTION_ERRORS.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

### Étape 3: Vérifier les Résultats

Vous devriez voir des messages comme :

```
✅ Colonne subscription_starts_at ajoutée
✅ Colonne subscription_status ajoutée
✅ Colonne subscription_requested_plan ajoutée
✅ Colonne subscription_requested_at ajoutée
✅ Colonne subscription_billing_period ajoutée

════════════════════════════════════════════
✅ CORRECTION DES ABONNEMENTS TERMINÉE
════════════════════════════════════════════

📊 STATISTIQUES:
  • Total utilisateurs: X
  • Abonnements actifs: X
  • Demandes en attente: X
  • Abonnements expirés: X

✅ Toutes les colonnes ont été ajoutées
✅ Toutes les fonctions ont été créées
✅ Toutes les policies RLS sont actives
✅ La vue admin est disponible
```

---

## 🧪 Tester le Système d'Abonnement

### Test 1: Créer une Demande d'Abonnement

1. Ouvrez l'application mobile
2. Allez dans **Profil** > **Devenir Vendeur** > **Plans d'Abonnement**
3. Choisissez un plan (Starter, Pro ou Premium)
4. Sélectionnez la période (Mensuel ou Annuel)
5. Cliquez sur **Envoyer la demande**

**Résultat attendu :**
- Message de succès : "Demande envoyée ! Votre demande d'abonnement a été envoyée à l'administrateur."

### Test 2: Vérifier la Demande dans Supabase

Dans le SQL Editor, exécutez :

```sql
SELECT * FROM pending_subscription_requests;
```

**Résultat attendu :**
- Voir la demande avec toutes les informations (nom, plan, prix, etc.)

### Test 3: Approuver la Demande (En tant qu'Admin)

```sql
-- Remplacez les UUIDs par les vraies valeurs
SELECT approve_subscription_request(
  'request_id_ici',  -- L'ID de la demande
  'admin_user_id_ici',  -- Votre ID utilisateur admin
  'Demande approuvée - Paiement vérifié'  -- Notes admin
);
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Abonnement activé avec succès",
  "user_id": "...",
  "plan_type": "pro",
  "expires_at": "2025-12-30..."
}
```

### Test 4: Vérifier l'Activation dans l'App

1. L'utilisateur doit recevoir une notification
2. Son plan doit être mis à jour
3. Il doit avoir accès aux fonctionnalités vendeur

---

## 📊 Requêtes SQL Utiles pour l'Admin

### Voir toutes les demandes en attente
```sql
SELECT * FROM pending_subscription_requests;
```

### Voir tous les abonnements actifs
```sql
SELECT
  full_name,
  shop_name,
  subscription_plan,
  subscription_starts_at,
  subscription_expires_at,
  EXTRACT(DAY FROM (subscription_expires_at - NOW())) as jours_restants
FROM profiles
WHERE subscription_status = 'active'
  AND subscription_plan != 'free'
ORDER BY subscription_expires_at ASC;
```

### Voir les abonnements qui expirent bientôt (dans 7 jours)
```sql
SELECT
  full_name,
  shop_name,
  phone,
  email,
  subscription_plan,
  subscription_expires_at,
  EXTRACT(DAY FROM (subscription_expires_at - NOW())) as jours_restants
FROM profiles
WHERE subscription_status = 'active'
  AND subscription_plan != 'free'
  AND subscription_expires_at <= NOW() + INTERVAL '7 days'
ORDER BY subscription_expires_at ASC;
```

### Approuver une demande
```sql
SELECT approve_subscription_request(
  'request_id',
  'admin_id',
  'Notes optionnelles'
);
```

### Rejeter une demande
```sql
SELECT reject_subscription_request(
  'request_id',
  'admin_id',
  'Raison du rejet'
);
```

---

## 🔍 Diagnostic des Erreurs

### Erreur: "function request_subscription does not exist"

**Solution:** Exécutez le script `FIX_SUBSCRIPTION_ERRORS.sql` complet

### Erreur: "column subscription_starts_at does not exist"

**Solution:** La colonne n'a pas été créée. Exécutez le script de correction.

### L'utilisateur ne reçoit pas de notification

**Vérifications:**
1. La table `user_subscriptions` existe-t-elle ?
2. Realtime est-il activé sur cette table ?
3. Le hook `useSubscriptionSync` est-il utilisé dans l'app ?

**Pour activer Realtime:**
```sql
-- Dans Supabase Dashboard > Database > Replication
-- Activez la réplication pour user_subscriptions
```

### La demande est créée mais le statut ne change pas

**Vérification:**
```sql
SELECT
  id,
  subscription_status,
  subscription_requested_plan,
  subscription_requested_at
FROM profiles
WHERE id = 'user_id';
```

**Si subscription_status est NULL:**
```sql
UPDATE profiles
SET subscription_status = 'active'
WHERE subscription_status IS NULL;
```

---

## 📝 Structure Complète des Tables

### Table `profiles`

Colonnes liées aux abonnements :
- `subscription_plan` : TEXT - Plan actuel (free, starter, pro, premium)
- `subscription_status` : VARCHAR(20) - Statut (active, pending, rejected, expired)
- `subscription_starts_at` : TIMESTAMP - Date de début
- `subscription_expires_at` : TIMESTAMP - Date d'expiration
- `subscription_requested_plan` : VARCHAR(20) - Plan demandé
- `subscription_requested_at` : TIMESTAMP - Date de la demande
- `subscription_billing_period` : VARCHAR(10) - Période (monthly, yearly)
- `is_seller` : BOOLEAN - Si l'utilisateur est vendeur

### Table `subscription_requests`

```sql
CREATE TABLE subscription_requests (
  id UUID PRIMARY KEY,
  user_id UUID,
  plan_type VARCHAR(20),
  billing_period VARCHAR(10),
  status VARCHAR(20),  -- pending, approved, rejected
  requested_at TIMESTAMP,
  processed_at TIMESTAMP,
  processed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP
);
```

### Table `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  plan_type VARCHAR(20),  -- free, starter, pro, premium
  name TEXT,
  description TEXT,
  price_monthly INTEGER,
  price_yearly INTEGER,
  currency VARCHAR(10),
  max_products INTEGER,
  commission_rate INTEGER,
  visibility_boost INTEGER,
  hd_photos BOOLEAN,
  video_allowed BOOLEAN,
  advanced_analytics BOOLEAN,
  is_active BOOLEAN,
  display_order INTEGER
);
```

---

## 🎯 Prochaines Étapes

1. ✅ Exécuter le script de correction
2. ✅ Tester la création d'une demande
3. ✅ Tester l'approbation
4. ✅ Vérifier les notifications en temps réel
5. 🔄 Créer un dashboard admin pour gérer les demandes
6. 🔄 Ajouter des emails de notification
7. 🔄 Implémenter le renouvellement automatique

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans Supabase Dashboard > Logs
2. Vérifiez que toutes les migrations ont été exécutées
3. Testez chaque fonction SQL individuellement
4. Contactez le support technique avec les détails de l'erreur

---

## ✅ Checklist de Déploiement

- [ ] Script `FIX_SUBSCRIPTION_ERRORS.sql` exécuté avec succès
- [ ] Toutes les colonnes créées (vérifier avec `\d profiles` dans psql)
- [ ] Fonction `request_subscription` testée
- [ ] Fonction `approve_subscription_request` testée
- [ ] Vue `pending_subscription_requests` accessible
- [ ] RLS activée sur `subscription_requests`
- [ ] Test complet de bout en bout réussi
- [ ] Notifications en temps réel fonctionnelles
- [ ] Documentation admin créée
- [ ] Accès admin configuré

---

**✨ Une fois toutes ces étapes complétées, votre système d'abonnement sera 100% fonctionnel !**
