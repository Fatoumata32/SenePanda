# 🔍 Guide de débogage - Points qui ne s'affichent pas

## 🎯 Situation

Le script `fix_points_system.sql` s'est exécuté sans erreur, mais les points ne s'affichent toujours pas dans l'application.

## 📋 3 scripts créés pour vous aider

### 1️⃣ `test_points_system.sql` - Diagnostic complet

**Objectif :** Tester tous les aspects du système de points

**À exécuter :**
```
Supabase → SQL Editor → Copier/Coller → Run
```

**Ce qu'il fait :**
- ✅ Vérifie que les colonnes existent
- ✅ Vérifie que les fonctions RPC existent
- ✅ Vérifie que la table `points_transactions` existe
- ✅ Affiche les données actuelles
- ✅ Teste le bonus de bienvenue
- ✅ Teste la connexion quotidienne
- ✅ Donne un diagnostic complet

### 2️⃣ `force_add_points.sql` - Forcer l'ajout de points

**Objectif :** Attribuer immédiatement les points à tous les utilisateurs existants

**À exécuter :**
```
Supabase → SQL Editor → Copier/Coller → Run
```

**Ce qu'il fait :**
- 🎁 Attribue 500 PC de bienvenue à tous les utilisateurs
- 🔥 Attribue 10 PC de connexion quotidienne
- 📊 Affiche le résumé des points
- 📜 Affiche les dernières transactions

### 3️⃣ `fix_points_system.sql` - Installation initiale

**Objectif :** Installer/réparer le système de points

**Statut :** ✅ Déjà exécuté

## 🚀 Procédure recommandée

### Étape 1 : Diagnostic

```sql
-- Exécuter test_points_system.sql dans Supabase
```

**Regardez les résultats :**
- ✅ Toutes les colonnes existent ?
- ✅ Toutes les fonctions existent ?
- ✅ La table points_transactions existe ?

### Étape 2 : Forcer l'attribution

```sql
-- Exécuter force_add_points.sql dans Supabase
```

**Résultat attendu :**
```
✅ Bonus attribué à: user@example.com (500 PC)
✅ Points attribués à: user@example.com (+10 PC, streak: 1)
```

### Étape 3 : Vérifier dans l'app

1. **Fermez complètement l'app** (pas juste minimiser)
2. **Relancez l'app**
3. **Allez dans Profil**
4. **Vérifiez** : Vous devriez voir vos PandaCoins

## 🔍 Pourquoi les points ne s'affichent pas ?

### Raison 1 : Les données ne sont pas rechargées

**Symptôme :** Les points sont dans la DB mais pas dans l'app

**Solution :**
```typescript
// L'app garde les anciennes données en cache
// Il faut fermer et relancer l'app
```

### Raison 2 : Le DailyLoginTracker n'a pas tourné

**Symptôme :** Pas de notification au lancement

**Solution :**
```sql
-- Forcer l'attribution avec force_add_points.sql
```

### Raison 3 : Les colonnes n'existaient pas au moment du chargement

**Symptôme :** L'app a chargé les données avant la migration

**Solution :**
```
1. Fermer l'app
2. Relancer l'app
3. Les nouvelles colonnes seront chargées
```

## 🧪 Tests manuels

### Test 1 : Vérifier les points dans la DB

```sql
-- Vérifier vos points directement dans la DB
SELECT
  email,
  panda_coins,
  current_streak,
  welcome_bonus_claimed,
  last_login_date
FROM profiles
WHERE email = 'VOTRE_EMAIL@example.com';
```

**Résultat attendu :**
```
email                | panda_coins | current_streak | welcome_bonus_claimed
---------------------|-------------|----------------|----------------------
votre@email.com      | 510         | 1              | true
```

### Test 2 : Vérifier les transactions

```sql
-- Vérifier l'historique de vos transactions
SELECT
  points,
  type,
  description,
  created_at
FROM points_transactions pt
JOIN profiles p ON p.id = pt.user_id
WHERE p.email = 'VOTRE_EMAIL@example.com'
ORDER BY created_at DESC;
```

