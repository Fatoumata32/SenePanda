# 🚀 Installation de la base de données SenePanda

## ⚡ MÉTHODE RAPIDE (3 minutes)

### Étape 1 : Créer un projet Supabase

1. Allez sur **https://app.supabase.com**
2. Cliquez sur **"New project"**
3. Remplissez :
   - **Name** : SenePanda
   - **Database Password** : Créez un mot de passe (NOTEZ-LE!)
   - **Region** : Europe (France)
   - **Plan** : Free
4. Cliquez sur **"Create new project"**
5. ⏳ Attendez 2-3 minutes

---

### Étape 2 : Désactiver la confirmation email

Dans votre projet Supabase :

1. Dans le menu de gauche, cliquez sur **🔐 Authentication**
2. Cliquez sur **⚙️ Settings** (sous Authentication)
3. Trouvez la section **"Email Auth"**
4. **DÉCOCHEZ** la case **"Enable email confirmations"**
5. Cliquez sur **"Save"**

> Cette étape permet de se connecter sans confirmer l'email (pratique pour le développement)

---

### Étape 3 : Exécuter le script SQL

1. Dans le menu de gauche, cliquez sur **🛠️ SQL Editor**
2. Cliquez sur **"+ New query"**
3. **Ouvrez le fichier `SETUP_DATABASE_COMPLET.sql`** dans votre éditeur
4. **COPIEZ TOUT** le contenu (Ctrl+A puis Ctrl+C)
5. **COLLEZ** dans l'éditeur SQL de Supabase (Ctrl+V)
6. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)
7. ⏳ Attendez 10-30 secondes

**Vous devriez voir** :
```
Success. No rows returned.
✅ Base de données SenePanda créée avec succès!
📊 Tables créées: 15
🔐 Policies RLS activées
⚡ Triggers configurés

🎉 Vous pouvez maintenant utiliser l'application!
```

---

### Étape 4 : Récupérer vos credentials

1. Dans le menu de gauche, cliquez sur **⚙️ Settings**
2. Cliquez sur **API**
3. Vous verrez :

#### Project URL
```
https://xxxxxxxx.supabase.co
```
**👉 COPIEZ cette URL**

#### anon public (API Key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**👉 COPIEZ cette clé**

---

### Étape 5 : Mettre à jour .env

1. Ouvrez le fichier **`.env`** dans votre projet
2. **REMPLACEZ** ces lignes :

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_URL.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_ANON
```

3. **SAUVEGARDEZ** (Ctrl+S)

**Exemple complet de .env :**
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTU3NjAwMH0.XXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici

# ZegoCloud Token Generation Backend
EXPO_PUBLIC_ZEGO_BACKEND_URL=http://localhost:54321/functions/v1
```

---

### Étape 6 : Tester la connexion

Dans votre terminal :

```bash
node scripts/test-supabase-connection.js
```

✅ Si vous voyez **"TEST RÉUSSI!"**, c'est bon !

❌ Si ça ne marche pas, vérifiez que :
- Le projet Supabase est actif (pas en pause)
- L'URL dans `.env` est correcte
- La clé dans `.env` est correcte (sans espace avant/après)

---

### Étape 7 : Lancer l'application

```bash
npm run dev
```

Puis :
- Appuyez sur **`a`** pour Android
- Ou **`i`** pour iOS

---

## 🎉 C'EST FAIT !

Vous pouvez maintenant :

✅ **Créer un compte**
- Format numéro : `+221771234567`
- Code PIN : 4-6 chiffres
- Bonus : 100 Panda Coins offerts!

✅ **Se connecter**
- Même numéro
- Même code PIN

✅ **Utiliser toutes les fonctionnalités** :
- Créer des produits
- Passer des commandes
- Chat
- Live shopping
- Et plus!

---

## 📊 Ce qui a été créé

### Tables principales
- ✅ `profiles` - Utilisateurs (avec 100 Panda Coins de départ)
- ✅ `products` - Produits
- ✅ `shops` - Boutiques
- ✅ `orders` - Commandes
- ✅ `live_sessions` - Lives shopping
- ✅ `chat_messages` - Messages
- ✅ `notifications` - Notifications
- ✅ `points_transactions` - Historique des coins
- ✅ `referrals` - Système de parrainage

### Fonctionnalités activées
- ✅ Authentification par téléphone + PIN
- ✅ Création automatique du profil
- ✅ 100 Panda Coins de bienvenue
- ✅ Confirmation email désactivée (dev)
- ✅ Sécurité RLS activée
- ✅ Triggers automatiques

---

## ⚠️ Problèmes courants

### "Network request failed"
→ Le projet Supabase est en pause
→ Allez sur https://app.supabase.com et réactivez-le

### "Invalid API key"
→ Vérifiez que vous avez copié la clé **anon public** (pas service_role)

### "relation does not exist"
→ Le script SQL n'a pas été exécuté correctement
→ Réexécutez le script complet

### "duplicate key value"
→ Tentez de créer un compte qui existe déjà
→ Connectez-vous au lieu de créer un compte

---

## 🔧 Commandes utiles

```bash
# Tester la connexion Supabase
node scripts/test-supabase-connection.js

# Lancer l'app en développement
npm run dev

# Vérifier les erreurs TypeScript
npm run typecheck

# Lancer les tests
npm run test
```

---

## 📞 Support

Si vous avez des problèmes :

1. Vérifiez que le script SQL a bien été exécuté (pas d'erreur rouge dans Supabase)
2. Vérifiez `.env` (URL et clé correctes)
3. Testez avec : `node scripts/test-supabase-connection.js`
4. Relancez l'app complètement : arrêtez (Ctrl+C) puis `npm run dev`

---

**Créé le** : 2026-01-10
**Version** : 1.0
