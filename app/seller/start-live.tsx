import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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
  Lock,
  Crown,
  Sparkles,
  TrendingUp,
  Eye,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useAuth } from '@/providers/AuthProvider';
import { Product } from '@/types/database';

export default function StartLiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { limits, loading: limitsLoading } = useSubscriptionLimits();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation de pulsation pour le bouton Démarrer
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
      // Animation de feedback
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const createLiveSession = async (startNow: boolean) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez entrer un titre pour votre live');
      return;
    }

    if (selectedProducts.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Sélectionnez au moins un produit à présenter');
      return;
    }

    setLoading(true);

    try {
      // Vérifier si le vendeur a déjà un live actif ou programmé
      const { data: existingLives, error: checkError } = await supabase
        .from('live_sessions')
        .select('id, title, status')
        .eq('seller_id', user.id)
        .in('status', ['live', 'scheduled']);

      if (checkError) throw checkError;

      if (existingLives && existingLives.length > 0) {
        const activeLive = existingLives.find(l => l.status === 'live');
        if (activeLive) {
          Alert.alert(
            'Live déjà actif',
            `Vous avez déjà un live en cours: "${activeLive.title}". Terminez-le avant d'en créer un nouveau.`,
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      }

      // Créer la session live
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          status: 'scheduled', // Toujours scheduled - sera mis à 'live' au démarrage
          scheduled_at: scheduledDate || new Date().toISOString(),
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                // Agora pour Expo Go (interface compatible)
                router.push({
                  pathname: '/seller/live-stream/[id]',
                  params: { id: session.id }
                } as any);
              } else {
                router.replace('/seller/my-lives' as any);
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

  // Écran de blocage si pas d'accès au Live Shopping
  if (limitsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as any);
    }
  };

  if (limits.needs_upgrade || !limits.can_create_live) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Shopping</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.upgradeContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[Colors.primaryOrange, '#FF8C42', '#FFB366']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeCard}
          >
            {/* Icône principale avec effet */}
            <View style={styles.upgradeIconContainer}>
              <View style={styles.upgradeIconBg}>
                <Video size={40} color={Colors.primaryOrange} strokeWidth={2.5} />
              </View>
              <View style={styles.upgradeIconLock}>
                <Lock size={18} color="#fff" />
              </View>
            </View>

            <Text style={styles.upgradeTitle}>Passez au Premium</Text>
            <Text style={styles.upgradeSubtitle}>pour débloquer le Live Shopping</Text>
            <Text style={styles.upgradeMessage}>
              {limits.upgrade_message || 'Boostez vos ventes en présentant vos produits en direct à vos clients !'}
            </Text>

            <View style={styles.planBadge}>
              <Crown size={16} color="#FFB366" />
              <Text style={styles.planBadgeText}>
                Plan actuel: {limits.plan_type.toUpperCase()}
              </Text>
            </View>

            {/* Features avec icônes SVG */}
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Video size={20} color={Colors.primaryOrange} />
                </View>
                <Text style={styles.featureText}>Streaming HD</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Users size={20} color={Colors.primaryOrange} />
                </View>
                <Text style={styles.featureText}>Illimité viewers</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <ShoppingBag size={20} color={Colors.primaryOrange} />
                </View>
                <Text style={styles.featureText}>50 produits/live</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <TrendingUp size={20} color={Colors.primaryOrange} />
                </View>
                <Text style={styles.featureText}>+300% ventes</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/seller/subscription-plans' as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#fff', '#FFF5F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeButtonGradient}
              >
                <Crown size={22} color={Colors.primaryOrange} />
                <Text style={styles.upgradeButtonText}>Passer Premium</Text>
                <View style={styles.upgradeArrow}>
                  <ArrowLeft size={18} color={Colors.primaryOrange} style={{ transform: [{ rotate: '180deg' }] }} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.upgradeNote}>
              🎁 Essai gratuit de 7 jours inclus
            </Text>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Live Shopping</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={[Colors.primaryOrange, '#FF8C42', '#FFB366']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Animated.View style={[styles.heroIconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.heroIconBg}>
              <Video size={56} color={Colors.primaryOrange} strokeWidth={2.5} />
            </View>
            <View style={styles.sparkleTopLeft}>
              <Sparkles size={20} color="#FFE5B4" fill="#FFE5B4" />
            </View>
            <View style={styles.sparkleBottomRight}>
              <Sparkles size={16} color="#FFE5B4" fill="#FFE5B4" />
            </View>
          </Animated.View>

          <Text style={styles.heroTitle}>🔥 Live Shopping Premium</Text>
          <Text style={styles.heroSubtitle}>
            Présentez vos produits en direct et boostez vos ventes !
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconBg}>
                <TrendingUp size={18} color={Colors.white} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.statValue}>+500%</Text>
                <Text style={styles.statLabel}>Engagement</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconBg}>
                <Zap size={18} color={Colors.white} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.statValue}>+300%</Text>
                <Text style={styles.statLabel}>Ventes</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconBg}>
                <Eye size={18} color={Colors.white} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.statValue}>10K+</Text>
                <Text style={styles.statLabel}>Vues</Text>
              </View>
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
                      activeOpacity={0.8}
                    >
                      {item.images && item.images[0] && (
                        <View style={styles.productImageContainer}>
                          <Image
                            source={{ uri: item.images[0] }}
                            style={styles.productImage}
                          />
                          {isSelected && (
                            <LinearGradient
                              colors={['transparent', 'rgba(255, 107, 107, 0.3)']}
                              style={styles.productImageOverlay}
                            />
                          )}
                        </View>
                      )}
                      <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={styles.productPriceRow}>
                          <Text style={styles.productPrice}>
                            {item.price.toLocaleString()} FCFA
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <LinearGradient
                          colors={[Colors.primaryOrange, '#FF8C42']}
                          style={styles.selectedBadge}
                        >
                          <Sparkles size={14} color="#fff" fill="#fff" />
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* Tips Card améliorée */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconBg}>
                <Sparkles size={18} color={Colors.primaryOrange} />
              </View>
              <Text style={styles.tipsTitle}>Conseils pour un live réussi</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipItem}>Assurez-vous d'avoir une bonne connexion internet</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipItem}>Préparez vos produits à l'avance</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipItem}>Interagissez avec les spectateurs</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipItem}>Créez des offres exclusives au live</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.scheduleLaterButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            createLiveSession(false);
          }}
          disabled={loading}
          activeOpacity={0.7}
        >
          <View style={styles.scheduleLaterIconBg}>
            <Calendar size={20} color={Colors.primaryOrange} />
          </View>
          <Text style={styles.scheduleLaterText}>Programmer</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.startNowButton, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              createLiveSession(true);
            }}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primaryOrange, '#FF8C42', '#FFB366']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startNowGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <View style={styles.startNowIconContainer}>
                    <Camera size={24} color={Colors.white} strokeWidth={2.5} />
                    <View style={styles.liveDotButton} />
                  </View>
                  <Text style={styles.startNowText}>🔥 Démarrer maintenant</Text>
                  <Sparkles size={20} color="#fff" fill="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
    padding: Spacing.xl * 1.5,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Shadows.large,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: -10,
  },
  heroTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
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
    width: 150,
    marginRight: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  productCardSelected: {
    borderColor: Colors.primaryOrange,
    borderWidth: 3,
    ...Shadows.large,
  },
  productImageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.backgroundLight,
  },
  productImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  productInfo: {
    padding: Spacing.md,
  },
  productTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: Colors.primaryOrange,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Shadows.medium,
  },
  selectedBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryOrange + '30',
    overflow: 'hidden',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOrange + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryOrange,
    marginTop: 7,
  },
  tipItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
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
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#FFE5D9',
  },
  scheduleLaterIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleLaterText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  startNowButton: {
    flex: 2.5,
  },
  startNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  startNowIconContainer: {
    position: 'relative',
  },
  liveDotButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  startNowText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  upgradeCard: {
    borderRadius: BorderRadius.xl * 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.large,
    overflow: 'hidden',
  },
  upgradeIconContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  upgradeIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  upgradeIconLock: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  upgradeTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  planBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  featureItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  upgradeButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  upgradeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.primaryOrange,
    flex: 1,
    textAlign: 'center',
  },
  upgradeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  upgradeFeatures: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    textAlign: 'left',
    lineHeight: 28,
    opacity: 0.9,
  },
});
