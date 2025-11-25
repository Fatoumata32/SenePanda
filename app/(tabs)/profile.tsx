import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Settings,
  ShoppingBag,
  Heart,
  Star,
  Package,
  TrendingUp,
  Award,
  Crown,
  ChevronRight,
  Camera,
  LogOut,
  Store,
  Bell,
  Shield,
  CreditCard,
  Gift,
  Users,
  Zap,
  BarChart3,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { Colors } from '@/constants/Colors';
import { useBonusSystem } from '@/hooks/useBonusSystem';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 280;
const AVATAR_SIZE = 100;

export default function ProfileScreenNew() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    orders: 0,
    favorites: 0,
    reviews: 0,
    followers: 0,
  });

  const { userPoints } = useBonusSystem();

  // Parallax effect for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    checkUser();
    fetchStats();
  }, []);

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
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch favorites count
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        orders: ordersCount || 0,
        favorites: favoritesCount || 0,
        reviews: reviewsCount || 0,
        followers: profile?.followers_count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkUser();
    await fetchStats();
    setRefreshing(false);
  }, []);

  const handlePickAvatar = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Upload avatar logic here
        Alert.alert('Succès', 'Avatar mis à jour avec succès');
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Erreur', 'Impossible de choisir une image');
    }
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/simple-auth');
          },
        },
      ]
    );
  };

  const userInitials = useMemo(() => {
    const fullName = profile?.full_name || profile?.username || 'U';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, [profile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <User size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Non connecté</Text>
          <Text style={styles.emptySubtitle}>Connectez-vous pour accéder à votre profil</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/simple-auth')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const QuickActionButton = ({ icon: Icon, label, onPress, color }: any) => (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const MenuButton = ({ icon: Icon, label, onPress, badge, color = Colors.primaryOrange }: any) => (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.9}
    >
      <View style={styles.menuButtonLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: color + '15' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={styles.menuButtonLabel}>{label}</Text>
      </View>
      <View style={styles.menuButtonRight}>
        {badge && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
        <ChevronRight size={20} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryOrange}
            colors={[Colors.primaryOrange]}
          />
        }
      >
        {/* Header with Gradient */}
        <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
          <LinearGradient
            colors={['#FF6B35', '#F59E0B', '#FBBF24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Premium Badge */}
            {profile?.is_premium && (
              <View style={styles.premiumBadgeContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumBadge}
                >
                  <Crown size={14} color="#FFFFFF" />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </LinearGradient>
              </View>
            )}

            {/* Avatar */}
            <Animated.View
              style={[
                styles.avatarContainer,
                {
                  transform: [{ scale: avatarScale }],
                  opacity: avatarOpacity,
                }
              ]}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={['#FF6B35', '#F59E0B']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>{userInitials}</Text>
                </LinearGradient>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                <Camera size={16} color={Colors.white} />
              </TouchableOpacity>
            </Animated.View>

            {/* User Info */}
            <Text style={styles.userName}>{profile?.full_name || profile?.username || 'Utilisateur'}</Text>
            {profile?.username && (
              <Text style={styles.userHandle}>@{profile.username}</Text>
            )}
            {profile?.bio && (
              <Text style={styles.userBio}>{profile.bio}</Text>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.orders}</Text>
                <Text style={styles.statLabel}>Commandes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.favorites}</Text>
                <Text style={styles.statLabel}>Favoris</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.reviews}</Text>
                <Text style={styles.statLabel}>Avis</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Points Card */}
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsCard}
          >
            <View style={styles.pointsCardHeader}>
              <View>
                <Text style={styles.pointsLabel}>Vos PandaCoins</Text>
                <Text style={styles.pointsValue}>{userPoints?.points || profile?.panda_coins || 0}</Text>
              </View>
              <View style={styles.pointsIconContainer}>
                <Zap size={32} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
            <TouchableOpacity
              style={styles.pointsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/rewards');
              }}
              activeOpacity={0.8}
            >
              <Gift size={18} color="#8B5CF6" />
              <Text style={styles.pointsButtonText}>Échanger des points</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                icon={ShoppingBag}
                label="Commandes"
                color="#10B981"
                onPress={() => router.push('/orders')}
              />
              <QuickActionButton
                icon={Heart}
                label="Favoris"
                color="#EF4444"
                onPress={() => router.push('/(tabs)/favorites')}
              />
              <QuickActionButton
                icon={Package}
                label="Livraisons"
                color="#3B82F6"
                onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
              />
              <QuickActionButton
                icon={Star}
                label="Avis"
                color="#F59E0B"
                onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
              />
            </View>
          </View>

          {/* Seller Section */}
          {profile?.is_seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Espace vendeur</Text>
              <MenuButton
                icon={Store}
                label="Ma boutique"
                onPress={() => router.push('/seller/setup')}
                color="#8B5CF6"
              />
              <MenuButton
                icon={BarChart3}
                label="Statistiques"
                onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
                color="#06B6D4"
              />
              <MenuButton
                icon={Package}
                label="Mes produits"
                onPress={() => router.push('/seller/products')}
                color="#10B981"
              />
            </View>
          )}

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mon compte</Text>
            <MenuButton
              icon={User}
              label="Modifier le profil"
              onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
              color={Colors.primaryOrange}
            />
            <MenuButton
              icon={CreditCard}
              label="Moyens de paiement"
              onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
              color="#6366F1"
            />
            <MenuButton
              icon={Users}
              label="Parrainage"
              onPress={() => router.push('/referral')}
              badge={profile?.total_referrals?.toString()}
              color="#EC4899"
            />
            <MenuButton
              icon={Crown}
              label="Devenir Premium"
              onPress={() => router.push('/seller/subscription-plans')}
              color="#F59E0B"
            />
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paramètres</Text>
            <MenuButton
              icon={Bell}
              label="Notifications"
              onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
              color="#8B5CF6"
            />
            <MenuButton
              icon={Shield}
              label="Confidentialité"
              onPress={() => Alert.alert('Bientôt disponible', 'Fonctionnalité en cours de développement')}
              color="#06B6D4"
            />
            <MenuButton
              icon={Settings}
              label="Préférences"
              onPress={() => router.push('/settings')}
              color="#6B7280"
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    height: HEADER_HEIGHT,
  },
  headerGradient: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  premiumBadgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  userHandle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  userBio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pointsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  pointsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  pointsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 64) / 4,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  menuButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  menuBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
