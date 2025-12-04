import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import { Plus, Package, Edit, Trash2, Eye, EyeOff, ArrowLeft, Store, Lock, Crown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import ActivateShopBanner from '@/components/ActivateShopBanner';

export default function SellerProductsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const {
    loading: subscriptionLoading,
    hasAccess,
    shopVisible,
    limits,
    checkAccess,
    checkProductLimit,
    redirectToPlans,
    subscriptionStatus,
  } = useSubscriptionAccess();

  useEffect(() => {
    loadProducts();
  }, []);

  // L'accès est maintenant géré automatiquement via hasAccess
  // Le plan FREE a accès avec des limites (5 produits max)

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      loadProducts();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const deleteProduct = async (productId: string) => {
    // Vérifier l'accès avant de permettre la suppression
    if (!checkAccess()) {
      return;
    }

    if (!limits?.canDeleteProducts) {
      Alert.alert('Accès refusé', 'Votre plan ne permet pas de supprimer des produits');
      return;
    }

    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce produit?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;
              loadProducts();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    // Vérifier l'accès
    if (!checkAccess()) {
      return;
    }

    // Vérifier la limite de produits
    if (!checkProductLimit(products.length)) {
      return;
    }

    router.push('/seller/add-product');
  };

  const handleEditProduct = (productId: string) => {
    // Vérifier l'accès
    if (!checkAccess()) {
      return;
    }

    if (!limits?.canEditProducts) {
      Alert.alert('Accès refusé', 'Votre plan ne permet pas de modifier des produits');
      return;
    }

    router.push(`/seller/edit-product/${productId}`);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Package size={32} color="#9CA3AF" />
        </View>
      )}

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, !item.is_active && styles.inactiveBadge]}>
            <Text style={[styles.statusText, !item.is_active && styles.inactiveText]}>
              {item.is_active ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        <Text style={styles.productPrice}>
          {item.price.toLocaleString()} {item.currency}
        </Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>

        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditProduct(item.id)}>
            <Edit size={16} color="#D97706" />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleProductStatus(item)}>
            {item.is_active ? (
              <EyeOff size={16} color="#6B7280" />
            ) : (
              <Eye size={16} color="#6B7280" />
            )}
            <Text style={styles.actionText}>
              {item.is_active ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteProduct(item.id)}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading || subscriptionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Produits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/seller/my-shop')}>
            <Store size={20} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {!hasAccess ? (
        <View style={styles.emptyState}>
          <Lock size={64} color="#D97706" />
          <Text style={styles.emptyTitle}>Abonnement requis</Text>
          <Text style={styles.emptyText}>
            {shopVisible
              ? 'Votre abonnement a expiré. Renouvelez-le pour continuer à gérer vos produits.'
              : 'Souscrivez à un abonnement pour commencer à vendre vos produits.'}
          </Text>
          <View style={styles.planInfo}>
            <Crown size={20} color="#F59E0B" />
            <Text style={styles.planInfoText}>
              Plan actuel : {subscriptionStatus?.plan.toUpperCase() || 'FREE'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={redirectToPlans}>
            <Crown size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Voir les abonnements</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Aucun produit</Text>
          <Text style={styles.emptyText}>
            Commencez par ajouter votre premier produit à votre boutique
          </Text>
          {limits && (
            <Text style={styles.limitText}>
              Limite : {products.length}/{limits.maxProducts === 999999 ? '∞' : limits.maxProducts} produits
            </Text>
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddProduct}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Ajouter un produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <ActivateShopBanner
              currentPlan={subscriptionStatus?.plan as any}
              shopIsActive={subscriptionStatus?.isActive}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  shopButton: {
    backgroundColor: '#FEF3C7',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  addButton: {
    backgroundColor: '#D97706',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  planInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  limitText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  inactiveText: {
    color: '#991B1B',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
