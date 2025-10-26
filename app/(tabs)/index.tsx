import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Store, ShoppingBag, Mic } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import ProductCard from '@/components/ProductCard';
import CategoryChip from '@/components/CategoryChip';
import PandaLogo from '@/components/PandaLogo';
import FeaturedProducts from '@/components/FeaturedProducts';
import FlashDeals from '@/components/FlashDeals';
import SimpleProductGrid from '@/components/SimpleProductGrid';
import PCCarousel from '@/components/PCCarousel';
import WaveDivider from '@/components/WaveDivider';
import SearchLogo from '@/components/SearchLogo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    checkUserProfile();
  }, [selectedCategory]);

  const checkUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  const handleSellPress = useCallback(() => {
    if (userProfile?.is_seller) {
      router.push('/seller/setup' as any);
    } else {
      router.push('/seller/setup');
    }
  }, [userProfile, router]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() =>
    products.filter((product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]
  );

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleBuyPress = useCallback(() => {
    // Scroll vers la section des produits ou explorer
    router.push('/(tabs)/explore');
  }, [router]);

  const handleVoiceSearch = useCallback(() => {
    setIsListening(true);

    // Annoncer que l'écoute commence
    Speech.speak("Dites le nom du produit que vous cherchez", {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 0.9,
    });

    // Simulation de recherche vocale (nécessite expo-speech-recognition pour la vraie implémentation)
    Alert.alert(
      "🎤 Recherche Vocale",
      "Dites le nom du produit que vous cherchez.\n\nExemple: 'Téléphone Samsung' ou 'Chaussures femme'",
      [
        {
          text: "Annuler",
          onPress: () => {
            setIsListening(false);
            Speech.speak("Recherche annulée", { language: 'fr-FR', rate: 0.9 });
          },
          style: "cancel"
        },
        {
          text: "Tester",
          onPress: () => {
            // Exemple de simulation
            const testQuery = "téléphone";
            setSearchQuery(testQuery);
            setIsListening(false);
            Speech.speak(`Recherche de ${testQuery}`, { language: 'fr-FR', rate: 0.9 });
          }
        }
      ]
    );
  }, []);

  const speakText = useCallback((text: string) => {
    Speech.speak(text, {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 0.85,
    });
  }, []);

  const ListHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Hero Section - Stable sans parallaxe */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={['#f9eddd', '#FFFACD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}>

          <View style={styles.heroContent}>
            {/* Logo + Brand inline pour gagner de la place */}
            <View style={styles.heroBrand}>
              <Image
                source={require('@/assets/images/logo30.png')}
                style={styles.heroLogoCompact}
                resizeMode="contain"
              />
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandName}>senepanda</Text>
                <Text style={styles.brandTagline}>Marketplace Multi-Vendeurs</Text>
              </View>
            </View>

            <View style={styles.heroTitleRow}>
              <View style={styles.heroTitleContainer}>
                <Text style={styles.heroTitleCompact}>
                  Achetez & Vendez{'\n'}en toute confiance
                </Text>
              </View>

              {/* PC Screen with carousel */}
              <PCCarousel />
            </View>

            {/* CTA Buttons - Côte à côte pour gagner de l'espace */}
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.ctaHalf}
                onPress={handleSellPress}
                activeOpacity={0.9}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaHalfButton}>
                  <View style={styles.ctaButtonContent}>
                    <Store size={18} color={Colors.white} strokeWidth={2} />
                    <Text style={styles.ctaHalfText}>Vendre</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaHalf}
                onPress={handleBuyPress}
                activeOpacity={0.8}>
                <View style={styles.ctaHalfOutline}>
                  <View style={styles.ctaButtonContent}>
                    <ShoppingBag size={18} color="#FF8C00" strokeWidth={2} />
                    <Text style={styles.ctaHalfTextOutline}>Acheter</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

        </LinearGradient>

        {/* Wave Divider - Intégré dans le wrapper pour continuité parfaite */}
        <WaveDivider
          backgroundColor="#FFFACD"
          waveColor="#FFFFFF"
          height={60}
        />
      </View>

      {/* Categories Carousel - Compact */}
      <View style={styles.categoriesQuickSection}>
        <Text style={styles.sectionTitleCategories}>Catégories Populaires</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}>
          <CategoryChip
            name="Tous"
            icon="🛍️"
            isSelected={selectedCategory === null}
            onPress={() => handleCategorySelect(null)}
          />
          {categories.slice(0, 10).map((category) => (
            <CategoryChip
              key={category.id}
              name={category.name}
              icon={category.icon || '📦'}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategorySelect(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Search Section - Ultra Compact avec Recherche Vocale */}
      <View style={styles.searchSectionCompact}>
        <View style={styles.searchInputWrapper}>
          <View style={styles.searchIconCircle}>
            <SearchLogo size={18} color={Colors.white} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoiceSearch}
            activeOpacity={0.7}
          >
            <Mic
              size={24}
              color={isListening ? "#EF4444" : "#F97316"}
              fill={isListening ? "#EF4444" : "transparent"}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => speakText("Appuyez sur le microphone pour rechercher un produit avec votre voix")}
        >
          <Text style={styles.helpButtonText}>🔊 Aide Vocale</Text>
        </TouchableOpacity>
      </View>

      {/* Flash Deals Section */}
      <FlashDeals />

      {/* Products Header - Compact */}
      <View style={styles.productsHeaderCompact}>
        <Text style={styles.miniSectionTitle}>Nouveautés</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8C00']} />
          }>
          <ListHeader />

          {/* Section Nouveautés - Images uniquement, 2 par ligne */}
          {filteredProducts.length > 0 ? (
            <SimpleProductGrid products={filteredProducts} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun produit disponible</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerWrapper: {
    backgroundColor: Colors.white,
  },

  // Hero Wrapper - Contient le gradient et le wave pour continuité parfaite
  heroWrapper: {
    backgroundColor: '#FFFACD', // Couleur de base qui match le gradient
    overflow: 'hidden', // Assure que le wave ne déborde pas
  },

  // Hero Section - Compact
  heroSection: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroContent: {
    width: '100%',
  },
  heroBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroLogoCompact: {
    width: 64,
    height: 64,
  },
  brandTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brandName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: Typography.fontWeight.medium,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['4xl'], // Encore plus d'espace
    gap: Spacing.md,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitleCompact: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    lineHeight: 32,
  },

  // Features Carousel
  featuresScrollView: {
    marginBottom: Spacing.lg,
  },
  featuresCarousel: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  featureCardCarousel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minWidth: 80,
    ...Shadows.medium,
  },
  featureIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  featureTextCarousel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // CTA Row - Côte à côte
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  ctaHalf: {
    flex: 1,
  },
  ctaHalfButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.medium,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ctaHalfText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  ctaHalfOutline: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#FF8C00',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    ...Shadows.small,
  },
  ctaHalfTextOutline: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#FF8C00',
    letterSpacing: 0.5,
  },

  // Section Title pour Catégories
  sectionTitleCategories: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // Mini Section Title
  miniSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  // Stats Carousel
  statsSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
  },
  statsCarousel: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCardCarousel: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minWidth: 90,
    ...Shadows.small,
  },
  statIconCarousel: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  statNumberCarousel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 2,
  },
  statLabelCarousel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Categories Quick Section - S'aligne parfaitement après le wave
  categoriesQuickSection: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  categoriesContainer: {
    marginTop: Spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },

  // Search Section - Ultra Compact
  searchSectionCompact: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundLight,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  voiceButtonActive: {
    backgroundColor: '#FEE2E2',
    ...Shadows.medium,
  },
  helpButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#DBEAFE',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  helpButtonText: {
    fontSize: Typography.fontSize.xs,
    color: '#1E40AF',
    fontWeight: Typography.fontWeight.semibold,
  },

  // Section Titles
  sectionTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  // Products Header - Compact
  productsHeaderCompact: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  productsGrid: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
