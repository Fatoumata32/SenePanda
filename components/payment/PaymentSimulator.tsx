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

interface PaymentSimulatorProps {
  visible: boolean;
  amount: number;
  phoneNumber: string;
  method: 'wave' | 'orange_money';
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Simulateur de paiement multi-méthodes (Wave, Orange Money)
 */
export default function PaymentSimulator({
  visible,
  amount,
  phoneNumber,
  method,
  onSuccess,
  onCancel,
}: PaymentSimulatorProps) {
  const [step, setStep] = useState<'pending' | 'processing' | 'success'>('pending');
  const [progress] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && step === 'pending') {
      // Animation de la barre de progression
      Animated.timing(progress, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        setStep('processing');
        setTimeout(() => {
          setStep('success');
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }, 1200);
      });
    }
    if (!visible) {
      setStep('pending');
      progress.setValue(0);
      scale.setValue(0);
    }
  }, [visible]);

  const getMethodLabel = () => {
    if (method === 'wave') return 'Wave';
    if (method === 'orange_money') return 'Orange Money';
    return '';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Paiement {getMethodLabel()}</Text>
          <Text style={styles.amount}>{amount.toLocaleString()} FCFA</Text>
          <Text style={styles.phone}>{phoneNumber}</Text>
          {step === 'pending' && (
            <TouchableOpacity style={styles.payButton} onPress={() => setStep('processing')}>
              <Text style={styles.payButtonText}>Simuler le paiement</Text>
            </TouchableOpacity>
          )}
          {step === 'processing' && (
            <View style={styles.processing}>
              <ActivityIndicator size="large" color="#1DC8FF" />
              <Text style={styles.processingText}>Traitement en cours...</Text>
            </View>
          )}
          {step === 'success' && (
            <Animated.View style={[styles.success, { transform: [{ scale }] }] }>
              <CheckCircle color="#10B981" size={48} />
              <Text style={styles.successText}>Paiement réussi !</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onSuccess}>
                <Text style={styles.closeButtonText}>Continuer</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    color: '#1DC8FF',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: '#1DC8FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  processing: {
    alignItems: 'center',
    marginBottom: 12,
  },
  processingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  success: {
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
});
