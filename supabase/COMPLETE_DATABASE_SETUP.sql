-- ============================================
-- SENEPANDA - Configuration Complete de la Base de Donnees
-- Date: 2024-11-22
-- Description: Fichier unique pour configurer toute la base de donnees
-- Instructions: Executez ce fichier dans le SQL Editor de Supabase Dashboard
-- ============================================

-- =============================================
-- 0.0 SUPPRESSION URGENTE DES TRIGGERS (PRIORITE ABSOLUE)
-- =============================================
-- Cette section DOIT etre executee en premier pour corriger l'erreur d'inscription

-- Supprimer tous les triggers sur auth.users dynamiquement
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_rec.tgname);
    RAISE NOTICE 'Supprime trigger: %', trigger_rec.tgname;
  END LOOP;
END $$;

-- Supprimer toutes les fonctions liees aux profils
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;

-- =============================================
-- 0.1 CREATION/VERIFICATION TABLE PROFILES (DYNAMIQUE)
-- =============================================

-- Creer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction utilitaire pour ajouter une colonne dynamiquement
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT,
  p_default TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column
  ) THEN
    IF p_default IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s DEFAULT %s', p_table, p_column, p_type, p_default);
    ELSE
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_type);
    END IF;
    RAISE NOTICE 'Colonne ajoutee: %.%', p_table, p_column;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ajouter toutes les colonnes manquantes a profiles dynamiquement
