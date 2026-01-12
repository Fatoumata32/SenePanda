import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingBag, Store } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { syncSubscriptionPlan } from '@/lib/subscriptionSync';
import PandaLogo from '@/components/PandaLogo';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // Vérification initiale
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Cette page n'est plus utilisée - rediriger directement vers home
    redirectToHome();
  }, []);

  const redirectToHome = async () => {
    try {
      // Vérifier la session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Pas de session, rediriger vers l'inscription
        router.replace('/simple-auth');
        return;
      }

      // Définir un rôle par défaut si nécessaire
      const existingRole = await AsyncStorage.getItem('user_preferred_role');
      if (!existingRole) {
        await AsyncStorage.setItem('user_preferred_role', 'buyer');
        
        // Mettre à jour le profil
        await supabase
          .from('profiles')
          .update({ preferred_role: 'buyer' })
          .eq('id', session.user.id);
      }

      // Rediriger vers home
      console.log('✅ Redirection directe vers home (page role-selection désactivée)');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error in redirectToHome:', error);
      // Rediriger vers home quand même
      router.replace('/(tabs)/home');
    }
  };

  const checkExistingRole = async () => {
    try {
      const existingRole = await AsyncStorage.getItem('user_preferred_role');
      if (existingRole) {
        // Un rôle existe déjà, rediriger vers home
        console.log('✅ Rôle déjà défini:', existingRole);
        router.replace('/(tabs)/home');
        return;
      }

      // Pas de rôle, continuer avec la sélection
      setChecking(false);
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
    } catch (error) {
      console.error('Error checking existing role:', error);
      setChecking(false);
      checkUserSession();
    }
  };

  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Pas de session, rediriger vers l'inscription
        router.replace('/simple-auth');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      router.replace('/simple-auth');
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

      // Mettre à jour le profil avec le rôle (essayer role puis is_seller pour compatibilité)
      const roleValue = selectedRole;
      const isSeller = selectedRole === 'seller';

      let { error: updateError } = await supabase
        .from('profiles')
        .update({ role: roleValue })
        .eq('id', user.id);

      // Si la colonne 'role' n'existe pas, utiliser 'is_seller'
      if (updateError?.code === 'PGRST204' || updateError?.message?.includes('role')) {
        const result = await supabase
          .from('profiles')
          .update({ is_seller: isSeller })
          .eq('id', user.id);
        updateError = result.error;
      }

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

      // Si c'est un vendeur, créer un abonnement FREE par défaut
      if (selectedRole === 'seller') {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('shop_name, is_seller, subscription_plan')
            .eq('id', user.id)
            .maybeSingle();

          // Si pas de plan d'abonnement défini, créer un plan FREE par défaut
          if (!profile?.subscription_plan) {
            const syncResult = await syncSubscriptionPlan(user.id, 'free');
            if (syncResult.success) {
              console.log('✅ Plan FREE créé pour nouveau vendeur');
            } else {
              console.error('❌ Erreur lors de la création du plan FREE:', syncResult.error);
            }
          }

          // Si le vendeur n'a pas encore configuré sa boutique, rediriger vers my-shop
          if (!profile?.shop_name) {
            console.log('🏪 Nouveau vendeur: redirection vers configuration boutique');
            router.replace('/seller/my-shop');
            return;
          }
        } catch (error) {
          console.error('Erreur lors de la configuration vendeur:', error);
        }
      }

      // Tous les utilisateurs → page d'accueil (sauf nouveaux vendeurs)
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Error saving role:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Erreur lors de l\'enregistrement du rôle. Veuillez réessayer.',
        [
          {
            text: 'Se reconnecter',
            onPress: () => router.replace('/simple-auth'),
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

  // Afficher un loader pendant la vérification
  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoHeader}>
          <PandaLogo size="large" showText={true} />
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
