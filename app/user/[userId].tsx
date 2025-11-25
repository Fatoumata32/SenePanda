import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Profile } from '@/types/database';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Phone,
  Star,
  Shield,
  Ban,
  CheckCircle,
  Calendar,
  Share2,
  Users,
  Camera,
  Grid,
  User,
  MessageCircle,
  ShoppingBag,
  Package,
  Heart,
  ArrowLeft,
  Moon,
  Sun,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

type TabType = 'about' | 'products' | 'reviews';

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    followers: 0,
  });

  // Theme colors
  const themeColors = {
    background: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    textMuted: isDark ? '#9CA3AF' : '#9CA3AF',
    border: isDark ? '#374151' : '#E5E7EB',
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      checkIfBlocked();
    }
  }, [userId]);

  const handleToggleDarkMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Charger le profil
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }

      if (!data) {
        console.warn('User profile not found with id:', userId);
        Alert.alert('Erreur', 'Profil utilisateur introuvable');
        return;
      }

      setProfile(data);

      // Charger les produits du vendeur
      if (data.is_seller) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, title, price, image_url, stock, is_active')
          .eq('seller_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!productsError && productsData) {
          setProducts(productsData);
          setStats(prev => ({ ...prev, totalProducts: productsData.length }));
        }

        // Charger les statistiques de ventes
        const { count: salesCount } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', userId);

        if (salesCount) {
          setStats(prev => ({ ...prev, totalSales: salesCount }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const checkIfBlocked = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_user_blocked', {
        p_blocker_id: user.id,
        p_blocked_id: userId,
      });

      if (!error) {
        setIsBlocked(data);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!user || !profile) return;

    Alert.alert(
      'Bloquer cet utilisateur',
      `Êtes-vous sûr de vouloir bloquer ${profile.full_name || profile.username}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            try {
              setBlockLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              const { data, error } = await supabase.rpc('block_user', {
                p_blocker_id: user.id,
                p_blocked_id: userId,
                p_reason: null,
              });

              if (error) throw error;

              if (data.success) {
                setIsBlocked(true);
                Alert.alert('Succès', 'Utilisateur bloqué');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setBlockLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async () => {
    if (!user || !profile) return;

    try {
      setBlockLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { data, error } = await supabase.rpc('unblock_user', {
        p_blocker_id: user.id,
        p_blocked_id: userId,
      });

      if (error) throw error;

      if (data.success) {
        setIsBlocked(false);
        Alert.alert('Succès', 'Utilisateur débloqué');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleTabChange = (tab: TabType, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    Animated.spring(tabIndicatorAnim, {
      toValue: index * (width / 3),
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const openSocialLink = (url: string | null, type: string) => {
    if (!url) {
      Alert.alert('Non disponible', `Lien ${type} non renseigné`);
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', `Impossible d'ouvrir le lien ${type}`);
    });
  };

  const openWhatsApp = (number: string | null) => {
    if (!number) {
      Alert.alert('Non disponible', 'Numéro WhatsApp non renseigné');
      return;
    }
    const cleanNumber = number.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleanNumber}`).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
    });
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Partager', 'Fonctionnalité de partage bientôt disponible!');
  };

  const renderBadges = () => {
    const badges = [
      { id: 1, icon: '🏆', name: 'Top Vendeur', color: '#FFD700' },
      { id: 2, icon: '⭐', name: 'Expert', color: '#8B5CF6' },
      { id: 3, icon: '💎', name: 'Premium', color: '#3B82F6' },
      { id: 4, icon: '🔥', name: 'Populaire', color: '#EF4444' },
    ];

    return (
      <View style={styles.badgesContainer}>
        <Text style={styles.sectionTitle}>🏅 Récompenses</Text>
        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              style={[
                styles.badgeCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50 + index * 10],
                      }),
                    },
                    { scale: scaleAnim },
                  ],
                },
              ]}>
              <LinearGradient
                colors={[badge.color + '20', badge.color + '10']}
                style={styles.badgeGradient}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  const renderAboutContent = () => (
    <View style={styles.tabContent}>
      {/* Contact Info Cards */}
      <View style={styles.infoCardsContainer}>
        <TouchableOpacity
          style={styles.infoCardTouchable}
          onPress={() => profile?.phone && Linking.openURL(`tel:${profile.phone}`)}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCard}>
            <View style={styles.infoCardIconContainer}>
              <Phone size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.infoCardLabel}>Téléphone</Text>
            <Text style={styles.infoCardValue}>{profile?.phone || 'Non renseigné'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoCardTouchable}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#F093FB', '#F5576C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCard}>
            <View style={styles.infoCardIconContainer}>
              <MapPin size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.infoCardLabel}>Localisation</Text>
            <Text style={styles.infoCardValue}>
              {profile?.city || profile?.country || 'Non renseigné'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Social Media Links */}
      {profile?.is_seller && (profile?.whatsapp_number || profile?.facebook_url || profile?.instagram_url) && (
        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>📱 Réseaux sociaux</Text>
          <View style={styles.socialButtons}>
            {profile?.whatsapp_number && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#25D366' }]}
                onPress={() => openWhatsApp(profile.whatsapp_number)}
                activeOpacity={0.8}>
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {profile?.facebook_url && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                onPress={() => openSocialLink(profile.facebook_url, 'Facebook')}
                activeOpacity={0.8}>
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            )}
            {profile?.instagram_url && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
                onPress={() => openSocialLink(profile.instagram_url, 'Instagram')}
                activeOpacity={0.8}>
                <Text style={styles.socialButtonText}>Instagram</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Shop Description */}
      {profile?.is_seller && profile?.shop_description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{profile.shop_description}</Text>
          </View>
        </View>
      )}

      {/* Seller Info */}
      <View style={styles.additionalInfo}>
        <Text style={styles.sectionTitle}>📋 Informations</Text>

        {profile?.is_seller && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Shield size={20} color="#10B981" />
            </View>
            <View style={styles.infoRowContent}>
              <Text style={styles.infoText}>Vendeur vérifié</Text>
              <Text style={styles.infoSubtext}>Identité confirmée</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={[styles.infoIconCircle, { backgroundColor: '#EDE9FE' }]}>
            <Calendar size={20} color="#8B5CF6" />
          </View>
          <View style={styles.infoRowContent}>
            <Text style={styles.infoText}>
              Membre depuis {new Date(profile?.created_at || '').getFullYear()}
            </Text>
            <Text style={styles.infoSubtext}>
              {Math.floor((Date.now() - new Date(profile?.created_at || '').getTime()) / (1000 * 60 * 60 * 24 * 30))} mois d'ancienneté
            </Text>
          </View>
        </View>

        {profile?.is_seller && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Package size={20} color="#F59E0B" />
            </View>
            <View style={styles.infoRowContent}>
              <Text style={styles.infoText}>{stats.totalProducts} produits</Text>
              <Text style={styles.infoSubtext}>{stats.totalSales} ventes réalisées</Text>
            </View>
          </View>
        )}

        {profile?.average_rating && profile.average_rating > 0 && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Star size={20} color="#EF4444" />
            </View>
            <View style={styles.infoRowContent}>
              <Text style={styles.infoText}>Note: {profile.average_rating.toFixed(1)}/5</Text>
              <Text style={styles.infoSubtext}>{profile?.total_reviews || 0} avis clients</Text>
            </View>
          </View>
        )}
      </View>

      {/* Trust Badges */}
      <View style={styles.trustSection}>
        <Text style={styles.sectionTitle}>🛡️ Garanties</Text>
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: '#DBEAFE' }]}>
              <Shield size={24} color="#2563EB" />
            </View>
            <Text style={styles.trustText}>Paiement{'\n'}sécurisé</Text>
          </View>
          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle size={24} color="#059669" />
            </View>
            <Text style={styles.trustText}>Produits{'\n'}authentiques</Text>
          </View>
          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: '#FEF3C7' }]}>
              <MessageCircle size={24} color="#D97706" />
            </View>
            <Text style={styles.trustText}>Support{'\n'}réactif</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProductsContent = () => (
    <View style={styles.tabContent}>
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Aucun produit pour le moment</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
              activeOpacity={0.8}>
              {product.image_url ? (
                <Image source={{ uri: product.image_url }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Package size={32} color="#D1D5DB" />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString()} FCFA
                </Text>
                {product.stock <= 5 && product.stock > 0 && (
                  <Text style={styles.lowStock}>Plus que {product.stock} en stock</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderReviewsContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyContainer}>
        <Star size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>Aucun avis pour le moment</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profil', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#667EEA', '#764BA2', '#F093FB']}
            style={styles.loadingGradient}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profil', headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profil non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Dark mode colors
  const colors = {
    background: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header with Gradient */}
        <LinearGradient
          colors={['#667EEA', '#764BA2', '#F093FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => router.back()}
              activeOpacity={0.7}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleToggleDarkMode}
              activeOpacity={0.7}>
              {isDark ? (
                <Sun size={24} color="#FFFFFF" />
              ) : (
                <Moon size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Decorative circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}>

            {/* Avatar with glow effect */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {profile.verified_seller && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={24} color="#FFFFFF" fill="#10B981" />
                </View>
              )}

              {profile.is_premium && (
                <View style={styles.premiumBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.premiumBadgeGradient}>
                    <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Shop Name or User Name */}
            <Text style={styles.profileName}>
              {profile.is_seller && profile.shop_name ? profile.shop_name : (profile.full_name || profile.username)}
            </Text>
            {profile.is_seller && profile.shop_name && (
              <Text style={styles.profileUsername}>par {profile.full_name || profile.username}</Text>
            )}
            {!profile.is_seller && profile.username && (
              <Text style={styles.profileUsername}>@{profile.username}</Text>
            )}

            {/* Shop Description or Bio */}
            <Text style={styles.profileBio}>
              {profile.is_seller && profile.shop_description
                ? profile.shop_description
                : `📍 ${profile.city || profile.country || 'Worldwide'}`}
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {stats.totalProducts}
                </Text>
                <Text style={styles.statLabel}>Produits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalSales}</Text>
                <Text style={styles.statLabel}>Ventes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profile.average_rating > 0 ? profile.average_rating.toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.statLabel}>Note</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {user?.id !== userId && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.followButton}
                  onPress={handleFollow}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={
                      isFollowing
                        ? ['#6B7280', '#4B5563']
                        : ['#FFD700', '#FFA500', '#FF8C00']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}>
                    {isFollowing ? (
                      <>
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Abonné</Text>
                      </>
                    ) : (
                      <>
                        <Users size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>S'abonner</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleShare}
                  activeOpacity={0.8}>
                  <View style={styles.iconButtonContent}>
                    <Share2 size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push(`/chat/${userId}`)}
                  activeOpacity={0.8}>
                  <View style={styles.iconButtonContent}>
                    <MessageCircle size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </LinearGradient>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('products', 0)}
              activeOpacity={0.7}>
              <ShoppingBag size={20} color={activeTab === 'products' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
                Produits
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('about', 1)}
              activeOpacity={0.7}>
              <User size={20} color={activeTab === 'about' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
                À propos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('reviews', 2)}
              activeOpacity={0.7}>
              <Star size={20} color={activeTab === 'reviews' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Avis
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{ translateX: tabIndicatorAnim }],
              },
            ]}
          />
        </View>

        {/* Tab Content */}
        {activeTab === 'products' && renderProductsContent()}
        {activeTab === 'about' && renderAboutContent()}
        {activeTab === 'reviews' && renderReviewsContent()}

        {/* Block/Unblock Section */}
        {user?.id !== userId && (
          <View style={styles.blockSection}>
            <TouchableOpacity
              style={styles.blockButton}
              onPress={isBlocked ? handleUnblockUser : handleBlockUser}
              disabled={blockLoading}
              activeOpacity={0.8}>
              {isBlocked ? (
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.blockButtonGradient}>
                  {blockLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle size={20} color="#FFFFFF" />
                      <Text style={styles.blockButtonText}>Débloquer</Text>
                    </>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.blockButtonInactive}>
                  {blockLoading ? (
                    <ActivityIndicator color="#EF4444" />
                  ) : (
                    <>
                      <Ban size={20} color="#EF4444" />
                      <Text style={styles.blockButtonTextInactive}>Bloquer</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  loadingGradient: {
    padding: 40,
    borderRadius: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Premium Header
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -30,
    left: -30,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGlow: {
    padding: 6,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 60,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumBadgeGradient: {
    padding: 8,
  },

  // Profile Info
  profileName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  profileBio: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  iconButtonContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#667EEA',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width / 3,
    height: 3,
    backgroundColor: '#667EEA',
    borderRadius: 2,
  },

  // Tab Content
  tabContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 16,
    fontWeight: '500',
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  lowStock: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },

  // Info Cards
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCardTouchable: {
    flex: 1,
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },

  // Social Section
  socialSection: {
    marginBottom: 24,
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Description Section
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },

  // Trust Section
  trustSection: {
    marginTop: 24,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 6,
  },
  infoCardValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },

  // Badges
  badgesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  badgeGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  // Additional Info
  additionalInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Gallery
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryItem: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  galleryPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Block Section
  blockSection: {
    padding: 20,
    paddingBottom: 40,
  },
  blockButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  blockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  blockButtonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#FEE2E2',
    gap: 10,
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  blockButtonTextInactive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});
