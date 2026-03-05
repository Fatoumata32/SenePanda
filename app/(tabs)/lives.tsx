import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Text,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from '@react-native-firebase/firestore';
import { Product } from '@/types/database';
import { VerticalVideoItem } from '@/components/VerticalVideoItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Flux Vidéo (Anciennement Lives):
 * - Affiche un flux vertical de vidéos produits (Style TikTok)
 */
export default function LivesScreen() {
  const router = useRouter();
  const db = getFirestore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchVideoProducts(true);
  }, []);

  const fetchVideoProducts = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      let q = query(
        collection(db, 'products'),
        where('is_active', '==', true),
        where('video_url', '!=', null),
        orderBy('video_url'), // Requis pour le filtre != null
        orderBy('created_at', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);

      const newProducts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(newProducts.length === PAGE_SIZE);
    } catch (error: any) {
      console.error('Error fetching video products from Firestore:', error);
      if (error?.code === 'firestore/failed-precondition') {
        const link = "https://console.firebase.google.com/v1/r/project/senepanda-6f7c5/firestore/indexes?create_composite=ClBwcm9qZWN0cy9zZW5lcGFuZGEtNmY3YzUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb2R1Y3RzL2luZGV4ZXMvXxABGg0KCWlzX2FjdGl2ZRABGg4KCnZpZGVvX3VybBABGg4KCmNyZWF0ZWRfYXQQAhoMCghfX25hbWVfXxAC";
        console.warn('⚠️ Index Firestore manquant pour les vidéos. Créez-le ici:', link);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchVideoProducts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideoProducts(true);
    setRefreshing(false);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <VerticalVideoItem
      product={item}
      isActive={index === activeIndex}
      isFocused={isFocused}
    />
  ), [activeIndex, isFocused]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Play size={64} color={Colors.primaryOrange} />
      <Text style={styles.emptyTitle}>Bientôt disponible</Text>
      <Text style={styles.emptySubtitle}>
        Aucune vidéo n'est encore disponible. Revenez bientôt pour découvrir nos produits en action !
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.replace('/(tabs)/home' as any)}
      >
        <Text style={styles.exploreButtonText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header (Floating) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vidéos</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={SCREEN_HEIGHT - 60}
          snapToAlignment="start"
          decelerationRate="fast"
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={Colors.primaryOrange} />
            </View>
          ) : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

