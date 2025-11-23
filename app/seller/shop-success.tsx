import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, Package, Eye, User, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { getLogoById, getBannerById, getBannerStyle } from '@/lib/shop-designs';

export default function ShopSuccessScreen() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  const [shop, setShop] = useState<Profile | null>(null);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', shopId)
        .maybeSingle();

      if (error) {
        console.error('Error loading shop:', error);
        throw error;
      }

      if (!data) {
        console.warn('Shop not found with id:', shopId);
        setShop(null);
        return;
      }

      setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const isLogoUrl = shop?.shop_logo_url?.startsWith('http://') ||
                    shop?.shop_logo_url?.startsWith('https://');
  const isBannerUrl = shop?.shop_banner_url?.startsWith('http://') ||
                      shop?.shop_banner_url?.startsWith('https://');

  const logo = isLogoUrl ? null : getLogoById(shop?.shop_logo_url || '');
  const banner = isBannerUrl ? null : getBannerById(shop?.shop_banner_url || '');
  const bannerStyle = banner ? getBannerStyle(banner) : { background: '#F59E0B' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Success Animation */}
        <View style={styles.successHeader}>
          <View style={styles.successCircle}>
            <Sparkles size={64} color="#F59E0B" />
          </View>
          <Text style={styles.successTitle}>Félicitations!</Text>
          <Text style={styles.successSubtitle}>
            Votre boutique a été créée avec succès
          </Text>
        </View>

        {/* Shop Preview */}
        {shop && (
          <View style={styles.previewCard}>
            {isBannerUrl ? (
              <Image
                source={{ uri: shop.shop_banner_url || '' }}
                style={styles.previewBanner}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.previewBanner, { backgroundColor: bannerStyle.background }]} />
            )}

            <View style={styles.previewLogoContainer}>
              {isLogoUrl ? (
                <Image
                  source={{ uri: shop.shop_logo_url || '' }}
                  style={[styles.previewLogo, { backgroundColor: '#FFFFFF' }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.previewLogo, { backgroundColor: logo?.bgColor || '#FEF3C7' }]}>
                  <Text style={styles.previewLogoIcon}>{logo?.icon || '🛍️'}</Text>
                </View>
              )}
            </View>

            <View style={styles.previewInfo}>
              <Text style={styles.previewShopName}>{shop.shop_name}</Text>
              {shop.shop_description && (
                <Text style={styles.previewDescription} numberOfLines={2}>
                  {shop.shop_description}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Que voulez-vous faire maintenant?</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => router.push('/seller/add-product')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
              <Package size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ajouter des produits</Text>
              <Text style={styles.actionDescription}>
                Commencez à vendre en ajoutant vos premiers produits
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/shop/${shopId}`)}>
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
              <Eye size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Voir ma boutique</Text>
              <Text style={styles.actionDescription}>
                Découvrez comment vos clients verront votre boutique
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/explore')}>
            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
              <Store size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Explorer</Text>
              <Text style={styles.actionDescription}>
                Voir les autres boutiques et découvrir des produits
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}>
            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
              <User size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mon profil</Text>
              <Text style={styles.actionDescription}>
                Gérer votre profil et paramètres de boutique
              </Text>
            </View>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewBanner: {
    width: '100%',
    height: 100,
  },
  previewLogoContainer: {
    marginTop: -40,
    alignSelf: 'center',
  },
  previewLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewLogoIcon: {
    fontSize: 36,
  },
  previewInfo: {
    padding: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  previewShopName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryAction: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
