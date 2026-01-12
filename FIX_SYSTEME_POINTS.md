# 🔧 Fix : Système de points et daily login

## ❌ Problème identifié

Le système de points (PandaCoins) et les connexions quotidiennes ne fonctionnent plus. Les utilisateurs ne reçoivent pas :
- ❌ Bonus de bienvenue (500 PandaCoins)
- ❌ Points de connexion quotidienne (10 PandaCoins/jour)
- ❌ Bonus de streak (7, 14, 21, 30 jours...)

## 🔍 Cause

Les colonnes nécessaires dans la table `profiles` n'existent pas ou les fonctions RPC ne sont pas créées.

## ✅ Solution : Migration SQL

J'ai créé un script SQL complet qui :
1. ✅ Ajoute toutes les colonnes nécessaires
2. ✅ Crée la table `points_transactions`
3. ✅ Crée les fonctions RPC
4. ✅ Configure les permissions
5. ✅ Initialise les valeurs par défaut

## 🚀 Installation (5 minutes)

### Étape 1 : Exécuter le script SQL

1. **Ouvrez** : Supabase Dashboard → SQL Editor
2. **Copiez** : Le contenu de `fix_points_system.sql`
3. **Collez** et cliquez sur **Run** ▶️

**Résultat attendu :**
```
✅ Migration du système de points terminée !
📊 Colonnes ajoutées: 5 / 5
📊 Fonctions créées: 3 / 3
📊 Table points_transactions créée
🎉 Installation complète - Système de points prêt !
```

### Étape 2 : Tester l'application

1. **Lancez** l'application : `npm start`
2. **Connectez-vous** ou **inscrivez-vous**
3. **Attendez** quelques secondes

**Vous devriez voir :**
- 🎉 **Nouveau compte** : "Bienvenue ! Vous avez reçu 500 PandaCoins"
- 🔥 **Connexion quotidienne** : "Connexion quotidienne ! +10 PandaCoins"

### Étape 3 : Vérifier dans le profil

1. Allez dans **Profil**
2. Vérifiez vos **PandaCoins**
3. Cliquez sur **Points** pour voir l'historique

## 📊 Système de points

### Bonus disponibles

| Action | Points | Fréquence |
|--------|--------|-----------|
| 🎉 Inscription | 500 PC | Une fois |
| 📅 Connexion quotidienne | 10 PC | Quotidien |
| 🔥 Streak 7 jours | +50 PC | Tous les 7 jours |
| 🔥 Streak 30 jours | +150 PC | Tous les 30 jours |
| 🎁 Parrainage (parrain) | 500 PC | Par filleul |
| 🎁 Parrainage (filleul) | 200 PC | À l'inscription |

### Calcul du streak

```
Jour 1: 10 points
Jour 2: 10 points
Jour 3: 10 points
...
Jour 7: 10 + 50 (bonus) = 60 points
Jour 8: 10 points
...
Jour 14: 10 + 50 (bonus) = 60 points
...
Jour 30: 10 + 50 + 100 (super bonus) = 160 points
```

**Total sur 30 jours consécutifs :** 610 PandaCoins !

## 🗄️ Structure de la base de données

### Colonnes ajoutées dans `profiles`

```sql
panda_coins INTEGER DEFAULT 0
  -- Solde de points de l'utilisateur

last_login_date DATE
  -- Date de dernière connexion (pour le streak)

current_streak INTEGER DEFAULT 0
  -- Nombre de jours de connexion consécutifs

longest_streak INTEGER DEFAULT 0
  -- Meilleur streak de l'utilisateur

welcome_bonus_claimed BOOLEAN DEFAULT FALSE
  -- Indique si le bonus de bienvenue a été réclamé
```

### Table `points_transactions`

```sql
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Types de transactions :**
- `daily_login` - Connexion quotidienne
- `welcome_bonus` - Bonus de bienvenue
- `referral_bonus` - Bonus de parrainage
- `purchase` - Achat
- `refund` - Remboursement
- `admin_adjustment` - Ajustement admin
- `reward_redemption` - Échange de récompense
- etc.

### Fonctions RPC créées

#### 1. `record_points_transaction`
Enregistre une transaction de points dans l'historique.

```sql
SELECT record_points_transaction(
  p_user_id := 'uuid',
  p_points := 100,
  p_type := 'daily_login',
  p_description := 'Connexion quotidienne'
);
```

#### 2. `award_welcome_bonus`
Attribue le bonus de bienvenue à un nouvel utilisateur.

```sql
SELECT award_welcome_bonus(p_user_id := 'uuid');
-- Retourne: { "success": true, "points": 500, "message": "..." }
```

#### 3. `record_daily_login`
Enregistre une connexion quotidienne et calcule les points.

```sql
SELECT record_daily_login(p_user_id := 'uuid');
-- Retourne: {
--   "success": true,
--   "points": 10,
--   "streak": 5,
--   "streak_bonus": 0
-- }
```

## 🔧 Fonctionnement du système

### Workflow de connexion quotidienne

```
1. [App] Utilisateur se connecte
   ↓
2. [DailyLoginTracker] Détecte la connexion
   ↓
3. [AsyncStorage] Vérifie si déjà connecté aujourd'hui
   ↓
4. [RPC] Appelle record_daily_login(user_id)
   ↓
5. [DB] Calcule le streak et les points
   ↓
6. [DB] Met à jour profiles (panda_coins, current_streak, etc.)
   ↓
7. [DB] Enregistre dans points_transactions
   ↓
8. [App] Affiche la notification "🔥 Connexion quotidienne !"
   ↓
9. [Speech] Message vocal "Vous avez gagné X points"
   ↓
