import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLocation, calculateDistance, formatDistance } from '@/hooks/useLocation';
import {
  updateUserLocation,
  findNearbySellers,
  findNearbyProducts,
  isValidCoordinates,
  getPremiumBadge,
} from '@/lib/geolocation';
import { supabase } from '@/lib/supabase';
import type { NearbySeller, NearbyProduct } from '@/types/database';

export default function TestLocationScreen() {
  const router = useRouter();
  const {
    coords,
    address,
    city,
    country,
    isLoading,
    error,
    hasPermission,
    requestLocation,
    getCurrentPosition,
    getAddressFromCoords,
  } = useLocation();

  const [userId, setUserId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    permission?: string;
    gps?: string;
    geocoding?: string;
    dbUpdate?: string;
    sellers?: string;
    products?: string;
  }>({});

  const [nearbySellers, setNearbySellers] = useState<NearbySeller[]>([]);
  const [nearbyProducts, setNearbyProducts] = useState<NearbyProduct[]>([]);
  const [testing, setTesting] = useState(false);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const runFullTest = async () => {
    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour tester');
      return;
    }

    setTesting(true);
    setTestResults({});
    setNearbySellers([]);
    setNearbyProducts([]);

    try {
      // Test 1: Permission
      setTestResults(prev => ({ ...prev, permission: '⏳ Vérification...' }));
      if (!hasPermission) {
        setTestResults(prev => ({ ...prev, permission: '❌ Permission refusée' }));
        return;
      }
      setTestResults(prev => ({ ...prev, permission: '✅ Permission accordée' }));

      // Test 2: GPS
      setTestResults(prev => ({ ...prev, gps: '⏳ Récupération GPS...' }));
      const position = await getCurrentPosition();
      if (!position) {
        setTestResults(prev => ({ ...prev, gps: '❌ Impossible d\'obtenir la position' }));
        return;
      }
      setTestResults(prev => ({
        ...prev,
        gps: `✅ GPS: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)} (précision: ${position.accuracy?.toFixed(0)}m)`
      }));

      // Test 3: Géocodage inversé
      setTestResults(prev => ({ ...prev, geocoding: '⏳ Conversion GPS → Adresse...' }));
      const addr = await getAddressFromCoords(position.latitude, position.longitude);
      if (!addr || addr === 'Adresse non disponible') {
        setTestResults(prev => ({ ...prev, geocoding: '❌ Géocodage échoué' }));
      } else {
        setTestResults(prev => ({
          ...prev,
          geocoding: `✅ Adresse: ${addr}`
        }));
      }

      // Test 4: Mise à jour base de données
      setTestResults(prev => ({ ...prev, dbUpdate: '⏳ Mise à jour BDD...' }));
      const updateResult = await updateUserLocation(
        userId,
        position.latitude,
        position.longitude,
        addr || undefined,
        city || undefined
      );

      if (!updateResult.success) {
        setTestResults(prev => ({
          ...prev,
          dbUpdate: `❌ Erreur BDD: ${updateResult.error}`
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          dbUpdate: '✅ Position sauvegardée en BDD'
        }));
      }

      // Test 5: Recherche vendeurs proches
      setTestResults(prev => ({ ...prev, sellers: '⏳ Recherche vendeurs proches...' }));
      const sellers = await findNearbySellers(position.latitude, position.longitude, 50, 10);
      setNearbySellers(sellers);
      setTestResults(prev => ({
        ...prev,
        sellers: `✅ ${sellers.length} vendeur(s) trouvé(s) dans un rayon de 50km`
      }));

      // Test 6: Recherche produits proches
      setTestResults(prev => ({ ...prev, products: '⏳ Recherche produits proches...' }));
      const products = await findNearbyProducts(position.latitude, position.longitude, 50, undefined, 10);
      setNearbyProducts(products);
      setTestResults(prev => ({
        ...prev,
        products: `✅ ${products.length} produit(s) trouvé(s) dans un rayon de 50km`
      }));

      Alert.alert('✅ Test terminé', 'Tous les tests ont été exécutés avec succès !');
    } catch (err: any) {
      console.error('Erreur test:', err);
      Alert.alert('Erreur', err.message || 'Une erreur est survenue pendant le test');
    } finally {
      setTesting(false);
    }
  };

  const testGPSOnly = async () => {
    setTesting(true);
    try {
      await requestLocation();
      Alert.alert('Succès', `Position obtenue:\n${coords?.latitude.toFixed(6)}, ${coords?.longitude.toFixed(6)}`);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'obtenir la position GPS');
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Géolocalisation</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status actuel */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>📍 État actuel</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permission:</Text>
            <Text style={[styles.statusValue, hasPermission ? styles.success : styles.error]}>
              {hasPermission ? '✅ Accordée' : '❌ Refusée'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Coordonnées GPS:</Text>
            <Text style={styles.statusValue}>
              {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : '-'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Précision:</Text>
            <Text style={styles.statusValue}>
              {coords?.accuracy ? `${coords.accuracy.toFixed(0)} m` : '-'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Adresse:</Text>
            <Text style={styles.statusValue}>{address || '-'}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Ville:</Text>
            <Text style={styles.statusValue}>{city || '-'}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pays:</Text>
            <Text style={styles.statusValue}>{country || '-'}</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Boutons de test */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.testButton, styles.testButtonPrimary]}
            onPress={runFullTest}
            disabled={testing || isLoading || !userId}
          >
            {testing || isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Lancer le test complet</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.testButtonSecondary]}
            onPress={testGPSOnly}
            disabled={testing || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="location" size={24} color={Colors.primary} />
                <Text style={styles.testButtonTextSecondary}>Test GPS uniquement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Résultats des tests */}
        {Object.keys(testResults).length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>📊 Résultats des tests</Text>

            {testResults.permission && (
              <Text style={styles.resultLine}>{testResults.permission}</Text>
            )}
            {testResults.gps && (
              <Text style={styles.resultLine}>{testResults.gps}</Text>
            )}
            {testResults.geocoding && (
              <Text style={styles.resultLine}>{testResults.geocoding}</Text>
            )}
            {testResults.dbUpdate && (
              <Text style={styles.resultLine}>{testResults.dbUpdate}</Text>
            )}
            {testResults.sellers && (
              <Text style={styles.resultLine}>{testResults.sellers}</Text>
            )}
            {testResults.products && (
              <Text style={styles.resultLine}>{testResults.products}</Text>
            )}
          </View>
        )}

        {/* Vendeurs trouvés */}
        {nearbySellers.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>👥 Vendeurs proches</Text>
            {nearbySellers.map((seller, index) => {
              const badge = getPremiumBadge(seller.subscription_plan);
              return (
                <View key={index} style={styles.sellerCard}>
                  <View style={styles.sellerHeader}>
                    <Text style={styles.sellerName}>{seller.seller_name}</Text>
                    {badge && (
                      <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
                        <Text style={styles.badgeText}>{badge.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sellerInfo}>📍 {formatDistance(seller.distance_km)}</Text>
                  <Text style={styles.sellerInfo}>⭐ {seller.average_rating?.toFixed(1) || 'N/A'} ({seller.total_reviews || 0} avis)</Text>
                  <Text style={styles.sellerInfo}>📦 {seller.total_products} produit(s)</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Produits trouvés */}
        {nearbyProducts.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>🛍️ Produits proches</Text>
            {nearbyProducts.map((product, index) => {
              const badge = getPremiumBadge(product.seller_subscription || null);
              return (
                <View key={index} style={styles.productCard}>
                  <Text style={styles.productTitle}>{product.product_title || product.title}</Text>
                  <Text style={styles.productPrice}>{product.price.toLocaleString()} FCFA</Text>
                  <View style={styles.productInfo}>
                    <Text style={styles.productSeller}>Vendeur: {product.seller_name}</Text>
                    {badge && (
                      <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
                        <Text style={styles.badgeText}>{badge.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productDistance}>📍 {formatDistance(product.distance_km)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Ce test vérifie tous les aspects du système de géolocalisation: permissions, GPS, géocodage,
            sauvegarde en base de données, et recherche de vendeurs/produits proches avec priorisation premium.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  success: {
    color: Colors.success,
  },
  error: {
    color: Colors.error,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  testButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  testButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  testButtonTextSecondary: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  resultsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  resultLine: {
    fontSize: 14,
    color: Colors.dark,
    paddingVertical: 4,
    lineHeight: 20,
  },
  sellerCard: {
    padding: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    flex: 1,
  },
  sellerInfo: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
  },
  productCard: {
    padding: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productSeller: {
    fontSize: 13,
    color: Colors.gray,
    flex: 1,
  },
  productDistance: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.lightBlue,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 20,
  },
});
