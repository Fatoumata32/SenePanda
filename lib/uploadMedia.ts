import { supabase } from './supabase';

export type UploadMediaResult = {
  url: string;
  error?: string;
};

/**
 * Convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadChatImage(
  userId: string,
  imageUri: string
): Promise<UploadMediaResult> {
  try {
    // Fetch the image as base64
    const response = await fetch(imageUri);
    const blob = await response.arrayBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error: any) {
    console.error('Upload image error:', error);
    return { url: '', error: error.message || 'Erreur lors de l\'upload' };
  }
}

/**
 * Upload a voice message to Supabase Storage
 */
export async function uploadVoiceMessage(
  userId: string,
  audioUri: string
): Promise<UploadMediaResult> {
  try {
    // Fetch the audio file as ArrayBuffer
    const response = await fetch(audioUri);
    const arrayBuffer = await response.arrayBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.m4a`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-voice')
      .upload(fileName, arrayBuffer, {
        contentType: 'audio/m4a',
        upsert: false,
      });

    if (error) {
      console.error('Upload voice error:', error);
      return { url: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-voice')
      .getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error: any) {
    console.error('Upload voice error:', error);
    return { url: '', error: error.message || 'Erreur lors de l\'upload du message vocal' };
  }
}

/**
 * Delete a media file from storage
 */
export async function deleteMedia(bucket: 'chat-images' | 'chat-voice', filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete media error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete media error:', error);
    return false;
  }
}
