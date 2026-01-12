# 🚀 Déploiement Edge Function - Guide Visuel

## ⚡ Méthode Rapide (via Dashboard - Recommandé)

### Étape 1 : Accéder aux Edge Functions

1. **Ouvrir** : [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionner** : Votre projet SenePanda
3. **Cliquer** : **Edge Functions** (menu gauche, icône éclair ⚡)

### Étape 2 : Créer une Nouvelle Fonction

1. **Cliquer** : Bouton **"+ New function"** ou **"Create function"**
2. **Nom de la fonction** : `create-user-4-digits`
3. **Ne pas** cocher "Create from template" (laisser vide)

### Étape 3 : Copier le Code

**Copier-coller** ce code complet dans l'éditeur :

```typescript
// Edge Function pour créer des utilisateurs avec codes PIN de 4 chiffres
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer un client Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer les données de la requête
    const { phone, firstName, lastName, password } = await req.json()

    // Validation
    if (!phone || !firstName || !lastName || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phone, firstName, lastName, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Valider le code PIN (exactement 4 chiffres)
    if (!/^\d{4}$/.test(password)) {
      return new Response(
        JSON.stringify({ error: 'Password must be exactly 4 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer l'email à partir du téléphone
    const cleanedPhone = phone.replace(/[\s-]/g, '')
    const email = `${cleanedPhone}@senepanda.app`

    // Créer l'utilisateur avec l'API Admin (bypass la validation de longueur)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password, // 4 chiffres directement
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        phone: cleanedPhone,
        first_name: firstName,
        last_name: lastName,
      }
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        phone: cleanedPhone,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        username: `user_${userData.user.id.substring(0, 8)}`,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Ne pas échouer si le profil existe déjà
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          phone: cleanedPhone,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Étape 4 : Déployer

1. **Cliquer** : Bouton **"Deploy"** (en haut à droite)
2. **Attendre** : Le déploiement (quelques secondes)
3. **Vérifier** : Message de succès "Function deployed successfully"

### Étape 5 : Vérifier

1. **Statut** : Doit être **"Active"** (vert)
2. **URL** : Copier l'URL de la fonction (on en aura besoin pour tester)

---

## ✅ Vérification

### Dans Dashboard

- [ ] Edge Functions visible dans le menu
- [ ] Fonction `create-user-4-digits` listée
- [ ] Statut : **Active** (vert)
- [ ] URL disponible

### Test Rapide

**Via le Dashboard** :
1. Cliquer sur la fonction `create-user-4-digits`
2. Onglet **"Invocations"** ou **"Test"**
3. Payload de test :
```json
{
  "phone": "+221781234567",
  "firstName": "Test",
  "lastName": "User",
  "password": "1234"
}
```
4. **Cliquer** : **"Send request"**
5. **Résultat attendu** :
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "+221781234567@senepanda.app",
    "phone": "+221781234567"
  }
}
```

---

## 🚨 Si Problème

### Erreur de Déploiement

**Cause** : Syntaxe incorrecte

**Solution** :
- Vérifier que le code est complet
- Pas d'erreurs de copier-coller
- Réessayer le déploiement

### Fonction Inactive

**Cause** : Déploiement incomplet

**Solution** :
- Cliquer sur la fonction
- Re-déployer manuellement
- Vérifier les logs

### Erreur lors du Test

**Cause** : Variables d'environnement manquantes

**Solution** :
Les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement injectées par Supabase. Si erreur, contacter le support.

---

## 📊 Après Déploiement

### L'App Utilisera Automatiquement

Le code dans `app/simple-auth.tsx` appelle automatiquement cette fonction quand :
1. L'inscription normale échoue (password trop court)
2. La fonction crée le compte avec 4 chiffres
3. L'app connecte automatiquement l'utilisateur

### Monitoring

**Dashboard** > **Edge Functions** > **create-user-4-digits** :
- **Invocations** : Nombre d'appels
- **Errors** : Taux d'erreurs
- **Logs** : Logs en temps réel

---

## 🎯 Résultat Final

✅ **Inscription** : Fonctionne avec 4 chiffres
✅ **Automatique** : Pas d'intervention admin
✅ **Transparent** : L'utilisateur ne voit rien
✅ **Scalable** : Illimité

---

## 📝 Checklist

- [ ] Dashboard ouvert
- [ ] Edge Functions accessible
- [ ] Nouvelle fonction créée (`create-user-4-digits`)
- [ ] Code copié-collé
- [ ] Fonction déployée
- [ ] Statut : Active
- [ ] Test effectué
- [ ] Résultat : Success

---

## 🎉 C'est Terminé !

Une fois la fonction déployée :
1. ✅ **Tester** l'inscription dans l'app
2. ✅ **Vérifier** qu'un compte se crée avec 4 chiffres
3. ✅ **Profiter** du système automatique !

---

**Temps estimé** : 5 minutes

**Difficulté** : Facile (copier-coller)

**Résultat** : Inscription opérationnelle ! 🚀
