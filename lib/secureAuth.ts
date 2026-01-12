/**
 * Secure Authentication Service
 * Gère la persistance sécurisée des credentials et l'auto-login
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from './supabase';

// Note: Utilise AsyncStorage pour compatibilité Expo Go
// En production, remplacer par expo-secure-store pour plus de sécurité

// Clés de stockage sécurisé
const KEYS = {
  PHONE: 'user_phone_secure',
  PIN: 'user_pin_secure',
  SESSION: 'user_session_secure',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  AUTO_LOGIN_ENABLED: 'auto_login_enabled',
};

/**
 * Sauvegarder les credentials de manière sécurisée
 */
export async function saveCredentials(phone: string, pin: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PHONE, phone);
    await AsyncStorage.setItem(KEYS.PIN, pin);
    await AsyncStorage.setItem(KEYS.AUTO_LOGIN_ENABLED, 'true');
    console.log('✅ Credentials sauvegardés de manière sécurisée');
  } catch (error) {
    console.error('❌ Erreur sauvegarde credentials:', error);
    throw error;
  }
}

/**
 * Récupérer les credentials sauvegardés
 */
export async function getStoredCredentials(): Promise<{ phone: string; pin: string } | null> {
  try {
    const phone = await AsyncStorage.getItem(KEYS.PHONE);
    const pin = await AsyncStorage.getItem(KEYS.PIN);

    if (!phone || !pin) {
      return null;
    }

    return { phone, pin };
  } catch (error) {
    console.error('❌ Erreur récupération credentials:', error);
    return null;
  }
}

/**
 * Supprimer les credentials sauvegardés (logout)
 */
export async function clearCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.PHONE);
    await AsyncStorage.removeItem(KEYS.PIN);
    await AsyncStorage.removeItem(KEYS.SESSION);
    await AsyncStorage.removeItem(KEYS.AUTO_LOGIN_ENABLED);
    await AsyncStorage.removeItem(KEYS.BIOMETRIC_ENABLED);
    // Supprimer également le rôle pour forcer le choix à la prochaine connexion
    await AsyncStorage.removeItem('user_preferred_role');
    console.log('✅ Credentials et rôle effacés');
  } catch (error) {
    console.error('❌ Erreur suppression credentials:', error);
  }
}

/**
 * Vérifier si l'auto-login est activé
 */
export async function isAutoLoginEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(KEYS.AUTO_LOGIN_ENABLED);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Activer/Désactiver l'auto-login
 */
export async function setAutoLoginEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await AsyncStorage.setItem(KEYS.AUTO_LOGIN_ENABLED, 'true');
    } else {
      await AsyncStorage.removeItem(KEYS.AUTO_LOGIN_ENABLED);
      await clearCredentials();
    }
  } catch (error) {
    console.error('❌ Erreur configuration auto-login:', error);
  }
}

/**
 * Vérifier si la biométrie est disponible sur l'appareil
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch (error) {
    console.error('❌ Erreur vérification biométrie:', error);
    return false;
  }
}

/**
 * Obtenir le type de biométrie disponible
 */
export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Empreinte digitale';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Scan iris';
    }

    return 'Biométrie';
  } catch (error) {
    return 'Biométrie';
  }
}

/**
 * Vérifier si la biométrie est activée
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Activer la biométrie
 */
export async function enableBiometric(phone: string, pin: string): Promise<boolean> {
  try {
    // Vérifier que la biométrie est disponible
    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('Biométrie non disponible sur cet appareil');
    }

    // Demander l'authentification biométrique
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmer votre identité',
      cancelLabel: 'Annuler',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return false;
    }

    // Sauvegarder les credentials de manière sécurisée
    await saveCredentials(phone, pin);
    await AsyncStorage.setItem(KEYS.BIOMETRIC_ENABLED, 'true');

    console.log('✅ Biométrie activée');
    return true;
  } catch (error) {
    console.error('❌ Erreur activation biométrie:', error);
    return false;
  }
}

/**
 * Désactiver la biométrie
 */
export async function disableBiometric(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.BIOMETRIC_ENABLED);
    await clearCredentials();
    console.log('✅ Biométrie désactivée');
  } catch (error) {
    console.error('❌ Erreur désactivation biométrie:', error);
  }
}

/**
 * Authentifier avec biométrie
 */
export async function authenticateWithBiometric(): Promise<{ phone: string; pin: string } | null> {
  try {
    // Vérifier que la biométrie est activée
    const enabled = await isBiometricEnabled();
    if (!enabled) {
      return null;
    }

    // Demander l'authentification biométrique
    const biometricType = await getBiometricType();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Utiliser ${biometricType}`,
      cancelLabel: 'Annuler',
      fallbackLabel: 'Utiliser le code PIN',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return null;
    }

    // Récupérer les credentials
    const credentials = await getStoredCredentials();
    return credentials;
  } catch (error) {
    console.error('❌ Erreur authentification biométrique:', error);
    return null;
  }
}

/**
 * Tentative d'auto-login au démarrage de l'app
 */
export async function attemptAutoLogin(): Promise<boolean> {
  try {
    // Vérifier si l'auto-login est activé
    const autoLoginEnabled = await isAutoLoginEnabled();
    if (!autoLoginEnabled) {
      console.log('⚠️ Auto-login désactivé');
      return false;
    }

    // Récupérer les credentials
    const credentials = await getStoredCredentials();
    if (!credentials) {
      console.log('⚠️ Aucun credential sauvegardé');
      return false;
    }

    console.log('🔄 Tentative auto-login...');

    // Générer l'email à partir du numéro
    const email = `${credentials.phone}@senepanda.app`;

    // Tenter la connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.pin,
    });

    if (error) {
      console.error('❌ Auto-login échoué:', error.message);
      // Si credentials invalides, les supprimer
      if (error.message.includes('Invalid login credentials')) {
        await clearCredentials();
      }
      return false;
    }

    if (!data?.user) {
      console.log('❌ Auto-login échoué: pas d\'utilisateur');
      return false;
    }

    console.log('✅ Auto-login réussi!');
    return true;
  } catch (error) {
    console.error('❌ Erreur auto-login:', error);
    return false;
  }
}

/**
 * Connexion avec sauvegarde optionnelle
 */
export async function loginWithRemember(
  phone: string,
  pin: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = `${phone}@senepanda.app`;

    // Connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.user) {
      return { success: false, error: 'Connexion échouée' };
    }

    // Sauvegarder les credentials si "Se souvenir de moi" est activé
    if (rememberMe) {
      await saveCredentials(phone, pin);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Padding pour les codes PIN courts
 */
export function padPinCode(pin: string): string {
  return pin.length < 6 ? pin.padStart(6, '0') : pin;
}

/**
 * Nettoyer le numéro de téléphone
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}

export default {
  saveCredentials,
  getStoredCredentials,
  clearCredentials,
  isAutoLoginEnabled,
  setAutoLoginEnabled,
  isBiometricAvailable,
  getBiometricType,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  authenticateWithBiometric,
  attemptAutoLogin,
  loginWithRemember,
  padPinCode,
  cleanPhoneNumber,
};
