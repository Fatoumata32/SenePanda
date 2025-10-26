# 🔧 Guide de Dépannage - Système de Récompenses

## ❌ Problème : "Erreur survenue lors de la réclamation"

### 🔍 Diagnostic

#### Étape 1 : Vérifier que les migrations ont été exécutées

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Exécutez le script de vérification :

```sql
-- Copiez et exécutez le contenu de:
-- supabase/migrations/verify_rewards_system.sql
```

**Ce que vous devez voir :**
- ✅ 4 tables : `loyalty_points`, `points_transactions`, `rewards_catalog`, `user_rewards`
- ✅ 5 fonctions : `apply_discount_reward`, `convert_points_to_discount`, `get_user_active_rewards`, `redeem_reward`, `register_referral`
- ✅ 10 récompenses dans le catalogue

#### Étape 2 : Vérifier que la fonction `redeem_reward` existe

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'redeem_reward';
```

**Si la fonction n'existe pas :**
→ Exécutez la migration `create_rewards_system.sql`

#### Étape 3 : Vérifier les logs de l'application

Ouvrez la console de votre application React Native et cherchez les messages :
- 🔄 Tentative de réclamation...
- 📊 Réponse de redeem_reward...
- ❌ Erreur Supabase...

Ces logs vous donneront le message d'erreur exact.

---

## 🚨 Erreurs Courantes et Solutions

### 1. "function redeem_reward does not exist"

**Cause :** La migration n'a pas été exécutée

**Solution :**
1. Allez dans SQL Editor de Supabase
2. Copiez tout le contenu de `supabase/migrations/create_rewards_system.sql`
3. Exécutez-le
4. Vérifiez que la fonction existe avec la requête ci-dessus

---

### 2. "Récompense introuvable ou inactive"

**Cause :** La récompense n'existe pas ou `is_active = false`

**Solution :**
```sql
-- Vérifier les récompenses disponibles
SELECT id, title, is_active, points_cost
FROM rewards_catalog
WHERE is_active = true;

-- Si aucune récompense, exécutez la migration create_rewards_system.sql
```

---

### 3. "Points insuffisants"

**Cause :** L'utilisateur n'a pas assez de points

**Solution :**
```sql
-- Vérifier le solde de l'utilisateur
SELECT points, total_earned, level
FROM loyalty_points
WHERE user_id = 'VOTRE-USER-ID';

-- Ajouter des points manuellement pour tester
UPDATE loyalty_points
SET points = points + 500
WHERE user_id = 'VOTRE-USER-ID';
```

---

### 4. "permission denied for table user_rewards"

**Cause :** Problème de permissions RLS (Row Level Security)

**Solution :**
```sql
-- Désactiver temporairement RLS pour tester
ALTER TABLE user_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog DISABLE ROW LEVEL SECURITY;

-- Ou créer les policies appropriées
CREATE POLICY "Users can view their own rewards"
  ON user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 5. "column 'category' does not exist"

**Cause :** Vous utilisez peut-être l'ancienne table `rewards` au lieu de `rewards_catalog`

**Solution :**

Vérifiez dans votre code que vous utilisez bien `rewards_catalog` :

```typescript
// ❌ Mauvais
const { data } = await supabase.from('rewards').select('*');

// ✅ Bon
const { data } = await supabase.from('rewards_catalog').select('*');
```

---

### 6. "Aucune réponse du serveur"

**Cause :** La fonction retourne `null` au lieu d'un objet JSON

**Solution :**

Vérifiez que la fonction retourne bien un JSON :

```sql
-- Tester manuellement la fonction
SELECT redeem_reward(
  'votre-user-id'::uuid,
  'reward-id'::uuid
);

-- Devrait retourner quelque chose comme:
-- {"success": true, "user_reward_id": "...", ...}
```

---

## 🧪 Test Manuel

Pour tester le système complet manuellement :

### 1. Créer un utilisateur test avec des points

```sql
-- Ajouter 1000 points à votre compte
INSERT INTO loyalty_points (user_id, points, total_earned, level)
VALUES ('votre-user-id', 1000, 1000, 'bronze')
ON CONFLICT (user_id) DO UPDATE
SET points = 1000, total_earned = 1000;
```

