# 🔧 Dépannage Admin - Solutions Rapides

## ❌ Erreurs Courantes et Solutions

### **1. "column reference 'role' is ambiguous"**

**Cause**: Ambiguïté dans la vue `admin_phones_list`

**Solution**: Le fichier a été corrigé. Utilisez `QUICK_ADMIN_SETUP.sql` à la place.

```sql
-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS admin_phones_list;

-- Recréer avec le bon script
-- Exécuter QUICK_ADMIN_SETUP.sql
```

---

### **2. "Aucun utilisateur trouvé avec cet email"**

**Cause**: Le compte utilisateur n'existe pas dans `auth.users`

**Solution Option 1 - Via l'Application (Recommandé)**:
1. Ouvrez l'application web/mobile
2. Créez un compte normal:
   - Email: `admin@senepanda.com`
   - Mot de passe: `VotreMotDePasse`
   - Nom: `Admin Principal`
3. Validez l'email si nécessaire
4. Ensuite exécutez `create_admin_with_phone()`

**Solution Option 2 - Via Supabase Dashboard**:
1. Allez dans **Supabase Dashboard** → **Authentication** → **Users**
2. Cliquez **"Add User"**
3. Remplissez:
   - Email: `admin@senepanda.com`
   - Password: `VotreMotDePasse`
   - ✅ Auto Confirm User
4. Cliquez **"Create User"**
5. Ensuite exécutez `create_admin_with_phone()`

**Vérification**:
```sql
-- Vérifier si le compte existe
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@senepanda.com';

-- Si aucun résultat → le compte n'existe pas
```

---

### **3. "Le PIN doit contenir exactement 6 chiffres"**

**Cause**: PIN invalide (trop court, trop long, ou contient des lettres)

**Solutions**:
```sql
-- ❌ INCORRECT
'1234'        -- Trop court (4 chiffres)
'12345'       -- Trop court (5 chiffres)
'1234567'     -- Trop long (7 chiffres)
'12345a'      -- Contient une lettre

-- ✅ CORRECT
'123456'      -- Exactement 6 chiffres
'000000'      -- OK mais éviter (évident)
'987654'      -- OK
'427891'      -- OK (recommandé: aléatoire)
```

---

### **4. "Format du téléphone invalide"**

**Cause**: Le numéro ne respecte pas le format `+221XXXXXXXXX`

**Solutions**:
```sql
-- ❌ INCORRECT
'781234567'          -- Sans indicatif
'221781234567'       -- Sans +
'+221 78 123'        -- Trop court
'+33781234567'       -- Mauvais indicatif (pas Sénégal)

-- ✅ CORRECT
'+221781234567'      -- Parfait
'+221 78 123 45 67'  -- OK (espaces auto-supprimés)
'+221-78-123-45-67'  -- OK (tirets auto-supprimés)
```

---

### **5. "Ce numéro de téléphone est déjà utilisé"**

**Cause**: Un autre admin utilise déjà ce numéro

**Solutions**:

**Option 1 - Choisir un autre numéro**:
```sql
SELECT create_admin_with_phone(
  'admin2@senepanda.com',
  '+221770000001',    -- Numéro différent
  '123456',
  'Admin 2'
);
```

**Option 2 - Supprimer l'ancien admin**:
```sql
-- Voir qui utilise ce numéro
SELECT id, full_name, email
FROM profiles
WHERE admin_phone = '+221781234567';

-- Supprimer l'admin existant
UPDATE profiles
SET admin_phone = NULL,
    admin_pin_hash = NULL,
    admin_enabled = false
WHERE admin_phone = '+221781234567';

-- Recréer l'admin
SELECT create_admin_with_phone(...);
```

---

### **6. "Code PIN incorrect" (lors de la connexion)**

**Cause**: PIN saisi ne correspond pas

**Solution - Réinitialiser le PIN**:
```sql
-- Méthode 1: Réinitialiser directement
UPDATE profiles
SET admin_pin_hash = crypt('123456', gen_salt('bf'))
WHERE admin_phone = '+221781234567';

-- Méthode 2: Via fonction (si disponible)
SELECT change_admin_pin(
  '+221781234567',
  'ancien_pin',    -- Doit connaître l'ancien
  '123456'         -- Nouveau PIN
);
```

---

### **7. "Ce compte admin est désactivé"**

**Cause**: `admin_enabled = false`

**Solution**:
```sql
-- Réactiver l'admin
UPDATE profiles
SET admin_enabled = true
WHERE admin_phone = '+221781234567';

-- Ou via fonction
SELECT enable_admin_phone('+221781234567');
```

---

### **8. "Function not found: create_admin_with_phone"**

**Cause**: Migration SQL non exécutée

**Solution**:
```sql
-- Exécuter le script complet
-- Fichier: QUICK_ADMIN_SETUP.sql
```

---

### **9. Table 'admin_phone_login_attempts' n'existe pas**

**Cause**: Table non créée

