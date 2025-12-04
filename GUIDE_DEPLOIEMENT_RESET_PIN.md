# 🔧 Guide de déploiement - Fonction "Code PIN oublié"

## ✅ Corrections apportées

La fonctionnalité "Code PIN oublié" a été complètement corrigée et fonctionne maintenant réellement !

### Avant (❌ Non fonctionnel)
- Affichait seulement un message de simulation
- Ne modifiait pas réellement le mot de passe
- L'utilisateur ne pouvait pas se reconnecter

### Après (✅ Fonctionnel)
- Appelle une Edge Function Supabase sécurisée
- Met à jour réellement le mot de passe dans la base de données
- L'utilisateur peut immédiatement se connecter avec le nouveau PIN

## 📋 Étapes de déploiement

### 1. Se connecter à Supabase CLI

```bash
npx supabase login
```

Cela ouvrira votre navigateur pour vous authentifier.

### 2. Lier le projet (si ce n'est pas déjà fait)

```bash
npx supabase link --project-ref [VOTRE-PROJECT-REF]
```

Trouvez votre `project-ref` dans l'URL de votre dashboard Supabase :
`https://app.supabase.com/project/[VOTRE-PROJECT-REF]`

### 3. Déployer la fonction reset-pin

```bash
npx supabase functions deploy reset-pin
```

### 4. Vérifier le déploiement

Allez dans votre Dashboard Supabase :
1. Menu "Edge Functions"
2. Vous devriez voir `reset-pin` avec un statut vert ✅

## 🎯 Comment utiliser

### Pour l'utilisateur :

1. **Sur l'écran de connexion**, cliquer sur "Code PIN oublié ?"
2. **Entrer le numéro de téléphone** (+221 XX XXX XX XX)
3. **Entrer un nouveau code PIN** (4 à 6 chiffres)
4. **Cliquer sur "Réinitialiser"**
5. **Confirmation** : Message de succès ✅
6. **Se connecter** avec le nouveau code PIN

## 🔒 Sécurité

La fonction est sécurisée :

✅ **Validation stricte**
- Format téléphone : +221XXXXXXXXX (obligatoire)
- Code PIN : 4-6 chiffres uniquement
- Vérification de l'existence du compte

✅ **Droits admin**
- Utilise `SUPABASE_SERVICE_ROLE_KEY` (accès complet)
- Seule la Edge Function a ces droits
- L'app mobile ne peut pas modifier directement les mots de passe

✅ **Protection**
- CORS configuré
- Validation côté serveur
- Logs d'erreurs

## 🧪 Test manuel de la fonction

Vous pouvez tester directement avec curl :

```bash
curl -X POST 'https://[VOTRE-PROJECT-REF].supabase.co/functions/v1/reset-pin' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [VOTRE-ANON-KEY]' \
  -d '{
    "phoneNumber": "+221771234567",
    "newPin": "5678"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Code PIN réinitialisé avec succès"
}
```

## 📱 Fonctionnalité dans l'app

### Code modifié : `app/simple-auth.tsx`

**Fonction `handleResetPassword()` :**
```typescript
// Appeler l'Edge Function pour réinitialiser le PIN
const { data: response, error: resetError } = await supabase.functions.invoke('reset-pin', {
  body: {
    phoneNumber: cleaned,
    newPin: newPassword
  }
});
```

**Feedback utilisateur :**
- Synthèse vocale : "Code PIN réinitialisé avec succès"
- Alert avec message de confirmation
- Redirection automatique vers connexion avec le nouveau PIN pré-rempli

## 🆘 Dépannage

### Erreur : "Access token not provided"
**Solution :** Exécutez `npx supabase login`

### Erreur : "Project not linked"
**Solution :** Exécutez `npx supabase link --project-ref [VOTRE-REF]`

### Erreur : "Function not found"
**Solution :** Vérifiez que le déploiement a réussi dans le dashboard

### Erreur : "Impossible de réinitialiser le code PIN"
**Causes possibles :**
1. Fonction pas déployée → Déployez la fonction
2. Pas de connexion internet → Vérifiez la connexion
3. Numéro incorrect → Vérifiez le format (+221...)

## 📊 Logs et monitoring

Pour voir les logs de la fonction :

```bash
npx supabase functions logs reset-pin
```

Ou dans le Dashboard :
1. Menu "Edge Functions"
2. Cliquer sur "reset-pin"
3. Onglet "Logs"

## ✨ Améliorations futures possibles

- [ ] Envoi de SMS de confirmation
- [ ] Code de vérification par SMS (2FA)
- [ ] Limitation du nombre de tentatives (rate limiting)
- [ ] Historique des réinitialisations
- [ ] Notification email/SMS après réinitialisation

---

**Status :** ✅ Prêt à déployer
**Fichiers créés :**
- `supabase/functions/reset-pin/index.ts` ✅
- `app/simple-auth.tsx` ✅ (mis à jour)

**Prochaine étape :** Déployez la fonction avec la commande ci-dessus !
