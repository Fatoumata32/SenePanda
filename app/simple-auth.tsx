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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, EyeOff, Gift, CheckCircle, XCircle } from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import { Colors, Gradients, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction pour générer un code de parrainage unique
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 pour éviter confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState<{ id: string; name: string } | null>(null);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

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

  // Vérifier le code de parrainage
  const checkReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralStatus('idle');
      setReferrerInfo(null);
      return;
    }

    setReferralStatus('checking');

    try {
      const { data: referrer, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name')
        .eq('referral_code', code.toUpperCase())
        .maybeSingle();

      if (error || !referrer) {
        setReferralStatus('invalid');
        setReferrerInfo(null);
        return;
      }

      const referrerName = referrer.full_name || `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim() || 'Utilisateur';
      setReferrerInfo({ id: referrer.id, name: referrerName });
      setReferralStatus('valid');
    } catch (error) {
      console.error('Error checking referral code:', error);
      setReferralStatus('invalid');
      setReferrerInfo(null);
    }
  };

  // Gérer le changement du code de parrainage
  const handleReferralCodeChange = (text: string) => {
    const upperCode = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(upperCode);

    // Vérifier le code après un délai
    if (upperCode.length >= 4) {
      checkReferralCode(upperCode);
    } else {
      setReferralStatus('idle');
      setReferrerInfo(null);
    }
  };

  // Traiter le bonus de parrainage
  const processReferralBonus = async (newUserId: string, referrerId: string) => {
    const REFERRER_BONUS = 500; // 500 points pour le parrain
    const REFERRED_BONUS = 200; // 200 points pour le filleul (inscription)

    try {
      console.log('🎁 Traitement du bonus de parrainage...');

      // 1. Ajouter les points au parrain (500 points)
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('panda_coins')
        .eq('id', referrerId)
        .single();

      const currentPoints = referrerProfile?.panda_coins || 0;
      const newPoints = currentPoints + REFERRER_BONUS;

      await supabase
        .from('profiles')
        .update({ panda_coins: newPoints })
        .eq('id', referrerId);

      console.log(`✅ Parrain: ${currentPoints} → ${newPoints} points (+${REFERRER_BONUS})`);

      // 2. Créer l'entrée dans la table referrals
      await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_id: newUserId,
        status: 'completed',
        reward_amount: REFERRER_BONUS,
        created_at: new Date().toISOString(),
      });

      // 3. Enregistrer les transactions de points
      // Transaction pour le parrain (500 points)
      await supabase.from('points_transactions').insert({
        user_id: referrerId,
        points: REFERRER_BONUS,
        type: 'referral_bonus',
        description: 'Bonus de parrainage - Nouveau filleul inscrit (+500)',
        related_id: newUserId,
      });

      // Transaction pour le filleul (200 points)
      await supabase.from('points_transactions').insert({
        user_id: newUserId,
        points: REFERRED_BONUS,
        type: 'referral_bonus',
        description: 'Bonus de bienvenue - Inscription avec code parrain (+200)',
        related_id: referrerId,
      });

      console.log('✅ Bonus de parrainage traité avec succès!');
      console.log(`   Parrain: +${REFERRER_BONUS} points | Filleul: +${REFERRED_BONUS} points`);
    } catch (error) {
      console.error('❌ Erreur traitement parrainage:', error);
      // Ne pas bloquer l'inscription en cas d'erreur
    }
  };

  // Connexion avec Firebase Auth
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

    if (!password.trim() || password.length < 6) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 6 chiffres');
      return;
    }

    try {
      setLoading(true);

      // Générer l'email à partir du numéro
      const email = `${cleaned}@senepanda.app`;

      // Se connecter avec Firebase Auth
      const userCredential = await auth().signInWithEmailAndPassword(email, password);

      if (!userCredential.user?.uid) {
        throw new Error('Impossible de se connecter');
      }

      const userId = userCredential.user.uid;

      // Vérifier et attribuer un code de parrainage si l'utilisateur n'en a pas
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', userId)
          .single();

        if (profile && !profile.referral_code) {
          // Générer et attribuer un code de parrainage
          const newCode = generateReferralCode();
          await supabase
            .from('profiles')
            .update({ referral_code: newCode })
            .eq('id', userId);
          console.log('✅ Code de parrainage attribué:', newCode);
        }
      } catch (e) {
        console.warn('Vérification code parrainage:', e);
      }

      Speech.speak('Connexion réussie! Bienvenue', { language: 'fr-FR' });

      // Vérifier si l'utilisateur a déjà un rôle enregistré
      const savedRole = await AsyncStorage.getItem('user_preferred_role');
      if (savedRole) {
        // Rôle déjà choisi, aller directement à l'accueil
        router.replace('/(tabs)/home');
      } else {
        // Nouveau utilisateur, demander de choisir un rôle
        router.replace('/role-selection');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert(
          'Code PIN incorrect',
          'Le code PIN que vous avez saisi est incorrect. Réessayez ou créez un nouveau compte.',
          [
            { text: 'Réessayer', style: 'cancel' },
            { text: 'Créer un compte', onPress: () => setMode('signup') }
          ]
        );
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Erreur réseau', 'Vérifiez votre connexion internet et réessayez.');
      } else {
        Alert.alert(
          'Erreur de connexion',
          'Une erreur est survenue. Vérifiez vos informations ou créez un nouveau compte.',
          [
            { text: 'Réessayer', style: 'cancel' },
            { text: 'Créer un compte', onPress: () => setMode('signup') }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Réinitialisation du mot de passe avec Firebase
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

    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau code PIN doit contenir au moins 6 chiffres');
      return;
    }

    try {
      setLoading(true);

      // Générer l'email à partir du numéro
      const email = `${cleaned}@senepanda.app`;

      // Envoyer un email de réinitialisation avec Firebase
      await auth().sendPasswordResetEmail(email);

      Speech.speak('Email de réinitialisation envoyé', { language: 'fr-FR' });
      Alert.alert(
        '✅ Email envoyé',
        'Vérifiez votre email pour les instructions de réinitialisation du code PIN.',
        [
          {
            text: 'Se connecter',
            onPress: () => {
              setMode('signin');
              setPassword('');
              setNewPassword('');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error resetting password:', error);

      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'Compte introuvable',
          'Aucun compte n\'existe avec ce numéro. Créez un nouveau compte.',
          [{ text: 'OK', onPress: () => setMode('signup') }]
        );
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Erreur réseau', 'Vérifiez votre connexion internet et réessayez.');
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue. Réessayez dans quelques instants.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Inscription avec Firebase Auth
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

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 6 chiffres');
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

      // Créer l'utilisateur avec Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      if (!userCredential.user?.uid) {
        throw new Error('Erreur lors de la création du compte');
      }

      const userId = userCredential.user.uid;

      // Préparer les données du profil avec le parrainage si valide
      const profileData: any = {
        id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone: cleaned,
        username: `user_${userId.substring(0, 8)}`,
        email: email,
        is_seller: false,
        panda_coins: 0,
        referral_code: generateReferralCode(), // Générer un code de parrainage unique
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Si parrainage valide, ajouter l'ID du parrain
      if (referralStatus === 'valid' && referrerInfo) {
        profileData.referred_by = referrerInfo.id;
        profileData.panda_coins = 200; // Bonus filleul (200 points)
        console.log('✅ Parrainage valide, parrain:', referrerInfo.id, '- Filleul reçoit 200 points');
      }

      // Créer le profil dans Supabase
      const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error('Erreur création profil:', profileError);
        throw profileError;
      }

      console.log('Profil créé avec succès!');

      // Traiter le parrainage si valide
      if (referralStatus === 'valid' && referrerInfo) {
        await processReferralBonus(userId, referrerInfo.id);
      }

      // Message de succès avec info parrainage
      const successMessage = referralStatus === 'valid' && referrerInfo
        ? `Bienvenue sur SenePanda!\n\n🎁 Vous avez reçu 200 PandaCoins grâce au parrainage de ${referrerInfo.name}!`
        : 'Bienvenue sur SenePanda!';

      Speech.speak('Compte créé avec succès!', { language: 'fr-FR' });
      Alert.alert('✅ Succès', successMessage, [
        { text: 'Continuer', onPress: () => router.replace('/role-selection') }
      ]);

    } catch (error: any) {
      console.error('Error signing up:', error);

      if (error.code === 'auth/email-already-in-use' || error.message?.includes('already registered')) {
        Alert.alert(
          'Numéro déjà utilisé',
          'Ce numéro est déjà enregistré. Essayez de vous connecter.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Erreur', 'Le code PIN n\'est pas assez fort. Utilisez au moins 6 chiffres.');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Erreur réseau', 'Vérifiez votre connexion internet et réessayez.');
      } else {
        const message = error.message?.includes('Network')
          ? 'Vérifiez votre connexion internet'
          : 'Erreur lors de la création du compte';

        Alert.alert('Erreur', message);
      }
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

                {/* Code de parrainage (optionnel) */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Gift size={16} color={Colors.primaryOrange} />
                    <Text style={styles.label}>Code de parrainage</Text>
                    <Text style={styles.optionalLabel}>(optionnel)</Text>
                  </View>
                  <View style={[
                    styles.referralInputContainer,
                    referralStatus === 'valid' && styles.referralInputValid,
                    referralStatus === 'invalid' && styles.referralInputInvalid,
                  ]}>
                    <TextInput
                      style={styles.referralInput}
                      value={referralCode}
                      onChangeText={handleReferralCodeChange}
                      placeholder="Ex: ABC12345"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                      maxLength={10}
                      editable={!loading}
                    />
                    {referralStatus === 'checking' && (
                      <ActivityIndicator size="small" color={Colors.primaryOrange} />
                    )}
                    {referralStatus === 'valid' && (
                      <CheckCircle size={20} color="#10B981" />
                    )}
                    {referralStatus === 'invalid' && (
                      <XCircle size={20} color="#EF4444" />
                    )}
                  </View>
                  {referralStatus === 'valid' && referrerInfo && (
                    <View style={styles.referrerInfoBox}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.referrerInfoText}>
                        Parrainé par {referrerInfo.name} - Vous recevrez 500 FCFA !
                      </Text>
                    </View>
                  )}
                  {referralStatus === 'invalid' && (
                    <Text style={styles.referralErrorText}>
                      Code de parrainage invalide
                    </Text>
                  )}
                  {referralStatus === 'idle' && (
                    <Text style={styles.hint}>
                      Entrez le code d'un ami pour recevoir 500 FCFA de bonus !
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* Code PIN */}
            {mode !== 'reset' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {mode === 'signin' ? 'Code PIN (minimum 6 chiffres)' : 'Créer un code PIN (minimum 6 chiffres)'}
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
                    ? 'Choisissez un code PIN de 6 chiffres minimum (ex: 123456)'
                    : 'Entrez votre code PIN (6 chiffres minimum)'}
                </Text>
              </View>
            )}

            {/* Nouveau code PIN pour reset */}
            {mode === 'reset' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nouveau code PIN (minimum 6 chiffres)</Text>
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
                  Choisissez un nouveau code PIN de 6 chiffres minimum
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
  // Styles pour le code de parrainage
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  optionalLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  referralInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    ...Shadows.small,
  },
  referralInputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  referralInputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  referralInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 2,
  },
  referrerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  referrerInfoText: {
    fontSize: Typography.fontSize.xs,
    color: '#065F46',
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  referralErrorText: {
    fontSize: Typography.fontSize.xs,
    color: '#DC2626',
    marginTop: Spacing.xs,
  },
});
