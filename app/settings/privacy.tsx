import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  ArrowLeft,
  Shield,
  MapPin,
  Bell,
  BarChart3,
  Share2,
  Cookie,
  Mail,
  Info,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentSettings {
  locationTracking: boolean;
  pushNotifications: boolean;
  analyticsData: boolean;
  personalizedAds: boolean;
  thirdPartySharing: boolean;
  cookies: boolean;
  marketingEmails: boolean;
}

const CONSENT_STORAGE_KEY = '@senepanda_consent_settings';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ConsentSettings>({
    locationTracking: false,
    pushNotifications: true,
    analyticsData: true,
    personalizedAds: false,
    thirdPartySharing: false,
    cookies: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading consent settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: ConsentSettings) => {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving consent settings:', error);
    }
  };

  const toggleSetting = (key: keyof ConsentSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleWithdrawAllConsent = () => {
    Alert.alert(
      'Retirer tous les consentements',
      'Êtes-vous sûr de vouloir retirer tous vos consentements ? Certaines fonctionnalités de l\'application pourraient ne plus fonctionner correctement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => {
            const newSettings: ConsentSettings = {
              locationTracking: false,
              pushNotifications: false,
              analyticsData: false,
              personalizedAds: false,
              thirdPartySharing: false,
              cookies: false,
              marketingEmails: false,
            };
            setSettings(newSettings);
            saveSettings(newSettings);
            Alert.alert('Succès', 'Tous vos consentements ont été retirés.');
          },
        },
      ]
    );
  };

  const consentItems = [
    {
      key: 'locationTracking' as keyof ConsentSettings,
      icon: MapPin,
      title: 'Localisation',
      description: 'Permet de vous montrer des produits et vendeurs près de chez vous',
      required: false,
      color: '#10B981',
    },
    {
      key: 'pushNotifications' as keyof ConsentSettings,
      icon: Bell,
      title: 'Notifications push',
      description: 'Recevez des alertes sur vos commandes, messages et promotions',
      required: false,
      color: '#3B82F6',
    },
    {
      key: 'analyticsData' as keyof ConsentSettings,
      icon: BarChart3,
      title: 'Données analytiques',
      description: 'Nous aide à améliorer l\'application en analysant son utilisation',
      required: false,
      color: '#8B5CF6',
    },
    {
      key: 'personalizedAds' as keyof ConsentSettings,
      icon: Share2,
      title: 'Publicités personnalisées',
      description: 'Affiche des publicités basées sur vos intérêts',
      required: false,
      color: '#F59E0B',
    },
    {
      key: 'thirdPartySharing' as keyof ConsentSettings,
      icon: Share2,
      title: 'Partage avec des tiers',
      description: 'Partage de données anonymisées avec nos partenaires',
      required: false,
      color: '#EC4899',
    },
    {
      key: 'cookies' as keyof ConsentSettings,
      icon: Cookie,
      title: 'Cookies',
      description: 'Stocke vos préférences et améliore votre expérience',
      required: false,
      color: '#6366F1',
    },
    {
      key: 'marketingEmails' as keyof ConsentSettings,
      icon: Mail,
      title: 'Emails marketing',
      description: 'Recevez nos newsletters et offres promotionnelles',
      required: false,
      color: '#EF4444',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoCard}>
          <Shield size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Vos données, votre contrôle</Text>
            <Text style={styles.infoText}>
              Gérez comment nous utilisons vos données. Vous pouvez modifier ces paramètres à tout moment.
            </Text>
          </View>
        </View>

        {/* Consent Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consentements</Text>

          {consentItems.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.key} style={styles.consentItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Icon size={20} color={item.color} />
                </View>
                <View style={styles.consentContent}>
                  <Text style={styles.consentTitle}>{item.title}</Text>
                  <Text style={styles.consentDescription}>{item.description}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => toggleSetting(item.key)}
                  trackColor={{ false: Colors.borderLight, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            );
          })}
        </View>

        {/* Required Data Notice */}
        <View style={styles.noticeCard}>
          <Info size={20} color="#F59E0B" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Données essentielles</Text>
            <Text style={styles.noticeText}>
              Certaines données sont nécessaires au fonctionnement de l'application (compte, commandes,
              paiements) et ne peuvent pas être désactivées sans supprimer votre compte.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings/terms')}
          >
            <Text style={styles.actionButtonText}>Voir les conditions d'utilisation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Reset privacy modal to show again
              AsyncStorage.removeItem('@senepanda_privacy_accepted').then(() => {
                Alert.alert('Succès', 'La politique de confidentialité sera affichée au prochain lancement.');
              });
            }}
          >
            <Text style={styles.actionButtonText}>Relire la politique de confidentialité</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleWithdrawAllConsent}
          >
            <Text style={styles.dangerButtonText}>Retirer tous les consentements</Text>
          </TouchableOpacity>
        </View>

        {/* Data Request */}
        <View style={styles.dataRequestSection}>
          <Text style={styles.dataRequestTitle}>Demande de données</Text>
          <Text style={styles.dataRequestText}>
            Conformément au RGPD, vous pouvez demander une copie de vos données personnelles
            ou leur suppression complète.
          </Text>
          <View style={styles.dataRequestButtons}>
            <TouchableOpacity
              style={styles.dataRequestButton}
              onPress={() => {
                Alert.alert(
                  'Demande envoyée',
                  'Votre demande d\'export de données a été envoyée. Vous recevrez un email avec vos données dans les 30 jours.'
                );
              }}
            >
              <Text style={styles.dataRequestButtonText}>Exporter mes données</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dataRequestButton, styles.deleteDataButton]}
              onPress={() => router.push('/settings/delete-account')}
            >
              <Text style={styles.deleteDataButtonText}>Supprimer mes données</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pour toute question concernant vos données, contactez-nous à privacy@senepanda.com
          </Text>
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  consentContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  consentTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  consentDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#C2410C',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: Typography.fontSize.xs,
    color: '#9A3412',
    lineHeight: 16,
  },
  actionsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  dangerButton: {
    borderColor: '#EF4444',
  },
  dangerButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#EF4444',
  },
  dataRequestSection: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  dataRequestTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  dataRequestText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  dataRequestButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dataRequestButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  dataRequestButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  deleteDataButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteDataButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#EF4444',
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
