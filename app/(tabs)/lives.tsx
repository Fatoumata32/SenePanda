import React, { useEffect, useState } from 'react';
// Fixed: removed Spacing and Typography imports to avoid cache issues
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Radio,
  Users,
  Eye,
  Video,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useActiveLiveSessions } from '@/hooks/useLiveShopping';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Page des Lives:
 * - Vendeurs: redirigés vers /seller/my-lives
 * - Acheteurs: voient la liste des lives actifs
 */
export default function LivesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSeller, setIsSeller] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hook pour les lives actifs
  const { sessions: activeLives, isLoading, refetch } = useActiveLiveSessions(50);

  useEffect(() => {
    checkUserRole();
  }, [user]);

  const checkUserRole = async () => {
    if (!user) {
      setIsSeller(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller, subscription_plan')
        .eq('id', user.id)
        .single();

      if (profile?.is_seller || profile?.subscription_plan) {
        // Rediriger les vendeurs vers leur gestion de lives
        router.replace('/seller/my-lives' as any);
      } else {
        setIsSeller(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsSeller(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderLiveCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.liveCard}
      onPress={() => router.push({ pathname: '/(tabs)/live-viewer/[id]', params: { id: item.id } } as any)}
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri: item.thumbnail_url ||
            item.seller?.avatar_url ||
            'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
        }}
        style={styles.liveThumbnail}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.liveGradient}
      />
      
      {/* Badge LIVE */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>

      {/* Viewers */}
      <View style={styles.viewersContainer}>
        <Eye size={14} color="#fff" />
        <Text style={styles.viewersText}>{item.viewer_count || 0}</Text>
      </View>

      {/* Info */}
      <View style={styles.liveInfo}>
        <Text style={styles.liveTitle} numberOfLines={2}>
          {item.title || 'Live Shopping'}
        </Text>
        <View style={styles.sellerRow}>
          <Image
            source={{
              uri: item.seller?.avatar_url ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
            }}
            style={styles.sellerAvatar}
          />
          <Text style={styles.sellerName} numberOfLines={1}>
            {item.seller?.shop_name || item.seller?.full_name || 'Vendeur'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#FF6B6B20', '#FF8E5320']}
        style={styles.emptyIconBg}
      >
        <Video size={64} color={Colors.primaryOrange} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Aucun live en cours</Text>
      <Text style={styles.emptySubtitle}>
        Revenez plus tard pour découvrir les lives{'\n'}de vos vendeurs préférés !
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/explore' as any)}
      >
        <Sparkles size={20} color="#fff" />
        <Text style={styles.exploreButtonText}>Explorer les boutiques</Text>
      </TouchableOpacity>
    </View>
  );

  // Afficher le loader pendant la vérification du rôle
  if (isSeller === null) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Radio size={20} color={Colors.error} />
          <Text style={styles.headerTitle}>Lives en cours</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      {activeLives.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.statText}>
              {activeLives.length} live{activeLives.length > 1 ? 's' : ''} actif{activeLives.length > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Users size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>
              {activeLives.reduce((sum, live) => sum + (live.viewer_count || 0), 0)} spectateurs
            </Text>
          </View>
        </View>
      )}

      {/* Liste des lives */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      ) : (
        <FlatList
          data={activeLives}
          renderItem={renderLiveCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primaryOrange]}
              tintColor={Colors.primaryOrange}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  statText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  liveThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  viewersContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  liveInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  liveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
  sellerName: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    gap: 8,
    elevation: 3,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
