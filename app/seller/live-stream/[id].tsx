// Live Broadcaster Screen - Version compatible Expo Go
// Interface de diffusion pour les vendeurs (sans streaming natif)

import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Eye,
  ShoppingBag,
  MessageCircle,
  X,
  RefreshCw,
  Radio,
  Package,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useLiveShopping, useLiveChat, useLiveViewers, useLiveFeaturedProducts } from '@/hooks/useLiveShopping';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types
interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

// Composant Message Chat
const ChatMessageItem = React.memo(({ item }: { item: ChatMessage }) => (
  <View style={styles.chatMessage}>
    <Text style={styles.chatUserName}>{item.user_name}:</Text>
    <Text style={styles.chatText}>{item.message}</Text>
  </View>
));

export default function LiveBroadcasterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  // Hooks Live Shopping
  const { session, isLoading, error, updateSession, endSession } = useLiveShopping(id);
  const { messages, sendMessage } = useLiveChat(id || '');
  const { viewerCount } = useLiveViewers(id || '', false);
  const { products, addProduct, removeProduct } = useLiveFeaturedProducts(id || '');

  // États locaux
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [duration, setDuration] = useState(0);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer de durée
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  // Synchroniser avec le statut de session
  useEffect(() => {
    if (session?.status === 'live') {
      setIsLive(true);
    }
  }, [session?.status]);

  // Auto-scroll chat
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Format durée
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Démarrer le live
  const handleStartLive = async () => {
    try {
      await updateSession({ status: 'live' });
      setIsLive(true);
    } catch (err) {
      console.error('Erreur démarrage live:', err);
      Alert.alert('Erreur', 'Impossible de démarrer le live');
    }
  };

  // Terminer le live
  const handleEndLive = () => {
    Alert.alert(
      'Terminer le live',
      'Voulez-vous vraiment terminer ce live?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            try {
              await endSession();
              router.back();
            } catch (err) {
              console.error('Erreur fin live:', err);
              router.back();
            }
          },
        },
      ]
    );
  };

  // Toggle camera
  const handleToggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  // Toggle mic
  const handleToggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  // Envoyer message
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      await sendMessage(chatMessage.trim());
      setChatMessage('');
    } catch (err) {
      console.error('Erreur envoi message:', err);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF2D55" />
        <Text style={styles.loadingText}>Préparation du live...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Zone caméra (placeholder en Expo Go) */}
      <View style={styles.cameraContainer}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.cameraPlaceholder}
        >
          {isCameraOn ? (
            <>
              <Camera size={60} color="#fff" />
              <Text style={styles.cameraText}>Aperçu caméra</Text>
              <Text style={styles.cameraSubtext}>
                Streaming vidéo disponible{'\n'}avec build natif
              </Text>
            </>
          ) : (
            <>
              <CameraOff size={60} color="#666" />
              <Text style={styles.cameraText}>Caméra désactivée</Text>
            </>
          )}
        </LinearGradient>
      </View>

      {/* Header avec status live */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerLeft}>
          {isLive ? (
            <View style={styles.liveBadge}>
              <Radio size={14} color="#fff" />
              <Text style={styles.liveBadgeText}>LIVE</Text>
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            </View>
          ) : (
            <View style={styles.preparingBadge}>
              <Text style={styles.preparingText}>EN PRÉPARATION</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <View style={styles.viewerBadge}>
            <Eye size={14} color="#fff" />
            <Text style={styles.viewerCount}>{viewerCount}</Text>
          </View>

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={isLive ? handleEndLive : () => router.back()}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Zone chat */}
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

      {/* Panneau produits */}
      {showProducts && (
        <View style={styles.productsPanel}>
          <View style={styles.productsPanelHeader}>
            <Text style={styles.productsPanelTitle}>Produits en vedette</Text>
            <TouchableOpacity onPress={() => setShowProducts(false)}>
              <X size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.productsList}>
            {products?.map((p: any) => (
              <View key={p.id} style={styles.productItem}>
                <Image
                  source={{ uri: p.product?.images?.[0] || 'https://via.placeholder.com/50' }}
                  style={styles.productThumb}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {p.product?.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    {p.product?.price?.toLocaleString()} FCFA
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeProductBtn}
                  onPress={() => removeProduct(p.id)}
                >
                  <X size={16} color="#FF2D55" />
                </TouchableOpacity>
              </View>
            ))}
            {(!products || products.length === 0) && (
              <Text style={styles.noProducts}>Aucun produit mis en avant</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Barre de contrôle en bas */}
      <SafeAreaView style={styles.controlBar} edges={['bottom']}>
        {!isLive ? (
          // Bouton démarrer
          <TouchableOpacity style={styles.startButton} onPress={handleStartLive}>
            <Radio size={24} color="#fff" />
            <Text style={styles.startButtonText}>Démarrer le live</Text>
          </TouchableOpacity>
        ) : (
          // Contrôles en live
          <View style={styles.liveControls}>
            {/* Input chat broadcaster */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Message..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendMessage}
              />
            </View>

            {/* Boutons contrôle */}
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={[styles.controlBtn, !isCameraOn && styles.controlBtnOff]}
                onPress={handleToggleCamera}
              >
                {isCameraOn ? (
                  <Camera size={22} color="#fff" />
                ) : (
                  <CameraOff size={22} color="#FF2D55" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlBtn, !isMicOn && styles.controlBtnOff]}
                onPress={handleToggleMic}
              >
                {isMicOn ? (
                  <Mic size={22} color="#fff" />
                ) : (
                  <MicOff size={22} color="#FF2D55" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => setShowProducts(!showProducts)}
              >
                <ShoppingBag size={22} color="#fff" />
                {products && products.length > 0 && (
                  <View style={styles.productCount}>
                    <Text style={styles.productCountText}>{products.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.endButton} onPress={handleEndLive}>
                <Text style={styles.endButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Loading
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

  // Camera
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  cameraSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Live Badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2D55',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  preparingBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  preparingText: {
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

  // Chat
  chatContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    maxHeight: 200,
  },
  chatList: {
    paddingVertical: 8,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chatUserName: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  chatText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },

  // Products Panel
  productsPanel: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 200,
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  productsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productsPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productsList: {
    maxHeight: 230,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  productPrice: {
    fontSize: 11,
    color: '#FF2D55',
    fontWeight: '600',
  },
  removeProductBtn: {
    padding: 4,
  },
  noProducts: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Control Bar
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // Start Button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF2D55',
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  // Live Controls
  liveControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
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
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  controlBtnOff: {
    backgroundColor: 'rgba(255,45,85,0.3)',
  },
  productCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF2D55',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
