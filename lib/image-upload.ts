/**
 * Helper pour l'upload d'images
 * Solution simple et fiable pour React Native/Expo Go
 */

import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Sélectionner une image depuis la galerie
 */
export async function pickImageFromGallery(aspect?: [number, number]): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission d\'accès à la galerie refusée');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: aspect || [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
}

/**
 * Prendre une photo avec la caméra
 */
export async function takePhoto(aspect?: [number, number]): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission d\'accès à la caméra refusée');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: aspect || [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
}

/**
 * Upload une image vers Supabase Storage
 * Utilise fetch().arrayBuffer() pour React Native/Expo
 */
export async function uploadImageToSupabase(
  uri: string,
  bucket: string,
  folder: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const finalFileName = fileName || `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${finalFileName}`;

    console.log('Reading file from:', uri);

    // Utiliser fetch pour récupérer le fichier en ArrayBuffer (compatible React Native)
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Le fichier est vide ou invalide');
    }

    console.log('File read successfully, size:', arrayBuffer.byteLength);
    console.log('Uploading to Supabase:', filePath);

    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'upload vers Supabase',
      };
    }

    console.log('Upload successful:', data);

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Upload une image de produit
 */
export async function uploadProductImage(
  uri: string,
  productId?: string,
  index: number = 0
): Promise<UploadResult> {
  const folder = productId ? `products/${productId}` : 'products';
  return uploadImageToSupabase(
    uri,
    'images',
    folder,
    `product-${Date.now()}-${index}.jpg`
  );
}

/**
 * Upload plusieurs images de produit
 */
export async function uploadProductImages(uris: string[], productId?: string): Promise<UploadResult[]> {
  const uploadPromises = uris.map((uri, index) =>
    uploadProductImage(uri, productId, index)
  );
  return Promise.all(uploadPromises);
}

/**
 * Upload un logo de boutique
 */
export async function uploadShopLogo(uri: string, shopId?: string): Promise<UploadResult> {
  const folder = shopId ? `shops/${shopId}` : 'shops';
  return uploadImageToSupabase(
    uri,
    'images',
    folder,
    `logo-${Date.now()}.jpg`
  );
}

/**
 * Upload une bannière de boutique
 */
export async function uploadShopBanner(uri: string, shopId?: string): Promise<UploadResult> {
  const folder = shopId ? `shops/${shopId}` : 'shops';
  return uploadImageToSupabase(
    uri,
    'images',
    folder,
    `banner-${Date.now()}.jpg`
  );
}

/**
 * Upload une photo de profil
 */
export async function uploadProfileAvatar(uri: string, userId: string): Promise<UploadResult> {
  return uploadImageToSupabase(
    uri,
    'images',
    `profiles/${userId}`,
    `avatar-${Date.now()}.jpg`
  );
}

/**
 * Supprimer une image de Supabase Storage
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<boolean> {
  try {
    // Extraire le chemin du fichier de l'URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('images');

    if (bucketIndex === -1) {
      throw new Error('Invalid image URL');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
