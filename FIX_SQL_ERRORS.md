# 🔧 Résolution des Erreurs SQL

## ❌ Erreur Rencontrée

```
ERROR: 42P13: cannot change return type of existing function
DETAIL: Row type defined by OUT parameters is different.
HINT: Use DROP FUNCTION get_cart_total(uuid) first.
```

---

## 🎯 Solution

### **Option 1: Exécuter le Script de Fix (Recommandé)**

1. **Ouvrez Supabase Dashboard** → **SQL Editor**

2. **Copiez et exécutez** le contenu de:
   ```
   supabase/migrations/fix_function_conflicts.sql
   ```

3. **Ce script va**:
   - Supprimer toutes les versions de `get_cart_total`
   - Recréer la fonction avec la bonne signature
   - Résoudre le conflit de type de retour

---

### **Option 2: Commandes Manuelles**

Si vous préférez le faire manuellement:

```sql
-- 1. Supprimer la fonction existante
DROP FUNCTION IF EXISTS get_cart_total(UUID);
DROP FUNCTION IF EXISTS get_cart_total(UUID, OUT INTEGER, OUT DECIMAL);

-- 2. Recréer avec la bonne signature
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS TABLE (
  item_count INTEGER,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CAST(COUNT(*) AS INTEGER) as item_count,
    CAST(COALESCE(SUM(c.quantity * p.price), 0) AS DECIMAL) as total_amount
  FROM cart c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📋 Ordre d'Exécution des Migrations

Pour éviter les conflits, exécutez les migrations dans cet ordre:

### **1. Fix des Conflits (EN PREMIER)**
```sql
-- Fichier: supabase/migrations/fix_function_conflicts.sql
```

### **2. Système de Rôles Admin**
```sql
-- Fichier: senepanda-web/supabase/migrations/add_admin_role_system.sql
```

### **3. Système d'Abonnements**
```sql
-- Fichier: project/supabase/migrations/add_subscription_approval_system.sql
```

### **4. Autres Migrations**
Exécutez les autres migrations après ces 3 premières.

---

## 🔍 Vérification

### **Vérifier que la fonction existe**
```sql
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'get_cart_total';
```

**Résultat attendu:**
```
routine_name    | routine_type | data_type
----------------|--------------|----------
get_cart_total  | FUNCTION     | record
```

### **Tester la fonction**
```sql
-- Remplacer par un vrai user_id
SELECT * FROM get_cart_total('00000000-0000-0000-0000-000000000000');
```

**Résultat attendu:**
```
item_count | total_amount
-----------|-------------
0          | 0.00
```

---

## 🐛 Autres Erreurs Courantes

### **Erreur: "relation does not exist"**
**Solution**: Créer la table manquante
```sql
-- Exemple pour la table cart
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### **Erreur: "column does not exist"**
**Solution**: Ajouter la colonne manquante
```sql
-- Exemple pour role dans profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
```

### **Erreur: "function already exists"**
**Solution**: Utiliser `CREATE OR REPLACE FUNCTION`
```sql
CREATE OR REPLACE FUNCTION ma_fonction(...)
RETURNS ... AS $$
...
```

---

## ✅ Checklist Post-Fix

Après avoir exécuté le fix, vérifiez:

- [ ] Fonction `get_cart_total` existe
- [ ] Aucune erreur dans les logs
- [ ] Test de la fonction réussit
- [ ] Autres migrations peuvent s'exécuter
- [ ] Application fonctionne normalement

---

## 📞 Si le Problème Persiste

### **1. Voir toutes les fonctions**
```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### **2. Supprimer TOUTES les versions d'une fonction**
```sql
-- Remplacer 'nom_fonction' par le nom réel
DO $$
DECLARE
  func_signature text;
BEGIN
  FOR func_signature IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE proname = 'nom_fonction'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature;
  END LOOP;
END $$;
```

### **3. Reset complet (ATTENTION: Destructif)**
```sql
-- ⚠️  Ceci supprime TOUTES les fonctions custom
-- N'utilisez que si absolument nécessaire

DROP FUNCTION IF EXISTS get_cart_total CASCADE;
DROP FUNCTION IF EXISTS make_user_admin CASCADE;
DROP FUNCTION IF EXISTS make_admin_by_email CASCADE;
DROP FUNCTION IF EXISTS approve_subscription_request CASCADE;
DROP FUNCTION IF EXISTS reject_subscription_request CASCADE;
-- ... et ainsi de suite
```

---

## 🎯 Résumé

**Pour résoudre l'erreur actuelle:**

1. ✅ Exécutez `fix_function_conflicts.sql`
2. ✅ Vérifiez que la fonction est recréée
3. ✅ Continuez avec les autres migrations
4. ✅ Testez l'application

Le problème vient du fait que PostgreSQL ne peut pas changer le type de retour d'une fonction existante. Il faut d'abord la supprimer puis la recréer.
