import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, User, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import * as Speech from 'expo-speech';

type AuthMode = 'signin' | 'signup';

export default function SimpleAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Données du formulaire
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  // Nettoyer le numéro de téléphone
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s-]/g, '');
  };

  // Valider le numéro de téléphone
  const isValidPhone = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return /^\+221[0-9]{9}$/.test(cleaned);
  };

  // Connexion
  const handleSignIn = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    const cleaned = cleanPhoneNumber(phoneNumber);
    if (!isValidPhone(cleaned)) {
      Alert.alert(
        'Numéro invalide',
        'Format attendu: +221 77 123 45 67'
      );
      return;
    }

    if (!password.trim() || password.length < 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 4 chiffres');
      return;
    }

    try {
      setLoading(true);

      // Générer l'email à partir du numéro
      const email = `${cleaned}@senepanda.app`;

      // Tenter de se connecter
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Vérifier le type d'erreur
        if (authError.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Code PIN incorrect',
            'Le code PIN que vous avez saisi est incorrect. Réessayez ou créez un nouveau compte.',
            [
              { text: 'Réessayer', style: 'cancel' },
              { text: 'Créer un compte', onPress: () => setMode('signup') }
            ]
          );
        } else if (authError.message.includes('Email not confirmed')) {
          Alert.alert(
            'Compte non vérifié',
            'Votre compte existe mais n\'est pas vérifié. Nous allons le vérifier automatiquement.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  // Confirmer l'email automatiquement pour contourner la vérification
                  try {
                    await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });
                    Speech.speak('Connexion réussie! Bienvenue', { language: 'fr-FR' });
                    router.replace('/role-selection');
                  } catch (e) {
                    console.error('Retry error:', e);
                  }
                }
              }
            ]
          );
        } else {
          throw authError;
        }
        return;
      }

      if (!authData?.user) {
        throw new Error('Impossible de se connecter');
      }

      Speech.speak('Connexion réussie! Bienvenue', { language: 'fr-FR' });
      router.replace('/role-selection');
    } catch (error: any) {
      console.error('Error signing in:', error);
      Alert.alert(
        'Erreur de connexion',
        'Une erreur est survenue. Vérifiez vos informations ou créez un nouveau compte.',
        [
          { text: 'Réessayer', style: 'cancel' },
          { text: 'Créer un compte', onPress: () => setMode('signup') }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const handleSignUp = async () => {
    if (!phoneNumber.trim() || !firstName.trim() || !lastName.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const cleaned = cleanPhoneNumber(phoneNumber);
    if (!isValidPhone(cleaned)) {
      Alert.alert(
        'Numéro invalide',
        'Format attendu: +221 77 123 45 67'
      );
      return;
    }

    if (password.length < 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 4 chiffres');
      return;
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      Alert.alert('Erreur', 'Le prénom et le nom doivent contenir au moins 2 caractères');
      return;
    }

    try {
      setLoading(true);

      // Vérifier si le numéro existe déjà
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, phone')
        .eq('phone', cleaned)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingProfile) {
        Alert.alert(
          'Numéro déjà utilisé',
          'Ce numéro de téléphone est déjà associé à un compte. Voulez-vous vous connecter ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => setMode('signin') }
          ]
        );
        return;
      }

      // Créer un email à partir du téléphone
      const email = `${cleaned}@senepanda.app`;

      // Créer le compte dans Supabase Auth avec options pour éviter l'email de confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: cleaned,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          emailRedirectTo: undefined, // Pas de redirection email
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          Alert.alert(
            'Email déjà utilisé',
            'Ce numéro est déjà enregistré. Essayez de vous connecter.',
            [
              { text: 'OK', onPress: () => setMode('signin') }
            ]
          );
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Impossible de créer le compte');
      }

      // Créer le profil dans la table profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone: cleaned,
        username: `user_${authData.user.id.substring(0, 8)}`,
        email: email,
        is_seller: false,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Ne pas bloquer si l'erreur est que le profil existe déjà
        if (!profileError.message.includes('duplicate key')) {
          throw profileError;
        }
      }

      Speech.speak('Compte créé avec succès! Bienvenue', { language: 'fr-FR' });
      Alert.alert(
        'Compte créé !',
        `Votre compte a été créé avec succès.\n\nNuméro: ${cleaned}\nCode PIN: ${password}\n\nNotez bien votre code PIN, vous en aurez besoin pour vous connecter.`,
        [
          { text: 'Continuer', onPress: () => router.replace('/role-selection') }
        ]
      );
    } catch (error: any) {
      console.error('Error signing up:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer le compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <PandaLogo size="large" showText={true} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.iconContainer}>
              {mode === 'signin' ? (
                <View style={styles.phoneIconWrapper}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.phoneIconGradient}>
                    <Phone size={36} color={Colors.white} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.phoneIconWrapper}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.phoneIconGradient}>
                    <User size={36} color={Colors.white} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
              )}
            </View>

            <Text style={styles.title}>
              {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Connectez-vous avec votre numéro et code PIN'
                : 'Inscrivez-vous en quelques secondes'}
            </Text>

            {/* Numéro de téléphone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.inputPhoneIconWrapper}>
                  <Phone size={18} color={Colors.primaryOrange} strokeWidth={2.5} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+221 77 123 45 67"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                  editable={!loading}
                />
              </View>
            </View>

            {/* Champs supplémentaires pour l'inscription */}
            {mode === 'signup' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Jean"
                    placeholderTextColor={Colors.textMuted}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Dupont"
                    placeholderTextColor={Colors.textMuted}
                    editable={!loading}
                  />
                </View>
              </>
            )}

            {/* Code PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {mode === 'signin' ? 'Code PIN (4-6 chiffres)' : 'Créer un code PIN (4-6 chiffres)'}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••"
                  keyboardType="number-pad"
                  secureTextEntry={!showPassword}
                  maxLength={6}
                  placeholderTextColor={Colors.textMuted}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.textMuted} />
                  ) : (
                    <Eye size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                {mode === 'signup'
                  ? 'Choisissez un code PIN facile à retenir (ex: 1234)'
                  : 'Entrez votre code PIN de 4 à 6 chiffres'}
              </Text>
            </View>

            {/* Bouton principal */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}>
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
                  <Text style={styles.buttonText}>
                    {mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
                  </Text>
                  <ArrowRight size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Lien pour changer de mode */}
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setPassword(''); // Réinitialiser le mot de passe
              }}
              disabled={loading}>
              <Text style={styles.switchModeText}>
                {mode === 'signin' ? (
                  <>Pas de compte ? <Text style={styles.switchModeBold}>Créer un compte</Text></>
                ) : (
                  <>Déjà un compte ? <Text style={styles.switchModeBold}>Se connecter</Text></>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  phoneIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    ...Shadows.orange,
    elevation: 8,
  },
  phoneIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputPhoneIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    ...Shadows.small,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    ...Shadows.small,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    ...Shadows.small,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 4,
  },
  eyeButton: {
    padding: Spacing.sm,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  primaryButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.orange,
    overflow: 'hidden',
    marginTop: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  switchModeButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  switchModeBold: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
  },
});
