-- Script pour créer un profil de test simple
-- Ce script crée un utilisateur de test avec un profil basique

-- IDENTIFIANTS DE TEST:
-- Email: test@marketplace.com
-- Mot de passe: TestMarket123!
--
-- Note: Vous devrez d'abord créer l'utilisateur dans Supabase Auth
-- via le dashboard ou l'API avant d'exécuter ce script

-- S'assurer que la colonne country existe avant les inserts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- ==========================================
-- PROFILS DE TEST (COMMENTÉS)
-- ==========================================
-- Ces INSERT sont des exemples. Pour les utiliser:
-- 1. Créez d'abord les utilisateurs dans Supabase Auth Dashboard
-- 2. Récupérez leurs UUIDs
-- 3. Remplacez 'USER_UUID_HERE' et 'SELLER_UUID_HERE' par les vrais UUIDs
-- 4. Décommentez les blocs ci-dessous
-- ==========================================

/*
-- Insertion d'un profil de test (client)
-- Remplacez 'USER_UUID_HERE' par l'UUID de l'utilisateur créé dans auth.users
INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_HERE', -- Remplacez par l'UUID réel de l'utilisateur
  'Utilisateur Test',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
  false,
  NULL,
  NULL,
  '+221 77 123 45 67',
  'Sénégal',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  phone = EXCLUDED.phone,
  country = EXCLUDED.country,
  updated_at = now();

-- Insertion d'un profil vendeur de test
-- Remplacez 'SELLER_UUID_HERE' par l'UUID d'un autre utilisateur
INSERT INTO profiles (
  id,
  full_name,
  avatar_url,
  is_seller,
  shop_name,
  shop_description,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  'SELLER_UUID_HERE', -- Remplacez par l'UUID réel du vendeur
  'Amadou Diallo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
  true,
  'Boutique Africaine',
  'Artisan spécialisé dans les produits traditionnels africains',
  '+225 05 12 34 56 78',
  'Côte d''Ivoire',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  is_seller = EXCLUDED.is_seller,
  shop_name = EXCLUDED.shop_name,
  shop_description = EXCLUDED.shop_description,
  phone = EXCLUDED.phone,
  country = EXCLUDED.country,
  updated_at = now();
*/