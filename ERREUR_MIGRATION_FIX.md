# 🔧 Résolution d'erreur - Migration SQL

## ❌ Erreur rencontrée

```
ERROR: 42710: policy "Users can view own subscription history" for table "subscription_history" already exists
```

## 🎯 Cause

Cette erreur signifie que vous avez déjà exécuté une partie de la migration et que certaines politiques RLS existent déjà dans votre base de données.

## ✅ Solutions

### Solution 1 : Utiliser la migration simplifiée (RECOMMANDÉ)

Cette version crée uniquement les colonnes essentielles sans les tables d'historique :

1. **Ouvrez** : `supabase/migrations/setup_subscription_simple.sql`
2. **Copiez** tout le contenu
3. **Allez** dans Supabase → SQL Editor
4. **Collez** et cliquez sur **Run** ▶️

✅ Cette migration :
- Vérifie si les colonnes existent avant de les créer
- N'affiche pas d'erreur si déjà installé
- Crée seulement le minimum nécessaire

### Solution 2 : Nettoyer et réinstaller

Si vous voulez repartir de zéro avec l'historique complet :

```sql
-- 1. Supprimer les tables existantes (ATTENTION: Perte de données)
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS subscription_activation_logs CASCADE;

-- 2. Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS record_subscription_activation() CASCADE;
DROP FUNCTION IF EXISTS is_subscription_active(UUID) CASCADE;
DROP FUNCTION IF EXISTS expire_old_subscriptions() CASCADE;
DROP FUNCTION IF EXISTS get_subscription_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Supprimer la vue
DROP VIEW IF EXISTS subscription_status CASCADE;

-- 4. Maintenant, exécuter la migration complète
-- Copier le contenu de: setup_subscription_immediate_activation.sql
```

### Solution 3 : Créer uniquement les colonnes manuellement

Si vous voulez juste faire fonctionner l'app rapidement :

```sql
-- Ajouter les 3 colonnes essentielles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter la contrainte
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_subscription_plan;

ALTER TABLE profiles
ADD CONSTRAINT check_subscription_plan
CHECK (subscription_plan IN ('free', 'starter', 'pro', 'premium'));

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
ON profiles(subscription_plan)
WHERE subscription_plan != 'free';

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires
ON profiles(subscription_expires_at)
WHERE subscription_expires_at IS NOT NULL;

-- Mettre à jour les données existantes
UPDATE profiles
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL;

UPDATE profiles
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Vérifier
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'subscription_expires_at', 'updated_at');
```

## 🧪 Vérifier que tout fonctionne

Après avoir appliqué une solution, vérifiez :

```sql
-- 1. Vérifier les colonnes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'subscription_expires_at', 'updated_at');

-- Résultat attendu: 3 lignes

-- 2. Vérifier les index
SELECT indexname
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname LIKE 'idx_profiles_subscription%';

-- Résultat attendu: Au moins 2 index

-- 3. Tester un update
UPDATE profiles
SET
  subscription_plan = 'pro',
  subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE id = auth.uid()
RETURNING subscription_plan, subscription_expires_at;
```

## 📋 Que faire maintenant ?

### Option A : Migration simple (Rapide) ⚡

```bash
# 1. Exécuter setup_subscription_simple.sql dans Supabase
# 2. Lancer l'app
npm start
# 3. Tester les abonnements
```

✅ Avantages :
- Installation rapide
- Pas d'erreur
- Tout fonctionne

❌ Inconvénients :
- Pas d'historique des abonnements
- Pas de logs détaillés

### Option B : Migration complète (Complète) 📊

```bash
# 1. Nettoyer la base (Solution 2)
# 2. Exécuter setup_subscription_immediate_activation.sql
# 3. Lancer l'app
npm start
# 4. Tester les abonnements
```

✅ Avantages :
- Historique complet
- Logs détaillés
- Monitoring avancé

❌ Inconvénients :
- Installation plus longue
- Nécessite nettoyage si erreur

## 🎯 Ma recommandation

**Pour démarrer rapidement** :
→ Utilisez **Solution 1** (migration simplifiée)

**Pour la production** :
→ Utilisez **Solution 2** (nettoyer et installer la version complète)

## 🆘 Besoin d'aide ?

### Erreur persiste ?

Si après avoir essayé une solution, vous avez toujours des erreurs :

```sql
-- Diagnostic complet
SELECT
  'Tables' AS type,
  table_name AS name
FROM information_schema.tables
WHERE table_name LIKE '%subscription%'

UNION ALL

SELECT
  'Fonctions' AS type,
  routine_name AS name
FROM information_schema.routines
WHERE routine_name LIKE '%subscription%'

UNION ALL

SELECT
  'Colonnes profiles' AS type,
  column_name AS name
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%subscription%'

UNION ALL

SELECT
  'Politiques RLS' AS type,
  policyname AS name
FROM pg_policies
WHERE tablename LIKE '%subscription%';
```

Envoyez-moi le résultat et je vous aiderai !

## ✅ État après installation réussie

Vous devriez voir :

```
✅ Colonnes ajoutées: 3 / 3
✅ Index créés: 2-3
✅ Tables créées: 0-2 (selon la solution)
✅ Fonctions créées: 0-5 (selon la solution)
```

L'application devrait maintenant fonctionner avec :
- ✅ Sélection d'un plan
- ✅ Simulateur Wave
- ✅ Activation immédiate
- ✅ Affichage du plan actif

---

**Dernière mise à jour** : 2025-12-04
**Version** : 1.0.1 (Fix erreurs policies)
