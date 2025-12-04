# 🗄️ Guide Complet - Configuration de la Base de Données SenePanda

## 📋 Vue d'ensemble

Ce guide vous permet de configurer **toute la base de données** de l'application SenePanda en une seule fois, y compris le système d'abonnements avec les bons prix.

## ⚠️ IMPORTANT

Le script `SENEPANDA_COMPLETE_DATABASE.sql` contient **TOUTE** la structure de la base de données :
- ✅ Table `profiles` avec toutes les colonnes
- ✅ Système d'abonnements complet (subscription_plans + subscription_history)
- ✅ Les **4 plans d'abonnement** avec les bons prix :
  - **Gratuit** : 0 F CFA
  - **Starter** : 2500 F CFA/mois, 25000 F CFA/an
  - **Pro** : 5000 F CFA/mois, 50000 F CFA/an
  - **Premium** : 10000 F CFA/mois, 100000 F CFA/an
- ✅ Toutes les autres tables (produits, commandes, messages, etc.)
- ✅ Tous les index pour les performances
- ✅ Toutes les politiques RLS (Row Level Security)
- ✅ Tous les triggers et fonctions

---

## 🚀 Instructions d'Exécution

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur : https://app.supabase.com
2. Sélectionnez votre projet **SenePanda**
3. Dans le menu de gauche, cliquez sur **SQL Editor**

### Étape 2 : Ouvrir le Script

1. Sur votre ordinateur, ouvrez le fichier :
   ```
   supabase/SENEPANDA_COMPLETE_DATABASE.sql
   ```

2. **Sélectionnez TOUT le contenu** du fichier (Ctrl+A ou Cmd+A)

3. **Copiez** tout le contenu (Ctrl+C ou Cmd+C)

### Étape 3 : Coller et Exécuter

1. Dans le **SQL Editor** de Supabase, collez le script (Ctrl+V ou Cmd+V)

2. Cliquez sur le bouton **Run** (ou appuyez sur Ctrl+Enter)

3. **Attendez** que l'exécution se termine (environ 10-30 secondes)

### Étape 4 : Vérification

Une fois l'exécution terminée, vous devriez voir :

✅ **Dans les messages** :
```
====================================
✅ BASE DE DONNÉES CONFIGURÉE AVEC SUCCÈS!
====================================

ℹ️  Nombre de plans actifs: 4

📦 Gratuit (FREE)
   💰 Prix mensuel: 0 XOF
   💰 Prix annuel: 0 XOF
   📦 Produits max: 10
   💳 Commission: 15%

📦 Starter (STARTER)
   💰 Prix mensuel: 2500 XOF
   💰 Prix annuel: 25000 XOF
   📦 Produits max: 50
   💳 Commission: 12%

📦 Pro (PRO)
   💰 Prix mensuel: 5000 XOF
   💰 Prix annuel: 50000 XOF
   📦 Produits max: 200
   💳 Commission: 10%

📦 Premium (PREMIUM)
   💰 Prix mensuel: 10000 XOF
   💰 Prix annuel: 100000 XOF
   💰 Produits max: 999999
   💳 Commission: 7%

====================================
🎉 Vous pouvez maintenant utiliser
   les abonnements dans l'app!
====================================
```

✅ **Dans les résultats** :
Un tableau avec les 4 plans :

| Type    | Nom      | Prix/mois  | Prix/an     | Produits max | Commission |
|---------|----------|------------|-------------|--------------|------------|
| free    | Gratuit  | 0 XOF      | 0 XOF       | 10           | 15%        |
| starter | Starter  | 2500 XOF   | 25000 XOF   | 50           | 12%        |
| pro     | Pro      | 5000 XOF   | 50000 XOF   | 200          | 10%        |
| premium | Premium  | 10000 XOF  | 100000 XOF  | 999999       | 7%         |

---

## 🧪 Tester dans l'Application

### 1. Redémarrer l'Application

Fermez complètement l'application et relancez-la :

