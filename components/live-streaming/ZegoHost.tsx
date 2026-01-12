// ZegoCloud Live Streaming - HOST (Vendeur)
// Page de diffusion en direct avec ZegoCloud UIKit

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ZegoUIKitPrebuiltLiveStreaming, {
  HOST_DEFAULT_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn';
import * as ZIM from 'zego-zim-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ZEGO_APP_ID, ZEGO_APP_SIGN, getLiveRoomID } from '@/lib/liveStreamConfig';

export default function ZegoHostPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) {
      Alert.alert('Erreur', 'Session invalide');
      router.back();
      return;
    }

    loadSessionData();
  }, [id, user]);

  const loadSessionData = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.seller_id !== user?.id) {
        Alert.alert('Erreur', 'Vous n\'êtes pas le propriétaire de ce live');
        router.back();
        return;
      }

      setSessionData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert('Erreur', 'Impossible de charger la session');
      router.back();
    }
  };

  // Gérer le bouton retour Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeaveLiveStreaming();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleStartLiveButtonPressed = async () => {
    try {
      // Mettre à jour le statut de la session à "live"
      const { error } = await supabase
        .from('live_sessions')
        .update({ status: 'live', started_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      console.log('✅ Live démarré avec succès');
    } catch (error) {
      console.error('❌ Erreur démarrage live:', error);
    }
  };

  const handleLiveStreamingEnded = async () => {
    try {
      // Mettre à jour le statut de la session à "ended"
      const { error } = await supabase
        .from('live_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      console.log('✅ Live terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur fin live:', error);
    }
  };

  const handleLeaveLiveStreaming = () => {
    Alert.alert(
      'Quitter le live',
      'Voulez-vous vraiment quitter ce live? Il sera terminé pour tous les spectateurs.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            await handleLiveStreamingEnded();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          },
        },
      ]
    );
  };

  if (loading || !sessionData || !user || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading sera affiché par ZegoUIKit */}
        </View>
      </SafeAreaView>
    );
  }

  // Générer des IDs uniques et valides pour ZegoCloud
  const userID = user.id.replace(/[^A-Za-z0-9_]/g, '_');
  const userName = profile.shop_name || profile.full_name || 'Vendeur';
  const liveID = getLiveRoomID(id!);

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltLiveStreaming
        appID={ZEGO_APP_ID}
        appSign={ZEGO_APP_SIGN}
        userID={userID}
        userName={userName}
        liveID={liveID}
        config={{
          ...HOST_DEFAULT_CONFIG,
          onStartLiveButtonPressed: handleStartLiveButtonPressed,
          onLiveStreamingEnded: handleLiveStreamingEnded,
          onLeaveLiveStreaming: handleLeaveLiveStreaming,
          // Personnalisation supplémentaire
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          useSpeakerWhenJoining: true,
          // Textes personnalisés
          confirmDialogInfo: {
            title: 'Quitter le live',
            message: 'Voulez-vous vraiment quitter? Le live sera terminé.',
            cancelButtonName: 'Annuler',
            confirmButtonName: 'Quitter',
          },
        }}
        plugins={[ZIM]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
