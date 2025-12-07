import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Phone } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

interface WavePaymentSimulatorProps {
  visible: boolean;
  amount: number;
  phoneNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Simulateur de paiement Wave
 * Simule un paiement Wave pour les tests sans API réelle
 */
export default function WavePaymentSimulator({
  visible,
  amount,
  phoneNumber,
  onSuccess,
  onCancel,
}: WavePaymentSimulatorProps) {
  const [step, setStep] = useState<'pending' | 'processing' | 'success'>('pending');
  const [progress] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && step === 'pending') {
      // Animation de la barre de progression
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [visible, step]);

  useEffect(() => {
    if (step === 'success') {
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [step]);

  const handleConfirmPayment = () => {
    setStep('processing');

    // Simuler le traitement du paiement (2 secondes)
    setTimeout(() => {
      setStep('success');

      // Appeler onSuccess après 1.5 secondes
      setTimeout(() => {
        onSuccess();
        resetSimulator();
      }, 1500);
    }, 2000);
  };

  const resetSimulator = () => {
    setStep('pending');
    progress.setValue(0);
    scale.setValue(0);
  };

  const handleCancel = () => {
    onCancel();
    resetSimulator();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Wave */}
          <LinearGradient
            colors={['#1DC8FF', '#0EA5E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Wave</Text>
            </View>
          </LinearGradient>

          {/* Contenu */}
          <View style={styles.content}>
            {step === 'pending' && (
              <>
                <Text style={styles.title}>Confirmation de paiement</Text>
                <Text style={styles.subtitle}>Vérifiez les détails de votre paiement</Text>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Montant</Text>
                    <Text style={styles.detailValue}>{amount.toLocaleString()} FCFA</Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <Text style={styles.detailLabel}>Numéro</Text>
                    <View style={styles.phoneRow}>
                      <Phone size={14} color={Colors.textMuted} />
                      <Text style={styles.detailValue}>{phoneNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bénéficiaire</Text>
                    <Text style={styles.detailValue}>SenePanda</Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    💡 Mode simulation : Le paiement sera validé automatiquement après confirmation.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmPayment}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#1DC8FF', '#0EA5E9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.confirmButtonText}>Confirmer le paiement</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#1DC8FF" />
                <Text style={styles.processingTitle}>Traitement en cours</Text>
                <Text style={styles.processingSubtitle}>
                  Veuillez patienter pendant que nous validons votre paiement...
                </Text>

                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {step === 'success' && (
              <Animated.View
                style={[
                  styles.successContainer,
                  {
                    transform: [{ scale }],
                  },
                ]}>
                <View style={styles.successIconContainer}>
                  <CheckCircle size={64} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Paiement réussi !</Text>
                <Text style={styles.successSubtitle}>
                  Votre paiement de {amount.toLocaleString()} FCFA a été validé avec succès.
                </Text>
                <Text style={styles.successInfo}>
                  Votre abonnement est maintenant actif ! 🎉
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.large,
  },
  header: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  logoText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 2,
  },
  content: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  detailsCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    fontSize: Typography.fontSize.xs,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  processingTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  processingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1DC8FF',
    borderRadius: 2,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  successIconContainer: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: '#10B981',
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  successInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
