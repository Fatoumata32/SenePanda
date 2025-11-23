/**
 * Validation patterns and utilities for form inputs
 */

// ============ REGEX PATTERNS ============

/**
 * Email validation - RFC 5322 compliant
 * Accepte: john.doe@example.com, user+tag@domain.co.uk
 * Rejette: test@@test.com, @example.com, test@
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Username validation
 * - 3-20 caractères
 * - Lettres, chiffres, underscores et tirets uniquement
 * - Doit commencer par une lettre
 * Accepte: john_doe, user123, my-username
 * Rejette: _user, 123user, user@name, us
 */
export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;

/**
 * Phone number validation (format international)
 * Accepte: +221 77 123 45 67, +33612345678, +1-555-123-4567
 * Format: + suivi de 1-3 chiffres (indicatif pays) puis 6-14 chiffres
 */
export const PHONE_PATTERN = /^\+[1-9]\d{0,2}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}$/;

/**
 * Password validation
 * - Minimum 8 caractères
 * - Au moins une minuscule
 * - Au moins une majuscule
 * - Au moins un chiffre
 */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * URL validation (HTTP/HTTPS)
 * Accepte: https://example.com, http://sub.example.com/path
 */
export const URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Referral code validation
 * - Exactement 8 caractères
 * - Lettres majuscules et chiffres uniquement
 * Accepte: ABC12345, XYZ98765
 */
export const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{8}$/;

// ============ VALIDATION FUNCTIONS ============

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'L\'email est requis' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }

  return { isValid: true };
}

/**
 * Valide un nom d'utilisateur
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Le nom d\'utilisateur est requis' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères' };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      isValid: false,
      error: 'Le nom d\'utilisateur doit commencer par une lettre et ne contenir que des lettres, chiffres, tirets et underscores'
    };
  }

  return { isValid: true };
}

/**
 * Valide un numéro de téléphone
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Le numéro de téléphone est requis' };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return {
      isValid: false,
      error: 'Format de téléphone invalide. Utilisez le format international (+221 77 123 45 67)'
    };
  }

  return { isValid: true };
}

/**
 * Valide un mot de passe
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Le mot de passe est requis' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins une minuscule' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins une majuscule' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }

  return { isValid: true };
}

/**
 * Valide une URL (optionnelle)
 */
export function validateUrl(url: string, fieldName: string = 'URL'): ValidationResult {
  // URL optionnelle
  if (!url || url.trim() === '') {
    return { isValid: true };
  }

  if (!URL_PATTERN.test(url)) {
    return { isValid: false, error: `${fieldName} invalide. Utilisez le format: https://example.com` };
  }

  return { isValid: true };
}

/**
 * Valide un code de parrainage
 */
export function validateReferralCode(code: string): ValidationResult {
  // Code optionnel
  if (!code || code.trim() === '') {
    return { isValid: true };
  }

  if (code.length !== 8) {
    return { isValid: false, error: 'Le code de parrainage doit contenir exactement 8 caractères' };
  }

  if (!REFERRAL_CODE_PATTERN.test(code.toUpperCase())) {
    return {
      isValid: false,
      error: 'Le code de parrainage doit contenir uniquement des lettres et des chiffres'
    };
  }

  return { isValid: true };
}

/**
 * Valide que deux mots de passe correspondent
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Les mots de passe ne correspondent pas' };
  }

  return { isValid: true };
}

/**
 * Valide un nom (prénom ou nom de famille)
 */
export function validateName(name: string, fieldName: string = 'Nom'): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: `${fieldName} est requis` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} doit contenir au moins 2 caractères` };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} ne peut pas dépasser 50 caractères` };
  }

  return { isValid: true };
}

/**
 * Valide un pays ou une ville
 */
export function validateLocation(location: string, fieldName: string = 'Localisation'): ValidationResult {
  if (!location || location.trim() === '') {
    return { isValid: false, error: `${fieldName} est requis` };
  }

  if (location.trim().length < 2) {
    return { isValid: false, error: `${fieldName} doit contenir au moins 2 caractères` };
  }

  return { isValid: true };
}
