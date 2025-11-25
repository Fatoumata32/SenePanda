import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@senepanda_biometric_enabled';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'face' | 'iris' | 'none';
  isEnrolled: boolean;
}

export function useBiometric() {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    biometricType: 'none',
    isEnrolled: false,
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check biometric capabilities on mount
  useEffect(() => {
    checkBiometricCapabilities();
    loadBiometricPreference();
  }, []);

  const checkBiometricCapabilities = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricCapabilities['biometricType'] = 'none';

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      setCapabilities({
        isAvailable: compatible && enrolled,
        biometricType,
        isEnrolled: enrolled,
      });
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
    }
  };

  const loadBiometricPreference = async () => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading biometric preference:', error);
    }
  };

  const enableBiometric = useCallback(async () => {
    if (!capabilities.isAvailable) {
      Alert.alert(
        'Authentification biométrique non disponible',
        'Veuillez configurer votre empreinte digitale ou Face ID dans les paramètres de votre appareil.'
      );
      return false;
    }

    try {
      const result = await authenticate('Activez l\'authentification biométrique');
      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }, [capabilities.isAvailable]);

  const disableBiometric = useCallback(async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      setIsEnabled(false);
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  }, []);

  const authenticate = useCallback(async (
    promptMessage?: string,
    cancelLabel?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available'
      };
    }

    setIsAuthenticating(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authentifiez-vous pour continuer',
        cancelLabel: cancelLabel || 'Annuler',
        disableDeviceFallback: false,
        fallbackLabel: 'Utiliser le code PIN',
      });

      setIsAuthenticating(false);

      if (result.success) {
        return { success: true };
      } else {
        const errorMessage = result.error === 'user_cancel'
          ? 'Authentification annulée'
          : 'Authentification échouée';

        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error: any) {
      setIsAuthenticating(false);
      console.error('Biometric authentication error:', error);

      return {
        success: false,
        error: error?.message || 'Une erreur est survenue'
      };
    }
  }, [capabilities.isAvailable]);

  const authenticateForSensitiveAction = useCallback(async (
    actionName: string
  ): Promise<boolean> => {
    const result = await authenticate(
      `Confirmez ${actionName}`,
      'Annuler'
    );

    if (!result.success && result.error) {
      Alert.alert('Erreur', result.error);
    }

    return result.success;
  }, [authenticate]);

  const getBiometricTypeLabel = useCallback(() => {
    switch (capabilities.biometricType) {
      case 'face':
        return Platform.OS === 'ios' ? 'Face ID' : 'Reconnaissance faciale';
      case 'fingerprint':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Empreinte digitale';
      case 'iris':
        return 'Reconnaissance d\'iris';
      default:
        return 'Biométrie';
    }
  }, [capabilities.biometricType]);

  return {
    capabilities,
    isEnabled,
    isAuthenticating,
    enableBiometric,
    disableBiometric,
    authenticate,
    authenticateForSensitiveAction,
    getBiometricTypeLabel,
    checkBiometricCapabilities,
  };
}

export default useBiometric;
