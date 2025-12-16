import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  ShoppingCart,
  Users,
  Send,
  X,
  Eye,
  ShoppingBag,
  Zap,
} from 'lucide-react-native';
import RtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useLiveShopping, useLiveChat, useLiveReactions, useLiveViewers, useLiveFeaturedProducts } from '@/hooks/useLiveShopping';
import { AGORA_APP_ID, getLiveChannelName } from '@/lib/agoraConfig';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/contexts/CartContext';

export default function LiveViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Live Shopping Hooks
  const { session } = useLiveShopping(id);
  const { messages, sendMessage } = useLiveChat(id || '');
  const { reactions, sendReaction } = useLiveReactions(id || '');
  const { viewerCount, joinLive } = useLiveViewers(id || '', true);
  const { products } = useLiveFeaturedProducts(id || '');

  // Agora Engine
  const agoraEngineRef = useRef<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);

  // UI State
  const [chatMessage, setChatMessage] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Animations
  const productsSlide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    setupAndJoin();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    Animated.spring(productsSlide, {
      toValue: showProducts ? 0 : 300,
      useNativeDriver: true,
    }).start();
  }, [showProducts]);

  const setupAndJoin = async () => {
    try {
      if (!AGORA_APP_ID || AGORA_APP_ID === 'YOUR_AGORA_APP_ID' as any) {
        Alert.alert(
          'Configuration requise',
          'Le live streaming n\'est pas encore configuré'
        );
        return;
      }

      // Créer l'engine
      agoraEngineRef.current = await (RtcEngine as any).create(AGORA_APP_ID);
      const engine = agoraEngineRef.current;

      // Activer la vidéo
      await engine.enableVideo();

      // Mode audience
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      await engine.setClientRole(ClientRoleType.ClientRoleAudience);

      // Event listeners
      engine.addListener('UserJoined', (uid: number) => {
        console.log('UserJoined', uid);
        setRemoteUid(uid);
      });

      engine.addListener('UserOffline', (uid: number) => {
        console.log('UserOffline', uid);
        setRemoteUid(0);
      });

      // Rejoindre le canal
      const channelName = getLiveChannelName(id || '');
      await engine.joinChannel(
        '', // Token
        channelName,
        0, // UID
        {
          clientRoleType: ClientRoleType.ClientRoleAudience,
        }
      );

      setIsJoined(true);
      console.log('✅ Rejoint le live avec succès');
    } catch (error) {
      console.error('❌ Erreur rejoindre live:', error);
    }
  };

  const cleanup = async () => {
    try {
      if (agoraEngineRef.current) {
        await agoraEngineRef.current.leaveChannel();
        await agoraEngineRef.current.destroy();
      }
    } catch (error) {
      console.error('Erreur cleanup:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour envoyer des messages');
      return;
    }

    try {
      await sendMessage(chatMessage, 'text');
      setChatMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const handleReaction = async (type: 'heart' | 'fire' | 'clap' | 'star' | 'cart') => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour réagir');
      return;
    }

    try {
      await sendReaction(type);
    } catch (error) {
      console.error('Erreur réaction:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      Alert.alert('Ajouté !', 'Produit ajouté au panier');
    } catch (error) {
      console.error('Erreur ajout panier:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
    }
  };

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Vidéo du vendeur */}
        <View style={styles.videoContainer}>
          {isJoined && remoteUid !== 0 ? (
            <RtcSurfaceView
              style={styles.video}
              canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
            />
          ) : (
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.videoPlaceholder}
            >
              <Eye size={64} color={Colors.white} />
              <Text style={styles.placeholderText}>
                En attente du vendeur...
              </Text>
            </LinearGradient>
          )}

          {/* Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.videoOverlay}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={Colors.white} />
              </TouchableOpacity>

              <View style={styles.sellerInfo}>
                {session.seller_avatar && (
                  <Image
                    source={{ uri: session.seller_avatar }}
                    style={styles.sellerAvatar}
                  />
                )}
                <View>
                  <Text style={styles.sellerName}>{session.seller_name}</Text>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
              </View>

              <View style={styles.viewersContainer}>
                <Users size={18} color={Colors.white} />
                <Text style={styles.viewersText}>{viewerCount}</Text>
              </View>
            </View>

            {/* Réactions animées */}
            <View style={styles.reactionsContainer}>
              {reactions.slice(-5).map((reaction, index) => (
                <Animated.Text
                  key={reaction.id}
                  style={[
                    styles.reactionEmoji,
                    {
                      bottom: 150 + index * 60,
                      opacity: 1 - (index * 0.2),
                    },
                  ]}
                >
                  {reaction.reaction_type === 'heart' && '❤️'}
                  {reaction.reaction_type === 'fire' && '🔥'}
                  {reaction.reaction_type === 'clap' && '👏'}
                  {reaction.reaction_type === 'star' && '⭐'}
                  {reaction.reaction_type === 'cart' && '🛒'}
                </Animated.Text>
              ))}
            </View>

            {/* Chat */}
            {showChat && (
              <View style={styles.chatContainer}>
                <ScrollView
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                >
                  {messages.slice(-10).map((msg) => (
                    <View key={msg.id} style={styles.messageItem}>
                      <Text style={styles.messageSender}>{msg.user_name}: </Text>
                      <Text style={styles.messageText}>{msg.message}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Contrôles */}
            <View style={styles.controls}>
              {/* Barre de réactions */}
              <View style={styles.reactionsBar}>
                <TouchableOpacity
                  style={styles.reactionButton}
                  onPress={() => handleReaction('heart')}
                >
                  <Text style={styles.reactionButtonText}>❤️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reactionButton}
                  onPress={() => handleReaction('fire')}
                >
                  <Text style={styles.reactionButtonText}>🔥</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reactionButton}
                  onPress={() => handleReaction('clap')}
                >
                  <Text style={styles.reactionButtonText}>👏</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reactionButton}
                  onPress={() => handleReaction('star')}
                >
                  <Text style={styles.reactionButtonText}>⭐</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reactionButton}
                  onPress={() => handleReaction('cart')}
                >
                  <Text style={styles.reactionButtonText}>🛒</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, showProducts && styles.actionButtonActive]}
                  onPress={() => setShowProducts(!showProducts)}
                >
                  <ShoppingBag size={24} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, !showChat && styles.actionButtonActive]}
                  onPress={() => setShowChat(!showChat)}
                >
                  <MessageCircle size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {/* Input message */}
              {showChat && (
                <View style={styles.messageInput}>
                  <TextInput
                    style={styles.messageTextInput}
                    value={chatMessage}
                    onChangeText={setChatMessage}
                    placeholder="Envoyer un message..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    onSubmitEditing={handleSendMessage}
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendMessage}
                  >
                    <Send size={20} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Panneau produits */}
        <Animated.View
          style={[
            styles.productsPanel,
            { transform: [{ translateX: productsSlide }] },
          ]}
        >
          <View style={styles.productsPanelHeader}>
            <View style={styles.productsPanelTitle}>
              <Zap size={20} color={Colors.primaryOrange} />
              <Text style={styles.productsPanelTitleText}>
                Produits en vedette
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowProducts(false)}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {product.product_image && (
                  <Image
                    source={{ uri: product.product_image }}
                    style={styles.productImage}
                  />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.product_title}
                  </Text>
                  <View style={styles.productPrices}>
                    {product.special_price ? (
                      <>
                        <Text style={styles.productOldPrice}>
                          {product.product_price?.toLocaleString()} F
                        </Text>
                        <Text style={styles.productPrice}>
                          {product.special_price.toLocaleString()} F
                        </Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            -{Math.round(((product.product_price! - product.special_price) / product.product_price!) * 100)}%
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.productPrice}>
                        {product.product_price?.toLocaleString()} F
                      </Text>
                    )}
                  </View>
                  {product.stock_limit && (
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockText}>
                        ⚡ Plus que {product.stock_limit - product.sold_count} restants !
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(product.product_id)}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#FF8C42']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.addToCartGradient}
                    >
                      <ShoppingCart size={20} color={Colors.white} />
                      <Text style={styles.addToCartText}>Ajouter au panier</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontWeight: '600',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  sellerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: '#EF4444',
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  viewersText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  reactionsContainer: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 200,
  },
  reactionEmoji: {
    fontSize: 32,
    position: 'absolute',
    right: 0,
  },
  chatContainer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: 180,
    maxHeight: 200,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    gap: Spacing.xs,
  },
  messageItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    flexWrap: 'wrap',
  },
  messageSender: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    flex: 1,
  },
  controls: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionButtonText: {
    fontSize: 24,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: Colors.primaryOrange,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
  },
  messageTextInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.white,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: Colors.white,
    ...Shadows.large,
  },
  productsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productsPanelTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  productsPanelTitleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  productCard: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundLight,
    marginBottom: Spacing.md,
  },
  productInfo: {
    gap: Spacing.sm,
  },
  productTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  productPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  productOldPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  stockInfo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stockText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#D97706',
  },
  addToCartButton: {
    marginTop: Spacing.xs,
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addToCartText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
