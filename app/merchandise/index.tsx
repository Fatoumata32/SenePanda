import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShoppingBag,
  ArrowLeft,
  Coins,
  CreditCard,
  Package,
  Truck,
  MapPin,
  Phone,
  User,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBonusSystem, useMerchandise } from '@/hooks/useBonusSystem';
import PointsDisplay from '@/components/PointsDisplay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import type { MerchandiseItem } from '@/types/database';

type ShippingInfo = {
  name: string;
  phone: string;
  address: string;
  city: string;
  postal_code?: string;
};

export default function MerchandiseScreen() {
  const router = useRouter();
  const { userPoints, refreshPoints } = useBonusSystem();
  const { items, loading, orderMerchandise, refreshMerchandise } = useMerchandise();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MerchandiseItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'cash'>('points');
  const [quantity, setQuantity] = useState(1);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
  });
  const [ordering, setOrdering] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshMerchandise(), refreshPoints()]);
    setRefreshing(false);
  };

  const handleSelectItem = (item: MerchandiseItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setPaymentMethod(item.price_points ? 'points' : 'cash');
  };

  const handleOrderItem = async () => {
    if (!selectedItem) return;

    // Validation du formulaire
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city) {
      Alert.alert(
        'Informations manquantes',
        'Veuillez remplir tous les champs obligatoires.',
        [{ text: 'OK' }]
      );
      return;
    }

    const totalCost =
      paymentMethod === 'points'
        ? (selectedItem.price_points || 0) * quantity
        : (selectedItem.price_cash || 0) * quantity;

    const confirmMessage =
      paymentMethod === 'points'
        ? `Confirmer la commande de ${quantity} x ${selectedItem.name} pour ${totalCost.toLocaleString()} points?`
        : `Confirmer la commande de ${quantity} x ${selectedItem.name} pour ${totalCost.toLocaleString()} FCFA?`;

    Alert.alert('Confirmer la commande', confirmMessage, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setOrdering(true);
          try {
            const result = await orderMerchandise(
              selectedItem.id,
              quantity,
              paymentMethod,
              shippingInfo
            );

            if (result.success) {
              Alert.alert(
                '🎉 Commande confirmée!',
                `Votre commande a été enregistrée avec succès!\n\nNuméro de commande: ${result.order_id?.slice(0, 8)}\n\nVous recevrez un email de confirmation avec les détails de livraison.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setSelectedItem(null);
                      setShippingInfo({
                        name: '',
                        phone: '',
                        address: '',
                        city: '',
                        postal_code: '',
                      });
                      refreshMerchandise();
                      refreshPoints();
                    },
                  },
                ]
              );
            } else {
              Alert.alert('Erreur', result.error || 'Une erreur est survenue', [{ text: 'OK' }]);
            }
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de passer la commande', [{ text: 'OK' }]);
          } finally {
            setOrdering(false);
          }
        },
      },
    ]);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      't-shirt': '👕',
      'cap': '🧢',
      'mug': '☕',
      'sticker': '🎨',
      'bag': '👜',
    };
    return iconMap[category] || '📦';
  };

  const renderMerchandiseCard = (item: MerchandiseItem) => {
    const isLowStock = item.stock <= item.low_stock_threshold;
    const canBuyWithPoints = item.price_points !== null;
    const canBuyWithCash = item.price_cash !== null;
    const userPointsAmount = userPoints?.points || 0;
    const canAffordWithPoints = canBuyWithPoints && userPointsAmount >= (item.price_points || 0);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemCard}
        onPress={() => handleSelectItem(item)}
        activeOpacity={0.8}
      >
        <View style={styles.itemImage}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
            </View>
          )}
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Stock limité</Text>
            </View>
          )}
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Populaire</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {item.size && (
            <Text style={styles.itemDetail}>Taille: {item.size}</Text>
          )}
          {item.color && (
            <Text style={styles.itemDetail}>Couleur: {item.color}</Text>
          )}

          <View style={styles.pricesRow}>
            {canBuyWithPoints && (
              <View style={styles.priceTag}>
                <Coins size={16} color={Colors.primaryOrange} />
                <Text style={styles.pricePoints}>{item.price_points!.toLocaleString()}</Text>
              </View>
            )}
            {canBuyWithCash && (
              <View style={styles.priceTag}>
                <CreditCard size={16} color="#10B981" />
                <Text style={styles.priceCash}>{item.price_cash!.toLocaleString()} F</Text>
              </View>
            )}
          </View>

          <Text style={styles.stockText}>Stock: {item.stock} disponible(s)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Vue du formulaire de commande
  if (selectedItem) {
    const totalCostPoints = (selectedItem.price_points || 0) * quantity;
    const totalCostCash = (selectedItem.price_cash || 0) * quantity;
    const canAffordPoints = (userPoints?.points || 0) >= totalCostPoints;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedItem(null)}>
            <ArrowLeft size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commander</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.orderContent} showsVerticalScrollIndicator={false}>
          {/* Item Summary */}
          <View style={styles.orderSection}>
            <Text style={styles.sectionTitle}>Article</Text>
            <View style={styles.itemSummary}>
              <Text style={styles.itemSummaryIcon}>{getCategoryIcon(selectedItem.category)}</Text>
              <View style={styles.itemSummaryInfo}>
                <Text style={styles.itemSummaryName}>{selectedItem.name}</Text>
                {selectedItem.size && <Text style={styles.itemSummaryDetail}>Taille: {selectedItem.size}</Text>}
                {selectedItem.color && <Text style={styles.itemSummaryDetail}>Couleur: {selectedItem.color}</Text>}
              </View>
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.orderSection}>
            <Text style={styles.sectionTitle}>Quantité</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(selectedItem.stock, quantity + 1))}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.orderSection}>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>
            <View style={styles.paymentMethods}>
              {selectedItem.price_points !== null && (
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    paymentMethod === 'points' && styles.paymentMethodSelected,
                    !canAffordPoints && styles.paymentMethodDisabled,
                  ]}
                  onPress={() => canAffordPoints && setPaymentMethod('points')}
                  disabled={!canAffordPoints}
                >
                  <Coins size={24} color={paymentMethod === 'points' ? Colors.white : Colors.primaryOrange} />
                  <Text style={[styles.paymentMethodText, paymentMethod === 'points' && styles.paymentMethodTextSelected]}>
                    {totalCostPoints.toLocaleString()} Points
                  </Text>
                  {!canAffordPoints && <Text style={styles.insufficientText}>Insuffisant</Text>}
                </TouchableOpacity>
              )}
              {selectedItem.price_cash !== null && (
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    paymentMethod === 'cash' && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <CreditCard size={24} color={paymentMethod === 'cash' ? Colors.white : '#10B981'} />
                  <Text style={[styles.paymentMethodText, paymentMethod === 'cash' && styles.paymentMethodTextSelected]}>
                    {totalCostCash.toLocaleString()} FCFA
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Shipping Info */}
          <View style={styles.orderSection}>
            <Text style={styles.sectionTitle}>Informations de livraison</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <User size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nom complet *"
                placeholderTextColor={Colors.textSecondary}
                value={shippingInfo.name}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Phone size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Téléphone *"
                placeholderTextColor={Colors.textSecondary}
                value={shippingInfo.phone}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MapPin size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Adresse complète *"
                placeholderTextColor={Colors.textSecondary}
                value={shippingInfo.address}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, address: text })}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MapPin size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Ville *"
                placeholderTextColor={Colors.textSecondary}
                value={shippingInfo.city}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, city: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MapPin size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Code postal (optionnel)"
                placeholderTextColor={Colors.textSecondary}
                value={shippingInfo.postal_code}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, postal_code: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.orderButton, ordering && styles.orderButtonDisabled]}
            onPress={handleOrderItem}
            disabled={ordering}
            activeOpacity={0.8}
          >
            {ordering ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Truck size={20} color={Colors.white} />
                <Text style={styles.orderButtonText}>Commander maintenant</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Vue de la liste des articles
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boutique Senepanda</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pointsSection}>
          <PointsDisplay compact showStreak={false} />
        </View>

        <View style={styles.infoCard}>
          <ShoppingBag size={20} color={Colors.primaryOrange} />
          <Text style={styles.infoText}>
            Commandez vos produits officiels Senepanda avec vos points ou en espèces!
          </Text>
        </View>

        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryOrange} />
            </View>
          ) : items.length > 0 ? (
            <View style={styles.itemsGrid}>{items.map(renderMerchandiseCard)}</View>
          ) : (
            <View style={styles.emptyState}>
              <Package size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucun article disponible</Text>
              <Text style={styles.emptyText}>
                La boutique sera bientôt approvisionnée avec de nouveaux produits!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  headerRight: {
    width: 40,
  },

  // Points Section
  pointsSection: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark,
  },

  // Content
  content: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },

  // Items Grid
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  // Item Card
  itemCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  itemImage: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 48,
  },
  lowStockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  lowStockText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  itemInfo: {
    padding: Spacing.md,
  },
  itemName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  itemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  itemDetail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  pricesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pricePoints: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
  },
  priceCash: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: '#10B981',
  },
  stockText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Order Content
  orderContent: {
    flex: 1,
  },
  orderSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },

  // Item Summary
  itemSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.lg,
  },
  itemSummaryIcon: {
    fontSize: 40,
  },
  itemSummaryInfo: {
    flex: 1,
  },
  itemSummaryName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 4,
  },
  itemSummaryDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Quantity Control
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  quantityText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    minWidth: 48,
    textAlign: 'center',
  },

  // Payment Methods
  paymentMethods: {
    gap: Spacing.md,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  paymentMethodSelected: {
    borderColor: Colors.primaryOrange,
    backgroundColor: Colors.primaryOrange,
  },
  paymentMethodDisabled: {
    opacity: 0.5,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  paymentMethodTextSelected: {
    color: Colors.white,
  },
  insufficientText: {
    fontSize: Typography.fontSize.xs,
    color: '#EF4444',
    fontWeight: Typography.fontWeight.semibold,
  },

  // Input
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    width: 24,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
  },

  // Order Button
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryOrange,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    margin: Spacing.lg,
    ...Shadows.medium,
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
