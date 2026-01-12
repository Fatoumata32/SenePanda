// ZegoCloud Live Streaming - AUDIENCE (Spectateur)
// Page de visualisation en direct avec ZegoCloud UIKit

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ZegoUIKitPrebuiltLiveStreaming, {
  AUDIENCE_DEFAULT_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn';
import * as ZIM from 'zego-zim-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ZEGO_APP_ID, ZEGO_APP_SIGN, getLiveRoomID } from '@/lib/liveStreamConfig';

export default function ZegoViewerPage() {
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
        .select(`
          *,
          seller:profiles!seller_id(
            id,
            shop_name,
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Vérifier que le live est actif
      if (data.status !== 'live') {
        Alert.alert(
          'Live non disponible',
          data.status === 'scheduled'
            ? 'Ce live n\'a pas encore démarré'
            : 'Ce live est terminé',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setSessionData(data);

      // Incrémenter le viewer_count
      await supabase.rpc('increment_live_viewers', { live_id: id });

      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert('Erreur', 'Impossible de charger le live');
      router.back();
    }
  };

  // Décrémenter le viewer_count quand on quitte
  useEffect(() => {
    return () => {
      if (id) {
        supabase.rpc('decrement_live_viewers', { live_id: id }).catch(console.error);
      }
    };
  }, [id]);

  // Gérer le bouton retour Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeaveLiveStreaming();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleLeaveLiveStreaming = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/explore');
    }
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
  const userName = profile.full_name || 'Spectateur';
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
          ...AUDIENCE_DEFAULT_CONFIG,
          onLeaveLiveStreaming: handleLeaveLiveStreaming,
          // Personnalisation spectateur
          turnOnCameraWhenJoining: false,
          turnOnMicrophoneWhenJoining: false,
          useSpeakerWhenJoining: true,
          // Textes personnalisés
          confirmDialogInfo: {
            title: 'Quitter le live',
            message: 'Voulez-vous vraiment quitter ce live?',
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
