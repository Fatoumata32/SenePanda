# 🎯 Guide d'Activation du Système d'Abonnements

## 📋 Vue d'ensemble

Ce guide vous aide à activer le système d'abonnements pour les vendeurs sur SenePanda.
Le système propose 4 plans : **Gratuit**, **Starter**, **Pro** et **Premium**.

## 🚀 Étapes d'Installation

### Étape 1️⃣ : Mise à jour de la structure de la base de données

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet SenePanda

2. **Ouvrir le SQL Editor**
   - Dans le menu latéral, cliquer sur **SQL Editor**
   - Cliquer sur **New query**

3. **Exécuter la première migration**
   - Copier le contenu du fichier :
     ```
     supabase/migrations/fix_subscription_plans_table.sql
     ```
   - Coller dans l'éditeur SQL
   - Cliquer sur **Run** (ou appuyer sur `Ctrl+Enter`)
   - ✅ Vérifier que tout s'est bien passé (messages de succès)

### Étape 2️⃣ : Insertion des plans d'abonnement

1. **Créer une nouvelle requête**
   - Cliquer sur **New query** dans le SQL Editor

2. **Exécuter la deuxième migration**
   - Copier le contenu du fichier :
     ```
     supabase/migrations/insert_default_subscription_plans.sql
     ```
   - Coller dans l'éditeur SQL
   - Cliquer sur **Run**
   - ✅ Vous devriez voir les 4 plans créés

### Étape 3️⃣ : Vérification

1. **Vérifier la table subscription_plans**
   - Dans le SQL Editor, exécuter :
   ```sql
   SELECT plan_type, name, price_monthly, price_yearly, max_products, commission_rate
   FROM subscription_plans
   ORDER BY display_order;
   ```

2. **Résultat attendu** :
   ```
   plan_type | name     | price_monthly | price_yearly | max_products | commission_rate
   ----------|----------|---------------|--------------|--------------|----------------
   free      | Gratuit  | 0             | 0            | 10           | 15.00
   starter   | Starter  | 2500          | 25000        | 50           | 12.00
   pro       | Pro      | 5000          | 50000        | 200          | 10.00
   premium   | Premium  | 10000         | 100000       | 999999       | 7.00
   ```

## 📊 Détails des Plans

### 🆓 Plan Gratuit
- **Prix** : 0 XOF
- **Produits** : 10 maximum
- **Commission** : 15%
- **Visibilité** : Standard
- **Support** : Standard
- **Photos HD** : ❌
- **Vidéos** : ❌
- **Analytics** : ❌

### ⚡ Plan Starter
- **Prix** : 2 500 XOF/mois (25 000 XOF/an, économie de 5 000 XOF)
- **Produits** : 50 maximum
- **Commission** : 12%
- **Visibilité** : +20%
- **Support** : Prioritaire
- **Photos HD** : ✅
- **Vidéos** : ❌
- **Analytics** : ✅ Avancé
- **Badge** : "Starter"

### 💼 Plan Pro (POPULAIRE)
- **Prix** : 5 000 XOF/mois (50 000 XOF/an, économie de 10 000 XOF)
- **Produits** : 200 maximum
- **Commission** : 10%
- **Visibilité** : +50%
- **Support** : VIP
- **Photos HD** : ✅
- **Vidéos** : ✅
- **Analytics** : ✅ Avancé + IA
- **Campagnes sponsorisées** : ✅
- **Badge** : "Pro Seller"

### 👑 Plan Premium
- **Prix** : 10 000 XOF/mois (100 000 XOF/an, économie de 20 000 XOF)
- **Produits** : Illimités
- **Commission** : 7%
- **Visibilité** : +100%
- **Support** : Concierge 24/7
- **Photos HD** : ✅
- **Vidéos** : ✅
- **Analytics** : ✅ Avancé + IA
- **Campagnes sponsorisées** : ✅
- **Badge** : "Premium Seller"

## 🎨 Utilisation dans l'Application

### Pour les Vendeurs

1. **Accéder aux abonnements**
   - Dans le profil vendeur
   - Cliquer sur "Gérer mon abonnement" ou "Passer à Premium"

