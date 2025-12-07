import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';

/**
 * Bouton flottant pour tester/relancer le guide interactif
 * À utiliser en développement ou comme feature permanente
 */
export const OnboardingDebugButton: React.FC = () => {
  const { resetOnboarding, startOnboarding, isActive } = useOnboarding();
  const router = useRouter();

  const handlePress = async () => {
    console.log('[OnboardingDebugButton] 🔘 Button pressed');
    console.log('[OnboardingDebugButton] isActive:', isActive);

    if (isActive) {
      console.log('[OnboardingDebugButton] ⚠️ Already active, showing alert');
      Alert.alert('Guide en cours', 'Le guide interactif est déjà actif!');
      return;
    }

    Alert.alert(
      'Guide Interactif 🎯',
      'Voulez-vous (re)lancer le guide interactif?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => console.log('[OnboardingDebugButton] ❌ Cancelled'),
        },
        {
          text: 'Lancer',
          onPress: async () => {
            console.log('[OnboardingDebugButton] ▶️ Launching guide...');
            await resetOnboarding();
            console.log('[OnboardingDebugButton] ✅ Reset done');
            // S'assurer d'être sur la page home
            router.push('/(tabs)/home' as any);
            console.log('[OnboardingDebugButton] 📍 Navigated to home');
            // Petit délai pour laisser la navigation se faire
            setTimeout(() => {
              console.log('[OnboardingDebugButton] 🚀 Starting onboarding...');
              startOnboarding();
            }, 500);
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel="Lancer le guide interactif"
      accessibilityRole="button"
    >
      <BookOpen size={24} color={Colors.white} />
      <Text style={styles.text}>Guide</Text>
    </TouchableOpacity>
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
});
