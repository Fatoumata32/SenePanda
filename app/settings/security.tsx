import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Lock,
  Fingerprint,
  Shield,
  Eye,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  isAutoLoginEnabled,
  setAutoLoginEnabled,
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getBiometricType,
  getStoredCredentials,
} from '@/lib/secureAuth';
import { useAuth } from '@/providers/AuthProvider';
import * as Haptics from 'expo-haptics';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [autoLoginActive, setAutoLoginActive] = useState(false);
  const [biometricActive, setBiometricActive] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biométrie');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Vérifier auto-login
      const autoLogin = await isAutoLoginEnabled();
      setAutoLoginActive(autoLogin);

      // Vérifier biométrie
      const bioAvailable = await isBiometricAvailable();
      setBiometricAvailable(bioAvailable);

      if (bioAvailable) {
        const bioType = await getBiometricType();
        setBiometricType(bioType);

        const bioEnabled = await isBiometricEnabled();
        setBiometricActive(bioEnabled);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const handleToggleAutoLogin = async (value: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!value) {
        // Désactiver auto-login
        Alert.alert(
          'Désactiver la connexion automatique ?',
          'Vous devrez vous reconnecter manuellement à chaque ouverture de l\'app.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Désactiver',
              style: 'destructive',
              onPress: async () => {
                await setAutoLoginEnabled(false);
                setAutoLoginActive(false);

                // Si biométrie active, la désactiver aussi
                if (biometricActive) {
                  await disableBiometric();
                  setBiometricActive(false);
                }

                Alert.alert('✅ Désactivé', 'La connexion automatique est désactivée');
              },
            },
          ]
        );
      } else {
        // Activer auto-login
        const credentials = await getStoredCredentials();

        if (!credentials) {
          Alert.alert(
            'Connexion requise',
            'Reconnectez-vous pour activer la connexion automatique',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.push('/simple-auth');
                },
              },
            ]
          );
          return;
        }

        await setAutoLoginEnabled(true);
        setAutoLoginActive(true);
        Alert.alert('✅ Activé', 'La connexion automatique est activée');
      }
    } catch (error) {
      console.error('Error toggling auto-login:', error);
      Alert.alert('Erreur', 'Impossible de modifier ce paramètre');
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);

      if (!value) {
        // Désactiver biométrie
        Alert.alert(
          `Désactiver ${biometricType} ?`,
          'Vous devrez entrer votre code PIN pour vous connecter.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Désactiver',
              style: 'destructive',
              onPress: async () => {
                await disableBiometric();
                setBiometricActive(false);
                Alert.alert('✅ Désactivé', `${biometricType} désactivé`);
              },
            },
          ]
        );
      } else {
        // Activer biométrie
        if (!autoLoginActive) {
          Alert.alert(
            'Connexion automatique requise',
            'Activez d\'abord la connexion automatique pour utiliser la biométrie',
            [
              {
                text: 'Activer',
                onPress: async () => {
                  await handleToggleAutoLogin(true);
                },
              },
              { text: 'Annuler', style: 'cancel' },
            ]
          );
          setLoading(false);
          return;
        }

        const credentials = await getStoredCredentials();
        if (!credentials) {
          Alert.alert(
            'Credentials manquants',
            'Reconnectez-vous pour activer la biométrie',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.push('/simple-auth');
                },
              },
            ]
          );
          setLoading(false);
          return;
        }

        const success = await enableBiometric(credentials.phone, credentials.pin);

        if (success) {
          setBiometricActive(true);
          Alert.alert('✅ Activé', `${biometricType} activé avec succès!`);
        } else {
          Alert.alert('Erreur', `Impossible d'activer ${biometricType}`);
        }
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Erreur', 'Impossible de modifier ce paramètre');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sécurité & Connexion</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Connexion Automatique */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={Colors.primaryOrange} />
            <Text style={styles.sectionTitle}>Connexion automatique</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Rester connecté</Text>
                <Text style={styles.settingDescription}>
                  Restez connecté automatiquement à chaque ouverture de l'app
                </Text>
              </View>
              <Switch
                value={autoLoginActive}
                onValueChange={handleToggleAutoLogin}
                trackColor={{ false: Colors.borderLight, true: Colors.primaryOrange }}
                thumbColor={Colors.white}
                disabled={loading}
              />
            </View>

            {autoLoginActive && (
              <View style={styles.statusBadge}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.statusText}>
                  Connecté automatiquement à chaque ouverture
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section Biométrie */}
        {biometricAvailable && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Fingerprint size={20} color={Colors.primaryOrange} />
              <Text style={styles.sectionTitle}>Authentification biométrique</Text>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{biometricType}</Text>
                  <Text style={styles.settingDescription}>
                    Connexion rapide avec {biometricType.toLowerCase()}
                  </Text>
                </View>
                <Switch
                  value={biometricActive}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: Colors.borderLight, true: Colors.primaryOrange }}
                  thumbColor={Colors.white}
                  disabled={loading || !autoLoginActive}
                />
              </View>

              {biometricActive && (
                <View style={styles.statusBadge}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.statusText}>
                    Connexion en 2 secondes avec {biometricType.toLowerCase()}
                  </Text>
                </View>
              )}

              {!autoLoginActive && (
                <View style={styles.warningBadge}>
                  <Shield size={16} color="#F59E0B" />
                  <Text style={styles.warningText}>
                    Activez la connexion automatique pour utiliser la biométrie
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Section Sécurité */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.primaryOrange} />
            <Text style={styles.sectionTitle}>Sécurité des données</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Eye size={18} color={Colors.textMuted} />
              <Text style={styles.infoText}>
                Vos identifiants sont chiffrés et stockés de manière sécurisée
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Lock size={18} color={Colors.textMuted} />
              <Text style={styles.infoText}>
                Chiffrement matériel (Keychain iOS / Keystore Android)
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Shield size={18} color={Colors.textMuted} />
              <Text style={styles.infoText}>
                Aucun accès possible depuis l'extérieur de l'app
              </Text>
            </View>
          </View>
        </View>

        {/* Bouton Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            Alert.alert(
              'Déconnexion',
              'Voulez-vous vraiment vous déconnecter ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Déconnexion',
                  style: 'destructive',
                  onPress: () => {
                    router.replace('/simple-auth');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#ECFDF5',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: '#065F46',
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: '#92400E',
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    borderWidth: 2,
    borderColor: '#EF4444',
    ...Shadows.small,
  },
  logoutButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#EF4444',
  },
});
