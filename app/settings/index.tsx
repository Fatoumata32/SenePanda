import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  User,
  Bell,
  Globe,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Smartphone,
  Mail,
  Lock,
  Eye,
  CreditCard,
  MapPin,
  Info,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationService from '@/lib/navigation';

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  icon: any;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  route?: string;
  action?: () => void;
  iconColor?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({ ...authUser, ...profile });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const notifs = await AsyncStorage.getItem('@notifications_enabled');
      const darkMode = await AsyncStorage.getItem('@dark_mode_enabled');

      if (notifs !== null) setNotificationsEnabled(JSON.parse(notifs));
      if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('@notifications_enabled', JSON.stringify(value));
    Speech.speak(
      value ? 'Notifications activées' : 'Notifications désactivées',
      { language: 'fr-FR' }
    );
  };

  const toggleDarkMode = async (value: boolean) => {
    setDarkModeEnabled(value);
    await AsyncStorage.setItem('@dark_mode_enabled', JSON.stringify(value));
    Speech.speak(
      value ? 'Mode sombre activé' : 'Mode sombre désactivé',
      { language: 'fr-FR' }
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem('user_preferred_role');
              Speech.speak('Déconnexion réussie', { language: 'fr-FR' });
              NavigationService.handlePostLogout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'Compte',
      items: [
        {
          id: 'profile',
          label: 'Informations personnelles',
          icon: User,
          type: 'navigation',
          route: '/(tabs)/profile',
          iconColor: Colors.primaryOrange,
        },
        {
          id: 'phone',
          label: 'Numéro de téléphone',
          icon: Smartphone,
          type: 'navigation',
          route: '/settings/phone',
          iconColor: Colors.primaryOrange,
        },
        {
          id: 'email',
          label: 'Email',
          icon: Mail,
          type: 'navigation',
          route: '/settings/email',
          iconColor: Colors.primaryOrange,
        },
        {
          id: 'password',
          label: 'Code PIN',
          icon: Lock,
          type: 'navigation',
          route: '/settings/password',
          iconColor: Colors.primaryOrange,
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          type: 'toggle',
          value: notificationsEnabled,
          action: () => toggleNotifications(!notificationsEnabled),
          iconColor: '#3B82F6',
        },
        {
          id: 'dark_mode',
          label: 'Mode sombre',
          icon: Moon,
          type: 'toggle',
          value: darkModeEnabled,
          action: () => toggleDarkMode(!darkModeEnabled),
          iconColor: '#6366F1',
        },
        {
          id: 'language',
          label: 'Langue',
          icon: Globe,
          type: 'navigation',
          route: '/settings/language',
          iconColor: '#10B981',
        },
      ],
    },
    {
      title: 'Confidentialité & Sécurité',
      items: [
        {
          id: 'privacy',
          label: 'Confidentialité',
          icon: Shield,
          type: 'navigation',
          route: '/settings/privacy',
          iconColor: '#8B5CF6',
        },
        {
          id: 'visibility',
          label: 'Visibilité du profil',
          icon: Eye,
          type: 'navigation',
          route: '/settings/visibility',
          iconColor: '#8B5CF6',
        },
        {
          id: 'addresses',
          label: 'Adresses de livraison',
          icon: MapPin,
          type: 'navigation',
          route: '/settings/addresses',
          iconColor: '#8B5CF6',
        },
        {
          id: 'payments',
          label: 'Modes de paiement',
          icon: CreditCard,
          type: 'navigation',
          route: '/settings/payments',
          iconColor: '#8B5CF6',
        },
      ],
    },
    {
      title: 'Assistance',
      items: [
        {
          id: 'help',
          label: 'Aide & Support',
          icon: HelpCircle,
          type: 'navigation',
          route: '/help-support',
          iconColor: '#EF4444',
        },
        {
          id: 'terms',
          label: 'Conditions d\'utilisation',
          icon: FileText,
          type: 'action',
          action: () => openURL('https://senepanda.app/terms'),
          iconColor: '#EF4444',
        },
        {
          id: 'about',
          label: 'À propos de SenePanda',
          icon: Info,
          type: 'navigation',
          route: '/settings/about',
          iconColor: '#EF4444',
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const Icon = item.icon;

    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
              <Icon size={20} color={item.iconColor || Colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.action}
            trackColor={{ false: Colors.borderLight, true: Colors.primaryOrange }}
            thumbColor={Colors.white}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={() => {
          if (item.route) {
            router.push(item.route as any);
          } else if (item.action) {
            item.action();
          }
        }}
        activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
            <Icon size={20} color={item.iconColor || Colors.textSecondary} />
          </View>
          <Text style={styles.settingLabel}>{item.label}</Text>
        </View>
        <ChevronRight size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info utilisateur */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.first_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur'}
              </Text>
              <Text style={styles.userPhone}>{user.phone || user.email}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)}>
              <ChevronRight size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sections */}
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Bouton de déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    marginLeft: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#EF4444',
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
