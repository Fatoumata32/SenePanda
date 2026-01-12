import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points_reward: number;
  current_progress: number;
  required_progress: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  percentage: number;
}

export interface AchievementsSummary {
  total_achievements: number;
  unlocked_achievements: number;
  total_points_earned: number;
  completion_percentage: number;
  achievements: Achievement[];
}

/**
 * Hook pour gérer les achievements et badges
 */
export function useAchievements() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AchievementsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge le résumé complet des achievements
   */
  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc(
        'get_user_achievements_summary',
        { p_user_id: user.id }
      );

      if (fetchError) throw fetchError;

      setSummary(data as AchievementsSummary);
    } catch (err: any) {
      console.error('❌ Error fetching achievements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Met à jour la progression d'un achievement
   * @param achievementCode Code unique de l'achievement
   * @param increment Nombre à ajouter à la progression (default 1)
   * @returns Données sur le déblocage si achievement débloqué
   */
  const updateProgress = useCallback(
    async (achievementCode: string, increment: number = 1) => {
      if (!user) {
        console.warn('❌ No user logged in');
        return null;
      }

      try {
        const { data, error: updateError } = await supabase.rpc(
          'update_achievement_progress',
          {
            p_user_id: user.id,
            p_achievement_code: achievementCode,
            p_increment: increment,
          }
        );

        if (updateError) throw updateError;

        // Rafraîchir les achievements
        await fetchAchievements();

        // Si débloqué, retourner les infos pour afficher une notification
        if (data.newly_unlocked) {
          console.log(`🎉 Achievement unlocked: ${data.achievement_name} (+${data.points_reward} pts)`);
          return {
            name: data.achievement_name,
            code: data.achievement_code,
            pointsReward: data.points_reward,
          };
        }

        return null;
      } catch (err: any) {
        console.error('❌ Error updating achievement:', err);
        return null;
      }
    },
    [user, fetchAchievements]
  );

  /**
   * Helpers pour mettre à jour des achievements spécifiques
   */
  const trackPurchase = useCallback(
    async (amount: number) => {
      await updateProgress('first_purchase');
      await updateProgress('shopping_spree');
      await updateProgress('cart_master');

      // Big spender basé sur le montant
      if (amount >= 100000) {
        await updateProgress('big_spender');
      }
    },
    [updateProgress]
  );

  const trackLiveView = useCallback(async () => {
    await updateProgress('first_live_viewer');
    await updateProgress('live_fan');
    await updateProgress('live_addict');
    await updateProgress('live_vip');
  }, [updateProgress]);

  const trackLivePurchase = useCallback(async () => {
    await updateProgress('live_buyer');
  }, [updateProgress]);

  const trackChatMessage = useCallback(async () => {
    await updateProgress('chat_master');
  }, [updateProgress]);

  const trackEarlyBird = useCallback(async () => {
    await updateProgress('early_bird');
  }, [updateProgress]);

  const trackReferral = useCallback(async () => {
    await updateProgress('first_referral');
    await updateProgress('influencer');
    await updateProgress('ambassador');
  }, [updateProgress]);

  const trackReview = useCallback(async () => {
    await updateProgress('review_master');
  }, [updateProgress]);

  const trackLogin = useCallback(async () => {
    await updateProgress('first_login');
  }, [updateProgress]);

  const trackStreak = useCallback(async (streakDays: number) => {
    if (streakDays >= 7) {
      await updateProgress('week_streak');
    }
    if (streakDays >= 30) {
      await updateProgress('month_streak');
    }
  }, [updateProgress]);

  const trackPoints = useCallback(async (totalPoints: number) => {
    if (totalPoints >= 10000) {
      await updateProgress('points_collector');
    }
    if (totalPoints >= 50000) {
      await updateProgress('points_king');
    }
  }, [updateProgress]);

  /**
   * Récupère les achievements par catégorie
   */
  const getAchievementsByCategory = useCallback(
    (category: string) => {
      if (!summary) return [];
      return summary.achievements.filter((a) => a.category === category);
    },
    [summary]
  );

  /**
   * Récupère les achievements débloqués
   */
  const getUnlockedAchievements = useCallback(() => {
    if (!summary) return [];
    return summary.achievements.filter((a) => a.is_unlocked);
  }, [summary]);

  /**
   * Récupère les achievements en cours
   */
  const getInProgressAchievements = useCallback(() => {
    if (!summary) return [];
    return summary.achievements.filter(
      (a) => !a.is_unlocked && a.current_progress > 0
    );
  }, [summary]);

  /**
   * Récupère les achievements verrouillés
   */
  const getLockedAchievements = useCallback(() => {
    if (!summary) return [];
    return summary.achievements.filter(
      (a) => !a.is_unlocked && a.current_progress === 0
    );
  }, [summary]);

  // Charger les achievements au montage
  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user, fetchAchievements]);

  return {
    // État
    summary,
    loading,
    error,

    // Actions
    refresh: fetchAchievements,
    updateProgress,

    // Helpers de tracking
    trackPurchase,
    trackLiveView,
    trackLivePurchase,
    trackChatMessage,
    trackEarlyBird,
    trackReferral,
    trackReview,
    trackLogin,
    trackStreak,
    trackPoints,

    // Filtres
    getAchievementsByCategory,
    getUnlockedAchievements,
    getInProgressAchievements,
    getLockedAchievements,
  };
}
