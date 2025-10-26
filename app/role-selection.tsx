import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingBag, Store } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    checkUserSession();

    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Message vocal de bienvenue
    Speech.speak(
      'Bienvenue! Souhaitez-vous utiliser l\'application en tant qu\'acheteur ou vendeur?',
      { language: 'fr-FR', rate: 0.9 }
    );
  }, []);

  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Pas de session, rediriger vers l'inscription
        router.replace('/register');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      router.replace('/register');
    }
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      Speech.speak('Veuillez choisir un rôle', { language: 'fr-FR' });
      return;
    }

    try {
      setLoading(true);

      // Vérifier d'abord la session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const user = session.user;

      // Sauvegarder le rôle dans AsyncStorage
      await AsyncStorage.setItem('user_preferred_role', selectedRole);

      // Mettre à jour le profil avec le rôle
      const isSeller = selectedRole === 'seller';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_seller: isSeller })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      Speech.speak(
        selectedRole === 'seller'
          ? 'Vous êtes maintenant vendeur'
          : 'Vous êtes maintenant acheteur',
        { language: 'fr-FR' }
      );

      // Si c'est un vendeur, vérifier s'il a déjà une boutique
      if (selectedRole === 'seller') {
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('seller_id', user.id)
          .maybeSingle();

        if (!shop) {
          // Pas de boutique → rediriger vers la création
          router.replace('/seller/shop-wizard');
        } else {
          // Boutique existe déjà → aller à l'app
          router.replace('/(tabs)');
        }
      } else {
        // Acheteur → aller directement à l'app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Error saving role:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Erreur lors de l\'enregistrement du rôle. Veuillez réessayer.',
        [
          {
            text: 'Se reconnecter',
            onPress: () => router.replace('/register'),
          },
          {
            text: 'Réessayer',
            style: 'cancel',
          },
        ]
      );
      Speech.speak('Erreur lors de l\'enregistrement du rôle', { language: 'fr-FR' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoHeader}>
          <Image
            source={require('@/assets/images/logo20.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.question}>Comment allez-vous utiliser l'application ?</Text>
          <Text style={styles.questionSubtitle}>Vous pouvez changer cela plus tard</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedRole === 'buyer' && styles.optionCardActive,
            ]}
            onPress={() => {
              setSelectedRole('buyer');
              Speech.speak('Acheteur sélectionné', { language: 'fr-FR', rate: 1.2 });
            }}>
            <View style={styles.optionIcon}>
              <ShoppingBag size={32} color={selectedRole === 'buyer' ? '#FF8C42' : '#6B7280'} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                selectedRole === 'buyer' && styles.optionTitleActive
              ]}>
                Acheteur
              </Text>
              <Text style={styles.optionSubtitle}>
                Découvrez et achetez des produits
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedRole === 'seller' && styles.optionCardActive,
            ]}
            onPress={() => {
              setSelectedRole('seller');
              Speech.speak('Vendeur sélectionné', { language: 'fr-FR', rate: 1.2 });
            }}>
            <View style={styles.optionIcon}>
              <Store size={32} color={selectedRole === 'seller' ? '#FF8C42' : '#6B7280'} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                selectedRole === 'seller' && styles.optionTitleActive
              ]}>
                Vendeur
              </Text>
              <Text style={styles.optionSubtitle}>
                Créez votre boutique et vendez vos produits
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}>
          {selectedRole ? (
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>
                {loading ? 'Chargement...' : 'Continuer'}
              </Text>
            </LinearGradient>
          ) : (
            <Text style={styles.continueButtonText}>
              {loading ? 'Chargement...' : 'Continuer'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logoHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardActive: {
    borderColor: '#FF8C42',
    backgroundColor: '#FFF4E6',
    shadowColor: '#FF8C42',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#FF8C42',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  continueButton: {
    borderRadius: 16,
    marginTop: 'auto',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
