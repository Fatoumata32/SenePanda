import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LoyaltyPoints,
  DailyStreak,
  DailyStreakResponse,
  Survey,
  SurveySubmissionResponse,
  CharitableCause,
  DonationResponse,
  MerchandiseItem,
  MerchandiseOrderResponse,
  RewardsCatalogItem,
  UserReward,
  ExtendedPointsTransaction,
} from '@/types/database';

/**
 * Hook personnalisé pour gérer le système complet de points bonus
 */
export function useBonusSystem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<LoyaltyPoints | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Récupérer l'utilisateur courant
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Récupérer les points de l'utilisateur
  const fetchUserPoints = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      // Si l'utilisateur n'a pas encore de points ou si la table n'existe pas
      if (error) {
        // Si c'est une erreur de table inexistante (42P01) ou autre erreur critique
        if (error.code === '42P01') {
          console.warn('La table loyalty_points n\'existe pas encore. Système de points désactivé.');
          setUserPoints(null);
          setError(null); // Pas d'erreur, juste pas de système de points
          return;
        }

        // Pour les autres erreurs
        console.error('Error fetching user points:', error);
        setError(error.message);
        return;
      }

      // Si aucune donnée, créer une entrée
      if (!data) {
        try {
          const { data: newData, error: insertError } = await supabase
            .from('loyalty_points')
            .insert({
              user_id: currentUser.id,
              total_points: 0,
              available_points: 0,
              lifetime_points: 0,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user points:', insertError);
            // Pas d'erreur critique, juste pas de points
            setUserPoints(null);
            setError(null);
            return;
          }

          setUserPoints(newData);
        } catch (createErr) {
          console.error('Could not create points:', createErr);
          setUserPoints(null);
          setError(null);
        }
        return;
      }

      setUserPoints(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching user points:', err);
      // Ne pas afficher l'erreur à l'utilisateur si le système de points n'est pas configuré
      setUserPoints(null);
      setError(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUserPoints();
    }
  }, [currentUser, fetchUserPoints]);

  return {
    loading,
    error,
    userPoints,
    currentUser,
    refreshPoints: fetchUserPoints,
  };
}

/**
 * Hook pour le système de daily streak
 */
export function useDailyStreak() {
  const { currentUser } = useBonusSystem();
  const [streak, setStreak] = useState<DailyStreak | null>(null);
  const [loading, setLoading] = useState(false);

  // Récupérer le streak de l'utilisateur
  const fetchStreak = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStreak(data);
    } catch (err: any) {
      console.error('Error fetching streak:', err);
    }
  }, [currentUser]);

  // Mettre à jour le streak quotidien
  const updateDailyStreak = useCallback(async (): Promise<DailyStreakResponse> => {
    if (!currentUser) {
      return {
        success: false,
        already_logged_today: false,
        current_streak: 0,
        points_earned: 0,
      };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_daily_streak', {
        p_user_id: currentUser.id,
      });

      if (error) throw error;

      // Rafraîchir le streak
      await fetchStreak();

      return data as DailyStreakResponse;
    } catch (err: any) {
      console.error('Error updating daily streak:', err);
      return {
        success: false,
        already_logged_today: false,
        current_streak: 0,
        points_earned: 0,
      };
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchStreak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    loading,
    updateDailyStreak,
    refreshStreak: fetchStreak,
  };
}

/**
 * Hook pour le système de sondages
 */
