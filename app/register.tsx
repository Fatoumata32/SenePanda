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
  User,
  Store,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Gift,
  Check,
  ArrowRight,
  ArrowLeft,
  Volume2,
  ShoppingBag,
  UserCircle2,
} from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';

type UserRole = 'buyer' | 'seller';

export default function RegisterScreen() {
  const router = useRouter();

  // Étape actuelle (1-3) - On commence à 1 (pas de choix de rôle ici)
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState<UserRole>('buyer'); // Rôle par défaut, sera modifié dans role-selection
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

  // Données boutique (si vendeur)
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopCategory, setShopCategory] = useState('');
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
    // Animer la barre de progression
    const progress = userRole === 'seller' ? currentStep / 4 : currentStep / 3;
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

      // 3. Gérer le code de parrainage
      if (referralCode && referralCode.length === 8) {
        const { data: referrerData } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (referrerData) {
          await supabase.from('referrals').insert({
            referrer_id: referrerData.id,
            referred_id: authData.user.id,
          });
        }
      }

      // Attendre un peu que la session soit bien établie
      await new Promise(resolve => setTimeout(resolve, 500));

      Speech.speak('Inscription réussie! Bienvenue sur SenePanda!', {
        language: 'fr-FR',
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
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
      <Text style={styles.stepTitle}>Choisissez votre type de compte</Text>
      <Text style={styles.stepSubtitle}>
        Vous pourrez toujours changer plus tard
      </Text>

      <TouchableOpacity
        style={[
          styles.roleCard,
          userRole === 'buyer' && styles.roleCardSelected,
        ]}
        onPress={() => setUserRole('buyer')}>
        <View style={[styles.roleIcon, { backgroundColor: '#DBEAFE' }]}>
          <ShoppingBag size={32} color="#3B82F6" />
        </View>
        <View style={styles.roleContent}>
          <Text style={styles.roleTitle}>Acheteur</Text>
          <Text style={styles.roleDescription}>
            Découvrez et achetez des produits locaux
          </Text>
        </View>
        {userRole === 'buyer' && (
          <View style={styles.roleCheck}>
            <Check size={20} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleCard,
          userRole === 'seller' && styles.roleCardSelected,
        ]}
        onPress={() => setUserRole('seller')}>
        <View style={[styles.roleIcon, { backgroundColor: '#FEE2E2' }]}>
          <Store size={32} color="#EF4444" />
        </View>
        <View style={styles.roleContent}>
          <Text style={styles.roleTitle}>Vendeur</Text>
          <Text style={styles.roleDescription}>
            Créez votre boutique et vendez vos produits
          </Text>
        </View>
        {userRole === 'seller' && (
          <View style={styles.roleCheck}>
            <Check size={20} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep2 = () => (
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

  const renderStep3 = () => {
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

  const renderStep4 = () => (
    <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.stepTitle}>Réseaux sociaux</Text>
      <Text style={styles.stepSubtitle}>
        Optionnel - Boostez votre visibilité
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Facebook size={16} color="#1877F2" />
          <Text style={styles.label}>Facebook</Text>
        </View>
        <TextInput
          style={styles.input}
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="https://facebook.com/votre-page"
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
          placeholder="https://instagram.com/votre-profil"
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
          placeholder="+221 77 123 45 67"
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Globe size={16} color="#6B7280" />
          <Text style={styles.label}>Site Web</Text>
        </View>
        <TextInput
          style={styles.input}
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          placeholder="https://votre-site.com"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

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
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep2(); // Informations personnelles
      case 2:
        return renderStep3(); // Parrainage et réseaux sociaux
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
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
          disabled={loading}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === maxStep ? 'Créer mon compte' : 'Continuer'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    overflow: 'hidden',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContent: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  referralInputContainer: {
    position: 'relative',
  },
  referralInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 2,
    textAlign: 'center',
  },
  checkMark: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  bonusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#FF8C42',
  },
});
