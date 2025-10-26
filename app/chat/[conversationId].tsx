import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert, Animated, Modal } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { uploadChatImage, uploadVoiceMessage } from '@/lib/uploadMedia';
import { LinearGradient } from 'expo-linear-gradient';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type?: 'text' | 'image' | 'voice' | 'system';
  image_url?: string | null;
  voice_url?: string | null;
  voice_duration?: number | null;
  is_read: boolean;
  read_at: string | null;
  offer_price: number | null;
  offer_status: 'pending' | 'accepted' | 'rejected' | 'expired' | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
};

type QuickReply = {
  id: string;
  message: string;
};

// Voice Message Player Component
function VoiceMessagePlayer({ voiceUrl, duration, isOwn }: { voiceUrl: string; duration: number; isOwn: boolean }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);

  const playSound = async () => {
    try {
      if (sound) {
        // If already loaded, check status
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          // If finished, replay from beginning
          if (hasFinished) {
            await sound.setPositionAsync(0);
            await sound.playAsync();
            setIsPlaying(true);
            setHasFinished(false);
            setPosition(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (isPlaying) {
            // Pause if currently playing
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            // Resume playback
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
        return;
      }

      // Load and play for the first time
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setHasFinished(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Erreur', 'Impossible de lire le message vocal');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setHasFinished(true);
        setPosition(duration); // Show full duration when finished
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.voiceContainer}>
      <TouchableOpacity onPress={playSound} style={styles.playButton}>
        <Ionicons
          name={hasFinished ? 'reload' : (isPlaying ? 'pause' : 'play')}
          size={20}
          color={isOwn ? '#FFFFFF' : '#F97316'}
        />
      </TouchableOpacity>
      <View style={styles.waveform}>
        <View style={[styles.waveformBar, { flex: position / duration || 0.1, backgroundColor: isOwn ? '#FFFFFF' : '#F97316' }]} />
        <View style={[styles.waveformBar, { flex: 1 - (position / duration || 0.1), backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : '#FEE2E2' }]} />
      </View>
      <Text style={[styles.voiceDuration, { color: isOwn ? '#FFFFFF' : '#6B7280' }]}>
        {formatTime(position)}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Audio recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef<any>(null);

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Image viewer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // User profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    if (!user || !conversationId) return;

    loadConversation();
    loadMessages();
    loadQuickReplies();
    markMessagesAsRead();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newMsg = payload.new as Message;

          // Check if message already exists (avoid duplicates)
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) {
              console.log('Message already exists, skipping duplicate');
              return prev;
            }

            return prev;
          });

          // Get sender profile for the new message
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();

          const formattedMsg = {
            ...newMsg,
            sender_name: senderProfile?.full_name || senderProfile?.username || 'Utilisateur',
            sender_avatar: senderProfile?.avatar_url,
          };

          setMessages((prev) => {
            // Check again if message already exists
            const exists = prev.some(m => m.id === formattedMsg.id);
            if (exists) {
              return prev;
            }
            return [formattedMsg, ...prev];
          });

          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    setChannel(messageChannel);

    // Update presence
    updatePresence(true);

    return () => {
      messageChannel.unsubscribe();
      updatePresence(false);
    };
  }, [user, conversationId]);

  const updatePresence = async (isOnline: boolean) => {
    if (!user) return;
    await supabase.rpc('update_user_presence', {
      p_user_id: user.id,
      p_is_online: isOnline,
    });
  };

  const loadConversation = async () => {
    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Determine the other user ID
      const otherUserId = conversation.buyer_id === user?.id
        ? conversation.seller_id
        : conversation.buyer_id;

      // Get other user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, phone, country, city')
        .eq('id', otherUserId)
        .single();

      if (profileError) throw profileError;

      // Get product if exists
      let product = null;
      if (conversation.product_id) {
        const { data: productData } = await supabase
          .from('products')
          .select('id, title, image_url')
          .eq('id', conversation.product_id)
          .single();

        product = productData;
      }

      setOtherUser({
        ...profile,
        product,
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // Get messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map((m: any) => m.sender_id))];

      // Get all sender profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', senderIds);

      // Map profiles to messages
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formattedMessages = messagesData.map((msg: any) => {
        const sender = profilesMap.get(msg.sender_id);
        return {
          ...msg,
          sender_name: sender?.full_name || sender?.username || 'Utilisateur',
          sender_avatar: sender?.avatar_url,
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuickReplies = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('quick_replies')
      .select('*')
      .eq('seller_id', user.id)
      .eq('is_active', true)
      .order('display_order');

    if (data) setQuickReplies(data);
  };

  const markMessagesAsRead = async () => {
    if (!user) return;
    await supabase.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    });
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) {
      console.log('Cannot send: no user or empty content');
      return;
    }

    console.log('Sending message:', { content, conversationId });
    setSending(true);

    // Create temporary message ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      is_read: false,
      read_at: null,
      offer_price: null,
      offer_status: null,
      created_at: new Date().toISOString(),
      sender_name: otherUser?.full_name || otherUser?.username || 'Vous',
      sender_avatar: otherUser?.avatar_url,
    };

    // Optimistic update - add message immediately
    setMessages((prev) => [tempMessage, ...prev]);
    setNewMessage('');

    // Scroll vers le bas immédiatement
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);

    try {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_sender_id: user.id,
        p_content: content.trim(),
      });

      if (error) {
        console.error('Send message error:', error);
        throw error;
      }

      console.log('Message sent successfully, ID:', data);

      // Get the real message from server with all information
      const { data: newMessage, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(username, full_name, avatar_url)
        `)
        .eq('id', data)
        .single();

      if (fetchError || !newMessage) {
        console.error('Error fetching new message:', fetchError);
        // Fallback: just update ID
        setMessages((prev) => prev.map(msg =>
          msg.id === tempId ? { ...msg, id: data } : msg
        ));
      } else {
        // Replace temp message with full message from server
        const formattedMsg = {
          ...newMessage,
          sender_name: newMessage.sender?.full_name || newMessage.sender?.username || 'Utilisateur',
          sender_avatar: newMessage.sender?.avatar_url,
        };

        setMessages((prev) => prev.map(msg =>
          msg.id === tempId ? formattedMsg : msg
        ));
      }

      // Feedback visuel et tactile
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Remove temp message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      setNewMessage(content); // Restore message content

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const sendImageMessage = async (imageUri: string) => {
    if (!user) return;

    setUploadingMedia(true);
    setSending(true);

    // Create temporary message ID for optimistic update
    const tempId = `temp-image-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: null,
      message_type: 'image',
      image_url: imageUri, // Use local URI temporarily
      is_read: false,
      read_at: null,
      offer_price: null,
      offer_status: null,
      created_at: new Date().toISOString(),
      sender_name: otherUser?.full_name || otherUser?.username || 'Vous',
      sender_avatar: otherUser?.avatar_url,
    };

    // Optimistic update - add message immediately
    setMessages((prev) => [tempMessage, ...prev]);

    // Scroll to the new message immediately
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);

    try {
      // Upload image to storage
      const { url, error } = await uploadChatImage(user.id, imageUri);

      if (error || !url) {
        throw new Error(error || 'Échec de l\'upload de l\'image');
      }

      // Send message with image
      const { data, error: sendError } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_sender_id: user.id,
        p_content: null,
        p_message_type: 'image',
        p_image_url: url,
        p_voice_url: null,
        p_voice_duration: null,
        p_offer_price: null,
      });

      if (sendError) {
        throw sendError;
      }

      console.log('Image message sent successfully, ID:', data);

      // Get the real message from server with all information
      const { data: newMessage, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(username, full_name, avatar_url)
        `)
        .eq('id', data)
        .single();

      if (fetchError || !newMessage) {
        console.error('Error fetching new message:', fetchError);
        // Fallback: just update ID and URL
        setMessages((prev) => prev.map(msg =>
          msg.id === tempId ? { ...msg, id: data, image_url: url } : msg
        ));
      } else {
        // Replace temp message with full message from server
        const formattedMsg = {
          ...newMessage,
          sender_name: newMessage.sender?.full_name || newMessage.sender?.username || 'Utilisateur',
          sender_avatar: newMessage.sender?.avatar_url,
        };

        setMessages((prev) => prev.map(msg =>
          msg.id === tempId ? formattedMsg : msg
        ));
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      console.error('Error sending image:', error);

      // Remove temp message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer l\'image');
    } finally {
      setUploadingMedia(false);
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      // Request permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour enregistrer de l\'audio');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      recordingInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);

      if (uri && recordingDuration > 0) {
        await sendVoiceMessage(uri, recordingDuration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement');
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }

      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingDuration(0);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const sendVoiceMessage = async (audioUri: string, duration: number) => {
    if (!user) return;

    setUploadingMedia(true);
    setSending(true);

    // Create temporary message ID for optimistic update
    const tempId = `temp-voice-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: null,
      message_type: 'voice',
      voice_url: audioUri, // Use local URI temporarily
      voice_duration: duration,
      is_read: false,
      read_at: null,
      offer_price: null,
      offer_status: null,
      created_at: new Date().toISOString(),
      sender_name: otherUser?.full_name || otherUser?.username || 'Vous',
      sender_avatar: otherUser?.avatar_url,
    };

    // Optimistic update - add message immediately
    setMessages((prev) => [tempMessage, ...prev]);

    // Scroll to the new message immediately
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);

    try {
      // Upload voice to storage
      const { url, error } = await uploadVoiceMessage(user.id, audioUri);

      if (error || !url) {
        throw new Error(error || 'Échec de l\'upload du message vocal');
      }

      // Send message with voice
      const { data, error: sendError } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_sender_id: user.id,
        p_content: null,
        p_message_type: 'voice',
        p_image_url: null,
        p_voice_url: url,
        p_voice_duration: duration,
        p_offer_price: null,
      });

      if (sendError) {
        throw sendError;
      }

      console.log('Voice message sent successfully, ID:', data);

      // Get the real message from server with all information
      const { data: newMessage, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(username, full_name, avatar_url)
        `)
        .eq('id', data)
        .single();

      if (fetchError || !newMessage) {
        console.error('Error fetching new message:', fetchError);
        // Fallback: just update ID and URL
        setMessages((prev) => prev.map(msg =>
          msg.id === tempId ? { ...msg, id: data, voice_url: url } : msg
        ));
      } else {
        // Replace temp message with full message from server
        const formattedMsg = {
          ...newMessage,
          sender_name: newMessage.sender?.full_name || newMessage.sender?.username || 'Utilisateur',
          sender_avatar: newMessage.sender?.avatar_url,
        };

        setMessages((prev) => prev.map(msg =>
          msg.id === tempId ? formattedMsg : msg
        ));
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRecordingDuration(0);
    } catch (error: any) {
      console.error('Error sending voice:', error);

      // Remove temp message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le message vocal');
    } finally {
      setUploadingMedia(false);
      setSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkIfBlocked = async () => {
    if (!user || !otherUser?.id) return;

    try {
      const { data, error } = await supabase.rpc('is_user_blocked', {
        p_blocker_id: user.id,
        p_blocked_id: otherUser.id,
      });

      if (!error) {
        setIsBlocked(data);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!user || !otherUser) return;

    Alert.alert(
      'Bloquer cet utilisateur',
      `Êtes-vous sûr de vouloir bloquer ${otherUser.full_name || otherUser.username}? Vous ne pourrez plus communiquer avec cette personne.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            try {
              setBlockLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              const { data, error } = await supabase.rpc('block_user', {
                p_blocker_id: user.id,
                p_blocked_id: otherUser.id,
                p_reason: null,
              });

              if (error) throw error;

              if (data.success) {
                setIsBlocked(true);
                setShowProfileModal(false);
                Alert.alert('Succès', 'Utilisateur bloqué avec succès');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error: any) {
              console.error('Error blocking user:', error);
              Alert.alert('Erreur', error.message || 'Impossible de bloquer cet utilisateur');
            } finally {
              setBlockLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async () => {
    if (!user || !otherUser) return;

    Alert.alert(
      'Débloquer cet utilisateur',
      `Êtes-vous sûr de vouloir débloquer ${otherUser.full_name || otherUser.username}?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Débloquer',
          onPress: async () => {
            try {
              setBlockLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              const { data, error } = await supabase.rpc('unblock_user', {
                p_blocker_id: user.id,
                p_blocked_id: otherUser.id,
              });

              if (error) throw error;

              if (data.success) {
                setIsBlocked(false);
                setShowProfileModal(false);
                Alert.alert('Succès', 'Utilisateur débloqué avec succès');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error: any) {
              console.error('Error unblocking user:', error);
              Alert.alert('Erreur', error.message || 'Impossible de débloquer cet utilisateur');
            } finally {
              setBlockLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDateSeparator = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare dates only
    const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const msgDate = resetTime(messageDate);
    const todayDate = resetTime(today);
    const yesterdayDate = resetTime(yesterday);

    if (msgDate.getTime() === todayDate.getTime()) {
      return "Aujourd'hui";
    } else if (msgDate.getTime() === yesterdayDate.getTime()) {
      return 'Hier';
    } else {
      return messageDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, previousMsg: Message | undefined) => {
    if (!previousMsg) return true;

    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();

    return currentDate !== previousDate;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === user?.id;
    const previousMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>{getDateSeparator(item.created_at)}</Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
          {!isOwn && (
            <Image
              source={{ uri: item.sender_avatar || 'https://via.placeholder.com/40' }}
              style={styles.messageAvatar}
            />
          )}

{isOwn ? (
            <View style={[styles.messageBubble, styles.ownBubble]}>
              {/* Image message */}
              {item.message_type === 'image' && item.image_url && (
                <TouchableOpacity onPress={() => {
                  setSelectedImage(item.image_url || null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              {/* Voice message */}
              {item.message_type === 'voice' && item.voice_url && (
                <VoiceMessagePlayer
                  voiceUrl={item.voice_url}
                  duration={item.voice_duration || 0}
                  isOwn={isOwn}
                />
              )}

              {/* Text content */}
              {item.content && (
                <Text style={[styles.messageText, styles.ownText]}>
                  {item.content}
                </Text>
              )}

              {item.offer_price && (
                <View style={styles.offerContainer}>
                  <Text style={styles.offerText}>💰 Offre: {item.offer_price.toLocaleString()} XOF</Text>
                  {item.offer_status === 'pending' && !isOwn && (
                    <View style={styles.offerActions}>
                      <TouchableOpacity style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton}>
                        <Text style={styles.rejectButtonText}>Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, styles.ownTime]}>
                  {formatMessageTime(item.created_at)}
                </Text>
                <Ionicons
                  name={item.is_read ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.is_read ? '#10B981' : '#9CA3AF'}
                  style={styles.readIcon}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.messageBubble, styles.otherBubble]}>
              {/* Image message */}
              {item.message_type === 'image' && item.image_url && (
                <TouchableOpacity onPress={() => {
                  setSelectedImage(item.image_url || null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              {/* Voice message */}
              {item.message_type === 'voice' && item.voice_url && (
                <VoiceMessagePlayer
                  voiceUrl={item.voice_url}
                  duration={item.voice_duration || 0}
                  isOwn={isOwn}
                />
              )}

              {/* Text content */}
              {item.content && (
                <Text style={[styles.messageText, styles.otherText]}>
                  {item.content}
                </Text>
              )}

              {item.offer_price && (
                <View style={styles.offerContainer}>
                  <Text style={styles.offerText}>💰 Offre: {item.offer_price.toLocaleString()} XOF</Text>
                  {item.offer_status === 'pending' && !isOwn && (
                    <View style={styles.offerActions}>
                      <TouchableOpacity style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton}>
                        <Text style={styles.rejectButtonText}>Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, styles.otherTime]}>
                  {formatMessageTime(item.created_at)}
                </Text>
                {isOwn && (
                  <Ionicons
                    name={item.is_read ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={item.is_read ? '#10B981' : '#9CA3AF'}
                    style={styles.readIcon}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Custom Header */}
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>

            <View style={styles.headerUserInfo}>
              <Image
                source={{
                  uri: otherUser?.avatar_url || 'https://ui-avatars.com/api/?name=' +
                  (otherUser?.full_name || otherUser?.username || 'User')
                }}
                style={styles.headerAvatar}
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {otherUser?.full_name || otherUser?.username || 'Utilisateur'}
                </Text>
                {otherUser?.product && (
                  <Text style={styles.headerProduct} numberOfLines={1}>
                    📦 {otherUser.product.title}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={async () => {
                  if (otherUser?.id) {
                    await checkIfBlocked();
                    setShowProfileModal(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}>
                <Ionicons name="person-circle-outline" size={28} color="#FF8C42" />
              </TouchableOpacity>
            </View>
          </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messagesList}
        />

        {quickReplies.length > 0 && (
          <View style={styles.quickRepliesContainer}>
            <FlatList
              horizontal
              data={quickReplies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.quickReplyButton}
                  onPress={() => sendMessage(item.message)}
                >
                  <Text style={styles.quickReplyText} numberOfLines={1}>
                    {item.message}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Recording overlay */}
        {isRecording && (
          <View style={styles.recordingOverlay}>
            <View style={styles.recordingContainer}>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
                <Ionicons name="close" size={28} color="#EF4444" />
              </TouchableOpacity>

              <View style={styles.recordingInfo}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Enregistrement...</Text>
                <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
              </View>

              <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                <Ionicons name="checkmark" size={28} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input container */}
        {!isRecording && (
          <View style={styles.inputContainer}>
            {uploadingMedia ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#F97316" />
                <Text style={styles.uploadingText}>Envoi en cours...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={sending}>
                  <Ionicons name="image" size={24} color={sending ? "#D1D5DB" : "#F97316"} />
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Votre message..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                  maxLength={500}
                  editable={!sending}
                />

                {newMessage.trim() ? (
                  <TouchableOpacity
                    onPress={() => sendMessage(newMessage)}
                    disabled={sending}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={startRecording}
                    disabled={sending}
                    onLongPress={startRecording}
                  >
                    <Ionicons name="mic" size={24} color={sending ? "#D1D5DB" : "#F97316"} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => {
              setSelectedImage(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.imageViewerInfo}>
            <Text style={styles.imageViewerText}>Pincer pour zoomer</Text>
          </View>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            {/* Modal Header */}
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>Profil utilisateur</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowProfileModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.profileModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            {otherUser && (
              <View style={styles.profileModalBody}>
                {/* Avatar and Name */}
                <View style={styles.profileModalAvatarSection}>
                  <Image
                    source={{
                      uri: otherUser.avatar_url || 'https://ui-avatars.com/api/?name=' +
                      (otherUser.full_name || otherUser.username || 'User')
                    }}
                    style={styles.profileModalAvatar}
                  />
                  <Text style={styles.profileModalName}>
                    {otherUser.full_name || otherUser.username || 'Utilisateur'}
                  </Text>
                  {otherUser.username && otherUser.full_name && (
                    <Text style={styles.profileModalUsername}>@{otherUser.username}</Text>
                  )}
                </View>

                {/* Contact Information */}
                <View style={styles.profileModalContactSection}>
                  {otherUser.phone && (
                    <View style={styles.profileModalContactRow}>
                      <Ionicons name="call-outline" size={18} color="#6B7280" />
                      <Text style={styles.profileModalContactText}>{otherUser.phone}</Text>
                    </View>
                  )}
                  {(otherUser.city || otherUser.country) && (
                    <View style={styles.profileModalContactRow}>
                      <Ionicons name="location-outline" size={18} color="#6B7280" />
                      <Text style={styles.profileModalContactText}>
                        {[otherUser.city, otherUser.country].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Block/Unblock Button */}
                <TouchableOpacity
                  style={[styles.profileModalButton, isBlocked && styles.profileModalUnblockButton]}
                  onPress={isBlocked ? handleUnblockUser : handleBlockUser}
                  disabled={blockLoading}
                >
                  {isBlocked ? (
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.profileModalButtonGradient}
                    >
                      {blockLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                          <Text style={styles.profileModalButtonText}>Débloquer</Text>
                        </>
                      )}
                    </LinearGradient>
                  ) : (
                    <View style={styles.profileModalBlockButton}>
                      {blockLoading ? (
                        <ActivityIndicator color="#EF4444" />
                      ) : (
                        <>
                          <Ionicons name="ban" size={20} color="#EF4444" />
                          <Text style={styles.profileModalBlockButtonText}>Bloquer</Text>
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerProduct: {
    fontSize: 13,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  messagesList: {
    padding: 16,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  dateSeparatorText: {
    marginHorizontal: 14,
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'capitalize',
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: '#FEF3C7',
    borderBottomRightRadius: 4,
    borderWidth: 2,
    borderColor: '#D97706',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.12,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  ownText: {
    color: '#374151',
  },
  otherText: {
    color: '#1F2937',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownTime: {
    color: '#6B7280',
  },
  otherTime: {
    color: '#9CA3AF',
  },
  readIcon: {
    marginLeft: 4,
  },
  offerContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  offerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickRepliesContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  quickReplyButton: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 8,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickReplyText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  imageButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  voiceButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  uploadingText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Voice message player styles
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flex: 1,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  waveformBar: {
    height: '100%',
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  // Recording overlay styles
  recordingOverlay: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  recordingInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  recordingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  recordingDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  stopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  // Image viewer styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerInfo: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  imageViewerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // Profile modal styles
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  profileModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileModalCloseButton: {
    padding: 4,
  },
  profileModalBody: {
    padding: 24,
  },
  profileModalAvatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileModalUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileModalContactSection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  profileModalContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileModalContactText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  profileModalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileModalUnblockButton: {
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
  },
  profileModalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  profileModalBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FEE2E2',
    gap: 8,
  },
  profileModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileModalBlockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});
