/**
 * Payment service for mobile money and card payments
 * Supports: Orange Money, Wave, Free Money, Card, Bank Transfer
 */

import { supabase } from './supabase';

export type PaymentMethod =
  | 'orange_money'
  | 'wave'
  | 'free_money'
  | 'card'
  | 'bank_transfer';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentRequest {
  amount: number;
  currency: string;
  method: PaymentMethod;
  phoneNumber?: string;
  cardToken?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  message: string;
  redirectUrl?: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  color: string;
  icon: string;
  requiresPhone: boolean;
  requiresCard: boolean;
  processingTime: string;
  fees: number; // percentage
  minAmount: number;
  maxAmount: number;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    color: '#FF6600',
    icon: 'smartphone',
    requiresPhone: true,
    requiresCard: false,
    processingTime: 'Instantané',
    fees: 0,
    minAmount: 100,
    maxAmount: 2000000,
  },
  {
    id: 'wave',
    name: 'Wave',
    color: '#1DC8FF',
    icon: 'smartphone',
    requiresPhone: true,
    requiresCard: false,
    processingTime: 'Instantané',
    fees: 0,
    minAmount: 100,
    maxAmount: 5000000,
  },
  {
    id: 'free_money',
    name: 'Free Money',
    color: '#CD1126',
    icon: 'smartphone',
    requiresPhone: true,
    requiresCard: false,
    processingTime: 'Instantané',
    fees: 0,
    minAmount: 100,
    maxAmount: 1000000,
  },
  {
    id: 'card',
    name: 'Carte Bancaire',
    color: '#1E40AF',
    icon: 'credit-card',
    requiresPhone: false,
    requiresCard: true,
    processingTime: 'Instantané',
    fees: 2.5,
    minAmount: 500,
    maxAmount: 10000000,
  },
  {
    id: 'bank_transfer',
    name: 'Virement Bancaire',
    color: '#059669',
    icon: 'building-2',
    requiresPhone: false,
    requiresCard: false,
    processingTime: '1-3 jours',
    fees: 0,
    minAmount: 10000,
    maxAmount: 100000000,
  },
];

/**
 * Validate phone number for mobile money
 */
export function validatePhoneNumber(phone: string, method: PaymentMethod): boolean {
  const cleaned = phone.replace(/\D/g, '');

  // Senegalese phone patterns
  const patterns: Record<string, RegExp> = {
    orange_money: /^(77|78)\d{7}$/,
    wave: /^(70|76|77|78)\d{7}$/,
    free_money: /^76\d{7}$/,
  };

  const pattern = patterns[method];
  if (!pattern) return true;

  return pattern.test(cleaned) || pattern.test(cleaned.slice(-9));
}

/**
 * Format phone number for display
 */
export function formatPhoneForPayment(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const last9 = cleaned.slice(-9);
  return `+221 ${last9.slice(0, 2)} ${last9.slice(2, 5)} ${last9.slice(5, 7)} ${last9.slice(7)}`;
}

/**
 * Calculate fees for a payment
 */
export function calculateFees(amount: number, method: PaymentMethod): number {
  const methodInfo = PAYMENT_METHODS.find(m => m.id === method);
  if (!methodInfo) return 0;
  return Math.round(amount * (methodInfo.fees / 100));
}

/**
 * Get total amount including fees
 */
export function getTotalWithFees(amount: number, method: PaymentMethod): number {
  return amount + calculateFees(amount, method);
}

/**
 * Initiate a payment
 */
export async function initiatePayment(
  userId: string,
  request: PaymentRequest
): Promise<PaymentResult> {
  try {
    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        phone_number: request.phoneNumber,
        description: request.description,
        metadata: request.metadata,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate payment processing based on method
    // In production, this would integrate with actual payment APIs
    const result = await processPayment(payment.id, request);

    return result;
  } catch (error: any) {
    return {
      success: false,
      status: 'failed',
      message: error.message || 'Erreur lors du paiement',
    };
  }
}

/**
 * Process payment (mock implementation)
 * Replace with actual payment gateway integration
 */
