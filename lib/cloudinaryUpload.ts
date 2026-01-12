import { CLOUDINARY_CONFIG, CLOUDINARY_URLS, CLOUDINARY_FOLDERS } from './cloudinaryConfig';
import * as ImagePicker from 'expo-image-picker';

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  tags?: string[];
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw';
}

export interface UploadResult {
  success: boolean;
  url?: string;
  public_id?: string;
  secure_url?: string;
  error?: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  bytes?: number;
  duration?: number; // for videos
}

/**
 * Generate Cloudinary signature for secure uploads
 */
function generateSignature(params: Record<string, any>): string {
  // Note: For production, implement proper signature generation
  // This is a simplified version
  const crypto = require('crypto');
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = {
    ...params,
    timestamp,
  };

  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + CLOUDINARY_CONFIG.apiSecret)
    .digest('hex');

  return signature;
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  imageUri: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = CLOUDINARY_FOLDERS.products,
      transformation,
      tags = [],
      public_id,
    } = options;

    // Create form data
    const formData = new FormData();

    // Get file info
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append image file
    formData.append('file', {
      uri: imageUri,
      type,
      name: filename,
    } as any);

    // Add Cloudinary parameters
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);

    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    if (public_id) {
      formData.append('public_id', public_id);
    }

    if (transformation) {
      formData.append('transformation', transformation);
    }

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URLS.image, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return {
      success: true,
      url: data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      resource_type: data.resource_type,
      bytes: data.bytes,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload a video to Cloudinary
 */
export async function uploadVideo(
  videoUri: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = CLOUDINARY_FOLDERS.liveStreams,
      transformation,
      tags = [],
      public_id,
    } = options;

    // Create form data
    const formData = new FormData();

    // Get file info
    const filename = videoUri.split('/').pop() || 'video.mp4';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : 'video/mp4';

    // Append video file
    formData.append('file', {
      uri: videoUri,
      type,
      name: filename,
    } as any);

    // Add Cloudinary parameters
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    formData.append('resource_type', 'video');

    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    if (public_id) {
      formData.append('public_id', public_id);
    }

    if (transformation) {
      formData.append('transformation', transformation);
    }

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URLS.video, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return {
      success: true,
      url: data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      resource_type: data.resource_type,
      bytes: data.bytes,
      duration: data.duration,
    };
  } catch (error) {
    console.error('Video upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  imageUris: string[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = imageUris.map(uri => uploadImage(uri, options));
  return Promise.all(uploadPromises);
}

/**
 * Pick and upload an image
 */
export async function pickAndUploadImage(
  options: UploadOptions = {}
): Promise<UploadResult | null> {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access media library was denied',
      };
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    // Upload image
    return await uploadImage(result.assets[0].uri, options);
  } catch (error) {
    console.error('Pick and upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Pick and upload a video
 */
export async function pickAndUploadVideo(
  options: UploadOptions = {}
): Promise<UploadResult | null> {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access media library was denied',
      };
    }

    // Pick video
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    // Upload video
    return await uploadVideo(result.assets[0].uri, options);
  } catch (error) {
    console.error('Pick and upload video error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete an asset from Cloudinary
 */
export async function deleteAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = generateSignature({ public_id: publicId, timestamp });

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    formData.append('signature', signature);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/destroy`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.result !== 'ok') {
      throw new Error('Delete failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Delete asset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate a Cloudinary URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
    quality?: number | 'auto';
    format?: string;
    gravity?: string;
  } = {}
): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity,
  } = options;

  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (gravity) transformations.push(`g_${gravity}`);

  const transformationString = transformations.join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformationString}/${publicId}`;
}