DO $$
BEGIN
  -- Informations de base
  PERFORM add_column_if_not_exists('profiles', 'email', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'username', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'first_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'last_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'full_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'phone', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'avatar_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'bio', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'city', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'country', 'TEXT', '''Senegal''');
  PERFORM add_column_if_not_exists('profiles', 'address', 'TEXT');

  -- Statuts utilisateur
  PERFORM add_column_if_not_exists('profiles', 'is_seller', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('profiles', 'is_verified', 'BOOLEAN', 'FALSE');
  PERFORM add_column_if_not_exists('profiles', 'is_premium', 'BOOLEAN', 'FALSE');

  -- Informations boutique vendeur
  PERFORM add_column_if_not_exists('profiles', 'shop_name', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_description', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_logo_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_banner_url', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shop_category', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'business_hours', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'return_policy', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'shipping_info', 'TEXT');

  -- Statistiques
  PERFORM add_column_if_not_exists('profiles', 'average_rating', 'DECIMAL(3,2)', '0');
  PERFORM add_column_if_not_exists('profiles', 'total_reviews', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'total_sales', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'followers_count', 'INTEGER', '0');
  PERFORM add_column_if_not_exists('profiles', 'following_count', 'INTEGER', '0');

  -- Systeme de parrainage
  PERFORM add_column_if_not_exists('profiles', 'referral_code', 'TEXT');
  PERFORM add_column_if_not_exists('profiles', 'referred_by', 'UUID');

  -- Abonnement vendeur
  PERFORM add_column_if_not_exists('profiles', 'subscription_plan', 'TEXT', '''free''');
  PERFORM add_column_if_not_exists('profiles', 'subscription_expires_at', 'TIMESTAMP WITH TIME ZONE');

  -- Timestamps
  PERFORM add_column_if_not_exists('profiles', 'created_at', 'TIMESTAMP WITH TIME ZONE', 'NOW()');
  PERFORM add_column_if_not_exists('profiles', 'updated_at', 'TIMESTAMP WITH TIME ZONE', 'NOW()');

  RAISE NOTICE 'Toutes les colonnes de profiles ont ete verifiees/ajoutees';
END $$;

-- Ajouter les contraintes manquantes
DO $$
BEGIN
  -- Contrainte UNIQUE sur username si pas deja presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key' AND conrelid = 'profiles'::regclass
  ) THEN
    BEGIN
      ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Contrainte username deja existante ou erreur: %', SQLERRM;
    END;
  END IF;

  -- Contrainte UNIQUE sur referral_code si pas deja presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_referral_code_key' AND conrelid = 'profiles'::regclass
  ) THEN
    BEGIN
      ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Contrainte referral_code deja existante ou erreur: %', SQLERRM;
    END;
  END IF;

  -- Foreign key sur referred_by si pas deja presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_referred_by_fkey' AND conrelid = 'profiles'::regclass
  ) THEN
    BEGIN
      ALTER TABLE profiles ADD CONSTRAINT profiles_referred_by_fkey
        FOREIGN KEY (referred_by) REFERENCES profiles(id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Contrainte referred_by deja existante ou erreur: %', SQLERRM;
    END;
  END IF;
END $$;

-- Activer RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- =============================================
-- 0.2 DIAGNOSTIC ET SUPPRESSION DE TOUS LES TRIGGERS
-- =============================================
-- IMPORTANT: On supprime TOUS les triggers pour eviter l'erreur
-- Le profil sera cree manuellement par l'application

-- Supprimer TOUTES les fonctions qui pourraient avoir des triggers (CASCADE supprime les triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_new() CASCADE;
DROP FUNCTION IF EXISTS public.insert_profile() CASCADE;

-- Supprimer TOUS les triggers sur auth.users par nom
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_create_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS insert_profile_trigger ON auth.users;

-- Supprimer TOUS les triggers dynamiquement via pg_trigger
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT tgname as trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND NOT tgisinternal
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.trigger_name);
      RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop trigger %: %', trigger_rec.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Supprimer TOUTES les fonctions du schema public qui reference profiles
DO $$
DECLARE
  func_rec RECORD;
BEGIN
  FOR func_rec IN
    SELECT p.proname as func_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosrc LIKE '%profiles%'
    AND p.prosrc LIKE '%INSERT%'
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS public.%I() CASCADE', func_rec.func_name);
      RAISE NOTICE 'Dropped function: %', func_rec.func_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop function %: %', func_rec.func_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- =============================================
-- 0.2 CORRECTIONS DES TABLES EXISTANTES
-- =============================================

-- Ajouter colonnes manquantes a orders
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'seller_id') THEN
            ALTER TABLE orders ADD COLUMN seller_id UUID REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
            ALTER TABLE orders ADD COLUMN shipping_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_city') THEN
            ALTER TABLE orders ADD COLUMN shipping_city TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_phone') THEN
            ALTER TABLE orders ADD COLUMN shipping_phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
            ALTER TABLE orders ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
            ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
            ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
            ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') THEN
            ALTER TABLE orders ADD COLUMN notes TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
            ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
            ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        -- Nouvelles colonnes pour le système de panier amélioré
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_name') THEN
            ALTER TABLE orders ADD COLUMN shipping_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_postal_code') THEN
            ALTER TABLE orders ADD COLUMN shipping_postal_code TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_country') THEN
            ALTER TABLE orders ADD COLUMN shipping_country TEXT DEFAULT 'Senegal';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_notes') THEN
            ALTER TABLE orders ADD COLUMN order_notes TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_number') THEN
            ALTER TABLE orders ADD COLUMN tracking_number TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
            ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'points_used') THEN
            ALTER TABLE orders ADD COLUMN points_used INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
            ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
            ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
            ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Ajouter colonnes manquantes a order_items
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'seller_id') THEN
            ALTER TABLE order_items ADD COLUMN seller_id UUID REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
            ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
            ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'created_at') THEN
            ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        -- Permettre NULL dans unit_price si elle existe
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'unit_price') THEN
            ALTER TABLE order_items ALTER COLUMN unit_price DROP NOT NULL;
        END IF;
        -- Nouvelles colonnes pour le système de panier amélioré
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_title') THEN
            ALTER TABLE order_items ADD COLUMN product_title TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_image_url') THEN
            ALTER TABLE order_items ADD COLUMN product_image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'total_price') THEN
            ALTER TABLE order_items ADD COLUMN total_price DECIMAL(10,2);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'seller_commission') THEN
            ALTER TABLE order_items ADD COLUMN seller_commission DECIMAL(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'platform_fee') THEN
            ALTER TABLE order_items ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Ajouter seller_id a flash_deals si manquant
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flash_deals') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'flash_deals' AND column_name = 'seller_id') THEN
            ALTER TABLE flash_deals ADD COLUMN seller_id UUID REFERENCES auth.users(id);
        END IF;
    END IF;
END $$;

