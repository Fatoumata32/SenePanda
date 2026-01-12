import { useCallback } from 'react';
import { useFirebase } from '../providers/FirebaseProvider';

/**
 * Hook pour utiliser Firebase Analytics facilement
 *
 * @example
 * const analytics = useFirebaseAnalytics();
 *
 * // Logger une vue de produit
 * analytics.trackProductView('product123', 'T-Shirt', 25000);
 *
 * // Logger un ajout au panier
 * analytics.trackAddToCart('product123', 25000, 2);
 *
 * // Logger un achat
 * analytics.trackPurchase('order123', 50000, 'wave');
 */
export function useFirebaseAnalytics() {
  const { logEvent, logScreenView, setUserProperties } = useFirebase();

  // E-commerce Events

  const trackProductView = useCallback(
    async (productId: string, productName: string, price: number, category?: string) => {
      await logEvent('view_item', {
        item_id: productId,
        item_name: productName,
        price,
        currency: 'XOF',
        item_category: category,
      });
    },
    [logEvent]
  );

  const trackAddToCart = useCallback(
    async (productId: string, productName: string, price: number, quantity: number) => {
      await logEvent('add_to_cart', {
        item_id: productId,
        item_name: productName,
        price,
        quantity,
        currency: 'XOF',
      });
    },
    [logEvent]
  );

  const trackRemoveFromCart = useCallback(
    async (productId: string, productName: string) => {
      await logEvent('remove_from_cart', {
        item_id: productId,
        item_name: productName,
      });
    },
    [logEvent]
  );

  const trackBeginCheckout = useCallback(
    async (totalAmount: number, itemCount: number) => {
      await logEvent('begin_checkout', {
        value: totalAmount,
        currency: 'XOF',
        items: itemCount,
      });
    },
    [logEvent]
  );

  const trackPurchase = useCallback(
    async (
      orderId: string,
      totalAmount: number,
      paymentMethod: string,
      itemCount: number
    ) => {
      await logEvent('purchase', {
        transaction_id: orderId,
        value: totalAmount,
        currency: 'XOF',
        payment_type: paymentMethod,
        items: itemCount,
      });
    },
    [logEvent]
  );

  // Live Shopping Events

  const trackLiveJoin = useCallback(
    async (liveSessionId: string, sellerName: string) => {
      await logEvent('live_join', {
        live_session_id: liveSessionId,
        seller_name: sellerName,
      });
    },
    [logEvent]
  );

  const trackLiveLeave = useCallback(
    async (liveSessionId: string, watchDuration: number) => {
      await logEvent('live_leave', {
        live_session_id: liveSessionId,
        watch_duration_seconds: watchDuration,
      });
    },
    [logEvent]
  );

  const trackLiveChatMessage = useCallback(
    async (liveSessionId: string) => {
      await logEvent('live_chat_message', {
        live_session_id: liveSessionId,
      });
    },
    [logEvent]
  );

  const trackLiveReaction = useCallback(
    async (liveSessionId: string, reactionType: string) => {
      await logEvent('live_reaction', {
        live_session_id: liveSessionId,
        reaction_type: reactionType,
      });
    },
    [logEvent]
  );

  const trackLivePurchase = useCallback(
    async (liveSessionId: string, productId: string, amount: number) => {
      await logEvent('live_purchase', {
        live_session_id: liveSessionId,
        product_id: productId,
        value: amount,
        currency: 'XOF',
      });
    },
    [logEvent]
  );

  // User Engagement Events

  const trackSearch = useCallback(
    async (searchTerm: string, resultCount: number) => {
      await logEvent('search', {
        search_term: searchTerm,
        results_count: resultCount,
      });
    },
    [logEvent]
  );

  const trackShare = useCallback(
    async (contentType: string, contentId: string) => {
      await logEvent('share', {
        content_type: contentType,
        item_id: contentId,
      });
    },
    [logEvent]
  );

  const trackLogin = useCallback(
    async (method: 'email' | 'phone' | 'pin') => {
      await logEvent('login', {
        method,
      });
    },
    [logEvent]
  );

  const trackSignUp = useCallback(
    async (method: 'email' | 'phone') => {
      await logEvent('sign_up', {
        method,
      });
    },
    [logEvent]
  );

  // Loyalty & Rewards Events

  const trackCoinsEarned = useCallback(
    async (amount: number, reason: string) => {
      await logEvent('coins_earned', {
        value: amount,
        reason,
      });
    },
    [logEvent]
  );

  const trackCoinsSpent = useCallback(
    async (amount: number, reason: string) => {
      await logEvent('coins_spent', {
        value: amount,
        reason,
      });
    },
    [logEvent]
  );

  const trackRewardClaimed = useCallback(
    async (rewardId: string, rewardName: string, coinsCost: number) => {
      await logEvent('reward_claimed', {
        reward_id: rewardId,
        reward_name: rewardName,
        coins_cost: coinsCost,
      });
    },
    [logEvent]
  );

  const trackBadgeUnlocked = useCallback(
    async (badgeId: string, badgeName: string) => {
      await logEvent('badge_unlocked', {
        badge_id: badgeId,
        badge_name: badgeName,
      });
    },
    [logEvent]
  );

  // Seller Events

  const trackProductCreated = useCallback(
    async (productId: string, price: number, category: string) => {
      await logEvent('product_created', {
        product_id: productId,
        price,
        currency: 'XOF',
        category,
      });
    },
    [logEvent]
  );

  const trackLiveStarted = useCallback(
    async (liveSessionId: string) => {
      await logEvent('live_started', {
        live_session_id: liveSessionId,
      });
    },
    [logEvent]
  );

  const trackLiveEnded = useCallback(
    async (liveSessionId: string, duration: number, totalViewers: number) => {
      await logEvent('live_ended', {
        live_session_id: liveSessionId,
        duration_seconds: duration,
        total_viewers: totalViewers,
      });
    },
    [logEvent]
  );

  const trackSubscriptionUpgrade = useCallback(
    async (newPlan: string, price: number) => {
      await logEvent('subscription_upgrade', {
        plan: newPlan,
        price,
        currency: 'XOF',
      });
    },
    [logEvent]
  );

  // Screen Tracking

  const trackScreen = useCallback(
    async (screenName: string) => {
      await logScreenView(screenName);
    },
    [logScreenView]
  );

  // User Properties

  const setUserProfile = useCallback(
    async (userId: string, isSeller: boolean, subscriptionPlan?: string) => {
      await setUserProperties({
        user_id: userId,
        is_seller: isSeller,
        subscription_plan: subscriptionPlan || 'free',
      });
    },
    [setUserProperties]
  );

  return {
    // E-commerce
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackPurchase,

    // Live Shopping
    trackLiveJoin,
    trackLiveLeave,
    trackLiveChatMessage,
    trackLiveReaction,
    trackLivePurchase,

    // User Engagement
    trackSearch,
    trackShare,
    trackLogin,
    trackSignUp,

    // Loyalty & Rewards
    trackCoinsEarned,
    trackCoinsSpent,
    trackRewardClaimed,
    trackBadgeUnlocked,

    // Seller
    trackProductCreated,
    trackLiveStarted,
    trackLiveEnded,
    trackSubscriptionUpgrade,

    // Screen Tracking
    trackScreen,

    // User Properties
    setUserProfile,
  };
}
