import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onBecomeSeller: () => void;
  onSkip: () => void;
  userName?: string;
}

/**
 * OnboardingSubscriptionModal
 *
 * Modal affiché lors de l'inscription pour demander si l'utilisateur
 * souhaite devenir vendeur et choisir un plan d'abonnement
 *
 * @example
 * <OnboardingSubscriptionModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   onBecomeSeller={() => router.push('/seller/subscription-plans')}
 *   onSkip={() => setShowModal(false)}
 *   userName={user.firstName}
 * />
 */
export function OnboardingSubscriptionModal({
  visible,
  onClose,
  onBecomeSeller,
  onSkip,
  userName = 'vous',
}: OnboardingSubscriptionModalProps) {
  const [selectedOption, setSelectedOption] = useState<'buyer' | 'seller' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedOption) return;

    setLoading(true);

    if (selectedOption === 'seller') {
      onBecomeSeller();
    } else {
      onSkip();
    }

    // Reset après un délai
    setTimeout(() => {
      setLoading(false);
      setSelectedOption(null);
    }, 500);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <LinearGradient
              colors={['#FF6B6B', '#FFD93D']}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="rocket" size={50} color={Colors.white} />
              <Text style={styles.headerTitle}>Bienvenue {userName} ! 🎉</Text>
              <Text style={styles.headerSubtitle}>
                Comment souhaitez-vous utiliser SenePanda ?
              </Text>
            </LinearGradient>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Option Acheteur */}
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedOption === 'buyer' && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedOption('buyer')}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.optionIconGradient}
                  >
                    <Ionicons name="cart" size={32} color={Colors.white} />
                  </LinearGradient>
                </View>

                <Text style={styles.optionTitle}>Je suis Acheteur</Text>
                <Text style={styles.optionDescription}>
                  Je veux découvrir et acheter des produits locaux
                </Text>

                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Achats illimités</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Points bonus</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Livraison rapide</Text>
                  </View>
                </View>

                {selectedOption === 'buyer' && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Option Vendeur */}
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedOption === 'seller' && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedOption('seller')}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FFD93D']}
                    style={styles.optionIconGradient}
                  >
                    <Ionicons name="storefront" size={32} color={Colors.white} />
                  </LinearGradient>
                </View>

                <Text style={styles.optionTitle}>Je suis Vendeur</Text>
                <Text style={styles.optionDescription}>
                  Je veux vendre mes produits et développer mon business
                </Text>

                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Ma boutique en ligne</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Gestion des stocks</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Statistiques</Text>
                  </View>
                </View>

                {/* Badge Premium */}
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={12} color={Colors.white} />
                  <Text style={styles.premiumBadgeText}>ABONNEMENT</Text>
                </View>

                {selectedOption === 'seller' && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Info pour vendeur */}
            {selectedOption === 'seller' && (
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Vous serez redirigé vers nos plans d'abonnement. Choisissez le plan qui
                  correspond à vos besoins !
                </Text>
              </View>
            )}

            {/* Boutons d'action */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !selectedOption && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!selectedOption || loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <LinearGradient
                    colors={
                      selectedOption === 'seller'
                        ? ['#FF6B6B', '#FFD93D']
                        : ['#667EEA', '#764BA2']
                    }
                    style={styles.continueButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.continueButtonText}>
                      {selectedOption === 'seller'
                        ? 'Voir les Plans d\'Abonnement'
                        : 'Continuer en tant qu\'Acheteur'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                  </LinearGradient>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Je déciderai plus tard</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.95,
  },
  optionsContainer: {
    padding: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  optionIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.dark,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: Colors.lightBlue,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: Colors.gray,
  },
});