✅ [Terminé] Points ajoutés au compte
```

### Workflow du bonus de bienvenue

```
1. [App] Nouvelle inscription
   ↓
2. [DailyLoginTracker] Détecte le nouveau compte
   ↓
3. [RPC] Appelle award_welcome_bonus(user_id)
   ↓
4. [DB] Vérifie welcome_bonus_claimed = false
   ↓
5. [DB] Ajoute 500 points
   ↓
6. [DB] Marque welcome_bonus_claimed = true
   ↓
7. [DB] Enregistre dans points_transactions
   ↓
8. [App] Affiche "🎉 Bienvenue ! 500 PandaCoins"
   ↓
✅ [Terminé] Bonus attribué
```

## 📱 Interface utilisateur

### Notifications affichées

#### Bonus de bienvenue
```
🎉 Bienvenue sur SenePanda !
Vous avez reçu 500 PandaCoins de bienvenue !
```

#### Connexion quotidienne
```
🔥 Connexion quotidienne !
✅ +10 PandaCoins gagnés
📅 Jour 5 de votre série
💰 Solde total: 1,250 PC
```

#### Bonus de streak
```
🔥 Super streak !
✅ +60 PandaCoins gagnés
🎁 Bonus streak: +50 points
📅 7 jours consécutifs !
💰 Solde total: 1,310 PC
```

## 🐛 Dépannage

### Problème : Aucune notification

**Vérifier :**
1. La migration SQL a été exécutée
2. Les colonnes existent dans `profiles`
3. Les fonctions RPC sont créées

```sql
-- Vérifier les colonnes
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('panda_coins', 'last_login_date', 'current_streak');

-- Vérifier les fonctions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('award_welcome_bonus', 'record_daily_login');
```

### Problème : Erreur "function does not exist"

**Solution :**
Réexécuter le script `fix_points_system.sql` dans Supabase.

### Problème : Points ne s'ajoutent pas

**Vérifier les logs :**
```typescript
// Dans la console de l'app
🔔 [DailyLogin] Vérification connexion quotidienne...
✅ [DailyLogin] Résultat: { success: true, points: 10, streak: 1 }
✅ [DailyLogin] Points mis à jour: 0 → 10
```

**Si pas de logs :**
- Le composant `DailyLoginTracker` n'est pas chargé
- Vérifier qu'il est bien dans `app/_layout.tsx`

### Problème : Déjà connecté aujourd'hui

C'est **normal** ! Le système ne donne des points qu'une fois par jour.

**Test :**
1. Changer la date système de votre appareil
2. Ou attendre le lendemain
3. Se reconnecter

### Forcer un reset (dev uniquement)

```sql
-- Réinitialiser le streak d'un utilisateur
UPDATE profiles
SET
  last_login_date = NULL,
  current_streak = 0,
  panda_coins = 0
WHERE id = 'user_id';

-- Ou supprimer les transactions
DELETE FROM points_transactions
WHERE user_id = 'user_id';
```

## 📊 Statistiques du système

### Voir les statistiques globales

```sql
SELECT * FROM points_statistics;
```

**Résultat :**
```
total_users_with_points | total_points_in_circulation | average_points_per_user
-----------------------|----------------------------|------------------------
156                    | 78450                      | 502.88
```

### Top utilisateurs par points

```sql
SELECT
  email,
  panda_coins,
  current_streak,
  longest_streak
FROM profiles
WHERE panda_coins > 0
ORDER BY panda_coins DESC
LIMIT 10;
```

### Historique des transactions

```sql
SELECT
  p.email,
  pt.points,
  pt.type,
  pt.description,
  pt.created_at
FROM points_transactions pt
JOIN profiles p ON p.id = pt.user_id
ORDER BY pt.created_at DESC
LIMIT 20;
```

## 🎯 Utilisation des points

Les points peuvent être utilisés pour :
- 🎁 **Récompenses** : Échanger contre des cadeaux
- 💳 **Réductions** : Obtenir des réductions sur les commandes
- 🏆 **Statut VIP** : Accès à des fonctionnalités premium
- 🎁 **Dons** : Donner à des causes caritatives
- 🛍️ **Merchandising** : Acheter des produits SenePanda

_(À implémenter selon vos besoins)_

## ✨ Améliorations futures

### Points pour d'autres actions

```sql
-- Ajouter un achat
SELECT record_points_transaction(
  'user_id',
  50,
  'purchase',
  'Achat de 5000 FCFA'
);

-- Ajouter un parrainage
SELECT record_points_transaction(
  'user_id',
  500,
  'referral_bonus',
  'Nouveau filleul inscrit'
);
```

### Missions quotidiennes

```sql
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_reward INTEGER NOT NULL,
  mission_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

### Système de niveaux

```sql
ALTER TABLE profiles
ADD COLUMN level INTEGER DEFAULT 1,
ADD COLUMN experience_points INTEGER DEFAULT 0;
```

## 📝 Résumé

✅ **Script SQL** : `fix_points_system.sql`
✅ **Colonnes ajoutées** : 5
✅ **Fonctions créées** : 3
✅ **Table créée** : `points_transactions`
✅ **Système prêt** : Oui

**Après la migration :**
- ✅ Bonus de bienvenue : 500 PC
- ✅ Connexion quotidienne : 10 PC
- ✅ Bonus de streak : 50-150 PC
- ✅ Notifications visuelles et vocales
- ✅ Historique des transactions

---

**Status** : ✅ Solution prête
**Temps d'installation** : 5 minutes
**Impact** : 🎉 Système de points entièrement fonctionnel
**Date** : 2025-12-04