**Solution**:
```sql
CREATE TABLE IF NOT EXISTS admin_phone_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_phone_login_attempts_phone ON admin_phone_login_attempts(phone);
CREATE INDEX idx_admin_phone_login_attempts_date ON admin_phone_login_attempts(attempted_at DESC);
```

---

### **10. "relation 'admin_phones_list' does not exist"**

**Cause**: Vue non créée

**Solution**:
```sql
-- Recréer la vue
CREATE OR REPLACE VIEW admin_phones_list AS
SELECT
  p.id,
  p.admin_phone,
  p.full_name,
  p.role,
  p.admin_enabled,
  au.email,
  p.created_at,
  au.last_sign_in_at,
  (SELECT COUNT(*) FROM admin_phone_login_attempts apla WHERE apla.phone = p.admin_phone AND apla.success = true) as total_logins,
  (SELECT MAX(attempted_at) FROM admin_phone_login_attempts apla WHERE apla.phone = p.admin_phone AND apla.success = true) as last_login_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.admin_phone IS NOT NULL
ORDER BY p.created_at DESC;
```

---

## 🔍 Commandes de Vérification

### **Vérifier l'État Complet**
```sql
-- 1. Utilisateur existe?
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@senepanda.com';

-- 2. Profil existe?
SELECT id, full_name, role, admin_phone, admin_enabled FROM profiles WHERE admin_phone = '+221781234567';

-- 3. Fonctions existent?
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%admin%phone%';

-- 4. Tables existent?
SELECT tablename FROM pg_tables WHERE tablename LIKE '%admin%';

-- 5. Vue existe?
SELECT viewname FROM pg_views WHERE viewname = 'admin_phones_list';
```

### **Tester Toute la Chaîne**
```sql
-- 1. Créer l'admin
SELECT create_admin_with_phone('admin@senepanda.com', '+221781234567', '123456', 'Test Admin');

-- 2. Vérifier login
SELECT verify_admin_phone_login('+221781234567', '123456');

-- 3. Lister admins
SELECT * FROM admin_phones_list;

-- 4. Voir les logs
SELECT * FROM admin_phone_login_attempts ORDER BY attempted_at DESC LIMIT 5;
```

---

## 🚀 Script de Réinitialisation Complète

Si tout est cassé, utilisez ce script pour tout nettoyer et recommencer:

```sql
-- ⚠️  ATTENTION: Ceci supprime TOUT le système admin
-- Utiliser uniquement en développement

-- 1. Supprimer les vues
DROP VIEW IF EXISTS admin_phones_list;

-- 2. Supprimer les fonctions
DROP FUNCTION IF EXISTS create_admin_with_phone(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS verify_admin_phone_login(VARCHAR, VARCHAR, INET, TEXT);
DROP FUNCTION IF EXISTS change_admin_pin(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS disable_admin_phone(VARCHAR);
DROP FUNCTION IF EXISTS enable_admin_phone(VARCHAR);

-- 3. Supprimer les tables
DROP TABLE IF EXISTS admin_phone_login_attempts;

-- 4. Supprimer les colonnes (optionnel)
ALTER TABLE profiles DROP COLUMN IF EXISTS admin_phone;
ALTER TABLE profiles DROP COLUMN IF EXISTS admin_pin_hash;
ALTER TABLE profiles DROP COLUMN IF EXISTS admin_enabled;

-- 5. Réexécuter QUICK_ADMIN_SETUP.sql
```

---

## ✅ Checklist de Diagnostic

Cochez au fur et à mesure:

- [ ] Migration SQL exécutée sans erreur
- [ ] Table `admin_phone_login_attempts` existe
- [ ] Vue `admin_phones_list` existe
- [ ] Fonction `create_admin_with_phone` existe
- [ ] Fonction `verify_admin_phone_login` existe
- [ ] Compte utilisateur créé dans `auth.users`
- [ ] Profil créé dans `profiles`
- [ ] Admin créé avec téléphone
- [ ] Test de login réussi
- [ ] Interface `/admin/login` accessible

---

## 📞 Aide Rapide

**Problème de compte:**
```sql
SELECT id, email FROM auth.users WHERE email = 'VOTRE_EMAIL';
```

**Problème de téléphone:**
```sql
SELECT admin_phone, admin_enabled FROM profiles WHERE admin_phone LIKE '%781234567%';
```

**Problème de PIN:**
```sql
UPDATE profiles SET admin_pin_hash = crypt('123456', gen_salt('bf')) WHERE admin_phone = '+221781234567';
```

**Tout vérifier:**
```sql
-- Exécuter QUICK_ADMIN_SETUP.sql
```

---

## 🎯 Solution Universelle

Si rien ne fonctionne:

1. ✅ Exécutez `QUICK_ADMIN_SETUP.sql`
2. ✅ Créez un compte via l'app web
3. ✅ Exécutez:
   ```sql
   SELECT create_admin_with_phone('votre@email.com', '+221781234567', '123456', 'Admin');
   ```
4. ✅ Testez:
   ```sql
   SELECT verify_admin_phone_login('+221781234567', '123456');
   ```

**Ça devrait fonctionner!** 🚀
