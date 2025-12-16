import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  LogOut,
  ShoppingBag,
  Settings,
  Award,
  CreditCard,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  Sun,
  Moon,
  Shield,
  FileText,
  Trash2,
  Crown,
  Gift,
  Star,
  Heart,
  Phone,
  Mail,
  MapPin,
  Copy,
  Edit3,
  Package,
  TrendingUp,
  Sparkles,
  Check,
  Clock,
  MessageCircle,
  Headphones,
  Facebook,
  Instagram,
  Twitter,
  ExternalLink,
  Store,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigation as useNavigationContext } from '@/contexts/NavigationContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as ClipboardLib from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { Profile } from '@/types/database';
import {
  validateUsername,
  validatePhoneNumber,
} from '@/lib/validation';
import TeardropAvatar from '@/components/TeardropAvatar';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { useProfileSubscriptionSync } from '@/hooks/useProfileSubscriptionSync';
import { useFocusEffect } from '@react-navigation/native';

// Fonction pour générer un avatar unique par utilisateur
const getDefaultAvatar = (userId: string) => {
  // Utiliser UI Avatars comme fallback (plus fiable sur les émulateurs)
  return `https://ui-avatars.com/api/?name=${userId.substring(0, 2)}&size=256&background=random&color=fff&bold=true`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, setThemeMode, themeMode } = useTheme();
  const { userRole, setUserRole } = useNavigationContext();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Stats dynamiques
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0); // Commandes reçues (ventes)
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Abonnement avec synchronisation en temps réel (ancien système)
  const { subscription: realtimeSubscription, isActive: isSubscriptionActive, refresh: refreshSubscription } = useSubscriptionSync(user?.id);

  // Synchronisation du profil (nouveau système)
  const {
    subscription: profileSubscription,
    isActive: profileIsActive,
    daysRemaining: profileDaysRemaining,
    refresh: refreshProfileSubscription
  } = useProfileSubscriptionSync(user?.id);

  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [planName, setPlanName] = useState<string>('Starter');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Menu déroulant pour les commandes (vendeur)
  const [ordersMenuExpanded, setOrdersMenuExpanded] = useState(false);

  // Modals
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [paymentsModalVisible, setPaymentsModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [informationModalVisible, setInformationModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [avatarZoomModalVisible, setAvatarZoomModalVisible] = useState(false);

  // Animation pour le zoom
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : '#F0F9FF',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
    statBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      yellow: isDark ? '#78350F' : '#FEF3C7',
      green: isDark ? '#064E3B' : '#D1FAE5',
      red: isDark ? '#7F1D1D' : '#FEE2E2',
      purple: isDark ? '#581C87' : '#F3E8FF',
    },
    menuIcon: {
      text: isDark ? '#F9FAFB' : '#1F2937',
      bg: {
        yellow: isDark ? '#78350F' : '#FEF3C7',
        blue: isDark ? '#1E3A8A' : '#DBEAFE',
        lightBlue: isDark ? '#0C4A6E' : '#E0F2FE',
        green: isDark ? '#064E3B' : '#D1FAE5',
        red: isDark ? '#7F1D1D' : '#FEE2E2',
      }
    },
    planBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      yellow: isDark ? '#78350F' : '#FEF3C7',
      purple: isDark ? '#581C87' : '#F3E8FF',
    },
    infoBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      purple: isDark ? '#581C87' : '#F3E8FF',
      teal: isDark ? '#134E4A' : '#CCFBF1',
      pink: isDark ? '#831843' : '#FCE7F3',
      green: isDark ? '#064E3B' : '#D1FAE5',
    },
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
          fetchStats(session.user.id);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/simple-auth');
    }
  }, [user, loading, router]);

  // Effet pour synchroniser avec profileSubscription (nouveau système)
  useEffect(() => {
    if (profileSubscription) {
      console.log('🔄 Mise à jour du profil depuis profileSubscription:', profileSubscription);

      setCurrentPlan(profileSubscription.subscription_plan || 'free');
      setDaysRemaining(profileSubscription.days_remaining);

      // Mettre à jour le nom du plan
      const planNames: Record<string, string> = {
        free: 'Gratuit',
        starter: 'Starter',
        pro: 'Pro',
        premium: 'Premium'
      };
      setPlanName(planNames[profileSubscription.subscription_plan] || 'Gratuit');

      // Mettre à jour le profil local si nécessaire
      if (profile && profile.subscription_plan !== profileSubscription.subscription_plan) {
        setProfile({
          ...profile,
          subscription_plan: profileSubscription.subscription_plan,
        });
      }
    }
  }, [profileSubscription]);

  // Recharger le profil quand l'utilisateur revient sur cette page
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Page profil active - Rechargement des données...');
      if (user?.id) {
        fetchProfile(user.id);
        fetchStats(user.id);
        refreshProfileSubscription();
      }
    }, [user?.id])
  );

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
        await fetchStats(user.id);
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
        setAvatarUri(data.avatar_url || getDefaultAvatar(userId));

        // Charger les informations d'abonnement (seulement si plan payant)
        const plan = data.subscription_plan || 'starter';
        if (plan !== 'free') {
          setCurrentPlan(plan);

          // Mapping des noms de plans
          const planNames: Record<string, string> = {
            starter: 'Starter',
            pro: 'Pro',
            premium: 'Premium'
          };
          setPlanName(planNames[plan] || 'Starter');

          // Calculer les jours restants si abonné
          if (data.subscription_expires_at) {
            const expiresAt = new Date(data.subscription_expires_at);
            const now = new Date();
            const diffTime = expiresAt.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays > 0 ? diffDays : 0);
          } else {
            setDaysRemaining(null);
          }
        }
      } else {
        setAvatarUri(getDefaultAvatar(userId));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      // Récupérer le nombre de commandes passées (achats)
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Récupérer le nombre de commandes reçues (ventes) - pour les vendeurs
      const { count: salesCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      // Récupérer le nombre de produits vendus (si vendeur)
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      // Récupérer le nombre d'avis laissés
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setTotalOrders(ordersCount || 0);
      setTotalSales(salesCount || 0);
      setTotalProducts(productsCount || 0);
      setTotalReviews(reviewsCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAvatarPress = () => {
    setAvatarZoomModalVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
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
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const openEditModal = () => {
    setEditFirstName(profile?.first_name || '');
    setEditLastName(profile?.last_name || '');
    setEditPhone(profile?.phone || '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Validation
      const firstNameValidation = validateUsername(editFirstName);
      if (!firstNameValidation.isValid) {
        Alert.alert('Erreur', firstNameValidation.errors.join(', '));
        return;
      }

      const lastNameValidation = validateUsername(editLastName);
      if (!lastNameValidation.isValid) {
        Alert.alert('Erreur', lastNameValidation.errors.join(', '));
        return;
      }

      const phoneValidation = validatePhoneNumber(editPhone);
      if (!phoneValidation.isValid) {
        Alert.alert('Erreur', phoneValidation.errors.join(', '));
        return;
      }

      const updates: any = {
        id: user.id,
        first_name: editFirstName,
        last_name: editLastName,
        full_name: `${editFirstName} ${editLastName}`,
        phone: editPhone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      setEditModalVisible(false);
      await fetchProfile(user.id);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      Speech.speak('Profil mis à jour', { language: 'fr-FR' });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
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

  const copyReferralCode = async () => {
    if (profile?.referral_code) {
      await ClipboardLib.setStringAsync(profile.referral_code);
      Speech.speak('Code copié', { language: 'fr-FR' });
      Alert.alert('✓ Copié!', 'Code de parrainage copié');
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  const totalPoints = profile?.panda_coins || 0;
  const referralPoints = (profile?.total_referrals || 0) * 50;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Mon Profil</Text>
        </View>

        {/* Avatar et Info */}
        <View style={styles.profileSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              style={styles.avatarContainer}
              activeOpacity={0.9}>
              <TeardropAvatar
                imageUri={avatarUri}
                size={140}
                shape="circle"
                glowColor={['#93C5FD', '#60A5FA']}
                borderWidth={4}
                borderColor={isDark ? '#374151' : '#FFFFFF'}
              >
                <Text style={styles.avatarText}>{userInitials}</Text>
              </TeardropAvatar>

              {/* Badge d'abonnement ou bouton caméra */}
              {currentPlan && currentPlan !== 'free' && currentPlan !== 'starter' ? (
                <LinearGradient
                  colors={
                    currentPlan === 'premium' ? ['#FBBF24', '#F59E0B', '#D97706'] :
                    currentPlan === 'pro' ? ['#A78BFA', '#8B5CF6', '#7C3AED'] :
                    ['#60A5FA', '#3B82F6', '#2563EB']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarSubscriptionBadge}
                >
                  <View style={styles.badgeInner}>
                    <Shield
                      size={22}
                      color="#FFFFFF"
                      strokeWidth={2.5}
                      fill={currentPlan === 'premium' ? '#FCD34D' : currentPlan === 'pro' ? '#C4B5FD' : '#93C5FD'}
                    />
                    <View style={styles.checkIconContainer}>
                      <Check size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePickImage();
                  }}>
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: themeColors.text }]}>
              {profile?.full_name || 'Utilisateur'}
            </Text>
          </View>
          <Text style={[styles.userHandle, { color: themeColors.textSecondary }]}>
            @{profile?.username || 'username'}
          </Text>

          {/* Bouton Modifier */}
          <TouchableOpacity
            style={[styles.editProfileButton, { backgroundColor: themeColors.card }]}
            onPress={openEditModal}>
            <Edit3 size={16} color={Colors.primaryOrange} />
            <Text style={[styles.editProfileText, { color: Colors.primaryOrange }]}>
              Modifier le profil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push('/orders')}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{totalOrders}</Text>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.blue }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Commandes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => setPointsModalVisible(true)}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{totalPoints}</Text>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.yellow }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Points</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={copyReferralCode}>
            <View style={styles.referralCodeContainer}>
              <Text style={[styles.statNumber, { color: themeColors.text, fontSize: 16 }]}>
                {profile?.referral_code || '---'}
              </Text>
              <Copy size={14} color="#10B981" />
            </View>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.green }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Code de parrainage</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { backgroundColor: themeColors.card }]}>
          <MenuItem
            icon={<Crown size={24} color={themeColors.menuIcon.text} />}
            label="Abonnement"
            onPress={() => {
              router.push('/seller/subscription-plans');
              Speech.speak('Gestion des abonnements', { language: 'fr-FR' });
            }}
            backgroundColor={themeColors.menuIcon.bg.yellow}
            themeColors={themeColors}
            rightIcon={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[
                  styles.subscriptionBadgeSmall,
                  { backgroundColor:
                    currentPlan === 'premium' ? '#F59E0B' :
                    currentPlan === 'pro' ? '#8B5CF6' :
                    currentPlan === 'starter' ? '#3B82F6' :
                    themeColors.border
                  }
                ]}>
                  {currentPlan && currentPlan !== 'free' && (
                    <Crown size={10} color="#FFFFFF" />
                  )}
                  <Text style={styles.subscriptionBadgeSmallText}>
                    {currentPlan === 'premium' ? 'PREMIUM' :
                     currentPlan === 'pro' ? 'PRO' :
                     currentPlan === 'starter' ? 'STARTER' :
                     'GRATUIT'}
                  </Text>
                </View>
                <ChevronRight size={20} color={themeColors.textSecondary} />
              </View>
            }
          />

          {/* Menu Commandes - avec sous-menu pour vendeurs */}
          {profile?.is_seller ? (
            <View>
              <MenuItem
                icon={<Package size={24} color={themeColors.menuIcon.text} />}
                label="Commandes"
                onPress={() => setOrdersMenuExpanded(!ordersMenuExpanded)}
                backgroundColor={themeColors.menuIcon.bg.blue}
                themeColors={themeColors}
                rightIcon={ordersMenuExpanded ?
                  <ChevronUp size={20} color={themeColors.textSecondary} /> :
                  <ChevronDown size={20} color={themeColors.textSecondary} />
                }
              />

              {ordersMenuExpanded && (
                <View style={[styles.subMenuContainer, { backgroundColor: themeColors.background }]}>
                  <TouchableOpacity
                    style={[styles.subMenuItem, { backgroundColor: themeColors.card }]}
                    onPress={() => {
                      setOrdersMenuExpanded(false);
                      router.push('/seller/orders');
                    }}>
                    <View style={[styles.subMenuIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                      <TrendingUp size={20} color="#10B981" />
                    </View>
                    <View style={styles.subMenuContent}>
                      <Text style={[styles.subMenuLabel, { color: themeColors.text }]}>
                        Mes Ventes
                      </Text>
                      <Text style={[styles.subMenuDescription, { color: themeColors.textSecondary }]}>
                        {totalSales} commande{totalSales > 1 ? 's' : ''} reçue{totalSales > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subMenuItem, { backgroundColor: themeColors.card }]}
                    onPress={() => {
                      setOrdersMenuExpanded(false);
                      router.push('/orders');
                    }}>
                    <View style={[styles.subMenuIconWrapper, { backgroundColor: '#DBEAFE' }]}>
                      <ShoppingBag size={20} color="#2563EB" />
                    </View>
                    <View style={styles.subMenuContent}>
                      <Text style={[styles.subMenuLabel, { color: themeColors.text }]}>
                        Mes Achats
                      </Text>
                      <Text style={[styles.subMenuDescription, { color: themeColors.textSecondary }]}>
                        {totalOrders} commande{totalOrders > 1 ? 's' : ''} passée{totalOrders > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <MenuItem
              icon={<Package size={24} color={themeColors.menuIcon.text} />}
              label="Mes Commandes"
              onPress={() => router.push('/orders')}
              backgroundColor={themeColors.menuIcon.bg.blue}
              themeColors={themeColors}
            />
          )}

          <MenuItem
            icon={<Settings size={24} color={themeColors.menuIcon.text} />}
            label="Paramètres"
            onPress={() => setSettingsModalVisible(true)}
            backgroundColor={themeColors.menuIcon.bg.lightBlue}
            themeColors={themeColors}
          />

          <MenuItem
            icon={<Headphones size={24} color={themeColors.menuIcon.text} />}
            label="Aide et Support"
            onPress={() => setInformationModalVisible(true)}
            backgroundColor={themeColors.menuIcon.bg.green}
            themeColors={themeColors}
          />

          {/* Mode développeur - Test de localisation */}
          {__DEV__ && (
            <MenuItem
              icon={<MapPin size={24} color={themeColors.menuIcon.text} />}
              label="🧪 Test Géolocalisation"
              onPress={() => {
                router.push('/test-location');
                Speech.speak('Test de localisation', { language: 'fr-FR' });
              }}
              backgroundColor="#9333EA"
              themeColors={themeColors}
            />
          )}

          <MenuItem
            icon={<LogOut size={24} color={themeColors.menuIcon.text} />}
            label="Déconnexion"
            onPress={handleSignOut}
            backgroundColor={themeColors.menuIcon.bg.red}
            themeColors={themeColors}
            isLast
          />
        </View>

        {/* Vendeur Section */}
        {profile?.is_seller && (
          <View style={styles.sellerSection}>
            <TouchableOpacity
              style={[styles.sellerCard, { backgroundColor: themeColors.card, marginBottom: 12 }]}
              onPress={() => router.push('/seller/my-shop')}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sellerGradient}>
                <Store size={24} color="#FFFFFF" />
                <View style={styles.sellerContent}>
                  <Text style={styles.sellerTitle}>Ma Boutique</Text>
                  <Text style={styles.sellerText}>
                    Personnalisez votre espace vendeur
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sellerCard, { backgroundColor: themeColors.card }]}
              onPress={() => router.push('/seller/products')}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sellerGradient}>
                <ShoppingBag size={24} color="#FFFFFF" />
                <View style={styles.sellerContent}>
                  <Text style={styles.sellerTitle}>Mes Produits</Text>
                  <Text style={styles.sellerText}>
                    {totalProducts} produit{totalProducts > 1 ? 's' : ''} en vente
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {!profile?.is_seller && (
          <TouchableOpacity
            style={[styles.sellerCard, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/seller/setup')}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sellerGradient}>
              <TrendingUp size={24} color="#FFFFFF" />
              <View style={styles.sellerContent}>
                <Text style={styles.sellerTitle}>Devenir Vendeur</Text>
                <Text style={styles.sellerText}>Commencez à vendre vos produits</Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Points Modal (avec Récompenses intégrées) */}
      <Modal
        visible={pointsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPointsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Mes Points & Récompenses</Text>
              <TouchableOpacity onPress={() => setPointsModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.pointsHeader, { backgroundColor: themeColors.background }]}>
                <Sparkles size={40} color="#F59E0B" />
                <Text style={[styles.pointsTotal, { color: themeColors.text }]}>{totalPoints}</Text>
                <Text style={[styles.pointsLabel, { color: themeColors.textSecondary }]}>Panda Coins disponibles</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 20, marginBottom: 12 }]}>
                Récompenses disponibles
              </Text>

              <View style={styles.rewardsList}>
                <RewardItem
                  icon={<Gift size={24} color={isDark ? '#C084FC' : '#8B5CF6'} />}
                  name="Bon d'achat 5000 FCFA"
                  description="Valable sur tous les produits"
                  cost="500 pts"
                  bgColor={themeColors.statBadge.purple}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Star size={24} color={isDark ? '#34D399' : '#059669'} />}
                  name="Livraison gratuite"
                  description="1 mois de livraison offerte"
                  cost="300 pts"
                  bgColor={themeColors.statBadge.green}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Crown size={24} color={isDark ? '#FBBF24' : '#D97706'} />}
                  name="Badge Premium"
                  description="Accès premium 3 mois"
                  cost="1000 pts"
                  bgColor={themeColors.statBadge.yellow}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Heart size={24} color={isDark ? '#60A5FA' : '#2563EB'} />}
                  name="Don à une association"
                  description="Conversion en don caritatif"
                  cost="100 pts"
                  bgColor={themeColors.statBadge.blue}
                  themeColors={themeColors}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        visible={subscriptionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubscriptionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Abonnement Premium</Text>
              <TouchableOpacity onPress={() => setSubscriptionModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.subscriptionIntro, { color: themeColors.textSecondary }]}>
                Choisissez votre plan et profitez d'avantages exclusifs
              </Text>

              <View style={styles.subscriptionPlans}>
                {/* Plan Starter - 3000F */}
                <TouchableOpacity style={[styles.planCard, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.planBadge, { backgroundColor: themeColors.planBadge.blue }]}>
                    <Star size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    <Text style={[styles.planBadgeText, { color: themeColors.text }]}>Starter</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: themeColors.text }]}>3000 FCFA</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>par mois</Text>
                  <View style={styles.planFeatures}>
                    <PlanFeature text="20 produits maximum" themeColors={themeColors} />
                    <PlanFeature text="5 photos par produit" themeColors={themeColors} />
                    <PlanFeature text="Commission 12%" themeColors={themeColors} />
                    <PlanFeature text="Support par email" themeColors={themeColors} />
                  </View>
                  <TouchableOpacity style={styles.selectPlanButton}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectPlanGradient}>
                      <Text style={styles.selectPlanText}>Choisir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Plan Pro - 5000F */}
                <TouchableOpacity style={[styles.planCard, styles.planCardPopular, { backgroundColor: themeColors.background }]}>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: themeColors.planBadge.yellow }]}>
                    <Crown size={18} color={isDark ? '#FBBF24' : '#F59E0B'} />
                    <Text style={[styles.planBadgeText, { color: themeColors.text }]}>Pro</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: themeColors.text }]}>5000 FCFA</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>par mois</Text>
                  <View style={styles.planFeatures}>
                    <PlanFeature text="100 produits maximum" themeColors={themeColors} />
                    <PlanFeature text="10 photos par produit" themeColors={themeColors} />
                    <PlanFeature text="Commission 8%" themeColors={themeColors} />
                    <PlanFeature text="Support prioritaire" themeColors={themeColors} />
                    <PlanFeature text="Badge Pro" themeColors={themeColors} />
                  </View>
                  <TouchableOpacity style={styles.selectPlanButton}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectPlanGradient}>
                      <Text style={styles.selectPlanText}>Choisir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Plan Premium - 15000F */}
                <TouchableOpacity style={[styles.planCard, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.planBadge, { backgroundColor: themeColors.planBadge.purple }]}>
                    <Sparkles size={18} color={isDark ? '#C084FC' : '#8B5CF6'} />
                    <Text style={[styles.planBadgeText, { color: themeColors.text }]}>Premium</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: themeColors.text }]}>15000 FCFA</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>par mois</Text>
                  <View style={styles.planFeatures}>
                    <PlanFeature text="Produits illimités" themeColors={themeColors} />
                    <PlanFeature text="20 photos par produit" themeColors={themeColors} />
                    <PlanFeature text="Commission 5%" themeColors={themeColors} />
                    <PlanFeature text="Support dédié 24/7" themeColors={themeColors} />
                    <PlanFeature text="Badge Premium" themeColors={themeColors} />
                    <PlanFeature text="Analytics avancés" themeColors={themeColors} />
                  </View>
                  <TouchableOpacity style={styles.selectPlanButton}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectPlanGradient}>
                      <Text style={styles.selectPlanText}>Choisir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Paramètres</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Préférences d'interface</Text>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    userRole === 'buyer' && styles.settingsItemSelected
                  ]}
                  onPress={async () => {
                    try {
                      await setUserRole('buyer');
                      Alert.alert(
                        'Rôle modifié',
                        'Vous utilisez maintenant l\'interface acheteur.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              setSettingsModalVisible(false);
                              router.replace('/' as any);
                            }
                          }
                        ]
                      );
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible de changer de rôle');
                    }
                  }}>
                  <ShoppingBag size={20} color={userRole === 'buyer' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Mode Acheteur</Text>
                  {userRole === 'buyer' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    userRole === 'seller' && styles.settingsItemSelected
                  ]}
                  onPress={async () => {
                    try {
                      await setUserRole('seller');
                      Alert.alert(
                        'Rôle modifié',
                        'Vous utilisez maintenant l\'interface vendeur.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              setSettingsModalVisible(false);
                              router.replace('/seller/my-shop' as any);
                            }
                          }
                        ]
                      );
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible de changer de rôle');
                    }
                  }}>
                  <Store size={20} color={userRole === 'seller' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Mode Vendeur</Text>
                  {userRole === 'seller' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
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
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Mode clair</Text>
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
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Mode sombre</Text>
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
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Automatique</Text>
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
                    setSettingsModalVisible(false);
                    router.push('/settings/privacy');
                  }}>
                  <Shield size={20} color="#8B5CF6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Confidentialité</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setSettingsModalVisible(false);
                    router.push('/settings/terms');
                  }}>
                  <FileText size={20} color="#3B82F6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Conditions d'utilisation</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setSettingsModalVisible(false);
                    router.push('/settings/delete-account');
                  }}>
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={[styles.settingsText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Information Modal */}
      <Modal
        visible={informationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInformationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Aide et Support</Text>
              <TouchableOpacity onPress={() => setInformationModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoSection}>
                {/* Section Contact */}
                <View style={[styles.supportSectionHeader, { borderBottomColor: themeColors.border }]}>
                  <MessageCircle size={20} color="#F59E0B" />
                  <Text style={[styles.supportSectionTitle, { color: themeColors.text }]}>
                    Contactez-nous
                  </Text>
                </View>

                <InfoItem
                  icon={<Phone size={20} color={isDark ? '#34D399' : '#10B981'} />}
                  label="Service Client"
                  value="+221 77 123 45 67"
                  bgColor={themeColors.infoBadge.green}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Phone size={20} color={isDark ? '#34D399' : '#10B981'} />}
                  label="Support Technique"
                  value="+221 78 987 65 43"
                  bgColor={themeColors.infoBadge.green}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Mail size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />}
                  label="Email"
                  value="support@senepanda.com"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Mail size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />}
                  label="Email Commercial"
                  value="contact@senepanda.com"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />

                {/* Section Réseaux Sociaux */}
                <View style={[styles.supportSectionHeader, { borderBottomColor: themeColors.border }]}>
                  <Star size={20} color="#F59E0B" />
                  <Text style={[styles.supportSectionTitle, { color: themeColors.text }]}>
                    Suivez-nous
                  </Text>
                </View>

                <InfoItem
                  icon={<Facebook size={20} color={isDark ? '#60A5FA' : '#1877F2'} />}
                  label="Facebook"
                  value="@SenePanda"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Instagram size={20} color={isDark ? '#F472B6' : '#E4405F'} />}
                  label="Instagram"
                  value="@senepanda_official"
                  bgColor={themeColors.infoBadge.pink}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Twitter size={20} color={isDark ? '#60A5FA' : '#1DA1F2'} />}
                  label="Twitter / X"
                  value="@SenePanda"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />

                {/* Section Horaires */}
                <View style={[styles.supportSectionHeader, { borderBottomColor: themeColors.border }]}>
                  <Clock size={20} color="#F59E0B" />
                  <Text style={[styles.supportSectionTitle, { color: themeColors.text }]}>
                    Horaires d'ouverture
                  </Text>
                </View>

                <View style={[styles.hoursContainer, { backgroundColor: themeColors.background }]}>
                  <Text style={[styles.hoursText, { color: themeColors.text }]}>
                    Lundi - Vendredi : 8h00 - 20h00
                  </Text>
                  <Text style={[styles.hoursText, { color: themeColors.text }]}>
                    Samedi : 9h00 - 18h00
                  </Text>
                  <Text style={[styles.hoursText, { color: themeColors.text }]}>
                    Dimanche : 10h00 - 16h00
                  </Text>
                </View>

                {/* Note */}
                <View style={[styles.supportNote, { backgroundColor: isDark ? '#1F2937' : '#FFF7ED' }]}>
                  <Headphones size={18} color="#F59E0B" />
                  <Text style={[styles.supportNoteText, { color: themeColors.textSecondary }]}>
                    Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans votre expérience SenePanda.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Avatar Zoom Modal */}
      <Modal
        visible={avatarZoomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarZoomModalVisible(false)}>
        <TouchableOpacity
          style={styles.avatarZoomOverlay}
          activeOpacity={1}
          onPress={() => setAvatarZoomModalVisible(false)}>
          <View style={styles.avatarZoomContainer}>
            <TouchableOpacity
              style={styles.closeZoomButton}
              onPress={() => setAvatarZoomModalVisible(false)}>
              <X size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TeardropAvatar
              imageUri={avatarUri}
              size={SCREEN_WIDTH * 0.85}
              shape="circle"
              glowColor={['#93C5FD', '#60A5FA']}
              borderWidth={6}
              borderColor="#FFFFFF"
            >
              <Text style={[styles.avatarText, { fontSize: 120 }]}>{userInitials}</Text>
            </TeardropAvatar>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={() => {
                setAvatarZoomModalVisible(false);
                handlePickImage();
              }}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.changePhotoGradient}>
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>Changer la photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Prénom</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="Jean"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nom</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Dupont"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Téléphone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+221 77 123 45 67"
                  keyboardType="phone-pad"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEdit}
                disabled={saving}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Composants
