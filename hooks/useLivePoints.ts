import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface LiveViewingSession {
  id: string;
  live_session_id: string;
  viewer_id: string;
  joined_at: string;
  left_at: string | null;
  total_watch_time_seconds: number;
  points_earned: number;
  points_from_watching: number;
  points_from_messages: number;
  points_from_reactions: number;
  points_from_purchase: number;
  messages_sent: number;
  reactions_sent: number;
  purchased: boolean;
}

export interface LivePointsEarned {
  totalPoints: number;
  watchingPoints: number;
  messagePoints: number;
  reactionPoints: number;
  purchasePoints: number;
  watchTime: number; // en secondes
}

/**
 * Hook pour tracker les points gagnés pendant un live
 * Incrémente automatiquement toutes les 30 secondes
 */
export function useLivePoints(liveSessionId: string | null, autoTrack: boolean = true) {
  const { user } = useAuth();
  const [pointsEarned, setPointsEarned] = useState<LivePointsEarned>({
    totalPoints: 0,
    watchingPoints: 0,
    messagePoints: 0,
    reactionPoints: 0,
    purchasePoints: 0,
    watchTime: 0,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Refs pour tracking
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());
  const accumulatedSecondsRef = useRef<number>(0);

  /**
   * Initialise ou récupère la session de visionnage
   */
  const initializeSession = useCallback(async () => {
    if (!liveSessionId || !user) return;

    try {
      const { data, error } = await supabase.rpc('record_live_view_session', {
        p_live_session_id: liveSessionId,
        p_viewer_id: user.id,
      });

      if (error) throw error;

      setSessionId(data.session_id);

      // Charger les stats de la session si elle existe déjà
      if (!data.new_session) {
        await refreshPointsEarned();
      }

      console.log('✅ Live viewing session initialized:', data.session_id);
    } catch (error: any) {
      console.error('❌ Error initializing live session:', error);
    }
  }, [liveSessionId, user]);

  /**
   * Rafraîchit les points gagnés depuis Supabase
   */
  const refreshPointsEarned = useCallback(async () => {
    if (!liveSessionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('live_viewing_sessions')
        .select('*')
        .eq('live_session_id', liveSessionId)
        .eq('viewer_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPointsEarned({
          totalPoints: data.points_earned,
          watchingPoints: data.points_from_watching,
          messagePoints: data.points_from_messages,
          reactionPoints: data.points_from_reactions,
          purchasePoints: data.points_from_purchase,
          watchTime: data.total_watch_time_seconds,
        });
      }
    } catch (error: any) {
      console.error('❌ Error refreshing points:', error);
    }
  }, [liveSessionId, user]);

  /**
   * Met à jour le temps de visionnage et les points
   */
  const updateWatchTime = useCallback(async (secondsWatched: number) => {
    if (!liveSessionId || !user || secondsWatched <= 0) return;

    try {
      const { data, error } = await supabase.rpc('update_live_watch_time', {
        p_live_session_id: liveSessionId,
        p_viewer_id: user.id,
        p_seconds_watched: secondsWatched,
      });

      if (error) throw error;

      // Mettre à jour l'état local
      if (data.points_earned > 0) {
        setPointsEarned((prev) => ({
          ...prev,
          totalPoints: prev.totalPoints + data.points_earned,
          watchingPoints: data.total_points,
          watchTime: data.watch_time,
        }));

        console.log(`✅ Earned ${data.points_earned} points for watching (+${secondsWatched}s)`);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error updating watch time:', error);
    }
  }, [liveSessionId, user]);

  /**
   * Attribue des points pour une interaction
   */
  const awardInteractionPoints = useCallback(async (
    interactionType: 'message' | 'reaction' | 'purchase'
  ) => {
    if (!liveSessionId || !user) return;

    try {
      const { data, error } = await supabase.rpc('award_live_interaction_points', {
        p_live_session_id: liveSessionId,
        p_viewer_id: user.id,
        p_interaction_type: interactionType,
      });

      if (error) throw error;

      // Mettre à jour l'état local
      if (data.points_earned > 0) {
        setPointsEarned((prev) => {
          const updated = { ...prev, totalPoints: prev.totalPoints + data.points_earned };

          if (interactionType === 'message') {
            updated.messagePoints += data.points_earned;
          } else if (interactionType === 'reaction') {
            updated.reactionPoints += data.points_earned;
          } else if (interactionType === 'purchase') {
            updated.purchasePoints += data.points_earned;
          }

          return updated;
        });

        console.log(`✅ Earned ${data.points_earned} points for ${interactionType}`);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error awarding interaction points:', error);
    }
  }, [liveSessionId, user]);

  /**
   * Démarre le tracking automatique
   */
  const startTracking = useCallback(async () => {
    if (isTracking || !liveSessionId || !user) return;

    await initializeSession();
    setIsTracking(true);
    lastUpdateRef.current = new Date();
    accumulatedSecondsRef.current = 0;

    // Tracker toutes les 10 secondes pour plus de précision
    trackingIntervalRef.current = setInterval(() => {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - lastUpdateRef.current.getTime()) / 1000);

      accumulatedSecondsRef.current += elapsedSeconds;
      lastUpdateRef.current = now;

      // Envoyer au serveur toutes les 30 secondes
      if (accumulatedSecondsRef.current >= 30) {
        const secondsToSend = accumulatedSecondsRef.current;
        accumulatedSecondsRef.current = 0;
        updateWatchTime(secondsToSend);
      }
    }, 10000); // Toutes les 10 secondes

    console.log('▶️ Live points tracking started');
  }, [isTracking, liveSessionId, user, initializeSession, updateWatchTime]);

  /**
   * Arrête le tracking automatique
   */
  const stopTracking = useCallback(async () => {
    if (!isTracking) return;

    // Envoyer les dernières secondes accumulées
    if (accumulatedSecondsRef.current > 0 && liveSessionId && user) {
      await updateWatchTime(accumulatedSecondsRef.current);
      accumulatedSecondsRef.current = 0;
    }

    // Arrêter l'intervalle
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    // Terminer la session
    if (liveSessionId && user) {
      try {
        const { data, error } = await supabase.rpc('end_live_viewing_session', {
          p_live_session_id: liveSessionId,
          p_viewer_id: user.id,
        });

        if (error) throw error;
        console.log('⏹️ Live viewing session ended:', data);
      } catch (error: any) {
        console.error('❌ Error ending session:', error);
      }
    }

    setIsTracking(false);
    console.log('⏸️ Live points tracking stopped');
  }, [isTracking, liveSessionId, user, updateWatchTime]);

  /**
   * Démarrage automatique si autoTrack est activé
   */
  useEffect(() => {
    if (autoTrack && liveSessionId && user && !isTracking) {
      startTracking();
    }

    // Cleanup au démontage
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [autoTrack, liveSessionId, user]);

  return {
    pointsEarned,
    isTracking,
    sessionId,
    startTracking,
    stopTracking,
    awardInteractionPoints,
    refreshPointsEarned,
  };
}
