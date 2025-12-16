import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Linking,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Profile, Product } from '@/types/database';
import { ArrowLeft, Phone, MapPin, Package, Facebook, Instagram, Twitter, Globe } from 'lucide-react-native';
import ProductCard from '@/components/ProductCard';
import { getLogoById, getBannerById, getBannerStyle } from '@/lib/shop-designs';

export default function ShopPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (id) {
      loadShopData();
    }
  }, [id]);

  const loadShopData = async () => {
    try {
      setLoading(true);

      // Charger les infos de la boutique
      const { data: shopData, error: shopError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('is_seller', true)
        .maybeSingle();

      if (shopError) {
        console.error('Error loading shop:', shopError);
        throw shopError;
      }

      if (!shopData) {
        console.warn('Shop not found with id:', id);
        setShop(null);
        setProducts([]);
        return;
      }

      setShop(shopData);

      // Charger les produits de la boutique
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, views_count')
        .eq('seller_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error: any) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <View style={styles.productWrapper}>
        <ProductCard
          product={item}
          onPress={() => router.push(`/product/${item.id}`)}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Chargement de la boutique...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Boutique introuvable</Text>
          <TouchableOpacity
            style={styles.backToExplorerButton}
            onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.backToExplorerText}>Retour à Explorer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Vérifier si c'est une URL ou un ID
  const isLogoUrl = shop.shop_logo_url?.startsWith('http://') || shop.shop_logo_url?.startsWith('https://');
  const isBannerUrl = shop.shop_banner_url?.startsWith('http://') || shop.shop_banner_url?.startsWith('https://');

  const logo = isLogoUrl ? null : getLogoById(shop.shop_logo_url || '');
  const banner = isBannerUrl ? null : getBannerById(shop.shop_banner_url || '');
  const bannerStyle = banner ? getBannerStyle(banner) : { background: '#F59E0B' };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bannière */}
        {isBannerUrl ? (
          <Image
            source={{ uri: shop.shop_banner_url || '' }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.banner, { backgroundColor: bannerStyle.background }]} />
        )}

        {/* Logo */}
        <View style={styles.logoContainer}>
          {isLogoUrl ? (
            <Image
              source={{ uri: shop.shop_logo_url || '' }}
              style={[styles.logo, { backgroundColor: '#FFFFFF' }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.logo, { backgroundColor: logo?.bgColor || '#FEF3C7' }]}>
              <Text style={styles.logoIcon}>{logo?.icon || '🛍️'}</Text>
            </View>
          )}
        </View>

        {/* Informations boutique */}
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{shop.shop_name}</Text>
          {shop.shop_description && (
            <Text style={styles.shopDescription}>{shop.shop_description}</Text>
          )}

          {/* Contact Info */}
          <View style={styles.contactSection}>
            {shop.phone && (
              <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
                <View style={styles.contactIcon}>
                  <Phone size={20} color="#F59E0B" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Téléphone</Text>
                  <Text style={styles.contactValue}>{shop.phone}</Text>
                </View>
              </TouchableOpacity>
            )}

            {shop.country && (
              <View style={styles.contactCard}>
                <View style={styles.contactIcon}>
                  <MapPin size={20} color="#10B981" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Localisation</Text>
                  <Text style={styles.contactValue}>{shop.country}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Social Media Links */}
          {(shop.facebook_url || shop.instagram_url || shop.twitter_url || shop.whatsapp_number || shop.website_url) && (
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>Réseaux sociaux</Text>
              <View style={styles.socialLinksContainer}>
                {shop.facebook_url && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(shop.facebook_url!)}>
                    <Facebook size={24} color="#1877F2" />
                    <Text style={styles.socialButtonText}>Facebook</Text>
                  </TouchableOpacity>
                )}

                {shop.instagram_url && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(shop.instagram_url!)}>
                    <Instagram size={24} color="#E4405F" />
                    <Text style={styles.socialButtonText}>Instagram</Text>
                  </TouchableOpacity>
                )}

                {shop.twitter_url && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(shop.twitter_url!)}>
                    <Twitter size={24} color="#1DA1F2" />
                    <Text style={styles.socialButtonText}>Twitter</Text>
                  </TouchableOpacity>
                )}

                {shop.whatsapp_number && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(`https://wa.me/${shop.whatsapp_number!.replace(/[^0-9]/g, '')}`)}>
                    <Phone size={24} color="#25D366" />
                    <Text style={styles.socialButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                )}

                {shop.website_url && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(shop.website_url!)}>
                    <Globe size={24} color="#6B7280" />
                    <Text style={styles.socialButtonText}>Site Web</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Produits */}
        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <Package size={24} color="#111827" />
            <Text style={styles.productsTitle}>
              Produits ({products.length})
            </Text>
          </View>

          {products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.productsGrid}
            />
          ) : (
            <View style={styles.noProductsContainer}>
              <Package size={48} color="#D1D5DB" />
              <Text style={styles.noProductsText}>
                Cette boutique n'a pas encore de produits
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 200,
  },
  logoContainer: {
    marginTop: -50,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 48,
  },
  shopInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  shopName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  shopDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  contactSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  socialSection: {
    width: '100%',
    marginTop: 16,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  productsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  productsGrid: {
    paddingBottom: 16,
  },
  productWrapper: {
    flex: 1,
    maxWidth: '50%',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noProductsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 24,
  },
  backToExplorerButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToExplorerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