```bash
# Si l'app est en cours d'exécution, arrêtez-la (Ctrl+C)
# Puis relancez
npx expo start
```

### 2. Tester le Flux d'Abonnement

1. **Ouvrez l'app** sur votre téléphone/émulateur
2. **Connectez-vous** avec votre compte
3. Allez dans **Profil**
4. Cliquez sur **Abonnement**
5. Vous devriez voir les **4 plans** avec les **bons prix** :
   - Gratuit (0 F)
   - Starter (2500 F/mois)
   - Pro (5000 F/mois)
   - Premium (10000 F/mois)

6. Cliquez sur **"Choisir ce plan"** sur un plan payant
7. Le **modal de paiement** doit s'ouvrir ✅
8. Sélectionnez une **méthode de paiement**
9. Cliquez sur **"Payer"**
10. Vous devriez voir **"Paiement réussi !"** ✅

---

## ❌ En Cas d'Erreur

### Erreur : "relation already exists"

C'est **normal** et **sans danger**. Le script est conçu pour :
- Créer les tables si elles n'existent pas
- Mettre à jour les tables existantes
- Ignorer les erreurs de duplication

➡️ **Continuez**, l'exécution devrait se terminer avec succès.

### Erreur : "permission denied"

Vous n'avez peut-être pas les droits d'admin.

**Solution** :
1. Vérifiez que vous êtes **propriétaire** du projet Supabase
2. Ou utilisez le **service role key** dans vos requêtes

### Les plans ne s'affichent pas dans l'app

**Solutions** :
1. **Vérifiez** que le script s'est bien exécuté (voir Section "Vérification")
2. **Fermez et rouvrez** complètement l'application
3. **Vérifiez** la connexion internet
4. **Reconnectez-vous** à l'application
5. Dans Supabase Dashboard, allez dans **Table Editor** > **subscription_plans** et vérifiez que les 4 plans existent

### Le modal de paiement ne s'ouvre pas

**Vérifiez** :
1. Que le script SQL s'est bien exécuté
2. Que vous avez bien **relancé** l'application
3. Les logs de la console pour voir s'il y a des erreurs

---

## 📊 Structure des Plans

| Plan     | Prix/mois | Prix/an   | Produits max | Commission | Fonctionnalités                              |
|----------|-----------|-----------|--------------|------------|----------------------------------------------|
| Gratuit  | 0 F       | 0 F       | 10           | 15%        | Basique                                      |
| Starter  | 2500 F    | 25000 F   | 50           | 12%        | Photos HD + Analytics + Support prioritaire  |
| Pro      | 5000 F    | 50000 F   | 200          | 10%        | + Vidéos + IA + Campagnes sponsorisées      |
| Premium  | 10000 F   | 100000 F  | Illimité     | 7%         | + Support concierge 24/7 + Tous les avantages|

---

## 📁 Fichiers Créés

- ✅ `supabase/SENEPANDA_COMPLETE_DATABASE.sql` - Script SQL complet
- ✅ `GUIDE_BASE_DE_DONNEES.md` - Ce guide

---

## ✅ Checklist Finale

- [ ] Script SQL exécuté sans erreur fatale
- [ ] 4 plans d'abonnement visibles dans le tableau de résultats
- [ ] Application redémarrée
- [ ] Page d'abonnement accessible depuis le profil
- [ ] 4 plans affichés avec les bons prix (2500, 5000, 10000)
- [ ] Modal de paiement s'ouvre au clic sur "Choisir ce plan"
- [ ] Paiement simulé fonctionne
- [ ] Profil mis à jour après paiement

---

## 🎉 Félicitations !

Si tous les points de la checklist sont validés, votre système d'abonnements est **100% fonctionnel** ! 🚀

---

## 📞 Support

En cas de problème, vérifiez :
1. Les logs de Supabase SQL Editor
2. Les logs de la console React Native
3. La table `subscription_plans` dans Table Editor
4. La table `profiles` pour voir si `subscription_plan` et `subscription_expires_at` existent

---

**Dernière mise à jour** : 30 novembre 2025
