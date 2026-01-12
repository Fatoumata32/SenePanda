-- ================================================================
-- SENEPANDA - SCRIPT SQL MINIMAL POUR AUTHENTIFICATION
-- ================================================================
--
-- Ce script crée UNIQUEMENT les tables pour l'inscription/connexion
--
-- Instructions :
-- 1. Allez sur https://app.supabase.com
-- 2. SQL Editor → New query
-- 3. Copiez-collez ce fichier
-- 4. Cliquez "Run"
--
-- ================================================================

-- ================================================================
-- Nettoyer l'ancien si nécessaire
-- ================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ================================================================
-- Table PROFILES - Essentielle pour l'authentification
-- ================================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  panda_coins INTEGER DEFAULT 100,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  city TEXT,
  country TEXT DEFAULT 'Senegal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- Activer RLS sur profiles
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Profils publics en lecture"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Utilisateurs peuvent créer leur profil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent modifier leur profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ================================================================
-- Fonction pour auto-créer le profil à l'inscription
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number TEXT;
  fname TEXT;
  lname TEXT;
BEGIN
  -- Extraire le téléphone de l'email
  phone_number := SPLIT_PART(NEW.email, '@', 1);

  -- Extraire prénom/nom des métadonnées
  fname := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  lname := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  -- Créer le profil automatiquement
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    first_name,
    last_name,
    full_name,
    panda_coins,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', phone_number),
    fname,
    lname,
    TRIM(fname || ' ' || lname),
    100,  -- 100 Panda Coins de bienvenue
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Trigger pour créer le profil automatiquement
-- ================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- Fonction pour mettre à jour updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at sur profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Index pour la performance
-- ================================================================

CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);

-- ================================================================
-- TERMINÉ !
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Configuration minimale créée avec succès!';
  RAISE NOTICE '📋 Table profiles créée';
  RAISE NOTICE '🔐 Policies RLS activées';
  RAISE NOTICE '⚡ Trigger auto-création profil activé';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Vous pouvez maintenant tester l''inscription!';
  RAISE NOTICE '💡 N''oubliez pas de désactiver la confirmation email:';
  RAISE NOTICE '   Authentication → Settings → Email Auth → Décocher "Enable email confirmations"';
END $$;
