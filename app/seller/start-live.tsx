import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Video,
  Zap,
  Users,
  ShoppingBag,
  Plus,
  X,
  Calendar,
  Camera,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Product } from '@/types/database';

export default function StartLiveScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, views_count')
        .eq('seller_id', user.id)
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const toggleProduct = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const createLiveSession = async (startNow: boolean) => {
    if (!user) return;

    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour votre live');
      return;
    }

    if (selectedProducts.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un produit à présenter');
      return;
    }

    setLoading(true);

    try {
      // Créer la session live
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          status: startNow ? 'scheduled' : 'scheduled', // On démarre manuellement
          scheduled_at: scheduledDate || new Date().toISOString(),
          chat_enabled: true,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Ajouter les produits en vedette
      const featuredProducts = selectedProducts.map((product, index) => ({
        live_session_id: session.id,
        product_id: product.id,
        display_order: index,
        is_active: true,
      }));

      const { error: productsError } = await supabase
        .from('live_featured_products')
        .insert(featuredProducts);

      if (productsError) throw productsError;

      Alert.alert(
        'Succès ! 🎉',
        startNow
          ? 'Votre live est prêt ! Appuyez sur "Démarrer" pour commencer.'
          : 'Votre live a été programmé avec succès !',
        [
          {
            text: startNow ? 'Aller au live' : 'OK',
            onPress: () => {
              if (startNow) {
                router.push(`/seller/live-stream/${session.id}` as any);
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating live session:', error);
      Alert.alert('Erreur', 'Impossible de créer la session live');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Live Shopping</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Video size={48} color={Colors.white} />
          <Text style={styles.heroTitle}>Live Shopping Premium</Text>
          <Text style={styles.heroSubtitle}>
            Présentez vos produits en direct et boostez vos ventes !
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={20} color={Colors.white} />
              <Text style={styles.statText}>Engagement +500%</Text>
            </View>
            <View style={styles.statItem}>
              <Zap size={20} color={Colors.white} />
              <Text style={styles.statText}>Ventes +300%</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.form}>
          {/* Titre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre du live *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Nouvelle collection été 2024 🌞"
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
            />
            <Text style={styles.helperText}>{title.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez ce que vous allez présenter..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.helperText}>{description.length}/500</Text>
          </View>

          {/* Produits sélectionnés */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ShoppingBag size={20} color={Colors.primaryOrange} />
              <Text style={styles.label}>Produits en vedette *</Text>
            </View>

            {selectedProducts.length > 0 ? (
              <View style={styles.selectedProductsContainer}>
                {selectedProducts.map((product) => (
                  <View key={product.id} style={styles.selectedProductChip}>
                    {product.images && product.images[0] && (
                      <Image
                        source={{ uri: product.images[0] }}
                        style={styles.productChipImage}
                      />
                    )}
                    <Text style={styles.productChipText} numberOfLines={1}>
                      {product.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleProduct(product)}
                      style={styles.removeChipButton}
                    >
                      <X size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyProducts}>
                <ShoppingBag size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  Sélectionnez les produits que vous allez présenter
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.addProductButton}
              onPress={() => setShowProductSelector(!showProductSelector)}
            >
              <Plus size={20} color={Colors.primaryOrange} />
              <Text style={styles.addProductText}>
                {showProductSelector ? 'Masquer les produits' : 'Ajouter des produits'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sélecteur de produits */}
          {showProductSelector && (
            <View style={styles.productSelector}>
              <FlatList
                data={availableProducts}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedProducts.find(p => p.id === item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.productCard,
                        isSelected && styles.productCardSelected
                      ]}
                      onPress={() => toggleProduct(item)}
                    >
                      {item.images && item.images[0] && (
                        <Image
                          source={{ uri: item.images[0] }}
                          style={styles.productImage}
                        />
                      )}
                      <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.productPrice}>
                          {item.price.toLocaleString()} FCFA
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Conseils pour un live réussi</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Assurez-vous d'avoir une bonne connexion internet</Text>
              <Text style={styles.tipItem}>• Préparez vos produits à l'avance</Text>
              <Text style={styles.tipItem}>• Interagissez avec les spectateurs</Text>
              <Text style={styles.tipItem}>• Créez des offres exclusives au live</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.scheduleLaterButton}
          onPress={() => createLiveSession(false)}
          disabled={loading}
        >
          <Calendar size={20} color={Colors.textSecondary} />
          <Text style={styles.scheduleLaterText}>Programmer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.startNowButton}
          onPress={() => createLiveSession(true)}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startNowGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Camera size={22} color={Colors.white} />
                <Text style={styles.startNowText}>Démarrer maintenant</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hero: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  form: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  selectedProductsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selectedProductChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingLeft: 4,
    paddingRight: Spacing.sm,
    paddingVertical: 4,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primaryOrange,
  },
  productChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  productChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    maxWidth: 100,
  },
  removeChipButton: {
    padding: 2,
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryOrange,
  },
  addProductText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  productSelector: {
    marginTop: Spacing.md,
  },
  productCard: {
    width: 140,
    marginRight: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  productCardSelected: {
    borderColor: Colors.primaryOrange,
    ...Shadows.medium,
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.backgroundLight,
  },
  productInfo: {
    padding: Spacing.sm,
  },
  productTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FFD93D',
  },
  tipsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.large,
  },
  scheduleLaterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scheduleLaterText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  startNowButton: {
    flex: 2,
  },
  startNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  startNowText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
