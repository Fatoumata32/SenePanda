# 🔐 Système de Code PIN SenePanda

## 🎯 Principe Simple

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Utilisateur tape → App envoie → Supabase compare      │
│       1234       →    1234     →       1234            │
│                                                         │
│  ✅ MÊME VALEUR PARTOUT = PAS DE CONFUSION             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Interface Utilisateur

```
╔═══════════════════════════════════════╗
║  🐼 SenePanda - Connexion             ║
╠═══════════════════════════════════════╣
║                                       ║
║  📱 Numéro de téléphone               ║
║  ┌─────────────────────────────────┐  ║
║  │ +221 78 542 38 33               │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  🔒 Code PIN (4 chiffres)             ║
║  ┌─────────────────────────────────┐  ║
║  │ •  •  •  •                👁️   │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │      🔑 Se connecter            │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║  Code PIN oublié ?                    ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## ⚙️ Configuration Technique

### TextInput

```typescript
<TextInput
  value={password}
  onChangeText={setPassword}
  placeholder="••••"

  // 🎯 CONFIGURATION STRICTE
  maxLength={4}              // ✅ Maximum 4 caractères
  keyboardType="number-pad"  // ✅ Clavier numérique
  secureTextEntry={true}     // ✅ Masqué par défaut
/>
```

### Validation

```typescript
// ✅ Vérifier la longueur
if (password.length < 4) {
  Alert.alert('Erreur', 'Code PIN de 4 chiffres requis');
  return;
}

// ✅ Vérifier le format
if (!/^\d{4}$/.test(password)) {
  Alert.alert('Erreur', 'Code PIN numérique uniquement');
  return;
}
```

### Authentification

```typescript
// ✅ Envoi DIRECT (pas de padding)
const { data, error } = await supabase.auth.signInWithPassword({
  email: `${phoneNumber}@senepanda.app`,
  password: password,  // ← Direct !
});
```

---

## 🔄 Workflow Complet

### 1. Inscription

```
┌─────────────┐
│ Utilisateur │
│ crée PIN    │
│   1234      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validation  │
│ 4 chiffres? │
│     ✓       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│ hash(1234)  │
│   Stocké    │
└─────────────┘
```

### 2. Connexion

```
┌─────────────┐
│ Utilisateur │
│ tape PIN    │
│   1234      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     App     │
│ Envoie 1234 │
│   direct    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│ Compare avec│
│  hash(1234) │
└──────┬──────┘
       │
       ▼
   ✅ Match !
```

---

## 📊 Codes PIN Valides/Invalides

### ✅ Codes PIN VALIDES

| Code | Description | Sécurité |
|------|-------------|----------|
| 5678 | Séquence | ⭐⭐⭐ |
| 8429 | Aléatoire | ⭐⭐⭐⭐⭐ |
| 7103 | Mélangé | ⭐⭐⭐⭐ |

### ⚠️ Codes PIN FAIBLES (mais valides)

| Code | Description | Sécurité |
|------|-------------|----------|
| 0000 | Répétition | ⭐ |
| 1111 | Répétition | ⭐ |
| 1234 | Séquence | ⭐ |
| 2580 | Ligne clavier | ⭐ |

### ❌ Codes PIN INVALIDES

| Code | Raison |
|------|--------|
| 123 | Trop court (3 chiffres) |
| 12345 | Trop long (5 chiffres) |
| abcd | Non numérique |
| 12.34 | Contient symbole |

---

## 🛠️ Administration

### Réinitialiser UN Compte

```bash
# 1. Dashboard Supabase
Authentication → Users → [chercher utilisateur]

# 2. Reset Password
Menu ... → Reset Password

# 3. Nouveau mot de passe
Taper : 1234  # ← 4 chiffres exactement
Save
```

### Réinitialiser TOUS les Comptes

```bash
# Script automatisé
node scripts/reset-all-to-1234.js

# Ou manuellement
# 1. SQL Editor
supabase/migrations/reset_all_to_1234_no_padding.sql

# 2. Dashboard
Pour chaque utilisateur : Reset Password → 1234
```

---

## 📋 Checklist Développeur

### Code
- [x] `maxLength={4}` dans TextInput
- [x] `keyboardType="number-pad"`
- [x] Validation : `!/^\d{4}$/.test(password)`
- [x] **PAS** de fonction `padPinCode()`
- [x] **PAS** de `padStart(6, '0')`
- [x] Envoi direct : `password: password`

### UI/UX
- [x] Placeholder : `"••••"`
- [x] Label : `"Code PIN (4 chiffres)"`
- [x] Toggle show/hide (icône œil)
- [x] Messages d'erreur clairs
- [x] Lien "Code PIN oublié ?"

### Sécurité
- [x] Limitation tentatives (3 max)
- [x] Délai après échecs (30s)
- [ ] Biométrie optionnelle (TODO)
- [ ] Notification connexions (TODO)

---

## 🎓 Formation Rapide

### Pour Nouveaux Devs

**Règle #1 : Toujours 4 chiffres**
```typescript
// ✅ Bon
const PIN_LENGTH = 4;
if (password.length !== PIN_LENGTH) { /* erreur */ }

// ❌ Mauvais
const PIN_LENGTH = 6;
password.padStart(6, '0');
```

**Règle #2 : Pas de transformation**
```typescript
// ✅ Bon
password: password

// ❌ Mauvais
password: padPinCode(password)
password: password.padStart(6, '0')
password: '00' + password
```

**Règle #3 : Validation stricte**
```typescript
// ✅ Bon
/^\d{4}$/.test(password)  // Exactement 4 chiffres

// ❌ Mauvais
/^\d+$/.test(password)    // N'importe quel nombre
password.length >= 4      // Au moins 4
```

---

## 🚨 Dépannage Express

### Problème : "Invalid login credentials"

```
Cause : Mot de passe incorrect dans DB
Fix   : Dashboard → Reset Password → 1234
```

### Problème : "Password too short"

```
Cause : Code utilise encore le padding
Fix   : Vérifier simple-auth.tsx, supprimer padPinCode()
```

### Problème : "Email not confirmed"

```sql
-- Fix SQL
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '[email]';
```

---

## 📚 Documentation

| Fichier | Utilité |
|---------|---------|
| `CODE_PIN_POLICY_V2.md` | Politique complète |
| `QUICK_FIX_GUIDE.md` | Guide rapide |
| `GUIDE_MIGRATION_4_CHIFFRES.md` | Migration détaillée |
| `SUMMARY.md` | Vue d'ensemble |
| `README_PIN_SYSTEM.md` | Ce fichier |

---

## 🎯 En Résumé

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  ✅ Code PIN = 4 chiffres PARTOUT                    ║
║  ✅ Pas de padding, pas de conversion                ║
║  ✅ Envoi direct à Supabase                          ║
║  ✅ Validation stricte (exactement 4 chiffres)       ║
║  ✅ Interface simple et cohérente                    ║
║                                                       ║
║  📌 Pour débloquer un compte :                       ║
║     Dashboard → Auth → Users → Reset Password        ║
║     Taper : 1234 (4 chiffres) → Save                 ║
║                                                       ║
║  📌 Pour réinitialiser tous les comptes :            ║
║     node scripts/reset-all-to-1234.js                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

**Version** : 2.0 (Sans Padding)

**Date** : 29 Novembre 2025

**Équipe** : SenePanda 🐼
