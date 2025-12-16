import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  X,
  Users,
  ShoppingCart,
  MessageCircle,
  Heart,
  Send,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Eye,
  DollarSign,
  TrendingUp,
} from 'lucide-react-native';
import RtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useLiveShopping, useLiveChat, useLiveReactions, useLiveViewers, useLiveFeaturedProducts } from '@/hooks/useLiveShopping';
import { AGORA_APP_ID, getLiveChannelName, VIDEO_PROFILE } from '@/lib/agoraConfig';
import { useAuth } from '@/providers/AuthProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LiveStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Live Shopping Hooks
  const { session, startSession, endSession } = useLiveShopping(id);
  const { messages, sendMessage } = useLiveChat(id || '');
  const { reactions, sendReaction } = useLiveReactions(id || '');
  const { viewerCount } = useLiveViewers(id || '', false);
  const { products } = useLiveFeaturedProducts(id || '');

  // Agora Engine
  const agoraEngineRef = useRef<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // UI State
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [totalSales, setTotalSales] = useState(0);

  // Animations
  const chatOpacity = useRef(new Animated.Value(1)).current;
  const statsScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupAgoraEngine();
    return () => {
      cleanup();
    };
  }, []);

  const setupAgoraEngine = async () => {
    try {
      if (!AGORA_APP_ID || (AGORA_APP_ID as any) === 'YOUR_AGORA_APP_ID') {
        Alert.alert(
          'Configuration requise',
          'Veuillez configurer votre Agora App ID dans lib/agoraConfig.ts'
        );
        return;
      }

      // Créer l'engine Agora
      agoraEngineRef.current = await (RtcEngine as any).create(AGORA_APP_ID);
      const engine = agoraEngineRef.current;

      // Activer la vidéo
      await engine.enableVideo();

      // Configurer le profil vidéo
      await engine.setVideoEncoderConfiguration({
        dimensions: { width: VIDEO_PROFILE.width, height: VIDEO_PROFILE.height },
        frameRate: VIDEO_PROFILE.frameRate,
        bitrate: VIDEO_PROFILE.bitrate,
      });

      // Configurer le mode de canal
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

      // Définir le rôle : Broadcaster (vendeur)
      await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      console.log('✅ Agora Engine configuré avec succès');
    } catch (error) {
      console.error('❌ Erreur configuration Agora:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser la vidéo');
    }
  };

  const startLiveStream = async () => {
    if (!agoraEngineRef.current || !id) return;

    try {
      const channelName = getLiveChannelName(id);

      // Rejoindre le canal Agora
      await agoraEngineRef.current.joinChannel(
        '', // Token (null pour le dev, à sécuriser en prod)
        channelName,
        0, // UID (0 = auto)
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        }
      );

      setIsJoined(true);

      // Démarrer la session dans la base de données
      await startSession(id);
      setIsLive(true);

      Alert.alert('🔴 Live démarré !', 'Vous êtes maintenant en direct !');
    } catch (error) {
      console.error('❌ Erreur démarrage live:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le live');
    }
  };

  const stopLiveStream = async () => {
    Alert.alert(
      'Terminer le live ?',
      'Êtes-vous sûr de vouloir terminer le live ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (agoraEngineRef.current) {
                await agoraEngineRef.current.leaveChannel();
              }
              if (id) {
                await endSession(id);
              }
              setIsJoined(false);
              setIsLive(false);
              router.back();
            } catch (error) {
              console.error('❌ Erreur arrêt live:', error);
            }
          },
        },
      ]
    );
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

  const toggleMute = async () => {
    if (!agoraEngineRef.current) return;
    await agoraEngineRef.current.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = async () => {
    if (!agoraEngineRef.current) return;
    await agoraEngineRef.current.muteLocalVideoStream(!isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  const switchCamera = async () => {
    if (!agoraEngineRef.current) return;
    await agoraEngineRef.current.switchCamera();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      await sendMessage(chatMessage, 'text');
      setChatMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const handleReaction = async (type: 'heart' | 'fire' | 'clap' | 'star' | 'cart') => {
    try {
      await sendReaction(type);
      // Animation de feedback
      Animated.sequence([
        Animated.timing(statsScale, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(statsScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Erreur réaction:', error);
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
        {/* Vidéo du vendeur (caméra locale) */}
        <View style={styles.videoContainer}>
          {isJoined && !isCameraOff ? (
            <RtcSurfaceView
              style={styles.video}
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <VideoIcon size={64} color={Colors.white} />
              <Text style={styles.videoPlaceholderText}>
                {isCameraOff ? 'Caméra désactivée' : 'En attente...'}
              </Text>
            </View>
          )}

          {/* Overlay avec informations */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.videoOverlay}
          >
            {/* Header */}
            <View style={styles.videoHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={Colors.white} />
              </TouchableOpacity>

              <View style={styles.liveIndicator}>
                {isLive && (
                  <View style={styles.liveDot} />
                )}
                <Text style={styles.liveText}>
                  {isLive ? 'LIVE' : 'PREPARATION'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewersButton}
                onPress={() => setShowStats(!showStats)}
              >
                <Users size={18} color={Colors.white} />
                <Text style={styles.viewersText}>{viewerCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Stats en direct */}
            {showStats && (
              <Animated.View style={[styles.statsContainer, { transform: [{ scale: statsScale }] }]}>
                <View style={styles.statCard}>
                  <Eye size={16} color={Colors.white} />
                  <Text style={styles.statValue}>{viewerCount}</Text>
                  <Text style={styles.statLabel}>Spectateurs</Text>
                </View>
                <View style={styles.statCard}>
                  <Heart size={16} color="#FF6B6B" />
                  <Text style={styles.statValue}>{reactions.length}</Text>
                  <Text style={styles.statLabel}>Réactions</Text>
                </View>
                <View style={styles.statCard}>
                  <DollarSign size={16} color="#10B981" />
                  <Text style={styles.statValue}>{totalSales}</Text>
                  <Text style={styles.statLabel}>Ventes</Text>
                </View>
              </Animated.View>
            )}

            {/* Réactions animées */}
            <View style={styles.reactionsContainer}>
              {reactions.slice(-5).map((reaction, index) => (
                <Animated.Text
                  key={reaction.id}
                  style={[
                    styles.reactionEmoji,
                    {
                      bottom: 100 + index * 60,
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
              <Animated.View style={[styles.chatContainer, { opacity: chatOpacity }]}>
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
              </Animated.View>
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
              </View>

              {/* Contrôles principaux */}
              <View style={styles.mainControls}>
                <TouchableOpacity
                  style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <MicOff size={24} color={Colors.white} />
                  ) : (
                    <Mic size={24} color={Colors.white} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                  onPress={toggleCamera}
                >
                  {isCameraOff ? (
                    <VideoOff size={24} color={Colors.white} />
                  ) : (
                    <VideoIcon size={24} color={Colors.white} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={switchCamera}
                >
                  <Text style={styles.switchCameraText}>🔄</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowChat(!showChat)}
                >
                  <MessageCircle size={24} color={Colors.white} />
                </TouchableOpacity>

                {!isLive ? (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={startLiveStream}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.startButtonGradient}
                    >
                      <Text style={styles.startButtonText}>🔴 DÉMARRER</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.endButton}
                    onPress={stopLiveStream}
                  >
                    <PhoneOff size={24} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Input de message */}
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
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  videoPlaceholderText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontWeight: '600',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  viewersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  viewersText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
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
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#EF4444',
  },
  switchCameraText: {
    fontSize: 24,
  },
  startButton: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  startButtonGradient: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
  endButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
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
});
