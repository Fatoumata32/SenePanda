# 🚀 Déploiement de la Fonction Edge ZegoCloud

## 📋 Vue d'ensemble

Vous avez maintenant un endpoint sécurisé qui:
- ✅ Génère les tokens ZegoCloud signés côté serveur
- ✅ Utilise votre secret serveur de manière sécurisée
- ✅ Déploie gratuitement sur Supabase Edge Functions
- ✅ Fonctionne en développement et production

## 🔧 Installation locale

### 1. Installer Supabase CLI
```bash
npm install -g supabase
```

### 2. Se connecter à Supabase
```bash
supabase login
```

### 3. Lier votre projet
```bash
cd C:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project
supabase link --project-ref inhzfdufjhuihtuykmwm
```

### 4. Créer les secrets locaux
Le fichier `.env.local` contient:
```
ZEGO_APP_ID=605198386
ZEGO_SERVER_SECRET=5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e
```

### 5. Démarrer Supabase localement (optionnel)
```bash
supabase start
```

Cela lance:
- Base de données PostgreSQL sur localhost:5432
- Functions sur localhost:54321
- Studio sur localhost:54323

## 🧪 Tester localement

### 1. Démarrer votre app Expo en dev
```bash
npm run dev
```

### 2. Appeler la fonction depuis l'app
La fonction sera disponible sur: `http://localhost:54321/functions/v1/zego-token`

### Test avec curl:
```bash
curl -X POST http://localhost:54321/functions/v1/zego-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "roomId": "senepanda_live_session1",
    "isHost": true,
    "expiresIn": 3600
  }'
```

**Réponse attendue:**
```json
{
  "token": "eyJ7YXBwXzpcVW0sInVzZXJfaWQiOiJ1c2VyMTIz...",
  "expiresIn": 3600,
  "issuedAt": 1704974400
}
```

## 📤 Déploiement en Production

### 1. Ajouter les secrets sur Supabase Cloud
```bash
supabase secrets set ZEGO_APP_ID=605198386
supabase secrets set ZEGO_SERVER_SECRET=5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e
```

### 2. Déployer la fonction
```bash
supabase functions deploy zego-token
```

### 3. Récupérer l'URL publique
```bash
supabase functions list
```

Vous verrez quelque chose comme:
```
Name         Status   URL
zego-token   Active   https://YOUR_PROJECT_ID.supabase.co/functions/v1/zego-token
```

### 4. Mettre à jour .env.local pour production
```env
EXPO_PUBLIC_ZEGO_BACKEND_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1
```

## 🔐 Sécurité

### Ce qui est sécurisé:
✅ Le secret ZegoCloud reste sur le serveur (jamais exposé au client)
✅ Les tokens sont signés côté serveur avec HMAC-SHA256
✅ Chaque token expire après 1 heure (configurable)
✅ CORS restrictif (seulement votre domaine en prod)

### Ce qui pourrait être amélioré:
⚠️ Ajouter une authentification JWT pour la fonction
⚠️ Implémenter un système de rate limiting
⚠️ Logger les tentatives échouées

### Exemple avec authentification JWT:
```typescript
// À ajouter en haut de la fonction
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 }
  );
}

const token = authHeader.slice(7);
// Vérifier le JWT avec votre clé publique Supabase
```

## 🛠️ Dépannage

### "ZEGO_SERVER_SECRET not configured"
**Solution:** Assurez-vous que les secrets sont définis:
```bash
supabase secrets list
```

### La fonction retourne 404
**Solution:** Redéployer la fonction:
```bash
supabase functions deploy zego-token --no-verify
```

### Les tokens n'expirent pas correctement
**Solution:** Vérifier que l'horloge du serveur est synchronisée (NTP)

### CORS error en production
**Solution:** Ajouter votre domaine frontend au CORS de la fonction

## 📊 Monitoring

### Voir les logs:
```bash
supabase functions logs zego-token
```

### En production (depuis Supabase Dashboard):
1. Aller à **Functions** → **zego-token**
2. Cliquer sur **Logs**
3. Filtrer par erreur ou succès

## 🎯 Prochaines étapes

- [ ] Déployer localement et tester
- [ ] Configurer les secrets en production
- [ ] Déployer en production
- [ ] Mettre à jour l'URL backend en production
- [ ] Ajouter l'authentification JWT
- [ ] Configurer le monitoring et les alertes

## 📝 Variables d'environnement à mettre à jour

### .env (Dev - public)
```env
EXPO_PUBLIC_ZEGO_BACKEND_URL=http://localhost:54321/functions/v1
```

### .env.local (Prod - secrets)
```env
ZEGO_APP_ID=605198386
ZEGO_SERVER_SECRET=5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e
EXPO_PUBLIC_ZEGO_BACKEND_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1
```

## 🎓 Ressources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [ZegoCloud Token Generation](https://docs.zegocloud.com/article/18026)
- [Deno Runtime](https://deno.land/runtime)
