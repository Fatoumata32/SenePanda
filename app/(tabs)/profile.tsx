import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  LogOut,
  ShoppingBag,
  Settings,
  Crown,
  Gift,
  Star,
  Heart,
  Phone,
  Mail,
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
  Store,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as ClipboardLib from 'expo-clipboard';
import TeardropAvatar from '@/components/TeardropAvatar';
import { useFocusEffect } from '@react-navigation/native';
import SettingsModal from '@/components/profile/SettingsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCoinBalance } from '@/hooks/useCoinBalance';
import { Profile } from '@/types/database';
import { validateUsername, validatePhoneNumber } from '@/lib/validation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fonction pour générer un avatar unique par utilisateur
const getDefaultAvatar = (userId: string) => {
  return `https://ui-avatars.com/api/?name=${userId.substring(0, 2)}&size=256&background=random&color=fff&bold=true`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, setThemeMode, themeMode } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // PandaCoins
  const { balance: coinBalance, loading: coinsLoading, refresh: refreshCoins } = useCoinBalance();

  // Stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [planName, setPlanName] = useState<string>('Gratuit');

  // Menu déroulant pour les commandes (vendeur)
  const [ordersMenuExpanded, setOrdersMenuExpanded] = useState(false);

  // Modals
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [informationModalVisible, setInformationModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [avatarZoomModalVisible, setAvatarZoomModalVisible] = useState(false);

  // Animation
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Sécurité - Code PIN
  const [pinEnabled, setPinEnabled] = useState(false);

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : '#FFF8F0',
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
    infoBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      purple: isDark ? '#581C87' : '#F3E8FF',
      teal: isDark ? '#134E4A' : '#CCFBF1',
      pink: isDark ? '#831843' : '#FCE7F3',
      green: isDark ? '#064E3B' : '#D1FAE5',
    },
  }), [isDark]);

  const userInitials = useMemo(() => {
    if (profile?.first_name && profile?.last_name) {
      return (profile.first_name[0] + profile.last_name[0]).toUpperCase();
    }

    const fullName = profile?.full_name || profile?.username || 'User';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, [profile?.first_name, profile?.last_name, profile?.full_name, profile?.username]);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          await fetchStats(session.user.id);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/simple-auth');
    }
  }, [user, loading, router]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchProfile(user.id);
        fetchStats(user.id);
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
        await loadPinStatus();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPinStatus = async () => {
    try {
      const pinStatus = await AsyncStorage.getItem('pin_enabled');
      setPinEnabled(pinStatus === 'true');
    } catch (error) {
      console.error('Error loading PIN status:', error);
    }
  };

  const handleTogglePin = async () => {
    try {
      const newStatus = !pinEnabled;

      if (newStatus) {
        Alert.alert(
          'Activer le code PIN',
          'Vous allez être redirigé pour configurer votre code PIN de sécurité.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Continuer',
              onPress: () => {
                setSettingsModalVisible(false);
                router.push('/settings/setup-pin' as any);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Désactiver le code PIN',
          'Êtes-vous sûr de vouloir désactiver la protection par code PIN ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Désactiver',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.removeItem('pin_enabled');
                await AsyncStorage.removeItem('user_pin');
                setPinEnabled(false);
                Alert.alert('Code PIN désactivé', 'La protection par code PIN a été désactivée.');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling PIN:', error);
      Alert.alert('Erreur', 'Impossible de modifier le paramètre du code PIN.');
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

        const plan = data.subscription_plan || 'free';
        setCurrentPlan(plan);

        const planNames: Record<string, string> = {
          free: 'Gratuit',
          starter: 'Starter',
          pro: 'Pro',
          premium: 'Premium'
        };
        setPlanName(planNames[plan] || 'Gratuit');
      } else {
        setAvatarUri(getDefaultAvatar(userId));
        setCurrentPlan('free');
        setPlanName('Gratuit');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setAvatarUri(getDefaultAvatar(userId));
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: salesCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

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
            await AsyncStorage.removeItem('pin_enabled');
            await AsyncStorage.removeItem('user_pin');
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Erreur', error.message);
            setProfile(null);
            setUser(null);
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
          <ActivityIndicator size="large" color={themeColors.text} />
        </View>
      </SafeAreaView>
    );
  }

  const totalPoints = coinBalance?.points || 0;

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

          <TouchableOpacity
            style={[styles.editProfileButton, { backgroundColor: themeColors.card }]}
            onPress={openEditModal}>
            <Edit3 size={16} color={themeColors.text} />
            <Text style={[styles.editProfileText, { color: themeColors.text }]}>
              Modifier le profil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
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
            onPress={() => router.push('/orders')}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{totalOrders}</Text>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.blue }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Commandes</Text>
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
        {(profile?.is_seller || profile?.subscription_plan) && (
          <View style={styles.sellerSection}>
            <TouchableOpacity
              style={[styles.sellerCard, { backgroundColor: themeColors.card, marginBottom: 12 }]}
              onPress={() => router.push('/seller/my-shop')}>
              <LinearGradient
                colors={['#10B981', '#059669']}
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

        {!profile?.is_seller && !profile?.subscription_plan && (
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

      {/* Points Modal */}
      <Modal
        visible={pointsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPointsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Mes Panda Coins 🐼</Text>
              <TouchableOpacity onPress={() => setPointsModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.pointsHeader, { backgroundColor: themeColors.background }]}>
                <Sparkles size={40} color="#F59E0B" />
                <Text style={[styles.pointsTotal, { color: themeColors.text }]}>{totalPoints}</Text>
                <Text style={[styles.pointsLabel, { color: themeColors.textSecondary }]}>Panda Coins disponibles</Text>
                
                <View style={styles.conversionInfo}>
                  <Text style={styles.conversionText}>💡 1 coin = 5 FCFA de réduction au checkout</Text>
                </View>
              </View>

              <View style={styles.earnCoinsSection}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Comment gagner des coins ?
                </Text>
                <View style={styles.earnMethodsList}>
                  <View style={styles.earnMethod}>
                    <View style={[styles.earnMethodIcon, { backgroundColor: '#FEF3C7' }]}>
                      <ShoppingBag size={18} color="#F59E0B" />
                    </View>
                    <Text style={styles.earnMethodText}>1 coin / 1000 FCFA d'achat</Text>
                  </View>
                  <View style={styles.earnMethod}>
                    <View style={[styles.earnMethodIcon, { backgroundColor: '#DBEAFE' }]}>
                      <MessageCircle size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.earnMethodText}>+50 coins par avis</Text>
                  </View>
                  <View style={styles.earnMethod}>
                    <View style={[styles.earnMethodIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Gift size={18} color="#10B981" />
                    </View>
                    <Text style={styles.earnMethodText}>+200 coins par parrainage</Text>
                  </View>
                </View>
              </View>

              <View style={styles.coinsActionButtons}>
                {/* Boutique Récompenses supprimée */}
                
                <TouchableOpacity 
                  style={styles.coinsActionSecondary}
                  onPress={() => {
                    setPointsModalVisible(false);
                    router.push('/rewards');
                  }}>
                  <TrendingUp size={20} color="#F59E0B" />
                  <Text style={styles.coinsActionSecondaryText}>Voir l'historique</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 20, marginBottom: 12 }]}>
                Récompenses disponibles
              </Text>

              <View style={styles.rewardsList}>
                <RewardItem
                  icon={<Gift size={24} color={themeColors.text} />}
                  name="Bon d'achat 5000 FCFA"
                  description="Valable sur tous les produits"
                  cost="2200 pts"
                  bgColor={themeColors.statBadge.purple}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Star size={24} color={themeColors.text} />}
                  name="Livraison gratuite"
                  description="Prochaine commande"
                  cost="750 pts"
                  bgColor={themeColors.statBadge.green}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Crown size={24} color={themeColors.text} />}
                  name="Réduction 10%"
                  description="Sur votre prochaine commande"
                  cost="1000 pts"
                  bgColor={themeColors.statBadge.yellow}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Heart size={24} color={themeColors.text} />}
                  name="Réduction 5%"
                  description="Sur votre prochaine commande"
                  cost="500 pts"
                  bgColor={themeColors.statBadge.blue}
                  themeColors={themeColors}
                />
              </View>
              
              <View style={styles.checkoutReminder}>
                <Sparkles size={16} color="#D97706" />
                <Text style={styles.checkoutReminderText}>
                  Utilisez vos coins directement au checkout pour des réductions instantanées!
                </Text>
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
                <View style={[styles.supportSectionHeader, { borderBottomColor: themeColors.border }]}>
                  <MessageCircle size={20} color="#F59E0B" />
                  <Text style={[styles.supportSectionTitle, { color: themeColors.text }]}>
                    Contactez-nous
                  </Text>
                </View>

                <InfoItem
                  icon={<Phone size={20} color="#10B981" />}
                  label="Service Client"
                  value="+221 77 123 45 67"
                  bgColor={themeColors.infoBadge.green}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Phone size={20} color="#10B981" />}
                  label="Support Technique"
                  value="+221 78 987 65 43"
                  bgColor={themeColors.infoBadge.green}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Mail size={20} color="#3B82F6" />}
                  label="Email"
                  value="support@senepanda.com"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Mail size={20} color="#3B82F6" />}
                  label="Email Commercial"
                  value="contact@senepanda.com"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />

                <View style={[styles.supportSectionHeader, { borderBottomColor: themeColors.border }]}>
                  <Star size={20} color="#F59E0B" />
                  <Text style={[styles.supportSectionTitle, { color: themeColors.text }]}>
                    Suivez-nous
                  </Text>
                </View>

                <InfoItem
                  icon={<Facebook size={20} color="#1877F2" />}
                  label="Facebook"
                  value="@SenePanda"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Instagram size={20} color="#E4405F" />}
                  label="Instagram"
                  value="@senepanda_official"
                  bgColor={themeColors.infoBadge.pink}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Twitter size={20} color="#1DA1F2" />}
                  label="Twitter / X"
                  value="@SenePanda"
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />

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

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        onOpenSubscription={() => router.push('/seller/subscription-plans')}
        onOpenPrivacy={() => router.push('/settings/privacy')}
        onOpenTerms={() => router.push('/settings/terms')}
        onOpenDeleteAccount={() => router.push('/settings/delete-account')}
        onSignOut={handleSignOut}
        isPremium={currentPlan !== 'free' && currentPlan !== 'starter'}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        pinEnabled={pinEnabled}
        onTogglePin={handleTogglePin}
        themeColors={themeColors}
      />
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
  conversionInfo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  conversionText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  earnCoinsSection: {
    marginBottom: 20,
  },
  earnMethodsList: {
    gap: 10,
  },
  earnMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  earnMethodIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnMethodText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  coinsActionButtons: {
    gap: 10,
    marginBottom: 20,
  },
  coinsActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
  },
  coinsActionPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coinsActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    borderRadius: 12,
  },
  coinsActionSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  checkoutReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  checkoutReminderText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
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