import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ReputationData } from '@/components/SellerReputationBadge';
import { calculateReputation } from '@/lib/reputationSystem';

interface SellerReputationStats {
  sellerId: string;
  averageRating: number;
  totalReviews: number;
  totalVotes: number;
  positiveReviews: number;
  communicationRating: number;
  shippingSpeedRating: number;
  responseRate: number;
  completionRate: number;
}

/**
 * Hook pour récupérer et calculer la réputation d'un vendeur
 */
export function useSellerReputation(sellerId: string | null | undefined) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    fetchSellerReputation(sellerId);
  }, [sellerId]);

  const fetchSellerReputation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les statistiques de réputation
      const stats = await getSellerReputationStats(id);

      if (stats) {
        // Calculer la réputation
        const reputationData = calculateReputation({
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          totalVotes: stats.totalVotes,
          responseRate: stats.responseRate,
          completionRate: stats.completionRate,
          positiveReviews: stats.positiveReviews,
          communicationRating: stats.communicationRating,
          shippingSpeedRating: stats.shippingSpeedRating,
        });

        setReputation(reputationData);
      } else {
        // Vendeur sans avis - réputation par défaut
        setReputation({
          level: 'nouveau',
          averageRating: 0,
          totalReviews: 0,
          totalVotes: 0,
          score: 0,
          nextLevelScore: 20,
          progress: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching seller reputation:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (sellerId) {
      fetchSellerReputation(sellerId);
    }
  };

  return { reputation, loading, error, refresh };
}

/**
 * Récupère les statistiques de réputation d'un vendeur depuis la base de données
 */
async function getSellerReputationStats(
  sellerId: string
): Promise<SellerReputationStats | null> {
  try {
    // 1. Récupérer les avis du vendeur
    const { data: reviews, error: reviewsError } = await supabase
      .from('seller_reviews')
      .select('rating, communication_rating, shipping_speed_rating')
      .eq('seller_id', sellerId);

    if (reviewsError) throw reviewsError;

    // 2. Récupérer d'abord les IDs des produits du vendeur
    const { data: sellerProducts, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', sellerId);

    if (productsError) throw productsError;

    const productIds = (sellerProducts || []).map((p) => p.id);

    // 3. Récupérer les votes utiles sur les avis de produits du vendeur
    const { data: productReviews, error: productReviewsError } = productIds.length > 0
      ? await supabase
          .from('product_reviews')
          .select('helpful_count, product_id')
          .in('product_id', productIds)
      : { data: [], error: null };

    if (productReviewsError) throw productReviewsError;

    // 4. Récupérer les statistiques de commandes
    let orderStats = null;
    try {
      const { data, error: orderStatsError } = await supabase.rpc(
        'get_seller_order_stats',
        { seller_id_param: sellerId }
      );

      if (orderStatsError) {
        console.warn('Error fetching order stats:', orderStatsError);
        // Continuer sans les stats de commandes
      } else {
        orderStats = data;
      }
    } catch (err) {
      console.warn('RPC function not available yet, using defaults:', err);
      // La fonction RPC n'existe pas encore, utiliser des valeurs par défaut
    }

    // 4. Calculer les statistiques
    if (!reviews || reviews.length === 0) {
      return null; // Pas d'avis
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalRating / totalReviews;

    const positiveReviews = reviews.filter((r) => (r.rating || 0) >= 4).length;

    const communicationRatings = reviews.filter((r) => r.communication_rating !== null);
    const avgCommunicationRating =
      communicationRatings.length > 0
        ? communicationRatings.reduce((sum, r) => sum + (r.communication_rating || 0), 0) /
          communicationRatings.length
        : 0;

    const shippingRatings = reviews.filter((r) => r.shipping_speed_rating !== null);
    const avgShippingRating =
      shippingRatings.length > 0
        ? shippingRatings.reduce((sum, r) => sum + (r.shipping_speed_rating || 0), 0) /
          shippingRatings.length
        : 0;

    const totalVotes = productReviews
      ? productReviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0)
      : 0;

    // Stats de commandes (valeurs par défaut si non disponibles)
    const responseRate = orderStats?.response_rate ?? 75;
    const completionRate = orderStats?.completion_rate ?? 85;

    return {
      sellerId,
      averageRating,
      totalReviews,
      totalVotes,
      positiveReviews,
      communicationRating: avgCommunicationRating,
      shippingSpeedRating: avgShippingRating,
      responseRate,
      completionRate,
    };
  } catch (error) {
    console.error('Error in getSellerReputationStats:', error);
    throw error;
  }
}

/**
 * Hook pour récupérer la réputation du profil utilisateur actuel
 */
export function useMyReputation() {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyReputation();
  }, []);

  const fetchMyReputation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller, average_rating, total_reviews')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile?.is_seller) {
        // Pas un vendeur, ne pas afficher d'erreur
        setLoading(false);
        return;
      }

      // Récupérer les statistiques complètes
      const stats = await getSellerReputationStats(user.id);

      if (stats) {
        const reputationData = calculateReputation({
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          totalVotes: stats.totalVotes,
          responseRate: stats.responseRate,
          completionRate: stats.completionRate,
          positiveReviews: stats.positiveReviews,
          communicationRating: stats.communicationRating,
          shippingSpeedRating: stats.shippingSpeedRating,
        });

        setReputation(reputationData);
      } else {
        // Vendeur sans avis
        setReputation({
          level: 'nouveau',
          averageRating: 0,
          totalReviews: 0,
          totalVotes: 0,
          score: 0,
          nextLevelScore: 20,
          progress: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching my reputation:', err);
      // Ne pas définir d'erreur pour les utilisateurs non vendeurs
      if (err instanceof Error && !err.message.includes('vendeur')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchMyReputation();
  };

  return { reputation, loading, error, refresh };
}

/**
 * Hook pour récupérer les meilleurs vendeurs par réputation
 */
export function useTopSellersByReputation(limit: number = 10) {
  const [sellers, setSellers] = useState<Array<{ sellerId: string; reputation: ReputationData }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopSellers();
  }, [limit]);

  const fetchTopSellers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les vendeurs avec le plus d'avis et les meilleures notes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, average_rating, total_reviews')
        .eq('is_seller', true)
        .gte('total_reviews', 5) // Au moins 5 avis
        .gte('average_rating', 4.0) // Note minimale de 4.0
        .order('average_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(limit * 2); // Récupérer plus pour filtrer après calcul

      if (profilesError) throw profilesError;

      // Calculer la réputation pour chaque vendeur
      const sellersWithReputation = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const stats = await getSellerReputationStats(profile.id);
            if (!stats) return null;

            const reputation = calculateReputation({
              averageRating: stats.averageRating,
              totalReviews: stats.totalReviews,
              totalVotes: stats.totalVotes,
              responseRate: stats.responseRate,
              completionRate: stats.completionRate,
              positiveReviews: stats.positiveReviews,
            });

            return { sellerId: profile.id, reputation };
          } catch (err) {
            console.error(`Error calculating reputation for seller ${profile.id}:`, err);
            return null;
          }
        })
      );

      // Filtrer les null et trier par score
      const validSellers = sellersWithReputation
        .filter((s): s is { sellerId: string; reputation: ReputationData } => s !== null)
        .sort((a, b) => b.reputation.score - a.reputation.score)
        .slice(0, limit);

      setSellers(validSellers);
    } catch (err) {
      console.error('Error fetching top sellers:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return { sellers, loading, error, refresh: fetchTopSellers };
}
