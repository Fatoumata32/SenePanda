# 🔐 Système de Code PIN - Version Finale

## 🎯 Comment Ça Marche

### Pour l'Utilisateur
```
Tape: 4 à 6 chiffres
Exemples: 1234, 12345, 123456
```

### Dans l'Application
```typescript
// L'app ajoute automatiquement le padding si nécessaire
password: "1234"   →  paddedPassword: "001234"  (padding ajouté)
password: "12345"  →  paddedPassword: "012345"  (padding ajouté)
password: "123456" →  paddedPassword: "123456"  (pas de padding)
```

### Dans Supabase
```
Stocké: hash de 6 caractères minimum
Exemples: hash("001234"), hash("012345"), hash("123456")
```

---

## 📋 Configuration Actuelle

✅ **Code** : Padding automatique activé
✅ **Validation** : 4 à 6 chiffres acceptés
✅ **Input** : maxLength={6}
✅ **Supabase** : Minimum 6 caractères (avec padding si nécessaire)
✅ **UX** : L'utilisateur tape 4 à 6 chiffres

---

## 🚀 Déploiement

### 1. Débloquer le Compte Principal

**Exécuter** : `RESET_COMPTE.sql` dans SQL Editor

**Ensuite** :
1. Dashboard > Authentication > Users
2. Chercher : `+221785423833@senepanda.app`
3. Reset Password : `001234` (6 caractères)
4. Save

**Tester** :
- App → +221 78 542 38 33 → PIN: 1234
- ✅ Connexion OK

---

## 📝 Pour Nouveaux Utilisateurs

### Inscription
1. **App** : Utilisateur tape 4 chiffres (ex: 1234)
2. **App** : Ajoute padding automatiquement (→ 001234)
3. **Supabase** : Crée le compte avec 001234
4. ✅ **Succès**

### Connexion
1. **App** : Utilisateur tape 4 chiffres (ex: 1234)
2. **App** : Ajoute padding automatiquement (→ 001234)
3. **Supabase** : Compare avec 001234 stocké
4. ✅ **Connexion OK**

---

## 🔧 Si Problème de Connexion

### Utilisateur ne peut pas se connecter

**Cause** : Mot de passe mal défini dans Supabase

**Solution** :
```
Dashboard > Authentication > Users > [Utilisateur]
Reset Password : 001234 (6 caractères, PAS 1234)
```

**Important** :
- Admin définit : `001234` (6 caractères)
- Utilisateur tape : `1234` (4 chiffres)
- App convertit : `1234` → `001234`

---

## 📊 Schéma Complet

```
┌─────────────────────────────────────────┐
│ UTILISATEUR                             │
│ Tape: 1234                              │
│ (4 chiffres visibles)                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ APPLICATION                             │
│ Fonction: padPinCode("1234")            │
│ Résultat: "001234"                      │
│ (padding automatique)                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ SUPABASE                                │
│ Reçoit: "001234"                        │
│ Stocke: hash("001234")                  │
│ (6 caractères requis)                   │
└─────────────────────────────────────────┘
```

---

## ✅ Avantages de Cette Solution

1. **UX Simple** : L'utilisateur tape seulement 4 chiffres
2. **Compatible** : Respecte la politique Supabase (min 6 chars)
3. **Transparent** : Le padding est invisible pour l'utilisateur
4. **Familier** : Comme les cartes bancaires (4 chiffres)

---

## 📁 Fichiers Importants

- `app/simple-auth.tsx` - Fonction `padPinCode()` + Logique auth
- `RESET_COMPTE.sql` - Script de déblocage rapide
- `CODE_PIN_POLICY.md` - Documentation complète (ancienne version)
- `supabase/config.toml` - Configuration locale

---

## 🎯 Actions Rapides

### Débloquer un Compte
1. SQL Editor : Exécuter `RESET_COMPTE.sql`
2. Dashboard : Reset Password à `001234`
3. App : Tester avec PIN `1234`

### Créer un Nouveau Compte
1. App : S'inscrire avec 4 chiffres
2. App : Padding automatique
3. ✅ Compte créé

---

## 📞 Support

### Utilisateur : "Mon code PIN ne fonctionne pas"

**Checklist** :
- [ ] Le compte existe ? (Dashboard > Users)
- [ ] L'email est confirmé ? (email_confirmed_at rempli)
- [ ] Le mot de passe est `001234` ? (Reset Password dans Dashboard)
- [ ] L'utilisateur tape bien 4 chiffres ?

**Solution Rapide** :
```sql
-- Dans SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '[email]@senepanda.app';
```

Puis Dashboard > Reset Password → `001234`

---

**Version** : 2.0 avec Padding
**Date** : 29 Novembre 2025
**Statut** : ✅ Opérationnel
