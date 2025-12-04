# Déploiement de la fonction reset-pin

## Étape 1 : Déployer la Edge Function

Exécutez cette commande dans le terminal :

```bash
npx supabase functions deploy reset-pin
```

## Étape 2 : Vérifier le déploiement

1. Allez dans le Dashboard Supabase
2. Cliquez sur "Edge Functions" dans la barre latérale
3. Vous devriez voir la fonction `reset-pin` listée

## Étape 3 : Tester la fonction

La fonction est maintenant disponible et sera appelée automatiquement quand un utilisateur demande à réinitialiser son code PIN.

## Comment ça fonctionne

1. **L'utilisateur clique sur "Code PIN oublié"** sur l'écran de connexion
2. **Il entre son numéro de téléphone** et un nouveau code PIN (4-6 chiffres)
3. **L'app vérifie** que le compte existe dans la base de données
4. **L'app appelle** la Edge Function `reset-pin`
5. **La fonction met à jour** le mot de passe avec la clé admin Supabase
6. **L'utilisateur peut se connecter** avec son nouveau code PIN

## Sécurité

✅ La fonction utilise la clé `SUPABASE_SERVICE_ROLE_KEY` qui a les droits admin
✅ Validation du format du numéro de téléphone (+221XXXXXXXXX)
✅ Validation du PIN (4-6 chiffres uniquement)
✅ Vérification de l'existence de l'utilisateur
✅ CORS activé pour permettre les appels depuis l'app

## Variables d'environnement

Les variables suivantes sont automatiquement disponibles dans les Edge Functions :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Pas besoin de configuration supplémentaire !

## En cas d'erreur

Si le déploiement échoue, vérifiez :
1. Que vous êtes connecté à Supabase CLI (`npx supabase login`)
2. Que vous avez lié votre projet (`npx supabase link`)
3. Que votre connexion internet fonctionne

## Test manuel

Vous pouvez tester la fonction avec curl :

```bash
curl -X POST 'https://[VOTRE-PROJECT-REF].supabase.co/functions/v1/reset-pin' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [VOTRE-ANON-KEY]' \
  -d '{
    "phoneNumber": "+221771234567",
    "newPin": "1234"
  }'
```

Remplacez `[VOTRE-PROJECT-REF]` et `[VOTRE-ANON-KEY]` par vos vraies valeurs.
