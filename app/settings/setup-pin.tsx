import React, { useState, useRef } from 'react';
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
import { X, Lock, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function SetupPinScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [firstPin, setFirstPin] = useState('');

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

  const handlePinChange = (value: string, index: number) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    const newPin = currentPin.substring(0, index) + value + currentPin.substring(index + 1);

    if (step === 'create') {
      setPin(newPin);
    } else {
      setConfirmPin(newPin);
    }

    // Auto-focus next input
    if (value && index < 3) {
      const nextInputs = [input1Ref, input2Ref, input3Ref, input4Ref];
      nextInputs[index + 1]?.current?.focus();
    }

    // Check if PIN is complete
    if (newPin.length === 4) {
      handlePinComplete(newPin);
    }
  };

  const handlePinComplete = async (completedPin: string) => {
    if (step === 'create') {
      setFirstPin(completedPin);
      setPin('');
      setStep('confirm');
      // Reset focus to first input
      setTimeout(() => input1Ref.current?.focus(), 100);
    } else {
      // Verify PINs match
      if (completedPin === firstPin) {
        try {
          await AsyncStorage.setItem('user_pin', completedPin);
          await AsyncStorage.setItem('pin_enabled', 'true');

          Alert.alert(
            'Code PIN activé',
            'Votre code PIN a été configuré avec succès. Il sera demandé à chaque connexion.',
            [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        } catch (error) {
          Alert.alert('Erreur', 'Impossible de sauvegarder le code PIN.');
        }
      } else {
        Alert.alert(
          'Codes non identiques',
          'Les codes PIN ne correspondent pas. Veuillez réessayer.',
          [
            {
              text: 'OK',
              onPress: () => {
                setStep('create');
                setPin('');
                setConfirmPin('');
                setFirstPin('');
                setTimeout(() => input1Ref.current?.focus(), 100);
              }
            }
          ]
        );
      }
    }
  };

  const renderPinInput = (index: number) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    const ref = [input1Ref, input2Ref, input3Ref, input4Ref][index];

    return (
      <TextInput
        key={index}
        ref={ref}
        style={[
          styles.pinInput,
          {
            backgroundColor: themeColors.card,
            borderColor: currentPin[index] ? '#D97706' : themeColors.border,
            color: themeColors.text,
          }
        ]}
        maxLength={1}
        keyboardType="number-pad"
        secureTextEntry
        value={currentPin[index] || ''}
        onChangeText={(value) => handlePinChange(value, index)}
        onKeyPress={(e) => {
          if (e.nativeEvent.key === 'Backspace' && !currentPin[index] && index > 0) {
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step === 'confirm') {
                setStep('create');
                setPin('');
                setConfirmPin('');
              } else {
                router.back();
              }
            }}
          >
            <X size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Configuration du code PIN
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            {step === 'create' ? (
              <Lock size={48} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Check size={48} color="#FFFFFF" strokeWidth={2.5} />
            )}
          </LinearGradient>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {step === 'create' ? 'Créez votre code PIN' : 'Confirmez votre code PIN'}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {step === 'create'
              ? 'Choisissez un code à 4 chiffres pour sécuriser votre compte'
              : 'Saisissez à nouveau votre code PIN pour le confirmer'
            }
          </Text>

          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map(renderPinInput)}
          </View>

          {step === 'create' && pin.length < 4 && (
            <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
              Saisissez 4 chiffres
            </Text>
          )}

          {step === 'confirm' && confirmPin.length < 4 && (
            <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
              Confirmez vos 4 chiffres
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