-- Ajouter colonnes manquantes a conversations
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'buyer_id') THEN
            ALTER TABLE conversations ADD COLUMN buyer_id UUID REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'seller_id') THEN
            ALTER TABLE conversations ADD COLUMN seller_id UUID REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'buyer_unread_count') THEN
            ALTER TABLE conversations ADD COLUMN buyer_unread_count INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'seller_unread_count') THEN
            ALTER TABLE conversations ADD COLUMN seller_unread_count INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'last_message') THEN
            ALTER TABLE conversations ADD COLUMN last_message TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'last_message_time') THEN
            ALTER TABLE conversations ADD COLUMN last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'last_message_preview') THEN
            ALTER TABLE conversations ADD COLUMN last_message_preview TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'last_message_at') THEN
            ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'product_id') THEN
            ALTER TABLE conversations ADD COLUMN product_id UUID REFERENCES products(id);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'status') THEN
            ALTER TABLE conversations ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
            ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'created_at') THEN
            ALTER TABLE conversations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Permettre NULL dans content pour les messages vocaux/images
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Ajouter colonnes manquantes a loyalty_points
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_points') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'available_points') THEN
            ALTER TABLE loyalty_points ADD COLUMN available_points INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'lifetime_points') THEN
            ALTER TABLE loyalty_points ADD COLUMN lifetime_points INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'total_points') THEN
            ALTER TABLE loyalty_points ADD COLUMN total_points INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'spent_points') THEN
            ALTER TABLE loyalty_points ADD COLUMN spent_points INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Ajouter colonnes manquantes a profiles
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
            ALTER TABLE profiles ADD COLUMN country TEXT DEFAULT 'Senegal';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shop_banner_url') THEN
            ALTER TABLE profiles ADD COLUMN shop_banner_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shop_logo_url') THEN
            ALTER TABLE profiles ADD COLUMN shop_logo_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shop_category') THEN
            ALTER TABLE profiles ADD COLUMN shop_category TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_hours') THEN
            ALTER TABLE profiles ADD COLUMN business_hours TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'return_policy') THEN
            ALTER TABLE profiles ADD COLUMN return_policy TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shipping_info') THEN
            ALTER TABLE profiles ADD COLUMN shipping_info TEXT;
        END IF;
    END IF;
END $$;

-- Ajouter currency a products si manquant
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'currency') THEN
            ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'XOF';
        END IF;
    END IF;
END $$;

-- Ajouter colonnes manquantes a messages
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
            ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content') THEN
            ALTER TABLE messages ADD COLUMN content TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_url') THEN
            ALTER TABLE messages ADD COLUMN media_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'image_url') THEN
            ALTER TABLE messages ADD COLUMN image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'voice_url') THEN
            ALTER TABLE messages ADD COLUMN voice_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'product_id') THEN
            ALTER TABLE messages ADD COLUMN product_id UUID REFERENCES products(id);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'offer_amount') THEN
            ALTER TABLE messages ADD COLUMN offer_amount DECIMAL(10,2);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'offer_status') THEN
            ALTER TABLE messages ADD COLUMN offer_status TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read') THEN
            ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'voice_duration') THEN
            ALTER TABLE messages ADD COLUMN voice_duration INTEGER;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'read_at') THEN
            ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'offer_price') THEN
            ALTER TABLE messages ADD COLUMN offer_price DECIMAL(10,2);
        END IF;
    END IF;
END $$;

-- =============================================
-- 1. TABLES PRINCIPALES
-- =============================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    city TEXT,
    country TEXT DEFAULT 'Senegal',
    address TEXT,
    is_seller BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    shop_name TEXT,
    shop_description TEXT,
    shop_logo_url TEXT,
    shop_banner_url TEXT,
    shop_category TEXT,
    business_hours TEXT,
    return_policy TEXT,
    shipping_info TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(id),
    subscription_plan TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    emoji TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency TEXT DEFAULT 'XOF',
    image_url TEXT,
    images TEXT[],
    stock INTEGER DEFAULT 0,
    condition TEXT DEFAULT 'new',
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_flash_deal BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des favoris
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Table des followers
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Table du panier
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_phone TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    seller_id UUID REFERENCES auth.users(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. SYSTEME DE CHAT
-- =============================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    buyer_unread_count INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    product_id UUID REFERENCES products(id),
    offer_amount DECIMAL(10,2),
    offer_status TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs bloques
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- =============================================
-- 3. SYSTEME D'AVIS
-- =============================================

-- Table des avis produits
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Table des avis vendeurs
CREATE TABLE IF NOT EXISTS seller_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seller_id, user_id, order_id)
);

