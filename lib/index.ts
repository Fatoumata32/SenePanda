// Core
export { supabase } from './supabase';

// API Utilities
export {
  ApiError,
  withRetry,
  handleSupabaseError,
  fetchWithTimeout,
  safeJsonParse,
  getPaginated,
  batchOperation,
  requireAuth,
  createRateLimiter,
} from './api';

// Formatters
export {
  formatPrice,
  formatDiscount,
  formatNumber,
  formatRelativeTime,
  formatDate,
  formatPhoneNumber,
  formatRating,
  formatFileSize,
  truncateText,
  pluralize,
} from './formatters';

// Validation
export * from './validation';

// Navigation
export { NavigationService } from './navigation';

// Media
export * from './image-upload';
export * from './uploadMedia';
