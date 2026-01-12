import { Cloudinary } from '@cloudinary/url-gen';

const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('Cloudinary credentials are missing. Please check your .env.production file.');
}

// Initialize Cloudinary instance
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: cloudName,
  },
  url: {
    secure: true,
  },
});

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName,
  apiKey,
  apiSecret,
  uploadPreset: 'senepanda_unsigned', // You'll need to create this in Cloudinary dashboard
};

// Upload URLs
export const CLOUDINARY_URLS = {
  image: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  video: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
  raw: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
};

// Folder structure for different types of uploads
export const CLOUDINARY_FOLDERS = {
  products: 'senepanda/products',
  profiles: 'senepanda/profiles',
  shops: 'senepanda/shops',
  liveStreams: 'senepanda/live-streams',
  chat: 'senepanda/chat',
};

export default cloudinary;