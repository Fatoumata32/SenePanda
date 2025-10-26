-- Script pour créer des profils de test avec utilisateurs
-- Ce script crée plusieurs utilisateurs de test pour la marketplace

-- Note: Ces profils seront créés une fois que les utilisateurs correspondants
-- existent dans auth.users. Vous devrez d'abord créer les utilisateurs via
-- le dashboard Supabase ou l'API d'authentification.

-- Pour créer les utilisateurs dans Supabase Dashboard:
-- 1. Allez dans Authentication > Users
-- 2. Cliquez sur "Add user"
-- 3. Entrez l'email et le mot de passe
-- 4. Copiez l'UUID généré
-- 5. Remplacez les UUIDs ci-dessous

-- ==========================================
-- PROFILS CLIENTS
-- ==========================================

-- Client 1: Marie Kouassi
-- Email: marie.kouassi@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'marie_kouassi',
  'Marie Kouassi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
  false,
  '+225 07 12 34 56 78',
  'Côte d''Ivoire',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Client 2: Jean Diop
-- Email: jean.diop@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'jean_diop',
  'Jean Diop',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=jean',
  false,
  '+221 77 234 56 78',
  'Sénégal',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Client 3: Fatima Touré
-- Email: fatima.toure@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
  full_name,
  avatar_url,
  is_seller,
  phone,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'fatima_toure',
  'Fatima Touré',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
  false,
  '+223 76 12 34 56',
  'Mali',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- PROFILS VENDEURS
-- ==========================================

-- Vendeur 1: Amadou Diallo - Artisan
-- Email: amadou.diallo@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
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
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'amadou_diallo',
  'Amadou Diallo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=amadou',
  true,
  'Artisanat Diallo',
  'Spécialiste de l''artisanat traditionnel africain. Sculptures sur bois, masques et objets décoratifs authentiques.',
  '+225 05 11 22 33 44',
  'Côte d''Ivoire',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 2: Aïcha Ndiaye - Mode
-- Email: aicha.ndiaye@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
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
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'aicha_ndiaye',
  'Aïcha Ndiaye',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=aicha',
  true,
  'Boutique Aïcha Mode',
  'Créations de mode africaine contemporaine. Robes, boubous et accessoires en wax et bazin.',
  '+221 77 55 66 77 88',
  'Sénégal',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 3: Kofi Mensah - Bijoux
-- Email: kofi.mensah@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
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
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'kofi_mensah',
  'Kofi Mensah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kofi',
  true,
  'Bijoux Kofi',
  'Bijoux artisanaux en or, argent et pierres précieuses. Chaque pièce raconte une histoire.',
  '+233 24 123 45 67',
  'Ghana',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 4: Mariam Traoré - Textile
-- Email: mariam.traore@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
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
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'mariam_traore',
  'Mariam Traoré',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=mariam',
  true,
  'Tissus Mariam',
  'Tissus traditionnels africains: bogolan, kente, pagne. Qualité exceptionnelle pour vos créations.',
  '+223 76 88 99 00',
  'Mali',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Vendeur 5: Youssef Ben Ali - Décoration
-- Email: youssef.benali@example.com | Password: Test123!
INSERT INTO profiles (
  id,
  username,
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
  gen_random_uuid(), -- Remplacez par l'UUID réel
  'youssef_benali',
  'Youssef Ben Ali',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef',
  true,
  'Déco Africaine',
  'Décoration d''intérieur inspirée de l''Afrique. Tapis berbères, poufs, coussins et luminaires.',
  '+212 6 12 34 56 78',
  'Maroc',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- INSTRUCTIONS
-- ==========================================
--
-- Pour utiliser ce script:
--
-- 1. Créez d'abord les utilisateurs dans Supabase Dashboard:
--    - Allez dans Authentication > Users
--    - Pour chaque profil ci-dessus, créez un utilisateur avec l'email et le mot de passe indiqués
--
-- 2. Récupérez les UUIDs générés pour chaque utilisateur
--
-- 3. Remplacez les gen_random_uuid() par les vrais UUIDs
--
-- 4. Exécutez ce script SQL dans le SQL Editor
--
-- OU utilisez le script automatique ci-dessous qui génère des UUIDs temporaires
-- (à des fins de démonstration uniquement)
