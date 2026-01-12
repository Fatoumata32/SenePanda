# 🚀 Configuration Supabase - 5 Minutes

## Étape 1️⃣ : Créer un compte Supabase (si pas encore fait)

1. Allez sur **https://app.supabase.com**
2. Cliquez sur **"Sign in with GitHub"** ou créez un compte
3. Connectez-vous

## Étape 2️⃣ : Créer un nouveau projet

1. Cliquez sur **"New project"**
2. Remplissez :
   - **Name** : `SenePanda` (ou le nom que vous voulez)
   - **Database Password** : Créez un mot de passe fort (NOTEZ-LE!)
     - Exemple : `MonMotDePasse2024!`
   - **Region** : Choisissez **"Europe (France)"** ou le plus proche
   - **Pricing Plan** : Sélectionnez **"Free"**
3. Cliquez sur **"Create new project"**
4. ⏳ **Attendez 2-3 minutes** que le projet soit créé

## Étape 3️⃣ : Récupérer vos credentials

Une fois le projet créé :

1. Dans le menu latéral, cliquez sur **⚙️ Settings**
2. Cliquez sur **API**
3. Vous verrez deux valeurs importantes :

### Project URL
```
https://xxxxxxxxxxxxxxx.supabase.co
```
**👉 COPIEZ cette URL**

### anon public (API Key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```
**👉 COPIEZ cette clé** (cliquez sur l'icône copier)

## Étape 4️⃣ : Mettre à jour le fichier .env

1. Ouvrez le fichier **`.env`** dans votre éditeur
2. **REMPLACEZ** les lignes suivantes :

```env
EXPO_PUBLIC_SUPABASE_URL=COLLEZ_VOTRE_URL_ICI
EXPO_PUBLIC_SUPABASE_ANON_KEY=COLLEZ_VOTRE_CLE_ICI
```

**Exemple de .env correct :**
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **SAUVEGARDEZ** le fichier (Ctrl+S)

## Étape 5️⃣ : Créer les tables de la base de données

Retournez sur **https://app.supabase.com** dans votre projet :

1. Dans le menu latéral, cliquez sur **SQL Editor**
2. Cliquez sur **"New query"**
3. Copiez-collez le SQL suivant et cliquez sur **"Run"** :

```sql
-- Créer la table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT UNIQUE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  panda_coins INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les profils publics
CREATE POLICY "Les profils sont visibles publiquement"
  ON profiles FOR SELECT
  USING (true);

-- Politique : Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Les utilisateurs peuvent créer leur profil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Politique : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Créer la table points_transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Créer la table referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs parrainages"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Désactiver la confirmation email (développement)
UPDATE auth.config
SET config = jsonb_set(
  config,
  '{mailer_autoconfirm}',
  'true'::jsonb
)
WHERE id = 'auth';
```

4. Si tout se passe bien, vous verrez **"Success. No rows returned"**

## Étape 6️⃣ : Tester la connexion

Dans votre terminal, exécutez :

```bash
node scripts/test-supabase-connection.js
```

Si vous voyez **✅ TEST RÉUSSI!**, c'est bon !

## Étape 7️⃣ : Lancer l'application

```bash
npm run dev
```

Appuyez sur **`a`** pour ouvrir sur Android ou **`i`** pour iOS.

---

## 🎉 C'est fait !

Vous pouvez maintenant :
- ✅ Créer un compte
- ✅ Se connecter
- ✅ Utiliser l'application

---

## ⚠️ En cas de problème

### "Network request failed"
- Vérifiez que le projet Supabase est **actif** (pas en pause)
- Vérifiez que l'URL dans `.env` est correcte
- Relancez l'app : `npm run dev`

### "Invalid API key"
- Vérifiez que vous avez copié la **anon public** key (pas la service_role)
- Vérifiez qu'il n'y a pas d'espace avant/après la clé dans `.env`

### "Email not confirmed"
- C'est normal, le SQL ci-dessus désactive la confirmation email

---

**Besoin d'aide ?** Relisez ce guide étape par étape.