export function useSurveys() {
  const { currentUser } = useBonusSystem();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les sondages disponibles
  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (err: any) {
      console.error('Error fetching surveys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Soumettre une réponse à un sondage
  const submitSurvey = useCallback(
    async (surveyId: string, answers: Record<string, any>): Promise<SurveySubmissionResponse> => {
      if (!currentUser) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('submit_survey_response', {
          p_user_id: currentUser.id,
          p_survey_id: surveyId,
          p_answers: answers,
        });

        if (error) throw error;
        return data as SurveySubmissionResponse;
      } catch (err: any) {
        console.error('Error submitting survey:', err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  return {
    surveys,
    loading,
    submitSurvey,
    refreshSurveys: fetchSurveys,
  };
}

/**
 * Hook pour le système de dons caritatifs
 */
export function useCharitableCauses() {
  const { currentUser } = useBonusSystem();
  const [causes, setCauses] = useState<CharitableCause[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les causes actives
  const fetchCauses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('charitable_causes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCauses(data || []);
    } catch (err: any) {
      console.error('Error fetching causes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Faire un don à une cause
  const donate = useCallback(
    async (
      causeId: string,
      points: number,
      isAnonymous: boolean = false,
      message: string | null = null
    ): Promise<DonationResponse> => {
      if (!currentUser) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('donate_points_to_charity', {
          p_user_id: currentUser.id,
          p_cause_id: causeId,
          p_points: points,
          p_is_anonymous: isAnonymous,
          p_message: message,
        });

        if (error) throw error;
        return data as DonationResponse;
      } catch (err: any) {
        console.error('Error donating:', err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchCauses();
  }, [fetchCauses]);

  return {
    causes,
    loading,
    donate,
    refreshCauses: fetchCauses,
  };
}

/**
 * Hook pour le système de merchandising
 */
export function useMerchandise() {
  const { currentUser } = useBonusSystem();
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les articles de merchandising
  const fetchMerchandise = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('merchandise_catalog')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching merchandise:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Commander un article de merchandising
  const orderMerchandise = useCallback(
    async (
      merchandiseId: string,
      quantity: number,
      paymentMethod: 'points' | 'cash',
      shippingInfo: {
        name: string;
        phone: string;
        address: string;
        city: string;
        postal_code?: string;
      }
    ): Promise<MerchandiseOrderResponse> => {
      if (!currentUser) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('order_merchandise', {
          p_user_id: currentUser.id,
          p_merchandise_id: merchandiseId,
          p_quantity: quantity,
          p_payment_method: paymentMethod,
          p_shipping_info: shippingInfo,
        });

        if (error) throw error;
        return data as MerchandiseOrderResponse;
      } catch (err: any) {
        console.error('Error ordering merchandise:', err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchMerchandise();
  }, [fetchMerchandise]);

  return {
    items,
    loading,
    orderMerchandise,
    refreshMerchandise: fetchMerchandise,
  };
}

/**
 * Hook pour le catalogue de récompenses
 */
export function useRewards() {
  const { currentUser } = useBonusSystem();
  const [rewards, setRewards] = useState<RewardsCatalogItem[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer le catalogue de récompenses
  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (err: any) {
      console.error('Error fetching rewards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les récompenses de l'utilisateur
  const fetchUserRewards = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRewards(data || []);
    } catch (err: any) {
      console.error('Error fetching user rewards:', err);
    }
  }, [currentUser]);

  // Échanger des points contre une récompense
  const redeemReward = useCallback(
    async (rewardId: string) => {
      if (!currentUser) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('redeem_reward', {
          p_user_id: currentUser.id,
          p_reward_id: rewardId,
        });

        if (error) throw error;

        // Rafraîchir les récompenses de l'utilisateur
        await fetchUserRewards();

        return data;
      } catch (err: any) {
        console.error('Error redeeming reward:', err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [currentUser, fetchUserRewards]
  );

  useEffect(() => {
    fetchRewards();
    fetchUserRewards();
  }, [fetchRewards, fetchUserRewards]);

  return {
    rewards,
    userRewards,
    loading,
    redeemReward,
    refreshRewards: fetchRewards,
    refreshUserRewards: fetchUserRewards,
  };
}

/**
 * Hook pour l'historique des transactions de points
 */
export function usePointsHistory() {
  const { currentUser } = useBonusSystem();
  const [transactions, setTransactions] = useState<ExtendedPointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer l'historique des points
  const fetchHistory = useCallback(async (limit: number = 50) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching points history:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    transactions,
    loading,
    refreshHistory: fetchHistory,
  };
}