-- =============================================
-- 4. SYSTEME DE POINTS ET RECOMPENSES
-- =============================================

-- Table des points de fidelite
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    spent_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des transactions de points
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des recompenses
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_value DECIMAL(10,2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des recompenses reclamees
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

-- =============================================
-- 5. FLASH DEALS ET PROMOTIONS
-- =============================================

-- Table des flash deals
CREATE TABLE IF NOT EXISTS flash_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id),
    discount_percentage INTEGER NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    deal_price DECIMAL(10,2) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    stock_limit INTEGER,
    sold_count INTEGER DEFAULT 0,
    deal_type TEXT DEFAULT 'flash',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. NOTIFICATIONS
-- =============================================

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT DEFAULT 'general',
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. ABONNEMENTS VENDEURS
-- =============================================

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_products INTEGER,
    commission_rate DECIMAL(5,2),
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active',
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table historique des abonnements (pour suivi des paiements)
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    action TEXT NOT NULL, -- 'upgrade', 'downgrade', 'renewal', 'cancel'
    amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'XOF',
    payment_method TEXT, -- 'orange_money', 'wave', 'free_money', 'card', 'bank'
    billing_period TEXT, -- 'monthly', 'yearly'
    expires_at TIMESTAMP WITH TIME ZONE,
    transaction_id TEXT,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. INDEX POUR PERFORMANCES (avec verification)
-- =============================================

DO $$
BEGIN
  -- Index products
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'seller_id') THEN
    CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
  END IF;

  -- Index favorites
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'product_id') THEN
    CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);
  END IF;

  -- Index cart_items
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'product_id') THEN
    CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_cart_created ON cart_items(created_at DESC);
  END IF;

  -- Index orders
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'seller_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
  END IF;

  -- Index order_items
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  END IF;

  -- Index conversations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'buyer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'seller_id') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
  END IF;

  -- Index messages
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
  END IF;

  -- Index product_reviews
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'product_id') THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
  END IF;

  -- Index notifications
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  END IF;

  -- Index followers
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followers' AND column_name = 'follower_id') THEN
    CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followers' AND column_name = 'following_id') THEN
    CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
  END IF;

  -- Index subscription_history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_history' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_history' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON subscription_history(created_at DESC);
  END IF;
