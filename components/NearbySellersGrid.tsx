/**
 * =============================================
 * COMPOSANT: NearbySellersGrid
 * =============================================
 *
 * Affiche une grille de vendeurs proches
 * avec priorité aux vendeurs premium
 *
 * Fonctionnalités:
 * - Badge premium visible
 * - Distance affichée
 * - Note et avis
 * - Badge vérifié
 * - Tri automatique (premium en premier)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { NearbySeller } from '@/types/database';
import { findNearbySellers } from '@/lib/geolocation';
import { formatDistance, getPremiumBadge } from '@/lib/geolocation';

interface NearbySellersGridProps {
  userLatitude: number;
  userLongitude: number;
  maxDistance?: number; // Distance max en km
  limit?: number;
  onSellerPress?: (sellerId: string) => void;
}

export default function NearbySellersGrid({
  userLatitude,
  userLongitude,
  maxDistance = 50,
  limit = 20,
  onSellerPress,
}: NearbySellersGridProps) {
  const router = useRouter();
  const [sellers, setSellers] = useState<NearbySeller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNearbySellers();
  }, [userLatitude, userLongitude, maxDistance, limit]);

  const loadNearbySellers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await findNearbySellers(
        userLatitude,
        userLongitude,
        maxDistance,
        limit
      );

      setSellers(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Erreur loadNearbySellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerPress = (sellerId: string) => {
    if (onSellerPress) {
      onSellerPress(sellerId);
    } else {
      // Navigation par défaut vers la boutique
      router.push(`/seller/${sellerId}` as any);
    }
  };

  const renderSellerCard = ({ item }: { item: NearbySeller }) => {
    const premiumBadge = getPremiumBadge(item.subscription_plan);

    return (
      <TouchableOpacity
        style={styles.sellerCard}
        onPress={() => handleSellerPress(item.seller_id)}
        activeOpacity={0.7}>
        {/* Image de la boutique */}
        <View style={styles.imageContainer}>
          {item.shop_logo_url ? (
            <Image source={{ uri: item.shop_logo_url }} style={styles.sellerImage} />
          ) : (
            <View style={[styles.sellerImage, styles.placeholderImage]}>
              <Ionicons name="storefront-outline" size={32} color="#9CA3AF" />
            </View>
          )}

          {/* Badge Premium */}
          {premiumBadge && (
            <View
              style={[styles.premiumBadge, { backgroundColor: premiumBadge.bgColor }]}>
              <Ionicons name={premiumBadge.icon as any} size={12} color="#FFFFFF" />
              <Text style={styles.premiumBadgeText}>{premiumBadge.label}</Text>
            </View>
          )}

          {/* Badge vérifié */}
          {item.verified_seller && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          )}
        </View>

        {/* Informations */}
        <View style={styles.infoContainer}>
          {/* Nom de la boutique */}
          <Text style={styles.shopName} numberOfLines={1}>
            {item.shop_name || item.full_name || 'Boutique'}
          </Text>

          {/* Distance */}
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color="#F59E0B" />
            <Text style={styles.distanceText}>{formatDistance(item.distance_km)}</Text>
          </View>

          {/* Note et avis */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.average_rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({item.total_reviews})</Text>
          </View>

          {/* Ville */}
          {item.city && (
            <View style={styles.cityContainer}>
              <Ionicons name="business-outline" size={12} color="#6B7280" />
              <Text style={styles.cityText} numberOfLines={1}>
                {item.city}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Recherche de vendeurs proches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadNearbySellers}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sellers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="location-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>Aucun vendeur trouvé dans votre région</Text>
        <Text style={styles.emptySubtext}>
          Essayez d'augmenter le rayon de recherche
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sellers}
      renderItem={renderSellerCard}
      keyExtractor={(item) => item.seller_id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sellerCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  sellerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  infoContainer: {
    padding: 12,
    gap: 6,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  reviewsText: {
    fontSize: 11,
    color: '#6B7280',
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontSize: 11,
    color: '#6B7280',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
