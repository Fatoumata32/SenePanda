/**
 * Page Wishlist - Liste de souhaits
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useWishlist, WishlistItem } from '../../hooks/useWishlist';
import { useLogger } from '../../hooks/useLogger';

export default function WishlistScreen() {
  const router = useRouter();
  const log = useLogger('WishlistScreen');
  const { items, count, loading, refreshing, refreshWishlist, removeFromWishlist, clearWishlist } =
    useWishlist();

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency || 'FCFA'}`;
  };

  const handleClearWishlist = () => {
    Alert.alert(
      'Vider la wishlist',
      `Êtes-vous sûr de vouloir supprimer tous les ${count} article${count > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, vider',
          style: 'destructive',
          onPress: async () => {
            const success = await clearWishlist();
            if (success) {
              log.track('wishlist_cleared', { count });
            }
          },
        },
      ]
    );
  };

  const handleRemove = (item: WishlistItem) => {
    Alert.alert('Retirer de la wishlist', `Retirer "${item.product.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          await removeFromWishlist(item.product_id);
          log.track('wishlist_item_removed', { productId: item.product_id });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => router.push(`/products/${item.product_id}`)}
      >
        <Image
          source={{
            uri: item.product.image_url || 'https://via.placeholder.com/80x80?text=Produit',
          }}
          style={styles.itemImage}
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.product.title}
          </Text>

          <Text style={styles.itemPrice}>
            {formatPrice(item.product.price, item.product.currency)}
          </Text>

          {item.product.stock > 0 ? (
            <Text style={styles.inStock}>En stock ({item.product.stock})</Text>
          ) : (
            <Text style={styles.outOfStock}>Rupture de stock</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemove(item)}
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>

        {item.product.stock > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cartButton]}
            onPress={() => {
              // TODO: Add to cart
              log.track('add_to_cart_from_wishlist', { productId: item.product_id });
            }}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Heart size={28} color="#FF6B6B" fill="#FF6B6B" />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Mes Favoris</Text>
            <Text style={styles.subtitle}>{count} article{count > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {count > 0 && (
          <TouchableOpacity onPress={handleClearWishlist}>
            <Text style={styles.clearButton}>Tout retirer</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Wishlist vide</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez des produits à votre liste de souhaits
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.shopButtonText}>Découvrir des produits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshWishlist}
              tintColor="#FF6B6B"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  inStock: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  outOfStock: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
    backgroundColor: '#FF6B6B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
