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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type TabType = 'about' | 'posts' | 'gallery' | 'followers';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [isFollowing, setIsFollowing] = useState(false);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
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
      toValue: index * (width / 4),
      useNativeDriver: true,
      friction: 8,
    }).start();
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
      {/* Info Cards */}
      <View style={styles.infoCardsContainer}>
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
      </View>

      {/* Badges */}
      {renderBadges()}

      {/* Additional Info */}
      <View style={styles.additionalInfo}>
        <Text style={styles.sectionTitle}>📋 Informations</Text>

        {profile?.is_seller && (
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Shield size={20} color="#10B981" />
            </View>
            <Text style={styles.infoText}>Vendeur vérifié</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIconCircle}>
            <Calendar size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.infoText}>
            Membre depuis {new Date(profile?.created_at || '').getFullYear()}
          </Text>
        </View>

        {profile?.loyalty_level && (
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Star size={20} color="#F59E0B" />
            </View>
            <Text style={styles.infoText}>
              Niveau: {profile.loyalty_level.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPostsContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.emptyText}>Aucune publication pour le moment</Text>
    </View>
  );

  const renderGalleryContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.galleryGrid}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.galleryItem}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.galleryPlaceholder}>
              <Camera size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFollowersContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.emptyText}>Aucun follower pour le moment</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header with Gradient */}
        <LinearGradient
          colors={['#667EEA', '#764BA2', '#F093FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}>

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

            {/* Name and Username */}
            <Text style={styles.profileName}>{profile.full_name || profile.username}</Text>
            {profile.username && (
              <Text style={styles.profileUsername}>@{profile.username}</Text>
            )}

            {/* Bio */}
            <Text style={styles.profileBio}>
              ✨ Passionate about quality products {'\n'}
              📍 {profile.city || profile.country || 'Worldwide'}
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profile.total_referrals || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.total_reviews || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profile.average_rating > 0 ? profile.average_rating.toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
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
        <View style={styles.tabsContainer}>
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('about', 0)}
              activeOpacity={0.7}>
              <User size={20} color={activeTab === 'about' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
                À propos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('posts', 1)}
              activeOpacity={0.7}>
              <Grid size={20} color={activeTab === 'posts' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
                Posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('gallery', 2)}
              activeOpacity={0.7}>
              <Camera size={20} color={activeTab === 'gallery' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'gallery' && styles.tabTextActive]}>
                Galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange('followers', 3)}
              activeOpacity={0.7}>
              <Users size={20} color={activeTab === 'followers' ? '#667EEA' : '#9CA3AF'} />
              <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
                Followers
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
        {activeTab === 'about' && renderAboutContent()}
        {activeTab === 'posts' && renderPostsContent()}
        {activeTab === 'gallery' && renderGalleryContent()}
        {activeTab === 'followers' && renderFollowersContent()}

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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
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
    width: width / 4,
    height: 3,
    backgroundColor: '#667EEA',
    borderRadius: 2,
  },

  // Tab Content
  tabContent: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 40,
    fontWeight: '500',
  },

  // Info Cards
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
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