async function processPayment(
  paymentId: string,
  request: PaymentRequest
): Promise<PaymentResult> {
  // Update status to processing
  await supabase
    .from('payments')
    .update({ status: 'processing' })
    .eq('id', paymentId);

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // For mobile money, would typically:
  // 1. Call provider API (Orange, Wave, etc.)
  // 2. Send USSD push to user's phone
  // 3. Wait for confirmation callback

  // Mock success (90% success rate for demo)
  const success = Math.random() > 0.1;

  const status: PaymentStatus = success ? 'completed' : 'failed';

  await supabase
    .from('payments')
    .update({
      status,
      completed_at: success ? new Date().toISOString() : null,
    })
    .eq('id', paymentId);

  // Create order if payment succeeded and metadata includes product info
  if (success && request.metadata?.product_id) {
    await createOrderFromPayment(paymentId, request);
  }

  return {
    success,
    transactionId: success ? paymentId : undefined,
    status,
    message: success
      ? 'Paiement effectué avec succès'
      : 'Le paiement a échoué. Veuillez réessayer.',
  };
}

/**
 * Create order from successful payment
 */
async function createOrderFromPayment(
  paymentId: string,
  request: PaymentRequest
): Promise<void> {
  try {
    const metadata = request.metadata || {};
    const quantity = metadata.quantity || 1;
    const unitPrice = metadata.unit_price || request.amount;
    const subtotal = unitPrice * quantity;

    // Get product details to find seller_id
    const { data: product } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', metadata.product_id)
      .single();

    if (!product) {
      console.error('Product not found for order creation');
      return;
    }

    // Get payment details for user_id
    const { data: payment } = await supabase
      .from('payments')
      .select('user_id')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      console.error('Payment not found for order creation');
      return;
    }

    // Calculate pricing
    const fees = request.amount - subtotal;
    const discountAmount = 0; // TODO: Calculate if discount was applied

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: payment.user_id,
        seller_id: product.seller_id,
        live_session_id: metadata.live_session_id || null,
        product_id: metadata.product_id,
        product_title: request.description.replace('Achat Live: ', ''),
        product_image: metadata.product_image || null,
        quantity,
        unit_price: unitPrice,
        subtotal,
        discount_amount: discountAmount,
        fees,
        total_amount: request.amount,
        currency: request.currency,
        payment_id: paymentId,
        payment_method: request.method,
        payment_status: 'completed',
        purchase_type: metadata.purchase_type || 'live_shopping',
        status: 'confirmed',
        metadata: {
          ...metadata,
          payment_description: request.description,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }

    console.log('✅ Order created successfully:', order.order_number);

    // TODO: Send notification to seller
    // TODO: Send confirmation email/SMS to buyer
  } catch (error) {
    console.error('Error in createOrderFromPayment:', error);
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  const { data, error } = await supabase
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .single();

  if (error || !data) return 'failed';
  return data.status as PaymentStatus;
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Subscribe to a plan
 */
export async function subscribeToPlan(
  userId: string,
  planId: string,
  paymentMethod: PaymentMethod,
  phoneNumber?: string,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<PaymentResult> {
  try {
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return {
        success: false,
        status: 'failed',
        message: 'Plan non trouvé',
      };
    }

    // Calculate amount based on billing period
    const amount = billingPeriod === 'yearly'
      ? (plan.price_yearly || plan.price_monthly * 10)
      : plan.price_monthly;

    // Initiate payment
    const paymentResult = await initiatePayment(userId, {
      amount,
      currency: plan.currency,
      method: paymentMethod,
      phoneNumber,
      description: `Abonnement ${plan.name} (${billingPeriod === 'yearly' ? 'Annuel' : 'Mensuel'})`,
      metadata: {
        plan_id: planId,
        plan_type: plan.plan_type,
        billing_period: billingPeriod,
      },
    });

    if (paymentResult.success) {
      // Update user's subscription
      const expiresAt = new Date();
      if (billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await supabase
        .from('profiles')
        .update({
          subscription_plan: plan.plan_type,
          subscription_expires_at: expiresAt.toISOString(),
          is_premium: plan.plan_type !== 'free',
          commission_rate: plan.commission_rate,
        })
        .eq('id', userId);

      // Create subscription record
      await supabase
        .from('seller_subscriptions')
        .insert({
          seller_id: userId,
          plan_id: planId,
          plan_type: plan.plan_type,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
        });
    }

    return paymentResult;
  } catch (error: any) {
    return {
      success: false,
      status: 'failed',
      message: error.message || 'Erreur lors de l\'abonnement',
    };
  }
}

export default {
  PAYMENT_METHODS,
  validatePhoneNumber,
  formatPhoneForPayment,
  calculateFees,
  getTotalWithFees,
  initiatePayment,
  checkPaymentStatus,
  getPaymentHistory,
  subscribeToPlan,
};
