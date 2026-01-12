# 🚀 Edge Functions - SenePanda

## 📌 `create-user-4-digits`

Cette Edge Function permet de créer des utilisateurs avec des codes PIN de 4 chiffres en contournant la validation de longueur minimum de Supabase Auth.

---

## 🛠️ Installation

### Prérequis

```bash
# Installer Supabase CLI
npm install supabase --save-dev

# Ou globalement
npm install -g supabase
```

### Login

```bash
# Se connecter à Supabase
npx supabase login
```

---

## 🚀 Déploiement

### 1. Lier le Projet

```bash
# Dans le dossier du projet
npx supabase link --project-ref your-project-ref
```

Pour trouver `your-project-ref` :
- Aller dans Dashboard > Settings > General
- Copier "Reference ID"

### 2. Déployer la Function

```bash
# Déployer
npx supabase functions deploy create-user-4-digits
```

### 3. Vérifier le Déploiement

1. **Dashboard** > **Edge Functions**
2. Vérifier que `create-user-4-digits` apparaît
3. Statut : **Active**

---

## 🔐 Configuration

La fonction utilise automatiquement :
- `SUPABASE_URL` - URL du projet
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role (admin)

Ces variables sont automatiquement injectées par Supabase.

---

## 📝 Utilisation

### Depuis l'Application

L'appel est automatique dans `simple-auth.tsx` quand l'inscription avec 4 chiffres échoue :

```typescript
const { data, error } = await supabase.functions.invoke('create-user-4-digits', {
  body: {
    phone: '+221781234567',
    firstName: 'Prénom',
    lastName: 'Nom',
    password: '1234',
  }
});
```

### Test Manuel (via curl)

```bash
# Récupérer l'URL de la fonction
# Dashboard > Edge Functions > create-user-4-digits > Copy URL

curl -X POST https://your-project-ref.supabase.co/functions/v1/create-user-4-digits \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+221781234567",
    "firstName": "Test",
    "lastName": "User",
    "password": "1234"
  }'
```

---

## 🔍 Logs

Voir les logs de la fonction :

```bash
# En temps réel
npx supabase functions logs create-user-4-digits --follow

# Derniers logs
npx supabase functions logs create-user-4-digits
```

Ou dans Dashboard > Edge Functions > create-user-4-digits > Logs

---

## ✅ Fonctionnement

```
┌─────────────────────────────────────────────┐
│ 1. App essaie inscription normale           │
│    supabase.auth.signUp({ password: '1234' })│
│    ❌ Erreur: "Password too short"          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. App appelle Edge Function                │
│    supabase.functions.invoke(...)           │
│    ✅ Utilise API Admin (bypass validation) │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Edge Function crée l'utilisateur         │
│    - Compte auth avec password "1234"       │
│    - Profil dans table profiles             │
│    - Email auto-confirmé                    │
│    ✅ Retour: { success: true, user: {...} }│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. App connecte automatiquement             │
│    supabase.auth.signInWithPassword(...)    │
│    ✅ Redirection vers /role-selection      │
└─────────────────────────────────────────────┘
```

---

## 🚨 Dépannage

### Erreur : "Function not found"

**Solution** : Redéployer la fonction
```bash
npx supabase functions deploy create-user-4-digits
```

### Erreur : "Unauthorized"

**Cause** : La clé ANON n'a pas accès

**Solution** : Vérifier les permissions Edge Function dans Dashboard

### Erreur : "Service role key not found"

**Cause** : Variable d'environnement manquante

**Solution** : Les variables sont automatiques, vérifier le déploiement

---

## 🔄 Mise à Jour

Pour modifier la fonction :

1. **Éditer** : `supabase/functions/create-user-4-digits/index.ts`
2. **Déployer** :
   ```bash
   npx supabase functions deploy create-user-4-digits
   ```
3. **Tester** dans l'app

---

## 📊 Monitoring

### Métriques Disponibles

Dashboard > Edge Functions > create-user-4-digits :
- **Invocations** : Nombre d'appels
- **Errors** : Taux d'erreurs
- **Duration** : Temps d'exécution
- **Logs** : Logs en temps réel

---

## 🎯 Résumé

✅ **Permet** : Inscription avec code PIN 4 chiffres
✅ **Contourne** : Validation longueur minimum Supabase
✅ **Automatique** : Appel transparent depuis l'app
✅ **Sécurisé** : Utilise API Admin serveur-side

**Commandes essentielles** :
```bash
# Déployer
npx supabase functions deploy create-user-4-digits

# Logs
npx supabase functions logs create-user-4-digits --follow

# Tester
curl -X POST [FUNCTION_URL] -H "Authorization: Bearer [ANON_KEY]" -d '{"phone":"+221...", "password":"1234"}'
```

---

**Créé** : 29 Novembre 2025
**Version** : 1.0
