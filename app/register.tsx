import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Phone,
  Globe,
  Facebook,
  Instagram,
  Gift,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();

  // Étape actuelle (1-2)
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Données du formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Réseaux sociaux (optionnel)
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Code parrainage
  const [referralCode, setReferralCode] = useState('');

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animer la barre de progression (2 étapes)
    const progress = currentStep / 2;
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
    }).start();

    // Animer le changement d'étape
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!firstName || !lastName || !email || !username || !phoneNumber || !country) {
          Alert.alert('Attention', 'Veuillez remplir tous les champs obligatoires');
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          Alert.alert('Attention', 'Veuillez entrer un email valide');
          return false;
        }
        if (!password || password.length < 6) {
          Alert.alert('Attention', 'Le mot de passe doit contenir au moins 6 caractères');
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert('Attention', 'Les mots de passe ne correspondent pas');
          return false;
        }
        return true;

      case 2:
        // Étape optionnelle (réseaux sociaux et parrainage)
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      const maxStep = 2; // 2 étapes : infos perso + réseaux sociaux/parrainage
      if (currentStep < maxStep) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    setLoading(true);

    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // 2. Créer le profil (is_seller: false par défaut, sera modifié dans role-selection)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        phone: phoneNumber,
        country,
        city: city || null,
        is_seller: false, // Par défaut acheteur, changeable dans role-selection
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        whatsapp_number: whatsappNumber || null,
        website_url: websiteUrl || null,
      });

      if (profileError) throw profileError;

      // 3. Gérer le code de parrainage avec la fonction RPC
      let welcomePoints = 0;
      if (referralCode && referralCode.trim().length === 8) {
        const { data: referralResult, error: referralError } = await supabase.rpc(
          'register_referral',
          {
            p_referred_user_id: authData.user.id,
            p_referral_code: referralCode.trim().toUpperCase(),
          }
        );

        if (referralError) {
          console.error('Erreur parrainage:', referralError);
        } else if (referralResult?.success) {
          welcomePoints = referralResult.welcome_points || 50;
        }
      }

      // Attendre un peu que la session soit bien établie
      await new Promise(resolve => setTimeout(resolve, 500));

      // Message de bienvenue avec points
      const welcomeMessage = welcomePoints > 0
        ? `Inscription réussie! Vous avez reçu ${welcomePoints} Panda Coins de bienvenue!`
        : 'Inscription réussie! Bienvenue sur SenePanda!';

      Alert.alert('Succès', welcomeMessage);
      Speech.speak(welcomeMessage, {
        language: 'fr-FR',
        rate: 0.9,
      });

      // Rediriger vers la sélection de rôle
      router.replace('/role-selection');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const maxStep = 2; // 2 étapes seulement
    const steps = [];

    for (let i = 1; i <= maxStep; i++) {
      steps.push(
        <View key={i} style={styles.stepDot}>
          <View
            style={[
              styles.stepCircle,
              i <= currentStep && styles.stepCircleActive,
            ]}>
            {i <= currentStep && (
              <LinearGradient
                colors={Gradients.goldOrange.colors}
                start={Gradients.goldOrange.start}
                end={Gradients.goldOrange.end}
                style={StyleSheet.absoluteFill}
              />
            )}
            {i < currentStep ? (
              <Check size={12} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  i <= currentStep && styles.stepNumberActive,
                ]}>
                {i}
              </Text>
            )}
          </View>
          {i < maxStep && <View style={styles.stepLine} />}
        </View>
      );
    }

    return <View style={styles.stepIndicator}>{steps}</View>;
  };

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.stepTitle}>Vos informations</Text>
      <Text style={styles.stepSubtitle}>
        Créez votre profil en quelques étapes
      </Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Jean"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Dupont"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="jean@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom d'utilisateur *</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="jean_dupont"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Téléphone *</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+221 77 123 45 67"
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Pays *</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Sénégal"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Dakar"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mot de passe *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmer le mot de passe *</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </Animated.View>
  );

  const renderStep2 = () => {
    // Étape 2 : Code de parrainage et réseaux sociaux (optionnels)
    return (
      <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.stepTitle}>Informations complémentaires</Text>
        <Text style={styles.stepSubtitle}>
          Optionnel - Complétez votre profil
        </Text>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Gift size={18} color="#10B981" />
            <Text style={styles.label}>Code de parrainage (optionnel)</Text>
          </View>
          <View style={styles.referralInputContainer}>
            <TextInput
              style={styles.referralInput}
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              placeholder="ABC12345"
              autoCapitalize="characters"
              maxLength={8}
              placeholderTextColor="#9CA3AF"
            />
            {referralCode.length === 8 && (
              <View style={styles.checkMark}>
                <Check size={18} color="#10B981" />
              </View>
            )}
          </View>
          <View style={styles.bonusCard}>
            <Gift size={16} color="#10B981" />
            <Text style={styles.bonusText}>
              Bonus: Recevez 50 Panda Coins de bienvenue!
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Facebook size={16} color="#1877F2" />
            <Text style={styles.label}>Facebook</Text>
          </View>
          <TextInput
            style={styles.input}
            value={facebookUrl}
            onChangeText={setFacebookUrl}
            placeholder="https://facebook.com/votreprofil"
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Instagram size={16} color="#E4405F" />
            <Text style={styles.label}>Instagram</Text>
          </View>
          <TextInput
            style={styles.input}
            value={instagramUrl}
            onChangeText={setInstagramUrl}
            placeholder="https://instagram.com/votreprofil"
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Phone size={16} color="#25D366" />
            <Text style={styles.label}>WhatsApp</Text>
          </View>
          <TextInput
            style={styles.input}
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            placeholder="+221 XX XXX XX XX"
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Globe size={16} color="#6366F1" />
            <Text style={styles.label}>Site web</Text>
          </View>
          <TextInput
            style={styles.input}
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            placeholder="https://votresite.com"
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </Animated.View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1(); // Informations personnelles
      case 2:
        return renderStep2(); // Parrainage et réseaux sociaux
      default:
        return null;
    }
  };

  const maxStep = 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {currentStep > 1 && (
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <PandaLogo size="small" showText={false} />
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}>
            <LinearGradient
              colors={Gradients.goldOrange.colors}
              start={Gradients.goldOrange.start}
              end={Gradients.goldOrange.end}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>
          Étape {currentStep} sur {maxStep}
        </Text>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={currentStep === maxStep ? 'Créer mon compte' : 'Continuer'}
          accessibilityState={{ disabled: loading }}>
          <LinearGradient
            colors={Gradients.goldOrange.colors}
            start={Gradients.goldOrange.start}
            end={Gradients.goldOrange.end}
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === maxStep ? 'Créer mon compte' : 'Continuer'}
              </Text>
              <ArrowRight size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/profile')}
          style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Déjà un compte? <Text style={styles.loginLinkBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    overflow: 'hidden',
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  stepContent: {
    width: '100%',
  },
  stepTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#374151',
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  referralInputContainer: {
    position: 'relative',
  },
  referralInput: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  checkMark: {
    position: 'absolute',
    right: Spacing.sm + 2,
    top: Spacing.sm + 2,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#D1FAE5',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  bonusText: {
    flex: 1,
    fontSize: Typography.fontSize.sm - 1,
    fontWeight: Typography.fontWeight.semibold,
    color: '#10B981',
  },
  footer: {
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.orange,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  loginLinkBold: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
  },
});
