import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Smartphone,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import {
  PaymentMethod,
  PAYMENT_METHODS,
  validatePhoneNumber,
  formatPhoneForPayment,
} from '@/lib/payment';
import * as Haptics from 'expo-haptics';

const iconMap: Record<string, any> = {
  smartphone: Smartphone,
  'credit-card': CreditCard,
  'building-2': Building2,
};

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
  amount: number;
}

function PaymentMethodSelectorComponent({
  selectedMethod,
  onSelectMethod,
  phoneNumber,
  onPhoneNumberChange,
  amount,
}: PaymentMethodSelectorProps) {
  const handleSelectMethod = (methodId: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectMethod(methodId);
  };

  const selectedMethodInfo = selectedMethod
    ? PAYMENT_METHODS.find(m => m.id === selectedMethod)
    : null;

  const isPhoneValid = selectedMethod && selectedMethodInfo?.requiresPhone
    ? validatePhoneNumber(phoneNumber, selectedMethod)
    : true;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Méthode de paiement</Text>

      <View style={styles.methods}>
        {PAYMENT_METHODS.map((method) => {
          const IconComponent = iconMap[method.icon];
          const isSelected = selectedMethod === method.id;
          const isDisabled = amount < method.minAmount || amount > method.maxAmount;

          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                isSelected && styles.methodCardSelected,
                isDisabled && styles.methodCardDisabled,
              ]}
              onPress={() => !isDisabled && handleSelectMethod(method.id)}
              disabled={isDisabled}
              accessible={true}
              accessibilityLabel={method.name}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
            >
              <View
                style={[
                  styles.methodIcon,
                  { backgroundColor: `${method.color}15` },
                ]}
              >
                <IconComponent size={20} color={method.color} />
              </View>

              <View style={styles.methodInfo}>
                <Text
                  style={[
                    styles.methodName,
                    isDisabled && styles.methodNameDisabled,
                  ]}
                >
                  {method.name}
                </Text>
                <Text style={styles.methodTime}>{method.processingTime}</Text>
                {method.fees > 0 && (
                  <Text style={styles.methodFees}>+{method.fees}% frais</Text>
                )}
              </View>

              {isSelected && (
                <View style={[styles.checkIcon, { backgroundColor: method.color }]}>
                  <Check size={14} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Phone number input for mobile money */}
      {selectedMethodInfo?.requiresPhone && (
        <View style={styles.phoneInput}>
          <Text style={styles.phoneLabel}>Numéro de téléphone</Text>
          <TextInput
            style={[
              styles.input,
              !isPhoneValid && phoneNumber.length > 0 && styles.inputError,
            ]}
            value={phoneNumber}
            onChangeText={onPhoneNumberChange}
            placeholder="77 123 45 67"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            maxLength={15}
            accessible={true}
            accessibilityLabel="Numéro de téléphone pour le paiement"
          />
          {phoneNumber.length > 0 && (
            <Text
              style={[
                styles.phoneHint,
                !isPhoneValid && styles.phoneHintError,
              ]}
            >
              {isPhoneValid
                ? formatPhoneForPayment(phoneNumber)
                : 'Numéro invalide pour ' + selectedMethodInfo.name}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  methods: {
    gap: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.primaryOrange,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  methodNameDisabled: {
    color: Colors.textMuted,
  },
  methodTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  methodFees: {
    fontSize: 10,
    color: Colors.warning,
    marginTop: 2,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneInput: {
    gap: 8,
  },
  phoneLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.error,
  },
  phoneHint: {
    fontSize: 12,
    color: Colors.success,
  },
  phoneHintError: {
    color: Colors.error,
  },
});

export const PaymentMethodSelector = memo(PaymentMethodSelectorComponent);
export default PaymentMethodSelector;
