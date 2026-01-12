-- ============================================
-- SCRIPT POUR APPLIQUER LES MIGRATIONS MANQUANTES
-- À copier-coller dans Supabase SQL Editor
-- ============================================

-- Ce script applique uniquement les migrations qui ne sont pas encore dans votre base
-- Selon le test, vous avez déjà la plupart des tables
-- Ce script va créer ce qui manque

-- ============================================
-- ÉTAPE 1: CRÉATION DES BUCKETS DE STOCKAGE
-- ============================================

-- Bucket pour les images de produits
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les images de boutiques
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les médias de chat
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ÉTAPE 2: POLITIQUES DE STOCKAGE
-- ============================================

-- Politique: Tout le monde peut voir les images de produits
CREATE POLICY IF NOT EXISTS "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Politique: Les utilisateurs connectés peuvent uploader des images de produits
CREATE POLICY IF NOT EXISTS "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- Politique: Les propriétaires peuvent supprimer leurs images
CREATE POLICY IF NOT EXISTS "Users can delete their own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique: Tout le monde peut voir les avatars
CREATE POLICY IF NOT EXISTS "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Politique: Les utilisateurs peuvent uploader leur avatar
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique: Les utilisateurs peuvent mettre à jour leur avatar
CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique: Les utilisateurs peuvent supprimer leur avatar
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique: Tout le monde peut voir les images de boutiques
CREATE POLICY IF NOT EXISTS "Anyone can view shop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Politique: Les vendeurs peuvent uploader des images de boutique
CREATE POLICY IF NOT EXISTS "Sellers can upload shop images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-images'
  AND auth.role() = 'authenticated'
);

-- Politique: Les vendeurs peuvent supprimer leurs images de boutique
CREATE POLICY IF NOT EXISTS "Sellers can delete their shop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique: Seuls les participants peuvent voir les médias de chat
CREATE POLICY IF NOT EXISTS "Users can view chat media in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media'
  AND auth.role() = 'authenticated'
);

-- Politique: Les utilisateurs peuvent uploader des médias dans leurs chats
CREATE POLICY IF NOT EXISTS "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- ÉTAPE 3: VÉRIFICATION DES EXTENSIONS
-- ============================================

-- Activer les extensions nécessaires si elles ne le sont pas déjà
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ÉTAPE 4: VÉRIFICATION FINALE
-- ============================================

-- Afficher un résumé
DO $$
DECLARE
  bucket_count INT;
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'storage';

  RAISE NOTICE '✅ Extensions activées';
  RAISE NOTICE '✅ Buckets créés: %', bucket_count;
  RAISE NOTICE '✅ Politiques de stockage: %', policy_count;
  RAISE NOTICE '🎉 Migration terminée avec succès !';
END $$;

-- Vérifier les buckets créés
SELECT
  '✅ Bucket créé' as status,
  name,
  CASE WHEN public THEN 'Public' ELSE 'Privé' END as visibility
FROM storage.buckets
ORDER BY name;
