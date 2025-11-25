/**
 * Advanced Validation Utilities
 * Comprehensive validation functions for forms and data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('L\'email est requis');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Format d\'email invalide');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Le mot de passe est requis');
  } else {
    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Phone number validation (Senegal format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || phone.trim().length === 0) {
    errors.push('Le numéro de téléphone est requis');
  } else {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');

    // Senegal phone format: +221 XX XXX XX XX or 77/78/76/70 XXX XX XX
    const phoneRegex = /^(\+221|00221)?[7][0678]\d{7}$/;

    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Format de numéro invalide (ex: 77 123 45 67)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Product name validation
 */
export function validateProductName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Le nom du produit est requis');
  } else {
    if (name.length < 3) {
      errors.push('Le nom doit contenir au moins 3 caractères');
    }
    if (name.length > 100) {
      errors.push('Le nom ne peut pas dépasser 100 caractères');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Price validation
 */
export function validatePrice(price: number): ValidationResult {
  const errors: string[] = [];

  if (price === null || price === undefined) {
    errors.push('Le prix est requis');
  } else {
    if (price < 0) {
      errors.push('Le prix ne peut pas être négatif');
    }
    if (price > 10000000) {
      errors.push('Le prix est trop élevé');
    }
    if (!Number.isFinite(price)) {
      errors.push('Le prix doit être un nombre valide');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Stock quantity validation
 */
export function validateStock(stock: number): ValidationResult {
  const errors: string[] = [];

  if (stock === null || stock === undefined) {
    errors.push('La quantité en stock est requise');
  } else {
    if (stock < 0) {
      errors.push('La quantité ne peut pas être négative');
    }
    if (!Number.isInteger(stock)) {
      errors.push('La quantité doit être un nombre entier');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * URL validation
 */
export function validateURL(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || url.trim().length === 0) {
    errors.push('L\'URL est requise');
  } else {
    try {
      new URL(url);
    } catch {
      errors.push('Format d\'URL invalide');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Description validation
 */
export function validateDescription(
  description: string,
  minLength: number = 10,
  maxLength: number = 1000
): ValidationResult {
  const errors: string[] = [];

  if (!description || description.trim().length === 0) {
    errors.push('La description est requise');
  } else {
    if (description.length < minLength) {
      errors.push(`La description doit contenir au moins ${minLength} caractères`);
    }
    if (description.length > maxLength) {
      errors.push(`La description ne peut pas dépasser ${maxLength} caractères`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Credit card number validation (Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): ValidationResult {
  const errors: string[] = [];

  if (!cardNumber || cardNumber.trim().length === 0) {
    errors.push('Le numéro de carte est requis');
  } else {
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');

    if (!/^\d+$/.test(cleanNumber)) {
      errors.push('Le numéro de carte ne doit contenir que des chiffres');
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push('Longueur de carte invalide');
    } else {
      // Luhn algorithm
      let sum = 0;
      let isEven = false;

      for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      if (sum % 10 !== 0) {
        errors.push('Numéro de carte invalide');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Expiry date validation (MM/YY)
 */
export function validateExpiryDate(expiryDate: string): ValidationResult {
  const errors: string[] = [];

  if (!expiryDate || expiryDate.trim().length === 0) {
    errors.push('La date d\'expiration est requise');
  } else {
    const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);

    if (!match) {
      errors.push('Format invalide (utilisez MM/AA)');
    } else {
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        errors.push('Mois invalide');
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.push('La carte a expiré');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * CVV validation
 */
export function validateCVV(cvv: string): ValidationResult {
  const errors: string[] = [];

  if (!cvv || cvv.trim().length === 0) {
    errors.push('Le code CVV est requis');
  } else if (!/^\d{3,4}$/.test(cvv)) {
    errors.push('CVV invalide (3 ou 4 chiffres)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Address validation
 */
export function validateAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!address || address.trim().length === 0) {
    errors.push('L\'adresse est requise');
  } else {
    if (address.length < 5) {
      errors.push('L\'adresse doit contenir au moins 5 caractères');
    }
    if (address.length > 200) {
      errors.push('L\'adresse est trop longue');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Username validation
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push('Le nom d\'utilisateur est requis');
  } else {
    if (username.length < 3) {
      errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    if (username.length > 30) {
      errors.push('Le nom d\'utilisateur ne peut pas dépasser 30 caractères');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, - et _');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export default {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateProductName,
  validatePrice,
  validateStock,
  validateURL,
  validateDescription,
  validateCreditCard,
  validateExpiryDate,
  validateCVV,
  validateAddress,
  validateUsername,
  sanitizeHTML,
  isEmpty,
};
