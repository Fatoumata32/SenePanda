# 🔧 Résoudre le problème de connexion Supabase

## ❌ Problème détecté

L'application ne peut pas se connecter à Supabase avec l'erreur :
```
Network request failed - Could not resolve host: inhzfdufjhuihtuykmwm.supabase.co
```

## 🔍 Diagnostic

Le projet Supabase configuré dans `.env` n'est **pas accessible**. Cela peut être dû à :

1. **Projet en pause** (les projets gratuits se mettent en pause après 7 jours d'inactivité)
2. **Projet supprimé** ou **URL incorrecte**
3. **Problème de configuration réseau**

## ✅ Solution : Réactiver votre projet Supabase

### Étape 1 : Accéder à votre dashboard Supabase

1. Allez sur **https://app.supabase.com**
2. Connectez-vous avec votre compte
3. Vous verrez la liste de vos projets

### Étape 2 : Vérifier l'état du projet

Cherchez votre projet **SenePanda** ou celui avec l'URL : `inhzfdufjhuihtuykmwm.supabase.co`

**Si le projet est marqué "PAUSED" (en pause) :**
- Cliquez sur le projet
- Cliquez sur le bouton **"Restore project"** ou **"Unpause"**
- Attendez 2-3 minutes que le projet redémarre

**Si le projet n'existe pas :**
- Vous devez créer un nouveau projet Supabase (voir ci-dessous)

### Étape 3 : Récupérer les bonnes credentials

Une fois le projet actif :

1. Dans le dashboard, cliquez sur **Settings** (⚙️)
2. Allez dans **API**
3. Copiez ces deux valeurs :
   - **Project URL** (ex: `https://xxxxxx.supabase.co`)
   - **anon public** key (commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Étape 4 : Mettre à jour le fichier .env

1. Ouvrez le fichier `.env` dans le projet
2. Remplacez les valeurs :

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_NOUVELLE_URL.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...VOTRE_CLE
```

3. **Sauvegardez le fichier**

### Étape 5 : Relancer l'application

**IMPORTANT** : Après avoir modifié `.env`, vous DEVEZ **arrêter complètement** l'application et la relancer :

```bash
# 1. Arrêter l'app (Ctrl+C dans le terminal)

# 2. Relancer proprement
npm run dev
```

---

## 🆕 Si vous devez créer un nouveau projet Supabase

### 1. Créer le projet

1. Sur https://app.supabase.com, cliquez sur **"New project"**
2. Choisissez :
   - **Name**: SenePanda
   - **Database Password**: Choisissez un mot de passe fort (notez-le!)
   - **Region**: Europe (France) ou le plus proche de vous
   - **Plan**: Free tier
3. Cliquez sur **"Create new project"**
4. Attendez 2-3 minutes que le projet soit créé

### 2. Exécuter les migrations (base de données)

Une fois le projet créé, vous devez créer les tables nécessaires :

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Cliquez sur **"New query"**
3. Copiez-collez le contenu de chaque fichier `.sql` dans `supabase/migrations/` et exécutez-les dans l'ordre
4. Ou utilisez la CLI Supabase (voir ci-dessous)

### 3. Avec Supabase CLI (recommandé)

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref VOTRE_PROJECT_REF

# Appliquer les migrations
supabase db push
```

### 4. Mettre à jour .env

Récupérez l'URL et la clé du nouveau projet (Settings → API) et mettez à jour `.env`

---

## 🧪 Tester la connexion

Une fois la configuration mise à jour :

```bash
# Relancer l'app
npm run dev
```

Vous devriez voir dans les logs :
```
✅ Configuration Supabase chargée
📡 URL Supabase: https://votre-projet.supabase.co
```

Si vous voyez toujours "Network request failed", vérifiez :
- Que le projet est bien **actif** (pas en pause)
- Que l'URL dans `.env` est **exactement** celle de Settings → API
- Que vous avez bien **relancé** l'application après modification de `.env`

---

## 📞 Besoin d'aide ?

Si le problème persiste :

1. Vérifiez les logs dans le terminal
2. Vérifiez que votre projet Supabase est accessible depuis le navigateur : `https://VOTRE_URL.supabase.co`
3. Contactez le support Supabase si le projet ne démarre pas

---

## 📝 Checklist de vérification

- [ ] Projet Supabase actif (pas en pause)
- [ ] URL correcte dans `.env`
- [ ] Clé anon correcte dans `.env`
- [ ] Application complètement relancée après modification de `.env`
- [ ] Migrations de base de données exécutées (si nouveau projet)
- [ ] Connexion internet fonctionnelle

---

**Dernière mise à jour** : 2026-01-10
