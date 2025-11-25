import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { analytics } from '@/lib/analytics';
import { useAuth } from '@/providers/AuthProvider';

export function useAnalytics() {
  const { user } = useAuth();

  // Initialize analytics and set user ID
  useEffect(() => {
    analytics.init();
  }, []);

  // Update user ID when auth changes
  useEffect(() => {
    analytics.setUserId(user?.id || null);
  }, [user?.id]);

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        analytics.trackAppOpen();
      } else if (nextAppState === 'background') {
        analytics.trackAppBackground();
        analytics.flush(); // Flush events when app goes to background
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Wrapped tracking methods
  const trackScreen = useCallback((screenName: string) => {
    analytics.trackScreenView(screenName);
  }, []);

  const trackProduct = useCallback((productId: string, productName: string) => {
    analytics.trackProductView(productId, productName);
  }, []);

  const trackAddToCart = useCallback((productId: string, quantity: number, price: number) => {
    analytics.trackAddToCart(productId, quantity, price);
  }, []);

  const trackRemoveFromCart = useCallback((productId: string) => {
    analytics.trackRemoveFromCart(productId);
  }, []);

  const trackPurchase = useCallback((orderId: string, total: number, items: number) => {
    analytics.trackPurchase(orderId, total, items);
  }, []);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    analytics.trackSearch(query, resultsCount);
  }, []);

  const trackFavorite = useCallback((productId: string, action: 'add' | 'remove') => {
    analytics.trackFavorite(productId, action);
  }, []);

  const trackCategory = useCallback((categoryId: string, categoryName: string) => {
    analytics.trackCategoryView(categoryId, categoryName);
  }, []);

  const trackShop = useCallback((shopId: string, shopName: string) => {
    analytics.trackShopView(shopId, shopName);
  }, []);

  const trackSubscription = useCallback((
    planType: string,
    billingPeriod: 'monthly' | 'yearly',
    action: 'start' | 'renew' | 'cancel'
  ) => {
    analytics.trackSubscription(planType, billingPeriod, action);
  }, []);

  const trackPayment = useCallback((method: string, amount: number, status: 'success' | 'failed') => {
    analytics.trackPayment(method, amount, status);
  }, []);

  const trackReview = useCallback((productId: string, rating: number) => {
    analytics.trackReview(productId, rating);
  }, []);

  const trackMessage = useCallback((conversationId: string, recipientId: string) => {
    analytics.trackMessage(conversationId, recipientId);
  }, []);

  const trackReferral = useCallback((code: string, action: 'share' | 'use') => {
    analytics.trackReferral(code, action);
  }, []);

  const trackRewardClaim = useCallback((rewardId: string, pointsCost: number) => {
    analytics.trackRewardClaim(rewardId, pointsCost);
  }, []);

  const trackShare = useCallback((contentType: string, contentId: string) => {
    analytics.trackShare(contentType, contentId);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string) => {
    analytics.trackError(errorType, errorMessage);
  }, []);

  const trackOnboarding = useCallback((step: string, completed: boolean) => {
    analytics.trackOnboarding(step, completed);
  }, []);

  const trackNotification = useCallback((type: string, action: 'received' | 'opened' | 'dismissed') => {
    analytics.trackNotification(type, action);
  }, []);

  const trackFunnelStep = useCallback((funnelName: string, step: number, stepName: string) => {
    analytics.trackFunnelStep(funnelName, step, stepName);
  }, []);

  const trackCustomEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, properties);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    analytics.setUserProperties(properties);
  }, []);

  const flush = useCallback(() => {
    analytics.flush();
  }, []);

  return {
    trackScreen,
    trackProduct,
    trackAddToCart,
    trackRemoveFromCart,
    trackPurchase,
    trackSearch,
    trackFavorite,
    trackCategory,
    trackShop,
    trackSubscription,
    trackPayment,
    trackReview,
    trackMessage,
    trackReferral,
    trackRewardClaim,
    trackShare,
    trackError,
    trackOnboarding,
    trackNotification,
    trackFunnelStep,
    trackCustomEvent,
    setUserProperties,
    flush,
  };
}

export default useAnalytics;
