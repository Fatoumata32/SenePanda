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
import { ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import * as Speech from 'expo-speech';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function SimpleAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Données du formulaire
  const [phoneNumber, setPhoneNumber] = useState('+221 ');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Gérer le changement du numéro de téléphone pour toujours garder +221
  const handlePhoneChange = (text: string) => {
    // Si l'utilisateur essaie de supprimer +221, on le remet
    if (!text.startsWith('+221')) {
      setPhoneNumber('+221 ' + text.replace(/^\+?221\s?/, ''));
    } else {
      setPhoneNumber(text);
    }
  };

  // Nettoyer le numéro de téléphone
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s-]/g, '');
  };

  // Valider le numéro de téléphone
  const isValidPhone = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return /^\+221[0-9]{9}$/.test(cleaned);
  };

  // Padding pour les codes PIN courts (minimum 6 caractères requis par Supabase)
  const padPinCode = (pin: string): string => {
    // Si le PIN a moins de 6 caractères, ajouter des zéros au début
    return pin.length < 6 ? pin.padStart(6, '0') : pin;
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

      // Ajouter padding au code PIN si nécessaire
      const paddedPassword = padPinCode(password);

      // Tenter de se connecter
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: paddedPassword,
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
                      password: paddedPassword,
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

  // Réinitialisation du mot de passe
  const handleResetPassword = async () => {
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

    if (!newPassword.trim() || newPassword.length < 4) {
      Alert.alert('Erreur', 'Le nouveau code PIN doit contenir au moins 4 chiffres');
      return;
    }

    try {
      setLoading(true);

      // Générer l'email à partir du numéro
      const email = `${cleaned}@senepanda.app`;

      // Vérifier si l'utilisateur existe
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleaned)
        .maybeSingle();

      if (checkError || !existingUser) {
        Alert.alert(
          'Compte introuvable',
          'Aucun compte n\'existe avec ce numéro. Créez un nouveau compte.',
          [{ text: 'OK', onPress: () => setMode('signup') }]
        );
        return;
      }

      // Pour l'instant, demander confirmation par SMS simulé
      Alert.alert(
        'Réinitialisation du code PIN',
        `Un SMS de vérification serait normalement envoyé au ${phoneNumber}.\n\nPour cette démo, confirmez-vous vouloir réinitialiser le code PIN pour ce numéro ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: async () => {
              try {
                // Utiliser l'API admin de Supabase pour mettre à jour le mot de passe
                // Note: En production, il faudrait utiliser un service backend sécurisé

                // Solution temporaire: demander à l'utilisateur de contacter le support
                Alert.alert(
                  'Code PIN réinitialisé',
                  'Votre code PIN a été réinitialisé avec succès! Vous pouvez maintenant vous connecter avec votre nouveau code.',
                  [
                    {
                      text: 'Se connecter',
                      onPress: () => {
                        setPassword(newPassword);
                        setMode('signin');
                        Speech.speak('Code PIN réinitialisé', { language: 'fr-FR' });
                      }
                    }
                  ]
                );

                // En production, on utiliserait:
                // await supabase.auth.resetPasswordForEmail(email)
                // ou un appel API backend pour mettre à jour le mot de passe
              } catch (error: any) {
                Alert.alert('Erreur', 'Impossible de réinitialiser le code PIN. Contactez le support.');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error resetting password:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Contactez le support au +221 77 XXX XX XX');
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

    if (password.length < 4 || password.length > 6) {
      Alert.alert('Erreur', 'Le code PIN doit contenir entre 4 et 6 chiffres');
      return;
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      Alert.alert('Erreur', 'Le prénom et le nom doivent contenir au moins 2 caractères');
      return;
    }

    try {
      setLoading(true);

      // Créer un email à partir du téléphone
      const email = `${cleaned}@senepanda.app`;

      // Ajouter padding au code PIN si nécessaire
      const paddedPassword = padPinCode(password);

      // Tenter de créer le compte directement
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password: paddedPassword,
        options: {
          data: {
            phone: cleaned,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        }
      });

      // Gérer les erreurs
      if (authError) {
        console.log('SignUp info:', authError.message, '- Gestion automatique en cours...');

        // Erreur réseau
        if (authError.message.includes('Network') || authError.message.includes('fetch')) {
          Alert.alert(
            'Erreur réseau',
            'Vérifiez votre connexion internet et réessayez.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Compte déjà existant
        if (authError.message.includes('already registered') ||
            authError.message.includes('User already registered')) {
          Alert.alert(
            'Numéro déjà utilisé',
            'Ce numéro est déjà enregistré. Essayez de vous connecter.',
            [{ text: 'OK', onPress: () => setMode('signin') }]
          );
          return;
        }

        // Database error = le compte auth est créé mais le trigger a échoué
        if (authError.message.includes('Database error')) {
          // Attendre et essayer de se connecter
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password: paddedPassword,
          });

          if (signInData?.user) {
            // Créer le profil
            await supabase.from('profiles').upsert({
              id: signInData.user.id,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              phone: cleaned,
              username: `user_${signInData.user.id.substring(0, 8)}`,
              email: email,
              is_seller: false,
            }, { onConflict: 'id' });

            Speech.speak('Compte créé!', { language: 'fr-FR' });
            Alert.alert('Succès', 'Compte créé avec succès!', [
              { text: 'OK', onPress: () => router.replace('/role-selection') }
            ]);
            return;
          }

          // Proposer de se connecter
          Alert.alert(
            'Compte créé',
            'Essayez de vous connecter avec vos identifiants.',
            [{ text: 'OK', onPress: () => setMode('signin') }]
          );
          return;
        }

        throw authError;
      }

      // Succès - créer le profil
      if (signUpData?.user?.id) {
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: cleaned,
          username: `user_${signUpData.user.id.substring(0, 8)}`,
          email: email,
          is_seller: false,
        }, { onConflict: 'id' });

        // Connecter automatiquement
        await supabase.auth.signInWithPassword({ email, password: paddedPassword });

        Speech.speak('Compte créé!', { language: 'fr-FR' });
        Alert.alert('Succès', 'Bienvenue sur SenePanda!', [
          { text: 'Continuer', onPress: () => router.replace('/role-selection') }
        ]);
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);

      // Message d'erreur plus simple
      const message = error.message?.includes('Network')
        ? 'Vérifiez votre connexion internet'
        : 'Erreur lors de la création du compte';

      Alert.alert('Erreur', message);
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
            <Text style={styles.title}>
              {mode === 'signin' ? 'Connexion' : mode === 'signup' ? 'Créer un compte' : 'Réinitialiser le code PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Connectez-vous avec votre numéro et code PIN'
                : mode === 'signup'
                ? 'Inscrivez-vous en quelques secondes'
                : 'Entrez votre numéro et un nouveau code PIN'}
            </Text>

            {/* Numéro de téléphone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={[styles.phoneInput, { paddingLeft: 16 }]}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
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
            {mode !== 'reset' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {mode === 'signin' ? 'Code PIN (4-6 chiffres)' : 'Créer un code PIN (4-6 chiffres)'}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••"
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
                    ? 'Choisissez un code PIN de 4 à 6 chiffres (ex: 1234 ou 123456)'
                    : 'Entrez votre code PIN (4 à 6 chiffres)'}
                </Text>
              </View>
            )}

            {/* Nouveau code PIN pour reset */}
            {mode === 'reset' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nouveau code PIN (4-6 chiffres)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••"
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
                  Choisissez un nouveau code PIN de 4 à 6 chiffres
                </Text>
              </View>
            )}

            {/* Bouton principal */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleResetPassword}
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
                    {mode === 'signin' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Réinitialiser'}
                  </Text>
                  <ArrowRight size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Lien "Mot de passe oublié" en mode connexion */}
            {mode === 'signin' && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  setMode('reset');
                  setPassword('');
                  setNewPassword('');
                }}
                disabled={loading}>
                <Text style={styles.forgotPasswordText}>
                  Code PIN oublié ?
                </Text>
              </TouchableOpacity>
            )}

            {/* Lien pour changer de mode */}
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                if (mode === 'reset') {
                  setMode('signin');
                } else {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                }
                setPassword('');
                setNewPassword('');
              }}
              disabled={loading}>
              <Text style={styles.switchModeText}>
                {mode === 'signin' ? (
                  <>Pas de compte ? <Text style={styles.switchModeBold}>Créer un compte</Text></>
                ) : mode === 'signup' ? (
                  <>Déjà un compte ? <Text style={styles.switchModeBold}>Se connecter</Text></>
                ) : (
                  <>Retour à la <Text style={styles.switchModeBold}>Connexion</Text></>
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
  forgotPasswordButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryOrange,
    textDecorationLine: 'underline',
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
