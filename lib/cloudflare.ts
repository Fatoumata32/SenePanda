/**
 * Cloudflare R2 & Images Service
 * Gestion du stockage et optimisation des médias
 */

import { supabase } from './supabase';

const R2_PUBLIC_URL = process.env.EXPO_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
const IMAGES_ACCOUNT_ID = process.env.EXPO_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_ID;
const IMAGES_HASH = process.env.EXPO_PUBLIC_CLOUDFLARE_IMAGES_HASH;

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

// Variantes d'images prédéfinies
export const imageVariants: Record<string, ImageVariant> = {
  thumbnail: { name: 'thumbnail', width: 150, height: 150, fit: 'cover' },
  small: { name: 'small', width: 300, fit: 'scale-down' },
  medium: { name: 'medium', width: 600, fit: 'scale-down' },
  large: { name: 'large', width: 1200, fit: 'scale-down' },
  product: { name: 'product', width: 800, height: 800, fit: 'contain' },
  avatar: { name: 'avatar', width: 200, height: 200, fit: 'cover' },
  banner: { name: 'banner', width: 1920, height: 600, fit: 'cover' },
  chat: { name: 'chat', width: 400, fit: 'scale-down' },
};

/**
 * Upload un fichier vers Cloudflare R2 via Edge Function Supabase
 */
export async function uploadToR2(
  file: Blob | ArrayBuffer,
  path: string,
  contentType: string
): Promise<UploadResult> {
  try {
    // Obtenir le token d'authentification
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Non authentifié' };
    }

    // Convertir en base64 si c'est un ArrayBuffer
    let base64Data: string;
    if (file instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(file);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      base64Data = btoa(binary);
    } else {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      base64Data = btoa(binary);
    }

    // Appeler l'Edge Function pour l'upload
    const { data, error } = await supabase.functions.invoke('upload-to-r2', {
      body: {
        file: base64Data,
        path,
        contentType,
      },
    });

    if (error) {
      console.error('Upload R2 error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      url: `${R2_PUBLIC_URL}/${path}`,
      key: path,
    };
  } catch (error) {
    console.error('Upload R2 error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Upload une image de produit vers R2
 */
export async function uploadProductImage(
  userId: string,
  imageUri: string,
  productId?: string
): Promise<UploadResult> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const path = `products/${userId}/${productId || 'new'}/${timestamp}-${randomStr}.jpg`;

    return await uploadToR2(blob, path, 'image/jpeg');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Upload un avatar vers R2
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<UploadResult> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const path = `avatars/${userId}/${timestamp}.jpg`;

    return await uploadToR2(blob, path, 'image/jpeg');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Upload une image de boutique vers R2
 */
export async function uploadShopImage(
  userId: string,
  imageUri: string,
  type: 'logo' | 'banner'
): Promise<UploadResult> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const path = `shops/${userId}/${type}-${timestamp}.jpg`;

    return await uploadToR2(blob, path, 'image/jpeg');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Upload une image de chat vers R2
 */
export async function uploadChatImageToR2(
  userId: string,
  imageUri: string
): Promise<UploadResult> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const path = `chat/${userId}/${timestamp}.jpg`;

    return await uploadToR2(blob, path, 'image/jpeg');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Upload un message vocal vers R2
 */
export async function uploadVoiceToR2(
  userId: string,
  audioUri: string
): Promise<UploadResult> {
  try {
    const response = await fetch(audioUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const path = `voice/${userId}/${timestamp}.m4a`;

    return await uploadToR2(blob, path, 'audio/m4a');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}

/**
 * Supprimer un fichier de R2
 */
export async function deleteFromR2(path: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    const { error } = await supabase.functions.invoke('delete-from-r2', {
      body: { path },
    });

    return !error;
  } catch (error) {
    console.error('Delete R2 error:', error);
    return false;
  }
}

/**
 * Obtenir l'URL optimisée via Cloudflare Images
 * Si Cloudflare Images n'est pas configuré, retourne l'URL R2 directe
 */
export function getOptimizedImageUrl(
  imageKey: string,
  variant: keyof typeof imageVariants = 'medium'
): string {
  // Si l'URL est déjà complète, l'utiliser directement
  if (imageKey.startsWith('http')) {
    // Si c'est déjà une URL Cloudflare Images, la retourner
    if (imageKey.includes('imagedelivery.net')) {
      return imageKey;
    }
    // Sinon retourner l'URL telle quelle
    return imageKey;
  }

  // Si Cloudflare Images est configuré, utiliser l'optimisation
  if (IMAGES_ACCOUNT_ID && IMAGES_HASH) {
    return `https://imagedelivery.net/${IMAGES_ACCOUNT_ID}/${imageKey}/${variant}`;
  }

  // Sinon, retourner l'URL R2 directe
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${imageKey}`;
  }

  // Fallback
  return imageKey;
}

/**
 * Obtenir l'URL avec paramètres de transformation (pour R2 sans Images)
 */
export function getResizedImageUrl(
  imageUrl: string,
  width: number,
  height?: number,
  fit: string = 'cover'
): string {
  // Si Cloudflare Images est configuré
  if (IMAGES_ACCOUNT_ID && IMAGES_HASH) {
    const imageKey = imageUrl.split('/').pop();
    const params = [`width=${width}`];
    if (height) params.push(`height=${height}`);
    params.push(`fit=${fit}`);

    return `https://imagedelivery.net/${IMAGES_ACCOUNT_ID}/${imageKey}/${params.join(',')}`;
  }

  // Sinon retourner l'URL originale
  return imageUrl;
}

/**
 * Générer un chemin unique pour l'upload
 */
export function generateUploadPath(
  userId: string,
  type: 'products' | 'avatars' | 'shops' | 'chat' | 'voice' | 'misc',
  filename: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const extension = filename.split('.').pop() || 'jpg';
  return `${type}/${userId}/${timestamp}-${randomStr}.${extension}`;
}
