# ⚡ DÉMARRAGE RAPIDE - SenePanda

## 🚀 EN 5 MINUTES

### 1️⃣ Créer le projet Supabase

**Allez sur** https://app.supabase.com

1. Cliquez **"New project"**
2. Remplissez :
   - Name: `SenePanda`
   - Password: `VotreMotDePasse2024!` (notez-le!)
   - Region: `Europe (France)`
   - Plan: `Free`
3. **"Create new project"**
4. ⏳ Attendez 2-3 minutes

---

### 2️⃣ Désactiver la confirmation email

1. **Authentication** → **Settings**
2. Section **"Email Auth"**
3. **DÉCOCHEZ** "Enable email confirmations"
4. **"Save"**

---

### 3️⃣ Exécuter le SQL

1. **SQL Editor** → **"+ New query"**
2. Ouvrez `SETUP_DATABASE_COMPLET.sql`
3. **Copiez TOUT** (Ctrl+A puis Ctrl+C)
4. **Collez** dans Supabase (Ctrl+V)
5. **"Run"**
6. ⏳ Attendez 10-30 secondes

✅ Vous verrez : "Success. No rows returned."

---

### 4️⃣ Récupérer vos credentials

1. **Settings** → **API**
2. **Copiez** :
   - Project URL : `https://xxxxx.supabase.co`
   - anon public key : `eyJhbGc...`

---

### 5️⃣ Mettre à jour .env

Ouvrez `.env` et remplacez :

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_URL.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_ANON
```

**SAUVEGARDEZ** (Ctrl+S)

---

### 6️⃣ Tester

```bash
node scripts/test-supabase-connection.js
```

✅ Si OK, continuez!

---

### 7️⃣ Lancer l'app

```bash
npm run dev
```

Puis appuyez sur **`a`** (Android) ou **`i`** (iOS)

---

## 🎉 TESTEZ L'INSCRIPTION

1. **Lancez l'app** sur votre appareil
2. **Cliquez** "Créer un compte"
3. **Remplissez** :
   - Numéro : `+221771234567`
   - Prénom : `Votre prénom`
   - Nom : `Votre nom`
   - Code PIN : `1234` (4-6 chiffres)
4. **"Créer le compte"**

✅ Vous recevrez **100 Panda Coins** de bienvenue!

---

## 🔐 TESTEZ LA CONNEXION

1. Sur la page de connexion
2. **Entrez** :
   - Numéro : `+221771234567`
   - Code PIN : `1234`
3. **"Se connecter"**

✅ Vous êtes connecté!

---

## ⚠️ Problèmes ?

### "Network request failed"
→ Projet en pause sur Supabase
→ Réactivez-le sur https://app.supabase.com

### "relation does not exist"
→ Script SQL pas exécuté
→ Re-exécutez `SETUP_DATABASE_COMPLET.sql`

### "Invalid API key"
→ Mauvaise clé dans `.env`
→ Vérifiez que c'est la clé **anon public**

### L'app ne démarre pas
```bash
# Arrêtez tout (Ctrl+C)
npm run dev
```

---

## 📖 Documentation complète

- **INSTALLER_DATABASE.md** - Guide détaillé
- **SETUP_DATABASE_COMPLET.sql** - Script SQL
- **FIX_SUPABASE_CONNECTION.md** - Dépannage

---

**Créé le** : 2026-01-10