**Résultat attendu :**
```
points | type          | description              | created_at
-------|---------------|--------------------------|--------------------
500    | welcome_bonus | Bonus de bienvenue       | 2025-12-04 10:00
10     | daily_login   | Connexion quotidienne... | 2025-12-04 10:01
```

### Test 3 : Forcer l'ajout manuel

```sql
-- Ajouter manuellement 1000 points pour test
UPDATE profiles
SET panda_coins = COALESCE(panda_coins, 0) + 1000
WHERE email = 'VOTRE_EMAIL@example.com';

-- Vérifier
SELECT email, panda_coins
FROM profiles
WHERE email = 'VOTRE_EMAIL@example.com';
```

Si après cela vous voyez les points dans l'app → Le problème était le cache

## 📱 Côté application

### Vérifier les logs

Dans la console de l'app, cherchez :

```
🔔 [DailyLogin] Vérification connexion quotidienne...
✅ [DailyLogin] Loyalty points créé
🎉 [DailyLogin] Bonus de bienvenue attribué: 500
✅ [DailyLogin] Résultat: { success: true, points: 10, ... }
```

**Si vous ne voyez pas ces logs :**
- Le composant `DailyLoginTracker` ne s'exécute pas
- Vérifier qu'il est bien dans `app/_layout.tsx`

### Forcer un rechargement dans l'app

Si vous êtes développeur, ajoutez ce code temporairement :

```typescript
// Dans votre page profil
useEffect(() => {
  const forceReload = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('panda_coins, current_streak')
      .eq('id', user.id)
      .single();

    console.log('Points actuels:', data);
  };

  forceReload();
}, []);
```

## 🎯 Checklist de dépannage

### Étape par étape

- [ ] 1. Script `fix_points_system.sql` exécuté sans erreur
- [ ] 2. Script `test_points_system.sql` montre tous les ✅
- [ ] 3. Script `force_add_points.sql` a attribué les points
- [ ] 4. Vérification SQL : Les points sont dans la DB
- [ ] 5. App fermée complètement et relancée
- [ ] 6. Page profil ouverte
- [ ] 7. Points visibles dans l'interface

**Si tous les ✅ sont cochés mais points toujours invisibles :**

### Vérification de l'interface

Le problème peut être dans l'affichage. Cherchez dans votre code :

```typescript
// Dans profile.tsx ou similaire
// Assurez-vous que panda_coins est bien affiché

<Text>{profile?.panda_coins || 0} PandaCoins</Text>
```

## 💡 Solution rapide (TL;DR)

```sql
-- 1. Exécutez ceci dans Supabase
SELECT email, panda_coins FROM profiles WHERE email = 'VOTRE_EMAIL';

-- 2. Si panda_coins = NULL ou 0:
SELECT award_welcome_bonus(id) FROM profiles WHERE email = 'VOTRE_EMAIL';
SELECT record_daily_login(id) FROM profiles WHERE email = 'VOTRE_EMAIL';

-- 3. Vérifiez à nouveau
SELECT email, panda_coins FROM profiles WHERE email = 'VOTRE_EMAIL';

-- 4. Fermez l'app et relancez
```

## 🆘 Si rien ne fonctionne

**Envoyez-moi :**

1. Le résultat de :
```sql
SELECT * FROM profiles WHERE email = 'VOTRE_EMAIL';
```

2. Le résultat de :
```sql
SELECT * FROM points_transactions
WHERE user_id = (SELECT id FROM profiles WHERE email = 'VOTRE_EMAIL')
ORDER BY created_at DESC;
```

3. Les logs de l'app (console) avec `[DailyLogin]`

Je pourrai alors diagnostiquer exactement le problème !

---

**Status** : 🔍 Mode diagnostic
**Scripts** : 3 disponibles
**Prochaine étape** : Exécuter `test_points_system.sql`
