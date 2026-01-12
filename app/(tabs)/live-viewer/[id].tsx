// Live Viewer Screen - Version compatible Expo Go
// Utilise Supabase Realtime pour le chat et les réactions (pas de streaming vidéo natif)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Send,
  Eye,
  ShoppingBag,
  Share2,
  X,
  CheckCircle,
  Radio,
  UserPlus,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useLiveShopping, useLiveChat, useLiveReactions, useLiveViewers, useLiveFeaturedProducts } from '@/hooks/useLiveShopping';
import { useAuth } from '@/providers/AuthProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types
interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  created_at: string;
  is_verified?: boolean;
}

interface FeaturedProduct {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

// Composant Message Chat
const ChatMessageItem = React.memo(({ item }: { item: ChatMessage }) => {
  return (
    <View style={styles.chatMessage}>
      <Image
        source={{ uri: item.user_avatar || 'https://via.placeholder.com/32' }}
        style={styles.chatAvatar}
      />
      <View style={styles.chatBubble}>
        <View style={styles.chatNameRow}>
          <Text style={styles.chatUserName}>{item.user_name}</Text>
          {item.is_verified && (
            <CheckCircle size={12} color="#3B82F6" fill="#3B82F6" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={styles.chatText}>{item.message}</Text>
      </View>
    </View>
  );
});

// Composant Coeur flottant pour les réactions
const FloatingHeart = ({ style }: { style: any }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });

  const scale = animation.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.3, 1.2, 1],
  });

  return (
    <Animated.View
      style={[
        styles.floatingHeart,
        style,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Heart size={30} color="#FF2D55" fill="#FF2D55" />
    </Animated.View>
  );
};

export default function LiveViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  // Hooks Live Shopping
  const { session, isLoading, error, refreshSession } = useLiveShopping(id);
  const { messages, sendMessage } = useLiveChat(id || '');
  const { reactions, sendReaction } = useLiveReactions(id || '');
  const { viewerCount } = useLiveViewers(id || '', true);
  const { products } = useLiveFeaturedProducts(id || '');

  // États locaux
  const [chatMessage, setChatMessage] = useState('');
  const [hearts, setHearts] = useState<number[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showProductCard, setShowProductCard] = useState(true);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const heartIdRef = useRef(0);

  // Auto-scroll chat
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Vérifier si le live est actif
  useEffect(() => {
    if (session?.status === 'ended' || session?.status === 'cancelled') {
      Alert.alert(
        'Live terminé',
        'Ce live est maintenant terminé.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [session?.status]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user) return;

    try {
      await sendMessage(chatMessage.trim());
      setChatMessage('');
    } catch (err) {
      console.error('Erreur envoi message:', err);
    }
  };

  // Envoyer une réaction coeur
  const handleSendHeart = async () => {
    // Animation locale
    const newHeartId = heartIdRef.current++;
    setHearts(prev => [...prev, newHeartId]);
    
    // Supprimer après animation
    setTimeout(() => {
      setHearts(prev => prev.filter(id => id !== newHeartId));
    }, 2000);

    // Envoyer au serveur
    try {
      await sendReaction('heart');
    } catch (err) {
      console.error('Erreur envoi réaction:', err);
    }
  };

  // Toggle follow
  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  // Partager
  const handleShare = () => {
    Alert.alert('Partager', 'Fonctionnalité de partage à venir');
  };

  // Ouvrir panier
  const handleOpenCart = () => {
    Alert.alert('Panier', 'Fonctionnalité panier à venir');
  };

  // Fermer le live
  const handleClose = () => {
    Alert.alert(
      'Quitter le live',
      'Voulez-vous vraiment quitter ce live?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // Loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF2D55" />
        <Text style={styles.loadingText}>Connexion au live...</Text>
      </View>
    );
  }

  // Erreur
  if (error || !session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Impossible de charger le live</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const featuredProduct = products?.[0]?.product;
  const sellerProfile = session.profiles;

  return (
    <View style={styles.container}>
      {/* Background - Zone vidéo (placeholder en mode Expo Go) */}
      <View style={styles.videoContainer}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.videoPlaceholder}
        >
          <Radio size={60} color="#FF2D55" />
          <Text style={styles.liveBadgeText}>LIVE</Text>
          <Text style={styles.videoPlaceholderText}>
            Streaming vidéo disponible{'\n'}avec build natif
          </Text>
        </LinearGradient>
      </View>

      {/* Overlay gradient en haut */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.topGradient}
      />

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerLeft}>
          {/* Profil vendeur */}
          <TouchableOpacity style={styles.sellerProfile}>
            <Image
              source={{ uri: sellerProfile?.avatar_url || 'https://via.placeholder.com/40' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {sellerProfile?.display_name || 'Vendeur'}
                </Text>
                {sellerProfile?.is_verified && (
                  <CheckCircle size={14} color="#3B82F6" fill="#3B82F6" style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={styles.followerCount}>
                {sellerProfile?.followers_count || 0} abonnés
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bouton Follow */}
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleToggleFollow}
          >
            {isFollowing ? (
              <Text style={styles.followingText}>Abonné</Text>
            ) : (
              <>
                <UserPlus size={14} color="#fff" />
                <Text style={styles.followText}>Suivre</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {/* Badge viewers */}
          <View style={styles.viewerBadge}>
            <Eye size={14} color="#fff" />
            <Text style={styles.viewerCount}>{viewerCount}</Text>
          </View>

          {/* Bouton fermer */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Zone centrale avec chat et produit */}
      <View style={styles.middleSection}>
        {/* Chat à gauche */}
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatMessageItem item={item as ChatMessage} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatList}
          />
        </View>

        {/* Carte produit à droite */}
        {featuredProduct && showProductCard && (
          <View style={styles.productCard}>
            <TouchableOpacity 
              style={styles.productCardClose}
              onPress={() => setShowProductCard(false)}
            >
              <X size={14} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: featuredProduct.images?.[0] || 'https://via.placeholder.com/80' }}
              style={styles.productImage}
            />
            <Text style={styles.productName} numberOfLines={2}>
              {featuredProduct.name}
            </Text>
            <TouchableOpacity style={styles.productPriceButton}>
              <Text style={styles.productPrice}>
                {featuredProduct.price?.toLocaleString()} FCFA
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coeurs flottants */}
        {hearts.map((heartId) => (
          <FloatingHeart
            key={heartId}
            style={{ right: 20 + Math.random() * 40 }}
          />
        ))}
      </View>

      {/* Barre d'actions en bas */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomBar}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <SafeAreaView edges={['bottom']} style={styles.actionBar}>
            {/* Input message */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Écrire un message..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              {chatMessage.trim() && (
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <Send size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Boutons action */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSendHeart}>
                <Heart size={28} color="#FF2D55" fill="#FF2D55" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share2 size={26} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleOpenCart}>
                <View style={styles.cartBadge}>
                  <ShoppingBag size={26} color="#fff" />
                  {products?.length > 0 && (
                    <View style={styles.cartCount}>
                      <Text style={styles.cartCountText}>{products.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Loading & Error
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Video
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadgeText: {
    color: '#FF2D55',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    letterSpacing: 4,
  },
  videoPlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },

  // Gradients
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Seller Profile
  sellerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    paddingRight: 12,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF2D55',
  },
  sellerInfo: {
    marginLeft: 8,
    maxWidth: 100,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followerCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },

  // Follow Button
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2D55',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  followingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Viewer Badge
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  viewerCount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Close Button
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Middle Section
  middleSection: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 100,
    zIndex: 5,
  },

  // Chat
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    maxWidth: SCREEN_WIDTH * 0.6,
    marginRight: 10,
  },
  chatList: {
    paddingVertical: 8,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  chatBubble: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '85%',
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatUserName: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  chatText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },

  // Product Card
  productCard: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  productCardClose: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  productImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  productName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    lineHeight: 14,
  },
  productPriceButton: {
    backgroundColor: '#FF2D55',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  productPrice: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Floating Hearts
  floatingHeart: {
    position: 'absolute',
    bottom: 120,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomGradient: {
    paddingTop: 40,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Input
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    marginRight: 10,
  },
  chatInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  cartBadge: {
    position: 'relative',
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF2D55',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
