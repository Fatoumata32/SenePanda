/**
 * App-wide constants
 */

export const APP_NAME = 'SenePanda';
export const APP_VERSION = '1.0.0';
export const APP_BUNDLE_ID = 'com.senepanda.app';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.senepanda.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PRODUCTS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 50,
  REVIEWS_PER_PAGE: 10,
};

// Image Configuration
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 10,
  QUALITY: 0.8,
  THUMBNAIL_SIZE: 150,
  PRODUCT_IMAGE_SIZE: 800,
  AVATAR_SIZE: 200,
  BANNER_SIZE: 1200,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Points & Rewards
export const POINTS_CONFIG = {
  WELCOME_BONUS: 100,
  PURCHASE_RATE: 0.01, // 1 point per 100 FCFA
  REVIEW_BONUS: 10,
  REFERRAL_BONUS: 50,
  DAILY_LOGIN_BONUS: 5,
  STREAK_MULTIPLIER: 1.5,
  LEVEL_THRESHOLDS: {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
  },
};

// Subscription Features
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxProducts: 5,
    maxPhotosPerProduct: 3,
    commissionRate: 0.15,
  },
  starter: {
    maxProducts: 20,
    maxPhotosPerProduct: 5,
    commissionRate: 0.12,
  },
  pro: {
    maxProducts: 100,
    maxPhotosPerProduct: 10,
    commissionRate: 0.08,
  },
  premium: {
    maxProducts: -1, // unlimited
    maxPhotosPerProduct: 20,
    commissionRate: 0.05,
  },
};

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SPLASH_DURATION: 2000,
};

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 1000 * 60 * 5, // 5 minutes
  PRODUCTS_EXPIRY: 1000 * 60 * 10, // 10 minutes
  PROFILE_EXPIRY: 1000 * 60 * 30, // 30 minutes
  CATEGORIES_EXPIRY: 1000 * 60 * 60, // 1 hour
};

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_PRODUCT_TITLE_LENGTH: 5,
  MAX_PRODUCT_TITLE_LENGTH: 100,
  MAX_PRODUCT_DESCRIPTION_LENGTH: 5000,
  MIN_PRODUCT_PRICE: 100, // FCFA
  MAX_PRODUCT_PRICE: 100000000, // FCFA
  PHONE_REGEX: /^(\+221)?[0-9]{9}$/,
};

// Social Links
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/senepanda',
  instagram: 'https://instagram.com/senepanda',
  twitter: 'https://twitter.com/senepanda',
  website: 'https://senepanda.com',
};

// Support
export const SUPPORT = {
  email: 'support@senepanda.com',
  phone: '+221 77 000 00 00',
  whatsapp: '+221770000000',
};

// Currency
export const CURRENCY = {
  code: 'XOF',
  symbol: 'FCFA',
  name: 'Franc CFA',
  decimals: 0,
};

// Localization
export const LOCALE = {
  default: 'fr-FR',
  country: 'SN',
  timezone: 'Africa/Dakar',
};

export default {
  APP_NAME,
  APP_VERSION,
  API_CONFIG,
  PAGINATION,
  IMAGE_CONFIG,
  POINTS_CONFIG,
  SUBSCRIPTION_LIMITS,
  ANIMATION,
  CACHE_CONFIG,
  VALIDATION,
  SOCIAL_LINKS,
  SUPPORT,
  CURRENCY,
  LOCALE,
};
