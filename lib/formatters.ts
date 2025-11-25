/**
 * Formatters for prices, numbers, and dates
 * Optimized for Senegalese market (FCFA)
 */

/**
 * Format price in FCFA
 */
export function formatPrice(
  amount: number,
  options: {
    currency?: string;
    showCurrency?: boolean;
    compact?: boolean;
    decimals?: number;
  } = {}
): string {
  const {
    currency = 'FCFA',
    showCurrency = true,
    compact = false,
    decimals = 0,
  } = options;

  let formattedAmount: string;

  if (compact && amount >= 1000000) {
    formattedAmount = `${(amount / 1000000).toFixed(1)}M`;
  } else if (compact && amount >= 1000) {
    formattedAmount = `${(amount / 1000).toFixed(1)}K`;
  } else {
    formattedAmount = amount.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return showCurrency ? `${formattedAmount} ${currency}` : formattedAmount;
}

/**
 * Format discount percentage
 */
export function formatDiscount(originalPrice: number, salePrice: number): string {
  if (originalPrice <= 0 || salePrice >= originalPrice) return '';
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  return `-${discount}%`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  num: number,
  options: { compact?: boolean; locale?: string } = {}
): string {
  const { compact = false, locale = 'fr-FR' } = options;

  if (compact) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
  }

  return num.toLocaleString(locale);
}

/**
 * Format relative time (e.g., "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return "à l'instant";
  } else if (diffMin < 60) {
    return `il y a ${diffMin} min`;
  } else if (diffHour < 24) {
    return `il y a ${diffHour}h`;
  } else if (diffDay < 7) {
    return `il y a ${diffDay}j`;
  } else if (diffWeek < 4) {
    return `il y a ${diffWeek} sem.`;
  } else if (diffMonth < 12) {
    return `il y a ${diffMonth} mois`;
  } else {
    return `il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`;
  }
}

/**
 * Format date in French locale
 */
export function formatDate(
  date: Date | string,
  options: {
    format?: 'short' | 'medium' | 'long';
    includeTime?: boolean;
  } = {}
): string {
  const { format = 'medium', includeTime = false } = options;

  const d = new Date(date);

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'long' ? 'long' : 'short',
    year: format === 'short' ? '2-digit' : 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return d.toLocaleDateString('fr-FR', dateOptions);
}

/**
 * Format phone number for Senegal
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle Senegalese numbers
  if (digits.startsWith('221')) {
    const local = digits.slice(3);
    return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
  }

  if (digits.length === 9) {
    return `+221 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format rating (e.g., "4.5/5")
 */
export function formatRating(rating: number, total?: number): string {
  const formattedRating = rating.toFixed(1);
  if (total !== undefined) {
    return `${formattedRating}/5 (${formatNumber(total)})`;
  }
  return `${formattedRating}/5`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Pluralize French words
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count <= 1) return singular;
  return plural || `${singular}s`;
}

export default {
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
};
