import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signInWithUsernameOrEmail } from '@/lib/auth-helpers';
import {
  validateUsername,
  validatePhoneNumber,
  validateAddress,
} from '@/lib/validation';
import { Profile } from '@/types/database';
import {
  LogIn,
  LogOut,
  ShoppingBag,
  Settings,
  Edit3,
  X,
  Gift,
  Crown,
  CreditCard,
  Users,
  Phone,
  MapPin,
  Mail,
  Copy,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Award,
  TrendingUp,
  ShoppingCart,
  Heart,
  Star,
  Package,
  Store,
  RefreshCw,
  Moon,
  Sun,
  Shield,
  FileText,
  Trash2,
  Bell,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import PandaLogo from '@/components/PandaLogo';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ClipboardLib from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { useBonusSystem } from '@/hooks/useBonusSystem';
import SubscriptionModal from '@/components/SubscriptionModal';

const { width } = Dimensions.get('window');

// 🎨 DESIGN SYSTEM
const DesignTokens = {
  colors: {
    background: '#FAFAFA',
    cardWhite: '#FFFFFF',
    pastel: {
      purple: { bg: '#F3E8FF', icon: '#9333EA' },
      green: { bg: '#D1FAE5', icon: '#059669' },
      amber: { bg: '#FEF3C7', icon: '#D97706' },
      pink: { bg: '#FCE7F3', icon: '#DB2777' },
      blue: { bg: '#DBEAFE', icon: '#2563EB' },
      teal: { bg: '#CCFBF1', icon: '#0D9488' },
      indigo: { bg: '#E0E7FF', icon: '#4F46E5' },
    },
    gradient: {
      beige: ['#FAF5EF', '#FFF9ED'] as const,
      gold: ['#FFD700', '#FFA500'] as const,
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
    h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
    h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');

  // Dynamic data
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Bonus system
  const { userPoints } = useBonusSystem();

  // Animation
  const [modalAnim] = useState(new Animated.Value(0));

  // Memoized values
  const totalPoints = useMemo(() =>
    userPoints?.points || profile?.panda_coins || 0,
    [userPoints?.points, profile?.panda_coins]
  );

  const referralPoints = useMemo(() =>
    (profile?.total_referrals || 0) * 50,
    [profile?.total_referrals]
  );

  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : '#FAFAFA',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
    headerGradient: isDark
      ? ['#1F2937', '#374151'] as const
      : ['#FAF5EF', '#FFF9ED'] as const,
  }), [isDark]);

  const userInitials = useMemo(() => {
    const fullName = profile?.full_name || profile?.username || 'User';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, [profile?.full_name, profile?.username]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Rediriger vers simple-auth si non connecté (après le chargement)
  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/simple-auth');
    }
  }, [user, loading, router]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
      if (data) {
        setAvatarUri(data.avatar_url || null);
        setIsPremium(data.is_premium || false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const animateModal = (show: boolean) => {
    Animated.spring(modalAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const openModal = (modalSetter: (visible: boolean) => void) => {
    modalSetter(true);
    animateModal(true);
  };

  const closeModal = (modalSetter: (visible: boolean) => void) => {
    animateModal(false);
    setTimeout(() => modalSetter(false), 200);
  };

  const handlePickImage = async (fromCamera: boolean = false) => {
    try {
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);

        if (user) {
          await supabase
            .from('profiles')
            .update({ avatar_url: uri })
            .eq('id', user.id);

          Speech.speak('Photo de profil mise à jour', { language: 'fr-FR' });
          closeModal(setAvatarModalVisible);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleAuth = async () => {
    try {
      // Validation des champs
      if (!usernameOrEmail || usernameOrEmail.trim() === '') {
        Alert.alert('Attention', 'Veuillez entrer votre email ou nom d\'utilisateur');
        return;
      }

      if (!password || password.trim() === '') {
        Alert.alert('Attention', 'Veuillez entrer votre mot de passe');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Attention', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      setSaving(true);
      const { data, error } = await signInWithUsernameOrEmail(usernameOrEmail, password);
      if (error) throw error;
      if (!data?.session) throw new Error('Échec de la connexion');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileData) {
        const role = profileData.is_seller ? 'seller' : 'buyer';
        await AsyncStorage.setItem('user_preferred_role', role);
      }

      setUsernameOrEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la connexion');
      Speech.speak(error.message || 'Erreur de connexion', { language: 'fr-FR' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Erreur', error.message);
            setProfile(null);
          },
        },
      ]
    );
  };

  const openEditModal = () => {
    setEditFirstName(profile?.first_name || '');
    setEditLastName(profile?.last_name || '');
    setEditPhone(profile?.phone || '');
    setEditCountry(profile?.country || '');
    setEditCity(profile?.city || '');
    openModal(setEditModalVisible);
  };

  const saveEdit = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Validation du prénom
      const firstNameValidation = validateUsername(editFirstName);
      if (!firstNameValidation.isValid) {
        Alert.alert('Erreur', firstNameValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      // Validation du nom
      const lastNameValidation = validateUsername(editLastName);
      if (!lastNameValidation.isValid) {
        Alert.alert('Erreur', lastNameValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      // Validation du téléphone
      const phoneValidation = validatePhoneNumber(editPhone);
      if (!phoneValidation.isValid) {
        Alert.alert('Erreur', phoneValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      // Validation du pays
      const countryValidation = validateAddress(editCountry);
      if (!countryValidation.isValid) {
        Alert.alert('Erreur', countryValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      const updates: any = {
        id: user.id,
        first_name: editFirstName,
        last_name: editLastName,
        full_name: `${editFirstName} ${editLastName}`,
        phone: editPhone,
        country: editCountry,
        city: editCity || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      closeModal(setEditModalVisible);
      await fetchProfile(user.id);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      Speech.speak('Profil mis à jour avec succès', { language: 'fr-FR' });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = useCallback(async () => {
    if (profile?.referral_code) {
      await ClipboardLib.setStringAsync(profile.referral_code);
      Speech.speak('Code copié', { language: 'fr-FR' });
      Alert.alert('✓ Copié!', 'Code de parrainage copié');
    }
  }, [profile?.referral_code]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignTokens.colors.pastel.purple.icon} />
      </View>
    );
  }

  // Afficher un loader pendant la redirection
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  // PROFILE SCREEN (Logged in) - REDESIGNED
  // Already memoized above

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.profileContainer}
        showsVerticalScrollIndicator={false}>

        {/* ✨ HEADER - Gradient Beige Soft */}
        <LinearGradient
          colors={themeColors.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => openModal(setAvatarModalVisible)}
              style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
              )}
              <View style={styles.cameraButton}>
                <Camera size={14} color={DesignTokens.colors.cardWhite} />
              </View>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Crown size={12} color={Colors.primaryGold} fill={Colors.primaryGold} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: themeColors.text }]}>{profile?.full_name || 'Utilisateur'}</Text>
              <Text style={[styles.headerUsername, { color: themeColors.textSecondary }]}>@{profile?.username || 'username'}</Text>
            </View>

            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <LogOut size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 🎁 CHOOSE YOUR GIFT - Card Blanche */}
        <TouchableOpacity
          style={[styles.giftCard, { backgroundColor: themeColors.card }]}
          onPress={() => openModal(setRewardsModalVisible)}
          activeOpacity={0.7}>
          <Gift size={24} color={DesignTokens.colors.pastel.purple.icon} />
          <Text style={[styles.giftCardText, { color: themeColors.text }]}>Choose Your Gift</Text>
          <ChevronRight size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* 🔄 SWITCH VENDEUR/ACHETEUR - Visible si vendeur avec boutique */}
        {profile?.is_seller && profile?.shop_name && (
          <View style={[styles.switchContainer, { backgroundColor: themeColors.card }]}>
            <TouchableOpacity
              style={[styles.switchButton, { backgroundColor: themeColors.background }]}
              onPress={() => router.push(`/user/${profile.id}`)}
              activeOpacity={0.7}>
              <View style={styles.switchIconContainer}>
                <Store size={20} color="#FFFFFF" />
              </View>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: themeColors.text }]}>Ma Boutique</Text>
                <Text style={[styles.switchSubtitle, { color: themeColors.textSecondary }]}>{profile.shop_name}</Text>
              </View>
              <ChevronRight size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchButton, { backgroundColor: themeColors.background }]}
              onPress={() => router.push('/seller/orders')}
              activeOpacity={0.7}>
              <View style={[styles.switchIconContainer, { backgroundColor: DesignTokens.colors.pastel.amber.icon }]}>
                <Package size={20} color="#FFFFFF" />
              </View>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: themeColors.text }]}>Commandes reçues</Text>
                <Text style={[styles.switchSubtitle, { color: themeColors.textSecondary }]}>Gérer les commandes clients</Text>
              </View>
              <ChevronRight size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* 🚀 QUICK ACTIONS - Pastels Uniformes */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/orders')}>
            <View style={[styles.actionIcon, { backgroundColor: DesignTokens.colors.pastel.blue.bg }]}>
              <Package size={24} color={DesignTokens.colors.pastel.blue.icon} />
            </View>
            <Text style={[styles.actionLabel, { color: themeColors.text }]}>Commandes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              if (profile?.is_seller) {
                router.push('/seller/products');
              } else {
                router.push('/seller/setup');
              }
            }}>
            <View style={[styles.actionIcon, { backgroundColor: DesignTokens.colors.pastel.green.bg }]}>
              <ShoppingBag size={24} color={DesignTokens.colors.pastel.green.icon} />
            </View>
            <Text style={[styles.actionLabel, { color: themeColors.text }]}>Vendre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => openModal(setSettingsModalVisible)}>
            <View style={[styles.actionIcon, { backgroundColor: DesignTokens.colors.pastel.amber.bg }]}>
              <Settings size={24} color={DesignTokens.colors.pastel.amber.icon} />
            </View>
            <Text style={[styles.actionLabel, { color: themeColors.text }]}>Paramètres</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={openEditModal}>
            <View style={[styles.actionIcon, { backgroundColor: DesignTokens.colors.pastel.pink.bg }]}>
              <Edit3 size={24} color={DesignTokens.colors.pastel.pink.icon} />
            </View>
            <Text style={[styles.actionLabel, { color: themeColors.text }]}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* 📋 INFORMATIONS PERSONNELLES - Modern Card */}
        <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Informations personnelles</Text>

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: DesignTokens.colors.pastel.blue.bg }]}>
              <Phone size={20} color={DesignTokens.colors.pastel.blue.icon} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Téléphone</Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>{profile?.phone || 'Non renseigné'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: DesignTokens.colors.pastel.teal.bg }]}>
              <MapPin size={20} color={DesignTokens.colors.pastel.teal.icon} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Localisation</Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                {profile?.city || profile?.country || 'Non renseigné'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: DesignTokens.colors.pastel.indigo.bg }]}>
              <Mail size={20} color={DesignTokens.colors.pastel.indigo.icon} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>{user?.email || 'Non renseigné'}</Text>
            </View>
          </View>
        </View>

        {/* 🎯 PARRAINAGE - Compact Modern */}
        {profile?.referral_code && (
          <View style={[styles.referralCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.referralHeader}>
              <View style={[styles.infoIconCircle, { backgroundColor: DesignTokens.colors.pastel.purple.bg }]}>
                <Gift size={20} color={DesignTokens.colors.pastel.purple.icon} />
              </View>
              <View style={styles.referralHeaderText}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Parrainage</Text>
                <Text style={[styles.referralStats, { color: themeColors.textSecondary }]}>
                  {profile?.total_referrals || 0} parrainages • {referralPoints} pts
                </Text>
              </View>
            </View>

            <View style={[styles.referralCodeBox, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.referralCode, { color: themeColors.text }]}>{profile.referral_code}</Text>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: themeColors.card }]}
                onPress={copyReferralCode}>
                <Copy size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.referralHint}>
              Partagez ce code • +50 points par inscription
            </Text>
          </View>
        )}

        {/* 👑 PREMIUM - Gold Gradient (kept) */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => setSubscriptionModalVisible(true)}
            activeOpacity={0.8}>
            <LinearGradient
              colors={DesignTokens.colors.gradient.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}>
              <Crown size={32} color={Colors.white} />
              <View style={styles.premiumContent}>
                <Text style={styles.premiumTitle}>Passez à Premium</Text>
                <Text style={styles.premiumText}>
                  Débloquez toutes les fonctionnalités exclusives
                </Text>
              </View>
              <ChevronRight size={24} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: DesignTokens.spacing.xxl }} />
      </ScrollView>

      {/* 📸 MODALS - Avatar, Rewards, Settings, Edit */}

      {/* Avatar Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => closeModal(setAvatarModalVisible)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.avatarModalContent,
              {
                backgroundColor: themeColors.card,
                transform: [{
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }],
                opacity: modalAnim,
              }
            ]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Changer la photo</Text>
            <View style={styles.avatarOptions}>
              <TouchableOpacity
                style={styles.avatarOption}
                onPress={() => handlePickImage(true)}>
                <View style={[styles.avatarOptionIcon, { backgroundColor: DesignTokens.colors.pastel.pink.bg }]}>
                  <Camera size={28} color={DesignTokens.colors.pastel.pink.icon} />
                </View>
                <Text style={[styles.avatarOptionText, { color: themeColors.text }]}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarOption}
                onPress={() => handlePickImage(false)}>
                <View style={[styles.avatarOptionIcon, { backgroundColor: DesignTokens.colors.pastel.blue.bg }]}>
                  <ImageIcon size={28} color={DesignTokens.colors.pastel.blue.icon} />
                </View>
                <Text style={[styles.avatarOptionText, { color: themeColors.text }]}>Galerie</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => closeModal(setAvatarModalVisible)}>
              <Text style={[styles.modalCancelText, { color: themeColors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Rewards Modal */}
      <Modal
        visible={rewardsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => closeModal(setRewardsModalVisible)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.rewardsModalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Récompenses Disponibles</Text>
              <TouchableOpacity onPress={() => closeModal(setRewardsModalVisible)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.rewardsHeader, { backgroundColor: themeColors.background }]}>
                <Gift size={40} color={DesignTokens.colors.pastel.purple.icon} />
                <Text style={[styles.rewardsTotalPoints, { color: themeColors.text }]}>{totalPoints}</Text>
                <Text style={[styles.rewardsTotalLabel, { color: themeColors.textSecondary }]}>Panda Coins disponibles</Text>
              </View>

              <View style={styles.rewardsList}>
                <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: DesignTokens.colors.pastel.purple.bg }]}>
                    <Gift size={24} color={DesignTokens.colors.pastel.purple.icon} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardName, { color: themeColors.text }]}>Bon d'achat 5000 FCFA</Text>
                    <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>Valable sur tous les produits</Text>
                  </View>
                  <Text style={[styles.rewardCost, { color: themeColors.text }]}>500 pts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: DesignTokens.colors.pastel.green.bg }]}>
                    <Star size={24} color={DesignTokens.colors.pastel.green.icon} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardName, { color: themeColors.text }]}>Livraison gratuite</Text>
                    <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>1 mois de livraison offerte</Text>
                  </View>
                  <Text style={[styles.rewardCost, { color: themeColors.text }]}>300 pts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: DesignTokens.colors.pastel.amber.bg }]}>
                    <Crown size={24} color={DesignTokens.colors.pastel.amber.icon} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardName, { color: themeColors.text }]}>Badge Premium</Text>
                    <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>Accès premium 3 mois</Text>
                  </View>
                  <Text style={[styles.rewardCost, { color: themeColors.text }]}>1000 pts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: DesignTokens.colors.pastel.pink.bg }]}>
                    <ShoppingBag size={24} color={DesignTokens.colors.pastel.pink.icon} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardName, { color: themeColors.text }]}>T-shirt Senepanda</Text>
                    <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>Édition limitée collector</Text>
                  </View>
                  <Text style={[styles.rewardCost, { color: themeColors.text }]}>800 pts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: DesignTokens.colors.pastel.blue.bg }]}>
                    <Heart size={24} color={DesignTokens.colors.pastel.blue.icon} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardName, { color: themeColors.text }]}>Don à une association</Text>
                    <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>Conversion en don caritatif</Text>
                  </View>
                  <Text style={[styles.rewardCost, { color: themeColors.text }]}>100 pts</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.rewardsDetailButton, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  closeModal(setRewardsModalVisible);
                  router.push('/rewards' as any);
                }}>
                <Text style={[styles.rewardsDetailButtonText, { color: themeColors.text }]}>Voir tous les cadeaux</Text>
                <ChevronRight size={20} color={themeColors.text} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => closeModal(setSettingsModalVisible)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Paramètres</Text>
              <TouchableOpacity onPress={() => closeModal(setSettingsModalVisible)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Premium & Parrainage */}
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Premium & Récompenses</Text>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    closeModal(setSettingsModalVisible);
                    setSubscriptionModalVisible(true);
                  }}>
                  <Crown size={20} color="#F59E0B" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>
                    {isPremium ? 'Gérer mon abonnement' : 'Passer à Premium'}
                  </Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    closeModal(setSettingsModalVisible);
                    router.push('/referral');
                  }}>
                  <Users size={20} color="#8B5CF6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Parrainage</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Apparence</Text>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    themeMode === 'light' && styles.settingsItemSelected
                  ]}
                  onPress={() => setThemeMode('light')}>
                  <Sun size={20} color={themeMode === 'light' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[
                    styles.settingsText,
                    { color: themeColors.text },
                    themeMode === 'light' && styles.settingsTextSelected
                  ]}>Mode clair</Text>
                  {themeMode === 'light' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    themeMode === 'dark' && styles.settingsItemSelected
                  ]}
                  onPress={() => setThemeMode('dark')}>
                  <Moon size={20} color={themeMode === 'dark' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[
                    styles.settingsText,
                    { color: themeColors.text },
                    themeMode === 'dark' && styles.settingsTextSelected
                  ]}>Mode sombre</Text>
                  {themeMode === 'dark' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    themeMode === 'system' && styles.settingsItemSelected
                  ]}
                  onPress={() => setThemeMode('system')}>
                  <Settings size={20} color={themeMode === 'system' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[
                    styles.settingsText,
                    { color: themeColors.text },
                    themeMode === 'system' && styles.settingsTextSelected
                  ]}>Automatique (système)</Text>
                  {themeMode === 'system' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Confidentialité & Légal</Text>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    closeModal(setSettingsModalVisible);
                    openModal(setPrivacyModalVisible);
                  }}>
                  <Shield size={20} color="#8B5CF6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Confidentialité</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    closeModal(setSettingsModalVisible);
                    openModal(setTermsModalVisible);
                  }}>
                  <FileText size={20} color="#3B82F6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Conditions d'utilisation</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Compte</Text>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    closeModal(setSettingsModalVisible);
                    openModal(setDeleteAccountModalVisible);
                  }}>
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={[styles.settingsText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.settingsLogout}
                onPress={() => {
                  closeModal(setSettingsModalVisible);
                  handleSignOut();
                }}>
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.settingsLogoutText}>Déconnexion</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => closeModal(setPrivacyModalVisible)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.fullModalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Politique de confidentialité</Text>
              <TouchableOpacity onPress={() => closeModal(setPrivacyModalVisible)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.privacyIconContainer}>
                <Shield size={40} color={Colors.primary} />
              </View>

              <Text style={[styles.privacyLastUpdate, { color: themeColors.textSecondary }]}>
                Dernière mise à jour : 23 novembre 2025
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>1. Introduction</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                Bienvenue sur SenePanda. Nous nous engageons à protéger votre vie privée et vos données personnelles.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>2. Données Collectées</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                • Informations de compte : nom, email, téléphone{'\n'}
                • Informations de profil : photo, adresse{'\n'}
                • Données de transaction : historique des achats{'\n'}
                • Données techniques : type d'appareil, OS
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>3. Utilisation des Données</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                • Gérer votre compte{'\n'}
                • Traiter vos commandes{'\n'}
                • Personnaliser votre expérience{'\n'}
                • Améliorer nos services
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>4. Vos Droits</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                • Accès à vos données{'\n'}
                • Rectification des informations{'\n'}
                • Suppression du compte{'\n'}
                • Portabilité des données
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>5. Contact</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                Email : privacy@senepanda.com{'\n'}
                Adresse : Dakar, Sénégal
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={termsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => closeModal(setTermsModalVisible)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.fullModalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Conditions d'utilisation</Text>
              <TouchableOpacity onPress={() => closeModal(setTermsModalVisible)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.privacyIconContainer}>
                <FileText size={40} color={Colors.primary} />
              </View>

              <Text style={[styles.privacyLastUpdate, { color: themeColors.textSecondary }]}>
                Dernière mise à jour : 23 novembre 2025
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>1. Acceptation</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                En utilisant SenePanda, vous acceptez ces conditions. Si vous n'acceptez pas, veuillez ne pas utiliser l'application.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>2. Inscription</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                • Avoir au moins 18 ans{'\n'}
                • Fournir des informations exactes{'\n'}
                • Maintenir la confidentialité de vos identifiants
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>3. Produits Interdits</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                • Produits contrefaits{'\n'}
                • Armes et explosifs{'\n'}
                • Drogues et substances illicites{'\n'}
                • Tout produit illégal
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>4. Transactions</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                Les prix sont en Francs CFA. Les paiements sont sécurisés. Les remboursements sont évalués au cas par cas.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>5. Responsabilité</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                SenePanda agit en tant qu'intermédiaire et n'est pas responsable des litiges entre utilisateurs.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>6. Contact</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                Email : legal@senepanda.com{'\n'}
                Adresse : Dakar, Sénégal
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          closeModal(setDeleteAccountModalVisible);
          setDeleteConfirmation('');
        }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.fullModalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Supprimer le compte</Text>
              <TouchableOpacity onPress={() => {
                closeModal(setDeleteAccountModalVisible);
                setDeleteConfirmation('');
              }}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.deleteWarningCard}>
                <AlertTriangle size={40} color="#EF4444" />
                <Text style={styles.deleteWarningTitle}>Attention</Text>
                <Text style={styles.deleteWarningText}>
                  Cette action est irréversible. Toutes vos données seront supprimées.
                </Text>
              </View>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text }]}>Ce qui sera supprimé :</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                • Votre profil et informations personnelles{'\n'}
                • Tous vos messages et conversations{'\n'}
                • Votre historique de commandes{'\n'}
                • Vos favoris et avis{'\n'}
                • Votre boutique et produits (si vendeur){'\n'}
                • Vos points de fidélité
              </Text>

              <Text style={[styles.privacySectionTitle, { color: themeColors.text, marginTop: 20 }]}>Confirmation</Text>
              <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
                Tapez <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>SUPPRIMER</Text> pour confirmer :
              </Text>

              <TextInput
                style={[styles.deleteConfirmInput, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: deleteConfirmation === 'SUPPRIMER' ? '#EF4444' : themeColors.border
                }]}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Tapez SUPPRIMER"
                placeholderTextColor={themeColors.textSecondary}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[
                  styles.deleteAccountButton,
                  deleteConfirmation !== 'SUPPRIMER' && styles.deleteAccountButtonDisabled
                ]}
                disabled={deleteConfirmation !== 'SUPPRIMER'}
                onPress={async () => {
                  Alert.alert(
                    'Confirmation finale',
                    'Êtes-vous absolument sûr de vouloir supprimer votre compte ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              // Delete user data
                              await supabase.from('messages').delete().eq('sender_id', user.id);
                              await supabase.from('favorites').delete().eq('user_id', user.id);
                              await supabase.from('reviews').delete().eq('user_id', user.id);
                              await supabase.from('products').delete().eq('seller_id', user.id);
                              await supabase.from('shops').delete().eq('owner_id', user.id);
                              await supabase.from('profiles').delete().eq('id', user.id);

                              await AsyncStorage.clear();
                              await supabase.auth.signOut();

                              closeModal(setDeleteAccountModalVisible);
                              setDeleteConfirmation('');

                              Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
                            }
                          } catch (error) {
                            Alert.alert('Erreur', 'Une erreur est survenue.');
                          }
                        }
                      }
                    ]
                  );
                }}>
                <Trash2 size={20} color="#FFFFFF" />
                <Text style={styles.deleteAccountButtonText}>Supprimer définitivement</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => closeModal(setEditModalVisible)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => closeModal(setEditModalVisible)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Prénom *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="Jean"
                  placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nom *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Dupont"
                  placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Téléphone *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+221 77 123 45 67"
                  keyboardType="phone-pad"
                  placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Pays *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editCountry}
                  onChangeText={setEditCountry}
                  placeholder="Sénégal"
                  placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Ville</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Dakar"
                  placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButtonCancel, { backgroundColor: themeColors.background }]}
                onPress={() => closeModal(setEditModalVisible)}>
                <Text style={[styles.modalButtonTextCancel, { color: themeColors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={saveEdit}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={DesignTokens.colors.cardWhite} />
                ) : (
                  <Text style={styles.modalButtonTextSave}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        onSuccess={() => {
          fetchProfile(user.id);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.background,
  },

  // Auth Screen
  authContainer: {
    padding: DesignTokens.spacing.xl,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xxl,
  },
  authTitle: {
    ...DesignTokens.typography.h1,
    color: DesignTokens.colors.text.primary,
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xs,
  },
  authSubtitle: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.secondary,
  },
  authForm: {
    gap: DesignTokens.spacing.md,
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.sm,
  },
  label: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing.xs,
  },
  input: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    borderRadius: DesignTokens.radius.sm,
    marginTop: DesignTokens.spacing.xs,
    ...DesignTokens.shadows.sm,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.xs,
    paddingVertical: DesignTokens.spacing.md,
  },
  primaryButtonText: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
  },
  linkButton: {
    marginTop: DesignTokens.spacing.xs,
    alignItems: 'center',
  },
  linkText: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.secondary,
  },
  linkTextBold: {
    color: DesignTokens.colors.text.primary,
    fontWeight: '700',
  },

  // ✨ REDESIGNED PROFILE SCREEN
  profileContainer: {
    paddingBottom: DesignTokens.spacing.xxl,
  },

  // Header
  header: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xxl,
    borderBottomLeftRadius: DesignTokens.radius.xl,
    borderBottomRightRadius: DesignTokens.radius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: DesignTokens.radius.full,
    borderWidth: 3,
    borderColor: DesignTokens.colors.cardWhite,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: DesignTokens.colors.cardWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: DesignTokens.colors.text.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: DesignTokens.colors.pastel.purple.icon,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DesignTokens.colors.cardWhite,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: DesignTokens.colors.cardWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DesignTokens.colors.cardWhite,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text.primary,
  },
  headerUsername: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gift Card
  giftCard: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: -DesignTokens.spacing.xxl,
    backgroundColor: DesignTokens.colors.cardWhite,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    ...DesignTokens.shadows.md,
  },

  // Switch Vendeur/Acheteur
  switchContainer: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.cardWhite,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.xs,
    ...DesignTokens.shadows.sm,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.background,
  },
  switchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.pastel.green.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTextContainer: {
    flex: 1,
    marginLeft: DesignTokens.spacing.sm,
  },
  switchTitle: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
  },
  switchSubtitle: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
    marginTop: 2,
  },
  giftCardText: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
    flex: 1,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.sm,
  },
  actionLabel: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.primary,
    textAlign: 'center',
  },

  // Info Card
  infoCard: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.xl,
    backgroundColor: DesignTokens.colors.cardWhite,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
    ...DesignTokens.shadows.md,
  },
  cardTitle: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.primary,
    fontWeight: '600',
  },

  // Referral Card
  referralCard: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.xl,
    backgroundColor: DesignTokens.colors.cardWhite,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
    ...DesignTokens.shadows.md,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  referralHeaderText: {
    flex: 1,
  },
  referralStats: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
    marginTop: 2,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.radius.sm,
    padding: DesignTokens.spacing.md,
  },
  referralCode: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text.primary,
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: DesignTokens.colors.cardWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.muted,
    textAlign: 'center',
  },

  // Premium Card
  premiumCard: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.xl,
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
    ...DesignTokens.shadows.md,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    ...DesignTokens.typography.h2,
    color: Colors.white,
    marginBottom: 4,
  },
  premiumText: {
    ...DesignTokens.typography.caption,
    color: 'rgba(255, 255, 255, 0.95)',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    paddingBottom: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text.primary,
  },

  // Avatar Modal
  avatarModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xxl,
    alignItems: 'center',
  },
  avatarOptions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xl,
    marginVertical: DesignTokens.spacing.xl,
  },
  avatarOption: {
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  avatarOptionIcon: {
    width: 80,
    height: 80,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.sm,
  },
  avatarOptionText: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.primary,
  },
  modalCancelButton: {
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xxl,
  },
  modalCancelText: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.secondary,
  },

  // Rewards Modal
  rewardsModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    maxHeight: '85%',
  },
  rewardsHeader: {
    alignItems: 'center',
    padding: DesignTokens.spacing.xxl,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.radius.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  rewardsTotalPoints: {
    fontSize: 48,
    fontWeight: '900',
    color: DesignTokens.colors.text.primary,
    marginTop: DesignTokens.spacing.md,
  },
  rewardsTotalLabel: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing.xs,
  },
  rewardsList: {
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xl,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.background,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
    marginBottom: 2,
  },
  rewardDescription: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
  },
  rewardCost: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
  },
  rewardsDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.xs,
    backgroundColor: DesignTokens.colors.background,
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.md,
  },
  rewardsDetailButtonText: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.primary,
  },

  // Settings Modal
  settingsModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    maxHeight: '80%',
  },
  settingsSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: DesignTokens.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: DesignTokens.spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.radius.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  settingsText: {
    flex: 1,
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.primary,
    fontWeight: '600',
  },
  settingsItemSelected: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  settingsTextSelected: {
    color: '#D97706',
    fontWeight: '700',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  settingsLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    padding: DesignTokens.spacing.lg,
    backgroundColor: '#FEE2E2',
    borderRadius: DesignTokens.radius.md,
    marginTop: DesignTokens.spacing.xl,
  },
  settingsLogoutText: {
    ...DesignTokens.typography.h3,
    color: '#EF4444',
  },

  // Full Modal (Privacy, Terms, Delete)
  fullModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    maxHeight: '85%',
  },
  modalScrollContent: {
    padding: DesignTokens.spacing.xl,
  },
  privacyIconContainer: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.md,
  },
  privacyLastUpdate: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: DesignTokens.spacing.xl,
  },
  privacySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.sm,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: DesignTokens.spacing.sm,
  },
  deleteWarningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteWarningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  deleteWarningText: {
    fontSize: 14,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteConfirmInput: {
    borderWidth: 2,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.lg,
  },
  deleteAccountButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.sm,
  },
  deleteAccountButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Edit Modal
  editModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    maxHeight: '90%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.xl,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.radius.sm,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  modalButtonSave: {
    flex: 1,
    backgroundColor: DesignTokens.colors.pastel.purple.icon,
    borderRadius: DesignTokens.radius.sm,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    ...DesignTokens.shadows.sm,
  },
  modalButtonTextCancel: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.secondary,
  },
  modalButtonTextSave: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.cardWhite,
  },
});
