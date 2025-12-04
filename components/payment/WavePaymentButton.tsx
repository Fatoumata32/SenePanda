import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Smartphone } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { initiateWavePayment, WavePaymentRequest } from '@/lib/wavePayment';

interface WavePaymentButtonProps {
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'premium';
}

export default function WavePaymentButton({
  amount,
  orderId,
  customerName,
  customerPhone,
  customerEmail,
  description,
  metadata,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  variant = 'default',
}: WavePaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      // Validation basique
      if (!customerPhone) {
        Alert.alert('Erreur', 'Numéro de téléphone requis pour Wave');
        setLoading(false);
        return;
      }

      if (amount <= 0) {
        Alert.alert('Erreur', 'Montant invalide');
        setLoading(false);
        return;
      }

      // Préparer la requête
      const request: WavePaymentRequest = {
        amount,
        currency: 'XOF',
        customerName,
        customerPhone,
        customerEmail,
        orderId,
        description: description || `Commande #${orderId}`,
        metadata: {
          ...metadata,
          app: 'SenePanda',
          timestamp: new Date().toISOString(),
        },
      };

      // Initier le paiement Wave
      const response = await initiateWavePayment(request);

      if (response.success && response.checkoutUrl) {
        // Ouvrir l'URL de paiement Wave
        const canOpen = await Linking.canOpenURL(response.checkoutUrl);

        if (canOpen) {
          await Linking.openURL(response.checkoutUrl);

          // Informer l'utilisateur
          Alert.alert(
            'Paiement Wave',
            'Vous allez être redirigé vers Wave pour finaliser le paiement.',
            [
              {
                text: 'Annuler',
                style: 'cancel',
                onPress: () => {
                  onCancel?.();
                  setLoading(false);
                },
              },
              {
                text: 'OK',
                onPress: () => {
                  // Le webhook confirmera le paiement
                  onSuccess?.(response.transactionId!);
                  setLoading(false);
                },
              },
            ]
          );
        } else {
          throw new Error('Impossible d\'ouvrir Wave');
        }
      } else {
        throw new Error(response.error || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('Erreur paiement Wave:', error);
      Alert.alert('Erreur', error.message || 'Impossible de traiter le paiement');
      onError?.(error.message);
      setLoading(false);
    }
  };

  if (variant === 'premium') {
    return (
      <TouchableOpacity
        onPress={handlePayment}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={styles.premiumContainer}
      >
        <LinearGradient
          colors={['#FF6B00', '#FF8C00', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <View style={styles.waveIcon}>
                <Smartphone size={24} color={Colors.white} />
              </View>
              <View style={styles.premiumButtonContent}>
                <Text style={styles.premiumButtonText}>Payer avec Wave</Text>
                <Text style={styles.premiumButtonAmount}>
                  {amount.toLocaleString()} FCFA
                </Text>
              </View>
              <CreditCard size={20} color={Colors.white} strokeWidth={2} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePayment}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.container, disabled && styles.containerDisabled]}
    >
      <View style={styles.button}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primaryOrange} />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FF6B00', '#FFA500']}
                style={styles.iconGradient}
              >
                <Smartphone size={20} color={Colors.white} />
              </LinearGradient>
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>Wave</Text>
              <Text style={styles.subtitle}>Paiement mobile money</Text>
            </View>
            <Text style={styles.amount}>{amount.toLocaleString()} FCFA</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Variant default
  container: {
    marginBottom: Spacing.md,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#FF8C00',
    ...Shadows.medium,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: '#FF6B00',
  },

  // Variant premium
  premiumContainer: {
    marginBottom: Spacing.md,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  waveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  premiumButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  premiumButtonAmount: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});
