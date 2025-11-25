import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const ANALYTICS_QUEUE_KEY = '@senepanda_analytics_queue';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    // Load queued events
    try {
      const saved = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading analytics queue:', error);
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
    }

    this.isInitialized = true;

    // Flush queue if we have events
    if (this.queue.length > 0) {
      this.flush();
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    this.queue.push(event);
    this.saveQueue();

    // Auto-flush if queue is getting large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // Common events
  trackScreenView(screenName: string) {
    this.track('screen_view', { screen_name: screenName });
  }

  trackProductView(productId: string, productName: string) {
    this.track('product_view', { product_id: productId, product_name: productName });
  }

  trackAddToCart(productId: string, quantity: number, price: number) {
    this.track('add_to_cart', { product_id: productId, quantity, price });
  }

  trackRemoveFromCart(productId: string) {
    this.track('remove_from_cart', { product_id: productId });
  }

  trackPurchase(orderId: string, total: number, items: number) {
    this.track('purchase', { order_id: orderId, total, items });
  }

  trackSearch(query: string, resultsCount: number) {
    this.track('search', { query, results_count: resultsCount });
  }

  trackSignUp(method: string) {
    this.track('sign_up', { method });
  }

  trackLogin(method: string) {
    this.track('login', { method });
  }

  trackShare(contentType: string, contentId: string) {
    this.track('share', { content_type: contentType, content_id: contentId });
  }

  trackError(errorType: string, errorMessage: string) {
    this.track('error', { error_type: errorType, error_message: errorMessage });
  }

  // Additional tracking methods
  trackFavorite(productId: string, action: 'add' | 'remove') {
    this.track('favorite', { product_id: productId, action });
  }

  trackCategoryView(categoryId: string, categoryName: string) {
    this.track('category_view', { category_id: categoryId, category_name: categoryName });
  }

  trackShopView(shopId: string, shopName: string) {
    this.track('shop_view', { shop_id: shopId, shop_name: shopName });
  }

  trackSubscription(planType: string, billingPeriod: 'monthly' | 'yearly', action: 'start' | 'renew' | 'cancel') {
    this.track('subscription', { plan_type: planType, billing_period: billingPeriod, action });
  }

  trackPayment(method: string, amount: number, status: 'success' | 'failed') {
    this.track('payment', { method, amount, status });
  }

  trackReview(productId: string, rating: number) {
    this.track('review', { product_id: productId, rating });
  }

  trackMessage(conversationId: string, recipientId: string) {
    this.track('message_sent', { conversation_id: conversationId, recipient_id: recipientId });
  }

  trackReferral(code: string, action: 'share' | 'use') {
    this.track('referral', { code, action });
  }

  trackRewardClaim(rewardId: string, pointsCost: number) {
    this.track('reward_claim', { reward_id: rewardId, points_cost: pointsCost });
  }

  trackOnboarding(step: string, completed: boolean) {
    this.track('onboarding', { step, completed });
  }

  trackNotification(type: string, action: 'received' | 'opened' | 'dismissed') {
    this.track('notification', { type, action });
  }

  trackAppOpen() {
    this.track('app_open', { timestamp: new Date().toISOString() });
  }

  trackAppBackground() {
    this.track('app_background', { timestamp: new Date().toISOString() });
  }

  // User properties
  setUserProperties(properties: Record<string, any>) {
    this.track('user_properties', properties);
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, unit: string) {
    this.track('performance', { metric, value, unit });
  }

  // Funnel tracking
  trackFunnelStep(funnelName: string, step: number, stepName: string) {
    this.track('funnel_step', { funnel: funnelName, step, step_name: stepName });
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving analytics queue:', error);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];
    await this.saveQueue();

    try {
      // Send events to your analytics backend
      // For now, we'll save them to Supabase
      const { error } = await supabase
        .from('analytics_events')
        .insert(
          events.map(event => ({
            event_name: event.name,
            properties: event.properties,
            user_id: event.userId,
            created_at: new Date(event.timestamp).toISOString(),
          }))
        );

      if (error) {
        // Put events back in queue if failed
        this.queue = [...events, ...this.queue];
        await this.saveQueue();
        console.error('Error flushing analytics:', error);
      }
    } catch (error) {
      // Put events back in queue if failed
      this.queue = [...events, ...this.queue];
      await this.saveQueue();
      console.error('Error flushing analytics:', error);
    }
  }
}

export const analytics = new Analytics();
