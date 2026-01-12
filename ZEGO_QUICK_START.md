# 🚀 Quick Start - ZegoCloud Backend Secure

## ⚡ 5 Minutes Setup

### 1. Vérifier Supabase CLI
```bash
supabase --version
# Si erreur: npm install -g supabase
```

### 2. Démarrer Supabase Local
```bash
cd C:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project
supabase start
```

### 3. Tester la fonction
```bash
node scripts/test-zego-token.js
```

Vous devriez voir:
```
✅ Succès!
Token: eyJ7YXBwXzpcVW0s...
Expire dans: 3600 secondes
```

### 4. Lancer l'app
```bash
npm run dev
```

### 5. Tester le live
- Créer un live shopping
- Vérifier les logs du composant

---

## 📦 Pour Production

```bash
# 1. Login Supabase
supabase login

# 2. Ajouter secrets
supabase secrets set ZEGO_APP_ID=605198386
supabase secrets set ZEGO_SERVER_SECRET=5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e

# 3. Déployer
supabase functions deploy zego-token

# 4. Mettre à jour .env.local
# EXPO_PUBLIC_ZEGO_BACKEND_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1

# 5. Builder
./gradlew assembleRelease
```

---

## 🧪 Verification

```bash
# Voir les logs
supabase functions logs zego-token

# Tester production
node scripts/test-zego-token.js https://YOUR_PROJECT_ID.supabase.co/functions/v1 user123 senepanda_live_test true
```

---

## 📁 Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `supabase/functions/zego-token/index.ts` | Endpoint backend |
| `lib/zegoConfig.ts` | Config + token generation |
| `components/zegocloud/zego-stream.tsx` | Host integration |
| `components/zegocloud/zego-viewer.tsx` | Audience integration |
| `.env` | URL dev/prod |
| `.env.local` | Secrets production |

---

## ✅ C'est prêt!

La configuration est complète et sécurisée. Tous les tokens sont maintenant générés côté serveur avec signature cryptographique.

**Next steps:**
1. Tester localement (supabase start + npm run dev)
2. Vérifier les logs
3. Déployer en production
4. Builder l'APK release
