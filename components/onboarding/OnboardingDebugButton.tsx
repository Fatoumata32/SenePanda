import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Modal, View, ScrollView, Pressable } from 'react-native';
import { BookOpen, X, Search, Store, ShoppingBag, MessageCircle, Heart, Video, Award, TrendingUp, Package } from 'lucide-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Bouton flottant pour tester/relancer le guide interactif
 * À utiliser en développement ou comme feature permanente
 */
const features = [
  {
    icon: Search,
    title: 'Explorer les produits',
    description: 'Découvrez des milliers de produits de vendeurs sénégalais',
    color: '#FF8C42',
  },
  {
    icon: Store,
    title: 'Boutiques vérifiées',
    description: 'Achetez en toute confiance auprès de vendeurs certifiés',
    color: '#10B981',
  },
  {
    icon: Video,
    title: 'Live Shopping',
    description: 'Assistez aux ventes en direct et interagissez avec les vendeurs',
    color: '#EF4444',
  },
  {
    icon: MessageCircle,
    title: 'Chat en temps réel',
    description: 'Communiquez directement avec les vendeurs',
    color: '#3B82F6',
  },
  {
    icon: Heart,
    title: 'Liste de favoris',
    description: 'Sauvegardez vos produits préférés',
    color: '#EC4899',
  },
  {
    icon: Award,
    title: 'Programme de récompenses',
    description: 'Gagnez des Panda Coins et débloquez des avantages',
    color: '#F59E0B',
  },
  {
    icon: ShoppingBag,
    title: 'Panier intelligent',
    description: 'Groupez vos achats par vendeur pour optimiser la livraison',
    color: '#8B5CF6',
  },
  {
    icon: TrendingUp,
    title: 'Offres et promotions',
    description: 'Profitez de réductions exclusives quotidiennes',
    color: '#14B8A6',
  },
];

export const OnboardingDebugButton: React.FC = () => {
  const { resetOnboarding, startOnboarding, isActive } = useOnboarding();
  const router = useRouter();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handlePress = () => {
    setShowGuideModal(true);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel="Voir les fonctionnalités"
        accessibilityRole="button"
      >
        <BookOpen size={24} color={Colors.white} />
        <Text style={styles.text}>Guide</Text>
      </TouchableOpacity>

      {/* Modal du Guide */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGuideModal}
        onRequestClose={() => setShowGuideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowGuideModal(false)}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <LinearGradient
              colors={['#FF8C42', '#FFA500', '#FFD700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconCircle}>
                  <Package size={28} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Fonctionnalités SenePanda</Text>
                  <Text style={styles.modalSubtitle}>Découvrez tout ce que vous pouvez faire</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowGuideModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Liste des fonctionnalités */}
            <ScrollView
              style={styles.featuresList}
              showsVerticalScrollIndicator={false}
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <View key={index} style={styles.featureCard}>
                    <View style={[styles.featureIconCircle, { backgroundColor: feature.color + '15' }]}>
                      <Icon size={24} color={feature.color} strokeWidth={2} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => {
                  setShowGuideModal(false);
                }}
              >
                <LinearGradient
                  colors={['#FF8C42', '#FFA500', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Commencer à explorer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: Colors.primaryOrange,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    gap: 4,
  },
  text: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
