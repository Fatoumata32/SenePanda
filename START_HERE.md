# 🚀 START HERE - Débloquer le Compte

## 📋 Actions en 3 Étapes (5 minutes)

### ✅ Étape 1 : SQL (2 minutes)

1. **Ouvrir** : [Supabase Dashboard](https://supabase.com/dashboard)
2. **Aller dans** : SQL Editor (icône `<>` dans le menu gauche)
3. **Copier-coller** le fichier `FIX_NOW.sql`
4. **Cliquer** : **RUN** (bouton vert)
5. **Vérifier** : Le tableau de résultats doit montrer "✓ Confirmé" et "✓ Complet"

### ✅ Étape 2 : Reset Password (2 minutes)

1. **Aller dans** : Authentication → Users
2. **Chercher** : `+221785423833@senepanda.app`
3. **Cliquer** sur l'utilisateur dans la liste
4. **Menu `...`** (trois points en haut à droite) → **Reset Password**
5. **Dans le champ Password** : Taper **`1234`**

```
⚠️ TRÈS IMPORTANT :
   Taper : 1-2-3-4
   PAS : 0-0-1-2-3-4
   Juste 4 chiffres : 1234
```

6. **Cliquer** : **Save** ou **Update user**

### ✅ Étape 3 : Test (1 minute)

1. **Ouvrir l'application** SenePanda
2. **Entrer** :
   - Numéro : `+221 78 542 38 33`
   - Code PIN : `1234`
3. **Cliquer** : Se connecter

---

## ✅ Résultat Attendu

```
┌─────────────────────────────────────┐
│  ✓ Email confirmé                   │
│  ✓ Profil complet                   │
│  ✓ Mot de passe = 1234              │
│  ✓ Connexion réussie                │
└─────────────────────────────────────┘
```

---

## ❌ Si Ça Ne Marche Pas

### Problème 1 : "Invalid login credentials"

**Solution** :
- Retourner au Dashboard
- Vérifier que le mot de passe est bien `1234` (4 chiffres)
- Pas `001234`, pas `12345`, juste `1234`

### Problème 2 : "Email not confirmed"

**Solution** :
- Re-exécuter `FIX_NOW.sql`
- Attendre 30 secondes
- Réessayer

### Problème 3 : Autre erreur

**Solution** :
- Consulter `QUICK_FIX_GUIDE.md`
- Ou voir `GUIDE_MIGRATION_4_CHIFFRES.md`

---

## 📁 Fichiers Utiles

| Fichier | Utilité |
|---------|---------|
| **FIX_NOW.sql** | ← Commencer par ici |
| QUICK_FIX_GUIDE.md | Guide rapide avec dépannage |
| GUIDE_MIGRATION_4_CHIFFRES.md | Guide complet |
| README_PIN_SYSTEM.md | Documentation du système |

---

## 🎯 Après le Déblocage

Une fois le compte débloqué :

1. ✅ Tester que la connexion fonctionne
2. ✅ (Optionnel) Réinitialiser les autres comptes :
   ```bash
   node scripts/reset-all-to-1234.js
   ```

---

**Temps estimé total** : 5 minutes

**Difficulté** : Facile

**Résultat** : Compte débloqué, connexion OK ✅
