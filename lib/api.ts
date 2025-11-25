/**
 * API utilities with error handling and retry logic
 */

import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry certain errors
      if (error instanceof ApiError) {
        if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
          throw error;
        }
      }

      // Wait before retrying
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: any): never {
  const message = error?.message || 'Une erreur est survenue';
  const code = error?.code || 'UNKNOWN_ERROR';
  const statusCode = error?.status || 500;

  // Map common Supabase errors to user-friendly messages
  const errorMessages: Record<string, string> = {
    'PGRST116': 'Aucun résultat trouvé',
    'PGRST301': 'Erreur de connexion à la base de données',
    '23505': 'Cette entrée existe déjà',
    '23503': 'Référence invalide',
    '22P02': 'Format de données invalide',
    'invalid_grant': 'Identifiants invalides',
    'user_not_found': 'Utilisateur non trouvé',
  };

  const userMessage = errorMessages[code] || message;

  throw new ApiError(userMessage, code, statusCode, error);
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(
        'La requête a expiré',
        'TIMEOUT',
        408
      );
    }
    throw error;
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Get paginated data from Supabase
 */
export async function getPaginated<T>(
  query: any,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: T[]; hasMore: boolean; total: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error);
  }

  return {
    data: data || [],
    hasMore: (data?.length || 0) === pageSize,
    total: count || 0,
  };
}

/**
 * Batch operations helper
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiError(
      'Vous devez être connecté pour effectuer cette action',
      'UNAUTHORIZED',
      401
    );
  }

  return user.id;
}

/**
 * Rate limiting helper
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests: number[] = [];

  return async function rateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }

    if (requests.length >= maxRequests) {
      const waitTime = requests[0] + windowMs - now;
      throw new ApiError(
        `Trop de requêtes. Réessayez dans ${Math.ceil(waitTime / 1000)} secondes`,
        'RATE_LIMITED',
        429
      );
    }

    requests.push(now);
  };
}

export default {
  ApiError,
  withRetry,
  handleSupabaseError,
  fetchWithTimeout,
  safeJsonParse,
  getPaginated,
  batchOperation,
  requireAuth,
  createRateLimiter,
};
