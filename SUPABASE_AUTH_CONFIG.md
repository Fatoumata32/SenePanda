# 🔐 Configuration Supabase Auth pour Codes PIN 4 Chiffres

## 🎯 Objectif

Configurer Supabase pour accepter les codes PIN de 4 chiffres lors de l'inscription.

---

## 📋 Méthode 1 : Configuration Dashboard (Si Disponible)

### Étape 1 : Accéder aux Paramètres Auth

1. **Ouvrir** : [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionner** : Votre projet SenePanda
3. **Cliquer** : **Authentication** (menu gauche)
4. **Cliquer** : **Settings** (ou **Policies**, **Configuration**)

### Étape 2 : Modifier la Longueur Minimum

Chercher une de ces options :
- **"Minimum Password Length"**
- **"Password Requirements"**
- **"Auth Settings"**
- **"Password Policy"**

Si trouvé :
1. **Changer** : `6` → `4`
2. **Sauvegarder**

### Résultat

✅ Les utilisateurs peuvent s'inscrire avec un code PIN de 4 chiffres directement dans l'app

---

## ⚠️ Méthode 2 : Si l'Option N'Existe Pas (Plan Gratuit)

**Supabase impose 6 caractères minimum par défaut** sur certains plans.

### Solution A : Réinitialisation Manuelle

Quand un utilisateur s'inscrit :

1. **Il entre** : +221 XX XXX XX XX + PIN 4 chiffres
2. **Erreur possible** : "Password should be at least 6 characters"
3. **Admin intervient** :
   - Dashboard → Authentication → Users
   - Chercher l'email : `+221XXXXXXXXX@senepanda.app`
   - Si l'utilisateur n'existe pas → L'inscription a échoué
   - Menu `...` → Reset Password → Taper le code PIN (ex: 1234)
   - Save

### Solution B : Script de Réinitialisation Automatique

Pour réinitialiser tous les comptes existants :

```bash
# Configurer .env.local avec SUPABASE_SERVICE_ROLE_KEY
node scripts/reset-all-to-1234.js
```

### Solution C : Workflow Hybride (Recommandé)

1. **Inscription** :
   - L'utilisateur essaie de s'inscrire avec 4 chiffres
   - Si erreur → Message : "Contactez l'admin pour activer votre compte"

2. **Activation par Admin** :
   - Admin reçoit la demande
   - Crée le compte manuellement dans Dashboard
   - Définit le mot de passe à 4 chiffres
   - Informe l'utilisateur

3. **Connexion** :
   - L'utilisateur se connecte avec son code PIN

---

## 🔍 Vérifier la Configuration Actuelle

### Test Rapide

Dans l'app :
1. Essayer de s'inscrire avec un code PIN de 4 chiffres
2. Observer le résultat :

```
✅ Inscription réussie
   → Supabase accepte 4 chiffres
   → Aucune action requise

❌ "Password should be at least 6 characters"
   → Supabase exige 6 caractères minimum
   → Utiliser Méthode 2
```

---

## 📊 Comparaison des Méthodes

| Méthode | Avantages | Inconvénients |
|---------|-----------|---------------|
| **Dashboard Config** | ✅ Automatique<br>✅ Pas d'intervention | ❌ Pas toujours disponible |
| **Réinit Manuelle** | ✅ Contrôle total<br>✅ Pas de config | ❌ Temps manuel<br>❌ Scalabilité |
| **Script Auto** | ✅ Rapide<br>✅ Scalable | ❌ Nécessite Service Role Key |
| **Workflow Hybride** | ✅ Sécurisé<br>✅ Contrôlé | ❌ Processus en 2 étapes |

---

## 🎓 Pour les Nouveaux Utilisateurs

### Si Inscription Bloquée

1. **Message à l'utilisateur** :
   ```
   Votre compte est en cours de création.
   Un administrateur va l'activer sous peu.
   Vous recevrez une notification.
   ```

2. **Admin active le compte** :
   ```
   Dashboard → Authentication → Users
   → Create New User
   → Email: +221XXXXXXXXX@senepanda.app
   → Password: 1234
   → Confirm
   ```

3. **Utilisateur se connecte** :
   ```
   Numéro: +221 XX XXX XX XX
   Code PIN: 1234
   ```

---

## 🛠️ Configuration Recommandée

### Pour Production

```
✅ Activer Email Confirmation: NON
   (on utilise le téléphone comme identifiant)

✅ Minimum Password Length: 4
   (si l'option existe)

✅ Password Strength Requirements: DÉSACTIVÉ
   (on accepte 0000, 1111, etc.)

✅ Rate Limiting: OUI
   (3 tentatives max, 30s de délai)
```

### Dans Dashboard → Authentication → Settings

```
Email Auth: Enabled
Phone Auth: Disabled (on simule avec email)
Email Confirmations: Disabled
Autoconfirm: Enabled
```

---

## 🚨 Problèmes Courants

### Problème 1 : "Password too short"

**Solution** : L'option n'est pas configurable dans votre plan
→ Utiliser Méthode 2 (Réinitialisation manuelle)

### Problème 2 : Utilisateur créé mais ne peut pas se connecter

**Solution** : Email non confirmé
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '+221XXXXXXXXX@senepanda.app';
```

### Problème 3 : Trop de comptes à activer manuellement

**Solution** : Utiliser le script automatisé
```bash
node scripts/reset-all-to-1234.js
```

---

## 📝 Checklist de Configuration

### Étape 1 : Vérifier
- [ ] Dashboard → Authentication → Settings exploré
- [ ] Option "Minimum Password Length" cherchée
- [ ] Test d'inscription effectué

### Étape 2 : Configurer
- [ ] Si option existe → Définie à 4
- [ ] Si option n'existe pas → Méthode 2 choisie
- [ ] Email Confirmations → Désactivées
- [ ] Autoconfirm → Activé

### Étape 3 : Tester
- [ ] Inscription avec 4 chiffres testée
- [ ] Connexion avec 4 chiffres testée
- [ ] Workflow documenté pour l'équipe

---

## 🎯 Résumé

**Option Idéale** : Dashboard → Settings → Minimum Password Length → 4

**Option Réaliste** : Réinitialisation manuelle via Dashboard pour chaque utilisateur

**Option Scalable** : Script automatisé `reset-all-to-1234.js`

---

## 📚 Voir Aussi

- `CODE_PIN_POLICY_V2.md` - Politique complète des codes PIN
- `START_HERE.md` - Guide de démarrage rapide
- `QUICK_FIX_GUIDE.md` - Dépannage rapide
- `scripts/reset-all-to-1234.js` - Script de réinitialisation

---

**Dernière mise à jour** : 29 Novembre 2025

**Version** : 2.0
