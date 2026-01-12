# 🚨 CORRECTIF URGENT - Erreurs Critiques

## ❌ Erreurs Détectées

### 1. Récursion Infinie dans Profiles RLS
```
Error: infinite recursion detected in policy for relation "profiles"
```

**Cause :** Les policies RLS sur `profiles` s'appellent entre elles de manière récursive.

**Impact :** Impossible de lire les profils → Application bloquée

---

### 2. Colonne Manquante dans Flash Deals
```
Error: column d.deal_type does not exist
```

**Cause :** La colonne `deal_type` n'existe pas dans la table `flash_deals`.

**Impact :** Erreurs lors du chargement des deals flash

---

## ✅ Solution - Application en 2 Minutes

### Étape 1 : Ouvrir Supabase Dashboard
```
1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" dans le menu
```

### Étape 2 : Exécuter le Script de Correction
```
1. Cliquer sur "+ New query"
2. Copier TOUT le contenu de : supabase/FIX_CRITICAL_ERRORS.sql
3. Coller dans l'éditeur
4. Cliquer sur "RUN" (ou Ctrl+Enter)
```

### Étape 3 : Vérifier les Messages
Vous devriez voir :
```
✅ Policies profiles corrigées (plus de récursion)
✅ Colonne deal_type ajoutée/vérifiée
✅ Fonction is_seller_subscription_active optimisée
✅ Policies products simplifiées
```

### Étape 4 : Redémarrer l'Application
```bash
# Arrêter l'app (Ctrl+C dans le terminal)

# Nettoyer le cache
rm -rf .expo node_modules/.cache

# Redémarrer
npm start
# ou
npx expo start --clear
```

---

## 🔍 Qu'est-ce qui a Changé ?

### Avant (Problématique)
```sql
-- Policy récursive ❌
CREATE POLICY "Users can view profiles"
ON profiles FOR SELECT
USING (
  -- Cette requête appelle d'autres policies sur profiles
  -- Causant une récursion infinie
  id IN (SELECT id FROM profiles WHERE ...)
);

-- Policy produits avec fonction récursive ❌
CREATE POLICY "View products from subscribed sellers"
ON products FOR SELECT
USING (
  is_seller_subscription_active(seller_id)
  -- Cette fonction lit profiles, déclenchant les policies récursives
);
```

### Après (Corrigé)
```sql
-- Policy simple et directe ✅
CREATE POLICY "Allow public read access to profiles"
ON profiles FOR SELECT
USING (true);  -- Simple, pas de récursion

-- Policy produits simplifiée ✅
CREATE POLICY "Public can view active products"
ON products FOR SELECT
USING (is_active = true);
-- La vérification d'abonnement est faite côté application
```

---

## 🎯 Impact sur l'Application

### Changement Important
**La visibilité des produits selon l'abonnement est maintenant gérée côté APPLICATION** et non plus via RLS SQL.

### Pourquoi ?
- RLS avec fonctions complexes = risque de récursion
- Vérification côté app = plus de contrôle
- Meilleure performance
- Pas de récursion possible

### Comment ça Fonctionne Maintenant ?

**Côté SQL :**
```sql
-- Tous les produits actifs sont visibles via RLS
SELECT * FROM products WHERE is_active = true;
```

**Côté Application :**
```typescript
// Le hook filtre selon l'abonnement
const { data: products } = await supabase
  .from('products')
  .select('*, profiles!inner(*)')
  .eq('is_active', true)
  .eq('profiles.subscription_plan', 'premium'); // Filtre côté app

// Ou utiliser la vue SQL (recommandé)
const { data: products } = await supabase
  .from('active_seller_products')  // Vue qui filtre automatiquement
  .select('*');
```

---

## 📋 Vérifications Post-Correctif

### Test 1 : Profiles Accessibles
```typescript
// Dans l'app ou Supabase SQL Editor
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(5);

// ✅ Doit fonctionner sans erreur de récursion
console.log(data);
```

### Test 2 : Flash Deals avec deal_type
```sql
-- Dans Supabase SQL Editor
SELECT id, deal_type, deal_price
FROM flash_deals
LIMIT 5;

-- ✅ Doit retourner les colonnes sans erreur
```

### Test 3 : Fonction Subscription Active
```sql
-- Dans Supabase SQL Editor
SELECT is_seller_subscription_active('user-id-test');

-- ✅ Doit retourner true ou false sans erreur
```

---

## 🔧 Si les Erreurs Persistent

### Problème : "infinite recursion" toujours présent

**Solution :**
```sql
-- Supprimer TOUTES les policies et recommencer
DROP POLICY IF EXISTS ALL ON profiles;

-- Réexécuter FIX_CRITICAL_ERRORS.sql
```

### Problème : "deal_type does not exist" toujours présent

**Solution :**
```sql
-- Vérifier si la colonne existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'flash_deals';

-- Si pas de deal_type, ajouter manuellement :
ALTER TABLE flash_deals
ADD COLUMN deal_type TEXT DEFAULT 'flash_sale';
```

### Problème : "cannot read profiles"

**Solution :**
```sql
-- Désactiver temporairement RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Vérifier que ça fonctionne
SELECT COUNT(*) FROM profiles;

-- Réactiver
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Réappliquer policies simples
```

---

## 🚀 Déploiement en Production

### Avant de Déployer
1. ✅ Tester en local/staging d'abord
2. ✅ Vérifier que l'app fonctionne
3. ✅ Backup de la base de données
4. ✅ Préparer rollback si nécessaire

### Déploiement
```bash
# 1. Créer backup
# Via Supabase Dashboard > Database > Backups

# 2. Exécuter FIX_CRITICAL_ERRORS.sql
# Via SQL Editor

# 3. Vérifier logs
# Via Supabase Dashboard > Database > Logs

# 4. Tester l'application
# Connexion, lecture profils, produits, flash deals
```

### Rollback si Nécessaire
```bash
# Restaurer le backup
# Supabase Dashboard > Database > Backups > Restore
```

---

## 📊 Checklist Rapide

- [ ] Script FIX_CRITICAL_ERRORS.sql exécuté
- [ ] Messages de succès affichés
- [ ] Application redémarrée
- [ ] Test lecture profiles OK
- [ ] Test flash deals OK
- [ ] Aucune erreur de récursion
- [ ] Aucune erreur deal_type

---

## 🎉 Résultat Attendu

### Avant (Erreurs)
```
❌ Error: infinite recursion detected in policy for relation "profiles"
❌ Error: column d.deal_type does not exist
```

### Après (Corrigé)
```
✅ Profiles chargés correctement
✅ Flash deals fonctionnent
✅ Aucune erreur de récursion
✅ Application fluide
```

---

## 📞 Support

Si les erreurs persistent après application du correctif :

1. **Vérifier les logs Supabase**
   - Dashboard > Database > Logs
   - Chercher "policy" ou "recursion"

2. **Vérifier les policies actives**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('profiles', 'products', 'flash_deals');
   ```

3. **Contacter le support**
   - Logs à fournir
   - Étapes déjà effectuées
   - Version Supabase

---

## 🔄 Mise à Jour Documentation

Ce correctif rend obsolète une partie de `DEPLOY_ALL_FEATURES.sql`.

**Nouveau flux recommandé :**
1. ✅ Exécuter `FIX_CRITICAL_ERRORS.sql` EN PREMIER
2. ✅ Puis exécuter `DEPLOY_ALL_FEATURES.sql`
3. ✅ Les policies seront déjà correctes

---

**Durée totale du correctif : 2-5 minutes**
**Impact : Critique → Résolu**
**Priorité : URGENTE ✅**