END $$;

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables (avec verification d'existence)
DO $$
DECLARE
  tables_to_enable TEXT[] := ARRAY[
    'profiles', 'products', 'categories', 'favorites', 'followers',
    'cart_items', 'orders', 'order_items', 'conversations', 'messages',
    'blocked_users', 'product_reviews', 'seller_reviews', 'loyalty_points',
    'points_transactions', 'rewards', 'claimed_rewards', 'referrals',
    'flash_deals', 'notifications', 'subscription_plans', 'subscriptions',
    'subscription_history'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_enable
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- =============================================
-- POLICIES RLS (avec verification d'existence des tables ET colonnes)
-- =============================================

-- Fonction utilitaire pour verifier si une colonne existe
CREATE OR REPLACE FUNCTION column_exists(p_table TEXT, p_column TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column
  );
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  -- Policies pour profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  -- Policies pour products
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
    CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Sellers can insert products" ON products;
    CREATE POLICY "Sellers can insert products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
    DROP POLICY IF EXISTS "Sellers can update own products" ON products;
    CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);
    DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
    CREATE POLICY "Sellers can delete own products" ON products FOR DELETE USING (auth.uid() = seller_id);
  END IF;

  -- Policies pour categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
    CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
  END IF;

  -- Policies pour favorites
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites')
     AND column_exists('favorites', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
    CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
    CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
    CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Policies pour followers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'followers') THEN
    DROP POLICY IF EXISTS "Anyone can view followers" ON followers;
    CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users can follow" ON followers;
    CREATE POLICY "Users can follow" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
    DROP POLICY IF EXISTS "Users can unfollow" ON followers;
    CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);
  END IF;

  -- Policies pour cart_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart_items')
     AND column_exists('cart_items', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
    CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can add to cart" ON cart_items;
    CREATE POLICY "Users can add to cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update cart" ON cart_items;
    CREATE POLICY "Users can update cart" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can remove from cart" ON cart_items;
    CREATE POLICY "Users can remove from cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Policies pour orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
     AND column_exists('orders', 'user_id') THEN
    DROP POLICY IF EXISTS "orders_select" ON orders;
    DROP POLICY IF EXISTS "orders_insert" ON orders;
    DROP POLICY IF EXISTS "orders_update" ON orders;
    CREATE POLICY "orders_select" ON orders FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Policies pour order_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    DROP POLICY IF EXISTS "order_items_select" ON order_items;
    DROP POLICY IF EXISTS "order_items_insert" ON order_items;
    DROP POLICY IF EXISTS "order_items_buyer_select" ON order_items;
    CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (auth.uid() = seller_id);
    CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);
    CREATE POLICY "order_items_buyer_select" ON order_items FOR SELECT USING (
      order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    );
  END IF;

  -- Policies pour conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
    CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
    DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
    CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
    DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
    CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;

  -- Policies pour messages
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
    CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
      EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid()))
    );
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
    DROP POLICY IF EXISTS "Users can update own messages" ON messages;
    CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
  END IF;

  -- Policies pour blocked_users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocked_users') THEN
    DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
    CREATE POLICY "Users can view own blocks" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
    DROP POLICY IF EXISTS "Users can block" ON blocked_users;
    CREATE POLICY "Users can block" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
    DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;
    CREATE POLICY "Users can unblock" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);
  END IF;

  -- Policies pour product_reviews
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_reviews')
     AND column_exists('product_reviews', 'user_id') THEN
    DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON product_reviews;
    CREATE POLICY "Reviews are viewable by everyone" ON product_reviews FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
    CREATE POLICY "Users can create reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
    CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Policies pour seller_reviews
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_reviews')
     AND column_exists('seller_reviews', 'user_id') THEN
    DROP POLICY IF EXISTS "Seller reviews are viewable by everyone" ON seller_reviews;
    CREATE POLICY "Seller reviews are viewable by everyone" ON seller_reviews FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Users can create seller reviews" ON seller_reviews;
    CREATE POLICY "Users can create seller reviews" ON seller_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies pour loyalty_points
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loyalty_points')
     AND column_exists('loyalty_points', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
    CREATE POLICY "Users can view own points" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
    CREATE POLICY "Users can update own points" ON loyalty_points FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "System can insert points" ON loyalty_points;
    CREATE POLICY "System can insert points" ON loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies pour points_transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_transactions')
     AND column_exists('points_transactions', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
    CREATE POLICY "Users can view own transactions" ON points_transactions FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "System can insert transactions" ON points_transactions;
    CREATE POLICY "System can insert transactions" ON points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies pour rewards
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards') THEN
    DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON rewards;
    CREATE POLICY "Rewards are viewable by everyone" ON rewards FOR SELECT USING (true);
  END IF;

  -- Policies pour claimed_rewards
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claimed_rewards')
     AND column_exists('claimed_rewards', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own claimed rewards" ON claimed_rewards;
    CREATE POLICY "Users can view own claimed rewards" ON claimed_rewards FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can claim rewards" ON claimed_rewards;
    CREATE POLICY "Users can claim rewards" ON claimed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies pour referrals
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
    DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
    CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;

  -- Policies pour flash_deals
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flash_deals') THEN
    DROP POLICY IF EXISTS "Flash deals are viewable by everyone" ON flash_deals;
    CREATE POLICY "Flash deals are viewable by everyone" ON flash_deals FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Sellers can create flash deals" ON flash_deals;
    CREATE POLICY "Sellers can create flash deals" ON flash_deals FOR INSERT WITH CHECK (auth.uid() = seller_id);
    DROP POLICY IF EXISTS "Sellers can update own flash deals" ON flash_deals;
    CREATE POLICY "Sellers can update own flash deals" ON flash_deals FOR UPDATE USING (auth.uid() = seller_id);
  END IF;

  -- Policies pour notifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
     AND column_exists('notifications', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
    CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;

  -- Policies pour subscription_plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
    DROP POLICY IF EXISTS "Plans are viewable by everyone" ON subscription_plans;
    CREATE POLICY "Plans are viewable by everyone" ON subscription_plans FOR SELECT USING (true);
  END IF;

  -- Policies pour subscriptions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions')
     AND column_exists('subscriptions', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
    CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can create subscriptions" ON subscriptions;
    CREATE POLICY "Users can create subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies pour subscription_history
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_history')
     AND column_exists('subscription_history', 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
    CREATE POLICY "Users can view own subscription history" ON subscription_history FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can create subscription history" ON subscription_history;
    CREATE POLICY "Users can create subscription history" ON subscription_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 10. FONCTIONS ET TRIGGERS
-- =============================================

-- Fonction pour mettre a jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour creer un profil automatiquement avec gestion du parrainage
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_referral_code TEXT;
    v_used_referral_code TEXT;
BEGIN
    -- Générer un code de parrainage unique
    v_referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8));

    -- Vérifier si un code de parrainage a été utilisé lors de l'inscription
    v_used_referral_code := NEW.raw_user_meta_data->>'referral_code';

    IF v_used_referral_code IS NOT NULL AND v_used_referral_code != '' THEN
        -- Trouver le parrain
        SELECT id INTO v_referrer_id
        FROM profiles
        WHERE referral_code = UPPER(v_used_referral_code);
    END IF;

    -- Créer le profil
    INSERT INTO profiles (id, email, full_name, avatar_url, referral_code, referred_by)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        v_referral_code,
        v_referrer_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
        referred_by = COALESCE(profiles.referred_by, EXCLUDED.referred_by);

    -- Si un parrain a été trouvé, créer l'enregistrement de parrainage
    IF v_referrer_id IS NOT NULL THEN
        INSERT INTO referrals (referrer_id, referred_id, status, reward_given)
        VALUES (v_referrer_id, NEW.id, 'pending', FALSE)
        ON CONFLICT (referred_id) DO NOTHING;

        -- Donner des points de bienvenue au nouveau membre (bonus parrainage)
        INSERT INTO points_transactions (user_id, points, type, description)
        VALUES (
            NEW.id,
            100, -- 100 points de bienvenue pour le filleul
            'referral_bonus',
            'Bonus de bienvenue - inscription via parrainage'
        );

        -- Donner des points au parrain
        INSERT INTO points_transactions (user_id, points, type, description, reference_id)
        VALUES (
            v_referrer_id,
            200, -- 200 points pour le parrain
            'referral',
            'Bonus de parrainage - nouveau filleul inscrit',
            NEW.id
        );

        -- Mettre à jour les points du parrain
        UPDATE loyalty_points
        SET
            available_points = available_points + 200,
            lifetime_points = lifetime_points + 200,
            total_points = total_points + 200,
            updated_at = NOW()
        WHERE user_id = v_referrer_id;

        -- Marquer le parrainage comme récompensé
        UPDATE referrals
        SET status = 'completed', reward_given = TRUE
        WHERE referrer_id = v_referrer_id AND referred_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour creer les points de fidelite
CREATE OR REPLACE FUNCTION create_user_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO loyalty_points (user_id, total_points, available_points, spent_points, lifetime_points)
    VALUES (NEW.id, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_loyalty_points ON profiles;
CREATE TRIGGER trigger_create_loyalty_points AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION create_user_loyalty_points();

-- Fonction pour mettre a jour la conversation apres un message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        last_message = LEFT(COALESCE(NEW.content, ''), 100),
        last_message_time = NEW.created_at,
        last_message_preview = CASE
            WHEN NEW.message_type = 'text' THEN LEFT(NEW.content, 100)
            WHEN NEW.message_type = 'image' THEN 'Image'
            WHEN NEW.message_type = 'voice' THEN 'Message vocal'
            WHEN NEW.message_type = 'product' THEN 'Produit'
            ELSE NEW.content
        END,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation ON messages;
CREATE TRIGGER trigger_update_conversation AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Fonction pour mettre a jour les stats produit apres un avis
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET
        average_rating = (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = NEW.product_id),
        total_reviews = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating AFTER INSERT OR UPDATE OR DELETE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Fonction pour mettre a jour les stats vendeur
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET
        average_rating = (SELECT COALESCE(AVG(rating), 0) FROM seller_reviews WHERE seller_id = NEW.seller_id),
        total_reviews = (SELECT COUNT(*) FROM seller_reviews WHERE seller_id = NEW.seller_id)
    WHERE id = NEW.seller_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_seller_rating ON seller_reviews;
CREATE TRIGGER trigger_update_seller_rating AFTER INSERT OR UPDATE OR DELETE ON seller_reviews FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

-- Fonction pour mettre a jour les compteurs de followers
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
CREATE TRIGGER trigger_update_follower_counts AFTER INSERT OR DELETE ON followers FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- =============================================
-- 11. FONCTION SEND_MESSAGE
-- =============================================

-- Supprimer toutes les versions existantes de send_message
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS send_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, UUID, DECIMAL);

-- Fonction pour envoyer un message
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_image_url TEXT DEFAULT NULL,
    p_voice_url TEXT DEFAULT NULL,
    p_voice_duration INTEGER DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_offer_price DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_conversation RECORD;
BEGIN
    -- Get conversation details
    SELECT * INTO v_conversation FROM conversations WHERE id = p_conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conversation not found';
    END IF;

    -- Insert message
    INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        image_url,
        voice_url,
        voice_duration,
        product_id,
        offer_price,
        is_read,
        created_at
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_content,
        p_message_type,
        p_image_url,
        p_voice_url,
        p_voice_duration,
        p_product_id,
        p_offer_price,
        FALSE,
        NOW()
    ) RETURNING id INTO v_message_id;

    -- Update conversation
    UPDATE conversations SET
        last_message = LEFT(COALESCE(p_content, ''), 100),
        last_message_time = NOW(),
        last_message_preview = CASE
            WHEN p_message_type = 'text' THEN LEFT(p_content, 100)
            WHEN p_message_type = 'image' THEN 'Image'
            WHEN p_message_type = 'voice' THEN 'Message vocal'
            WHEN p_message_type = 'product' THEN 'Produit'
            ELSE p_content
        END,
        last_message_at = NOW(),
        updated_at = NOW(),
        -- Update unread count for the other user
        buyer_unread_count = CASE
            WHEN p_sender_id = v_conversation.seller_id THEN COALESCE(buyer_unread_count, 0) + 1
            ELSE buyer_unread_count
        END,
        seller_unread_count = CASE
            WHEN p_sender_id = v_conversation.buyer_id THEN COALESCE(seller_unread_count, 0) + 1
            ELSE seller_unread_count
        END
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 12. FONCTION CREATE_ORDER_FROM_CART
-- =============================================

-- Supprimer l'ancienne version si elle existe
DROP FUNCTION IF EXISTS create_order_from_cart(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Fonction pour créer une commande à partir du panier
CREATE OR REPLACE FUNCTION create_order_from_cart(
    p_user_id UUID,
    p_shipping_name TEXT,
    p_shipping_address TEXT,
    p_shipping_city TEXT,
    p_shipping_postal_code TEXT DEFAULT NULL,
    p_shipping_country TEXT DEFAULT 'Senegal',
    p_shipping_phone TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cash',
    p_order_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_subtotal DECIMAL(10,2) := 0;
    v_shipping_cost DECIMAL(10,2) := 0;
    v_tax_amount DECIMAL(10,2) := 0;
    v_total DECIMAL(10,2) := 0;
    v_cart_item RECORD;
    v_item_total DECIMAL(10,2);
BEGIN
    -- Vérifier qu'il y a des articles dans le panier
    IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Le panier est vide';
    END IF;

    -- Calculer le sous-total
    SELECT COALESCE(SUM(ci.quantity * p.price), 0)
    INTO v_subtotal
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = p_user_id;

    -- Calculer les frais de livraison (gratuit au-dessus de 25000 XOF)
    IF v_subtotal < 25000 THEN
        v_shipping_cost := 2500; -- 2500 XOF pour les commandes < 25000 XOF
    END IF;

    -- Calculer la taxe (10%)
    v_tax_amount := v_subtotal * 0.10;

    -- Calculer le total
    v_total := v_subtotal + v_shipping_cost + v_tax_amount;

    -- Créer la commande
    INSERT INTO orders (
        user_id,
        subtotal,
        shipping_cost,
        tax_amount,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        shipping_phone,
        payment_method,
        payment_status,
        status,
        order_notes,
        notes,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_subtotal,
        v_shipping_cost,
        v_tax_amount,
        v_total,
        p_shipping_name,
        p_shipping_address,
        p_shipping_city,
        p_shipping_postal_code,
        p_shipping_country,
        p_shipping_phone,
        p_payment_method,
        'pending',
        'pending',
        p_order_notes,
        p_order_notes,
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;

    -- Ajouter les articles de la commande
    FOR v_cart_item IN
        SELECT ci.*, p.price, p.seller_id, p.title, p.image_url
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = p_user_id
    LOOP
        v_item_total := v_cart_item.quantity * v_cart_item.price;

        INSERT INTO order_items (
            order_id,
            product_id,
            seller_id,
            quantity,
            price,
            unit_price,
            total_price,
            product_title,
            product_image_url,
            created_at
        ) VALUES (
            v_order_id,
            v_cart_item.product_id,
            v_cart_item.seller_id,
            v_cart_item.quantity,
            v_cart_item.price,
            v_cart_item.price,
            v_item_total,
            v_cart_item.title,
            v_cart_item.image_url,
            NOW()
        );

        -- Réduire le stock du produit
        UPDATE products
        SET stock = GREATEST(0, stock - v_cart_item.quantity)
        WHERE id = v_cart_item.product_id;
    END LOOP;

    -- Vider le panier
    DELETE FROM cart_items WHERE user_id = p_user_id;

    -- Ajouter des points de fidélité (1 point pour 1000 XOF dépensé)
    INSERT INTO points_transactions (user_id, points, type, description, reference_id)
    VALUES (
        p_user_id,
        FLOOR(v_total / 1000)::INTEGER,
        'purchase',
        'Points gagnés pour la commande',
        v_order_id
    );

    -- Mettre à jour les points disponibles
    UPDATE loyalty_points
    SET
        available_points = available_points + FLOOR(v_total / 1000)::INTEGER,
        lifetime_points = lifetime_points + FLOOR(v_total / 1000)::INTEGER,
        total_points = total_points + FLOOR(v_total / 1000)::INTEGER,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 12.1 FONCTIONS UTILITAIRES POUR LE PANIER
-- =============================================

-- Fonction pour calculer le total du panier
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS TABLE (
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total DECIMAL(10,2),
    item_count INTEGER
) AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_shipping DECIMAL(10,2);
    v_tax DECIMAL(10,2);
    v_count INTEGER;
BEGIN
    -- Calculer le sous-total et le nombre d'articles
    SELECT
        COALESCE(SUM(ci.quantity * p.price), 0),
        COALESCE(SUM(ci.quantity), 0)
    INTO v_subtotal, v_count
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = p_user_id;

    -- Calculer les frais de livraison
    IF v_subtotal < 25000 AND v_subtotal > 0 THEN
        v_shipping := 2500;
    ELSE
        v_shipping := 0;
    END IF;

    -- Calculer la taxe (10%)
    v_tax := v_subtotal * 0.10;

    RETURN QUERY SELECT
        v_subtotal,
        v_shipping,
        v_tax,
        v_subtotal + v_shipping + v_tax,
        v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vider le panier
CREATE OR REPLACE FUNCTION clear_cart(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM cart_items WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 13. REALTIME POUR LE CHAT
-- =============================================

-- Activer le temps reel pour les messages et conversations
DO $$
BEGIN
    -- Ajouter messages au realtime si pas deja fait
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;

    -- Ajouter conversations au realtime si pas deja fait
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorer les erreurs si deja ajoute
        NULL;
END $$;

-- =============================================
-- FIN DE LA CONFIGURATION
-- =============================================