function MenuItem({
  icon,
  label,
  onPress,
  backgroundColor,
  isLast = false,
  themeColors,
  rightIcon,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  isLast?: boolean;
  themeColors: any;
  rightIcon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor }]}>
        {icon}
      </View>
      <Text style={[styles.menuLabel, { color: themeColors.text }]}>{label}</Text>
      {rightIcon || <ChevronRight size={20} color={themeColors.textSecondary} />}
    </TouchableOpacity>
  );
}

function RewardItem({
  icon,
  name,
  description,
  cost,
  bgColor,
  themeColors,
}: any) {
  return (
    <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
      <View style={[styles.rewardIcon, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <View style={styles.rewardInfo}>
        <Text style={[styles.rewardName, { color: themeColors.text }]}>{name}</Text>
        <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>{description}</Text>
      </View>
      <Text style={[styles.rewardCost, { color: themeColors.text }]}>{cost}</Text>
    </TouchableOpacity>
  );
}

function InfoItem({
  icon,
  label,
  value,
  bgColor,
  themeColors,
}: any) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconCircle, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function PlanFeature({ text, themeColors }: { text: string; themeColors: any }) {
  return (
    <View style={styles.planFeatureItem}>
      <Check size={16} color="#10B981" />
      <Text style={[styles.planFeatureText, { color: themeColors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarSubscriptionBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkIconContainer: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subscriptionBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subscriptionBadgeSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userHandle: {
    fontSize: 14,
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  subscriptionCard: {
    marginHorizontal: Math.min(20, SCREEN_WIDTH * 0.05),
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  subscriptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.min(20, SCREEN_WIDTH * 0.05),
    gap: Math.min(16, SCREEN_WIDTH * 0.04),
    flexWrap: 'wrap',
  },
  subscriptionIconContainer: {
    width: Math.min(56, SCREEN_WIDTH * 0.14),
    height: Math.min(56, SCREEN_WIDTH * 0.14),
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
    minWidth: 150,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  subscriptionLabel: {
    fontSize: Math.min(12, SCREEN_WIDTH * 0.03),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: Math.min(10, SCREEN_WIDTH * 0.025),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscriptionPlan: {
    fontSize: Math.min(24, SCREEN_WIDTH * 0.06),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subscriptionDays: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscriptionDaysText: {
    fontSize: Math.min(13, SCREEN_WIDTH * 0.0325),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subscriptionChevron: {
    opacity: 0.6,
  },
  sellerSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sellerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  sellerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  sellerContent: {
    flex: 1,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sellerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  pointsHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  pointsTotal: {
    fontSize: 48,
    fontWeight: '900',
    marginTop: 12,
  },
  pointsLabel: {
    fontSize: 15,
    marginTop: 8,
  },
  rewardsList: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 13,
  },
  rewardCost: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
  },
  walletTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  settingsItemSelected: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
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
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  supportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    marginBottom: 16,
    marginTop: 8,
    borderBottomWidth: 1,
  },
  supportSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  hoursContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '500',
  },
  supportNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  supportNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscriptionIntro: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  subscriptionPlans: {
    gap: 20,
    marginBottom: 24,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardPopular: {
    borderColor: '#F59E0B',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    marginBottom: 20,
  },
  planFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planFeatureText: {
    fontSize: 14,
    flex: 1,
  },
  selectPlanButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectPlanGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPlanText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Sous-menu styles
  subMenuContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subMenuIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subMenuContent: {
    flex: 1,
    gap: 4,
  },
  subMenuLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subMenuDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Avatar Zoom Modal styles
  avatarZoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarZoomContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  closeZoomButton: {
    position: 'absolute',
    top: -100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  changePhotoButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
  },
  changePhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