### 2. Vérifier qu'il y a des récompenses

```sql
SELECT * FROM rewards_catalog WHERE is_active = true LIMIT 5;
```

### 3. Tester la fonction manuellement

```sql
SELECT redeem_reward(
  'votre-user-id'::uuid,
  (SELECT id FROM rewards_catalog WHERE points_cost = 50 LIMIT 1)
);
```

**Résultat attendu :**
```json
{
  "success": true,
  "user_reward_id": "...",
  "reward_title": "Bon de 500 XOF",
  "points_spent": 50,
  "remaining_points": 950
}
```

---

## 📋 Checklist de Vérification

Avant de tester l'application, assurez-vous que :

- [ ] Les 3 migrations ont été exécutées :
  - [ ] `fix_immediate_referral_rewards.sql`
  - [ ] `retroactive_referral_points.sql`
  - [ ] `create_rewards_system.sql`

- [ ] Les tables existent :
  - [ ] `rewards_catalog`
  - [ ] `user_rewards`
  - [ ] `loyalty_points`
  - [ ] `points_transactions`

- [ ] Les fonctions existent :
  - [ ] `redeem_reward`
  - [ ] `convert_points_to_discount`
  - [ ] `apply_discount_reward`
  - [ ] `get_user_active_rewards`

- [ ] Il y a des récompenses dans le catalogue (au moins 10)

- [ ] Votre utilisateur a des points dans `loyalty_points`

- [ ] Les permissions RLS sont configurées ou désactivées

---

## 🔬 Activer les Logs Détaillés

Pour voir exactement ce qui se passe, ajoutez ces logs dans votre code :

```typescript
// Dans app/rewards/redeem/[id].tsx

// Avant l'appel
console.log('🔄 Calling redeem_reward with:', {
  p_user_id: user.id,
  p_reward_id: reward.id,
});

// Après l'appel
console.log('📊 Response:', { data, error });

// Si erreur
if (error) {
  console.error('❌ Full error object:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}
```

Ensuite, regardez la console de votre application (dans Metro bundler ou les Developer Tools).

---

## 📞 Besoin d'Aide ?

Si après avoir suivi ces étapes le problème persiste :

1. **Vérifiez les logs** de la console React Native
2. **Vérifiez les logs** de Supabase (Dashboard > Logs)
3. **Copiez le message d'erreur exact** que vous voyez
4. **Vérifiez** que toutes les migrations ont bien été exécutées

### Script de Diagnostic Complet

Exécutez ce script pour obtenir un diagnostic complet :

```sql
-- DIAGNOSTIC COMPLET DU SYSTÈME DE RÉCOMPENSES

SELECT '=== TABLES ===' as section;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%reward%' OR table_name LIKE '%points%';

SELECT '=== FONCTIONS ===' as section;
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%reward%' OR routine_name LIKE '%referral%');

SELECT '=== RÉCOMPENSES ===' as section;
SELECT COUNT(*) as total, category
FROM rewards_catalog
GROUP BY category;

SELECT '=== UTILISATEURS AVEC POINTS ===' as section;
SELECT COUNT(*) as total_users,
       SUM(points) as total_points,
       AVG(points) as avg_points
FROM loyalty_points;

SELECT '=== DERNIÈRES TRANSACTIONS ===' as section;
SELECT type, COUNT(*) as count
FROM points_transactions
GROUP BY type
ORDER BY count DESC;
```

---

## ✅ Solution Rapide

Si vous voulez juste que ça fonctionne immédiatement :

```sql
-- 1. Exécutez toutes les migrations d'un coup
\i supabase/migrations/fix_immediate_referral_rewards.sql
\i supabase/migrations/retroactive_referral_points.sql
\i supabase/migrations/create_rewards_system.sql

-- 2. Donnez-vous des points pour tester
UPDATE loyalty_points
SET points = 1000, total_earned = 1000
WHERE user_id = auth.uid();

-- 3. Désactivez RLS temporairement
ALTER TABLE rewards_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards DISABLE ROW LEVEL SECURITY;

-- 4. Testez !
```

**N'oubliez pas de réactiver RLS en production !**