2. **Choisir un plan**
   - Voir les détails de chaque plan
   - Comparer les avantages
   - Choisir mensuel ou annuel (économie de 17% sur l'annuel)

3. **Processus de paiement**
   - Sélectionner la méthode de paiement :
     - Orange Money
     - Wave
     - Free Money
     - Carte bancaire
     - Virement bancaire
   - Entrer les informations requises
   - Confirmer le paiement

4. **Activation**
   - L'abonnement est activé immédiatement
   - Le profil est mis à jour avec le nouveau plan
   - Les nouvelles limites s'appliquent automatiquement

### Gestion de l'Abonnement

- **Voir le plan actuel** : Affiché dans le profil
- **Jours restants** : Visible sur la carte du plan
- **Renouvellement** : Proposé automatiquement avant expiration
- **Changement de plan** : Possible à tout moment
  - Upgrade : Paiement de la différence
  - Downgrade : Valable jusqu'à la fin de la période payée

## 🔧 Configuration Technique

### Tables de la Base de Données

1. **subscription_plans**
   - Contient les 4 plans d'abonnement
   - Visible par tous (lecture seule)

2. **subscription_history**
   - Historique des paiements et changements de plan
   - Chaque utilisateur ne voit que son historique

3. **profiles.subscription_plan**
   - Plan actuel de l'utilisateur
   - Valeurs : 'free', 'starter', 'pro', 'premium'

4. **profiles.subscription_expires_at**
   - Date d'expiration de l'abonnement
   - NULL pour le plan gratuit

### Méthodes de Paiement Disponibles

- ✅ Orange Money
- ✅ Wave
- ✅ Free Money
- ✅ Carte bancaire
- ✅ Virement bancaire

### Sécurité

- ✅ Row Level Security (RLS) activé
- ✅ Les utilisateurs ne peuvent voir que leurs propres données
- ✅ Les plans sont en lecture seule pour les utilisateurs
- ✅ Paiements cryptés et sécurisés

## 📱 Pages et Composants

### Pages
- `/seller/subscription-plans` : Page complète des plans
- Accessible depuis le profil vendeur

### Composants
- `SubscriptionModal` : Modal réutilisable pour choisir un plan
- Peut être utilisé n'importe où dans l'application

### Exemple d'utilisation du Modal

```typescript
import SubscriptionModal from '@/components/SubscriptionModal';

const [showModal, setShowModal] = useState(false);

<SubscriptionModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    // Rafraîchir les données
    loadUserData();
  }}
/>
```

## ✅ Checklist de Vérification

- [ ] Migration 1 exécutée avec succès
- [ ] Migration 2 exécutée avec succès
- [ ] 4 plans visibles dans la table subscription_plans
- [ ] Page /seller/subscription-plans accessible
- [ ] Modal SubscriptionModal fonctionnel
- [ ] Processus de paiement complet
- [ ] Mise à jour du profil après paiement
- [ ] Historique des paiements enregistré

## 🐛 Dépannage

### Problème : "Table subscription_plans n'existe pas"
**Solution** : Exécuter d'abord le fichier `supabase/COMPLETE_DATABASE_SETUP.sql`

### Problème : "Colonnes manquantes dans subscription_plans"
**Solution** : Exécuter la migration `fix_subscription_plans_table.sql`

### Problème : "Aucun plan disponible"
**Solution** : Exécuter la migration `insert_default_subscription_plans.sql`

### Problème : "Erreur de permission"
**Solution** : Vérifier que RLS est bien configuré (inclus dans les migrations)

## 📞 Support

Pour toute question ou problème :
1. Vérifier ce guide
2. Consulter les logs dans Supabase Dashboard
3. Vérifier les erreurs dans la console de l'application

## 🎉 Félicitations !

Le système d'abonnements est maintenant opérationnel ! 🚀

Les vendeurs peuvent maintenant :
- ✅ Voir les différents plans
- ✅ Comparer les avantages
- ✅ Souscrire à un plan payant
- ✅ Gérer leur abonnement
- ✅ Profiter des avantages de leur plan
