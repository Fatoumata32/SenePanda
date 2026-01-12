import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Zap,
  ShoppingCart,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  validatePhoneNumber,
  calculateFees,
  getTotalWithFees,
  initiatePayment,
} from '@/lib/payment';
import { useAuth } from '@/providers/AuthProvider';
import * as Haptics from 'expo-haptics';

interface LiveCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    image_url?: string;
    special_price?: number;
  };
  liveSessionId: string;
  onSuccess: () => void;
}

export default function LiveCheckoutModal({
  visible,
  onClose,
  product,
  liveSessionId,
  onSuccess,
}: LiveCheckoutModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success' | 'error'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const finalPrice = product.special_price || product.price;
  const subtotal = finalPrice * quantity;
  const fees = selectedMethod ? calculateFees(subtotal, selectedMethod) : 0;
  const total = subtotal + fees;

  useEffect(() => {
    if (!visible) {
      // Reset on close
      setStep('method');
      setSelectedMethod(null);
      setPhoneNumber('');
      setQuantity(1);
      setErrorMessage('');
    }
  }, [visible]);

  const handleMethodSelect = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);
    setStep('details');
  };

  const handlePayment = async () => {
    if (!user || !selectedMethod) return;

    // Validate phone for mobile money
    const methodInfo = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (methodInfo?.requiresPhone) {
      if (!phoneNumber) {
        Alert.alert('Numéro requis', 'Veuillez entrer votre numéro de téléphone');
        return;
      }
      if (!validatePhoneNumber(phoneNumber, selectedMethod)) {
        Alert.alert('Numéro invalide', `Ce numéro n'est pas valide pour ${methodInfo.name}`);
        return;
      }
    }

    setProcessing(true);
    setStep('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await initiatePayment(user.id, {
        amount: total,
        currency: product.currency,
        method: selectedMethod,
        phoneNumber: methodInfo?.requiresPhone ? phoneNumber : undefined,
        description: `Achat Live: ${product.title}`,
        metadata: {
          product_id: product.id,
          live_session_id: liveSessionId,
          quantity,
          unit_price: finalPrice,
          purchase_type: 'live_shopping',
        },
      });

      if (result.success) {
        setStep('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setStep('error');
        setErrorMessage(result.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      setStep('error');
      setErrorMessage(error.message || 'Une erreur est survenue');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessing(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Zap size={20} color={Colors.primaryOrange} />
        <Text style={styles.sectionTitle}>Mode de paiement express</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.methodCard}
            onPress={() => handleMethodSelect(method.id)}
          >
            <View style={[styles.methodIcon, { backgroundColor: `${method.color}20` }]}>
              {method.requiresCard ? (
                <CreditCard size={24} color={method.color} />
              ) : (
                <Smartphone size={24} color={method.color} />
              )}
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodTime}>{method.processingTime}</Text>
            </View>
            {method.fees > 0 && (
              <Text style={styles.methodFee}>{method.fees}% frais</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPaymentDetails = () => {
    const methodInfo = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (!methodInfo) return null;

    return (
      <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
        {/* Product Summary */}
        <View style={styles.productSummary}>
          {product.image_url && (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          )}
          <View style={styles.productSummaryInfo}>
            <Text style={styles.productSummaryTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.productSummaryPrice}>
              {finalPrice.toLocaleString()} {product.currency}
            </Text>
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.label}>Quantité</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                if (quantity > 1) {
                  setQuantity(quantity - 1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                setQuantity(quantity + 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method Info */}
        <View style={styles.selectedMethodCard}>
          <View style={[styles.methodIcon, { backgroundColor: `${methodInfo.color}20` }]}>
            {methodInfo.requiresCard ? (
              <CreditCard size={24} color={methodInfo.color} />
            ) : (
              <Smartphone size={24} color={methodInfo.color} />
            )}
          </View>
          <View style={styles.selectedMethodInfo}>
            <Text style={styles.selectedMethodName}>{methodInfo.name}</Text>
            <TouchableOpacity onPress={() => setStep('method')}>
              <Text style={styles.changeMethodText}>Changer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone Number Input */}
        {methodInfo.requiresPhone && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder={`Ex: ${methodInfo.id === 'orange_money' ? '77 123 45 67' : '70 123 45 67'}`}
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={20}
            />
            <Text style={styles.inputHint}>
              Vous recevrez une notification {methodInfo.name} pour confirmer le paiement
            </Text>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Sous-total ({quantity}x)</Text>
            <Text style={styles.priceValue}>
              {subtotal.toLocaleString()} {product.currency}
            </Text>
          </View>
          {fees > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais ({methodInfo.fees}%)</Text>
              <Text style={styles.priceValue}>
                {fees.toLocaleString()} {product.currency}
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString()} {product.currency}
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={processing}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButtonGradient}
          >
            {processing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Zap size={20} color={Colors.white} />
                <Text style={styles.payButtonText}>
                  Payer {total.toLocaleString()} {product.currency}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderProcessing = () => (
    <View style={styles.statusContainer}>
      <ActivityIndicator size="large" color={Colors.primaryOrange} />
      <Text style={styles.statusTitle}>Traitement en cours...</Text>
      <Text style={styles.statusMessage}>
        Veuillez confirmer le paiement sur votre téléphone
      </Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <CheckCircle size={64} color="#10B981" />
      <Text style={styles.statusTitle}>Paiement réussi !</Text>
      <Text style={styles.statusMessage}>
        Votre commande a été enregistrée avec succès
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.statusContainer}>
      <AlertCircle size={64} color="#EF4444" />
      <Text style={styles.statusTitle}>Paiement échoué</Text>
      <Text style={styles.statusMessage}>{errorMessage}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => setStep('details')}
      >
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ShoppingCart size={24} color={Colors.primaryOrange} />
              <Text style={styles.headerTitle}>
                {step === 'method' && 'Paiement Express'}
                {step === 'details' && 'Détails du paiement'}
                {step === 'processing' && 'Traitement'}
                {step === 'success' && 'Succès'}
                {step === 'error' && 'Erreur'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {step === 'method' && renderMethodSelection()}
          {step === 'details' && renderPaymentDetails()}
          {step === 'processing' && renderProcessing()}
          {step === 'success' && renderSuccess()}
          {step === 'error' && renderError()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    ...Shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  methodName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  methodTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  methodFee: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  productSummary: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  productSummaryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  productSummaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  productSummaryPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  quantitySection: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  quantityValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  selectedMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  selectedMethodInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedMethodName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  changeMethodText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  priceBreakdown: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  priceValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  payButton: {
    marginTop: Spacing.md,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  payButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  statusContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  statusTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statusMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
