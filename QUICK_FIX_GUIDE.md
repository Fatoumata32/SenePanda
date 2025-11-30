# 🚀 Guide Rapide - Réinitialisation à 1234

## ⚡ TL;DR - Actions Immédiates

### 1. Exécuter le Script SQL (2 minutes)

```sql
-- Copier-coller dans Supabase Dashboard > SQL Editor

-- Confirmer tous les emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Compléter tous les profils
UPDATE profiles
SET first_name = COALESCE(first_name, 'Utilisateur'),
    last_name = COALESCE(last_name, 'SenePanda'),
    full_name = COALESCE(full_name, 'Utilisateur SenePanda'),
    username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8)),
    email = COALESCE(email, phone || '@senepanda.app'),
    updated_at = NOW()
WHERE first_name IS NULL OR last_name IS NULL;
```

### 2. Réinitialiser le Compte +221785423833

**Dashboard > Authentication > Users** :
1. Chercher : `+221785423833@senepanda.app`
2. Menu `...` → Reset Password
3. Taper : **`1234`** (exactement 4 chiffres, pas 001234)
4. Save

### 3. Tester

App :
- Numéro : `+221 78 542 38 33`
- Code PIN : `1234`
- Se connecter

Si ça marche : ✅ Terminé !
Si ça bloque : ⬇️ Voir la section Dépannage ci-dessous

---

## 🔧 Dépannage Rapide

### Erreur : "Invalid login credentials"

**Cause** : Mot de passe mal défini dans Supabase

**Fix** :
```
Dashboard → Authentication → Users → [Utilisateur]
Menu ... → Reset Password → Taper: 1234 → Save
```

### Erreur : "Email not confirmed"

**Cause** : Email non confirmé

**Fix** :
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '+221785423833@senepanda.app';
```

### Erreur : "Password should be at least 6 characters"

**Cause** : Code obsolète qui utilise encore le padding

**Fix** :
1. Vérifier que `app/simple-auth.tsx` n'a pas `padPinCode()`
2. Redémarrer l'app : `npx expo start --clear`

---

## 📋 Pour Réinitialiser TOUS les Comptes

### Option 1 : Script Automatique (5 minutes)

```bash
# 1. Configurer .env.local
# Ajouter : SUPABASE_SERVICE_ROLE_KEY=votre_cle

# 2. Installer dépendances
npm install @supabase/supabase-js dotenv

# 3. Lancer
node scripts/reset-all-to-1234.js
```

### Option 2 : Manuel via Dashboard (10-30 minutes)

1. **SQL Editor** :
   ```bash
   Copier-coller : supabase/migrations/reset_all_to_1234_no_padding.sql
   RUN
   ```

2. **Pour chaque utilisateur** :
   ```
   Authentication → Users → [User] → ... → Reset Password
   Taper: 1234 → Save
   ```

---

## ✅ Checklist Express

- [ ] SQL exécuté (emails confirmés, profils complets)
- [ ] Compte +221785423833 réinitialisé à `1234`
- [ ] Test de connexion réussi
- [ ] (Optionnel) Tous les autres comptes réinitialisés

---

## 📞 Besoin d'Aide ?

1. **Logs Supabase** : Dashboard → Logs → Auth
2. **Vérifier compte** : SQL Editor →
   ```sql
   SELECT * FROM auth.users WHERE email = '+221785423833@senepanda.app';
   ```
3. **Documentation complète** : Voir `GUIDE_MIGRATION_4_CHIFFRES.md`

---

**Dernière mise à jour** : 29 Novembre 2025
**Version** : 2.0 (Sans padding)
