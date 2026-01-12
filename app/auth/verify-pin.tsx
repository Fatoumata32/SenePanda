import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function VerifyPinScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const input3Ref = useRef<TextInput>(null);
  const input4Ref = useRef<TextInput>(null);

  const themeColors = {
    background: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
  };

  useEffect(() => {
    // Auto-focus first input on mount
    setTimeout(() => input1Ref.current?.focus(), 300);
  }, []);

  const handlePinChange = (value: string, index: number) => {
    const newPin = pin.substring(0, index) + value + pin.substring(index + 1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInputs = [input1Ref, input2Ref, input3Ref, input4Ref];
      nextInputs[index + 1]?.current?.focus();
    }

    // Check if PIN is complete
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const verifyPin = async (enteredPin: string) => {
    try {
      const storedPin = await AsyncStorage.getItem('user_pin');

      if (enteredPin === storedPin) {
        // PIN correct - Rediriger vers l'app
        router.replace('/(tabs)');
      } else {
        // PIN incorrect
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          // Bloquer après 3 tentatives
          setIsLocked(true);
          Alert.alert(
            'Trop de tentatives',
            'Vous avez saisi un code incorrect 3 fois. Veuillez vous reconnecter.',
            [
              {
                text: 'Se reconnecter',
                onPress: async () => {
                  await supabase.auth.signOut();
                  router.replace('/login');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Code incorrect',
            `Code PIN incorrect. ${3 - newAttempts} tentative${3 - newAttempts > 1 ? 's' : ''} restante${3 - newAttempts > 1 ? 's' : ''}.`,
            [
              {
                text: 'Réessayer',
                onPress: () => {
                  setPin('');
                  setTimeout(() => input1Ref.current?.focus(), 100);
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier le code PIN.');
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Code PIN oublié',
      'Pour réinitialiser votre code PIN, vous devez vous reconnecter à votre compte.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se reconnecter',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const renderPinInput = (index: number) => {
    const ref = [input1Ref, input2Ref, input3Ref, input4Ref][index];

    return (
      <TextInput
        key={index}
        ref={ref}
        style={[
          styles.pinInput,
          {
            backgroundColor: themeColors.card,
            borderColor: pin[index] ? '#D97706' : themeColors.border,
            color: themeColors.text,
          },
          isLocked && styles.pinInputDisabled
        ]}
        maxLength={1}
        keyboardType="number-pad"
        secureTextEntry
        value={pin[index] || ''}
        onChangeText={(value) => handlePinChange(value, index)}
        editable={!isLocked}
        onKeyPress={(e) => {
          if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInputs = [input1Ref, input2Ref, input3Ref, input4Ref];
            prevInputs[index - 1]?.current?.focus();
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Content */}
        <View style={styles.content}>
          <LinearGradient
            colors={isLocked ? ['#EF4444', '#DC2626'] : ['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            {isLocked ? (
              <AlertCircle size={48} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Lock size={48} color="#FFFFFF" strokeWidth={2.5} />
            )}
          </LinearGradient>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {isLocked ? 'Compte verrouillé' : 'Saisissez votre code PIN'}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {isLocked
              ? 'Trop de tentatives incorrectes'
              : 'Entrez votre code PIN pour accéder à votre compte'
            }
          </Text>

          {!isLocked && (
            <>
              <View style={styles.pinContainer}>
                {[0, 1, 2, 3].map(renderPinInput)}
              </View>

              {attempts > 0 && (
                <View style={styles.attemptsContainer}>
                  <AlertCircle size={16} color="#EF4444" />
                  <Text style={[styles.attemptsText, { color: '#EF4444' }]}>
                    {attempts} tentative{attempts > 1 ? 's' : ''} échouée{attempts > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={handleForgotPin}
              >
                <Text style={styles.forgotButtonText}>Code PIN oublié ?</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pinInput: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pinInputDisabled: {
    opacity: 0.5,
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  attemptsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  forgotButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
