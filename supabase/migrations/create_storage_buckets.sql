/*
  # Configuration du stockage pour les images

  1. Buckets
    - `images` - Bucket pour toutes les images (produits, boutiques, profils)

  2. Politiques de sécurité
    - Lecture publique pour tous
    - Upload restreint aux utilisateurs authentifiés
    - Mise à jour/suppression selon le type de ressource

  3. Structure des dossiers:
    - images/products/{product_id}/{filename} - Images de produits
    - images/shops/{shop_id}/{filename} - Logos et bannières de boutiques
    - images/profiles/{user_id}/{filename} - Photos de profil
*/

-- Créer le bucket pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politique pour permettre à tous de lire les images (public)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader des images
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs images de profil
DROP POLICY IF EXISTS "Users can update their profile images" ON storage.objects;
CREATE POLICY "Users can update their profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre aux vendeurs de mettre à jour les images de leurs produits
DROP POLICY IF EXISTS "Sellers can update their product images" ON storage.objects;
CREATE POLICY "Sellers can update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
);

-- Politique pour permettre aux vendeurs de mettre à jour les images de leur boutique
DROP POLICY IF EXISTS "Sellers can update their shop images" ON storage.objects;
CREATE POLICY "Sellers can update their shop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
);

-- Politique pour permettre aux utilisateurs de supprimer leurs images de profil
DROP POLICY IF EXISTS "Users can delete their profile images" ON storage.objects;
CREATE POLICY "Users can delete their profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre aux vendeurs de supprimer les images de leurs produits
DROP POLICY IF EXISTS "Sellers can delete their product images" ON storage.objects;
CREATE POLICY "Sellers can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM products
    WHERE id = (storage.foldername(name))[2]
    AND seller_id = auth.uid()
  )
);

-- Politique pour permettre aux vendeurs de supprimer les images de leur boutique
DROP POLICY IF EXISTS "Sellers can delete their shop images" ON storage.objects;
CREATE POLICY "Sellers can delete their shop images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'shops'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_seller = true
  )
);
