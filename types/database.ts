export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_seller: boolean;
  is_premium: boolean;
  shop_name: string | null;
  shop_description: string | null;
  shop_logo_url: string | null;
  shop_banner_url: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  // Social media links for sellers
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  average_rating: number;
  total_reviews: number;
  verified_seller: boolean;
  seller_badge: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_points: number;
  available_points: number;
  commission_rate: number;
  // Referral & rewards
  referral_code: string | null;
  total_referrals: number;
  referral_points: number;
  panda_coins: number;
  followers_count: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  images: string[] | null;
  stock: number;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
};

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
};

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type SellerReview = {
  id: string;
  seller_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  communication_rating: number | null;
  shipping_speed_rating: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type ReviewHelpfulVote = {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
};

// Loyalty & Rewards System Types
export type LoyaltyPoints = {
  id: string;
  user_id: string;
  points: number;
  total_earned: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  level_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type PointsTransaction = {
  id: string;
  user_id: string;
  points: number;
  type: 'purchase' | 'review' | 'referral' | 'redemption' | 'bonus' | 'welcome';
  description: string | null;
  reference_id: string | null;
  created_at: string;
};

export type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  reward_type: 'discount' | 'free_shipping' | 'voucher';
  reward_value: number | null;
  min_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  is_active: boolean;
  stock: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClaimedReward = {
  id: string;
  user_id: string;
  reward_id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  order_id: string | null;
  expires_at: string | null;
  created_at: string;
  reward?: Reward;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'completed';
  referrer_points: number;
  referred_points: number;
  completed_at: string | null;
  created_at: string;
};

export type SellerBadge = {
  id: string;
  seller_id: string;
  badge_type: 'verified' | 'top_seller' | 'fast_shipping' | 'quality';
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned_at: string;
  expires_at: string | null;
  is_active: boolean;
};

// Subscription System Types
export type SubscriptionPlanType = 'free' | 'starter' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export type SubscriptionPlan = {
  id: string;
  plan_type: SubscriptionPlanType;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;

  // Commercial advantages
  commission_rate: number;
  max_products: number;

  // Visibility advantages
  visibility_boost: number;
  featured_rotation_hours: number | null;
  homepage_spots: number;
  priority_in_search: number;

  // Media features
  hd_photos: boolean;
  video_allowed: boolean;
  photo_360_allowed: boolean;
  max_photos_per_product: number;

  // Badges and certifications
  badge_name: string | null;
  verified_badge: boolean;

  // Support and services
  support_level: string | null;
  advanced_analytics: boolean;
  ai_analytics: boolean;
  sponsored_campaigns: boolean;

  // Metadata
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SellerSubscription = {
  id: string;
  seller_id: string;
  plan_id: string;
  plan_type: SubscriptionPlanType;

  // Subscription information
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;

  // Billing
  amount_paid: number | null;
  currency: string;
  payment_method: string | null;
  transaction_id: string | null;

  // Auto renewal
  auto_renew: boolean;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  plan?: SubscriptionPlan;
};

export type FeaturedProductRotation = {
  id: string;
  product_id: string;
  seller_id: string;
  plan_type: SubscriptionPlanType;

  // Rotation slot
  rotation_slot: number;
  priority: number;

  // Display period
  start_time: string;
  end_time: string;

  // Statistics
  views_count: number;
  clicks_count: number;

  created_at: string;

  // Relations
  product?: Product;
};

export type SubscriptionHistory = {
  id: string;
  seller_id: string;
  plan_type: SubscriptionPlanType;
  action: 'activated' | 'renewed' | 'cancelled' | 'expired' | 'upgraded' | 'downgraded';
  old_plan_type: SubscriptionPlanType | null;
  new_plan_type: SubscriptionPlanType | null;
  amount_paid: number | null;
  currency: string;
  created_at: string;
};

export type SellerPlanBenefits = {
  plan_type: SubscriptionPlanType;
  commission_rate: number;
  max_products: number;
  current_products: number;
  visibility_boost: number;
  can_add_more_products: boolean;
};

// Chat System Types
export type ConversationStatus = 'active' | 'archived' | 'blocked';
export type MessageType = 'text' | 'image' | 'system';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  status: ConversationStatus;
  last_message_at: string;
  last_message_preview: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  image_url: string | null;
  is_read: boolean;
  read_at: string | null;
  offer_price: number | null;
  offer_status: OfferStatus | null;
  created_at: string;
  updated_at: string;
};

export type UserPresence = {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  device_token: string | null;
  updated_at: string;
};

export type QuickReply = {
  id: string;
  seller_id: string;
  message: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

// Flash Deals System Types
export type DealStatus = 'scheduled' | 'active' | 'expired' | 'cancelled';
export type DealType = 'flash_sale' | 'daily_deal' | 'weekend_special' | 'seasonal';

export type FlashDeal = {
  id: string;
  product_id: string;
  seller_id: string;
  deal_type: DealType;
  status: DealStatus;
  original_price: number;
  deal_price: number;
  discount_percentage: number;
  starts_at: string;
  ends_at: string;
  total_stock: number;
  claimed_count: number;
  remaining_stock: number;
  is_featured: boolean;
  priority_order: number;
  badge_text: string;
  badge_color: string;
  views_count: number;
  clicks_count: number;
  created_at: string;
  updated_at: string;
};

export type DealClaim = {
  id: string;
  deal_id: string;
  user_id: string;
  product_id: string | null;
  claimed_price: number;
  quantity: number;
  is_purchased: boolean;
  purchased_at: string | null;
  order_id: string | null;
  expires_at: string;
  created_at: string;
};

export type DealNotification = {
  id: string;
  deal_id: string;
  user_id: string;
  notification_type: 'deal_starting' | 'deal_ending' | 'stock_low';
  is_sent: boolean;
  sent_at: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type DealHistory = {
  id: string;
  deal_id: string | null;
  product_id: string | null;
  seller_id: string | null;
  original_price: number | null;
  deal_price: number | null;
  total_stock: number | null;
  claimed_count: number | null;
  purchased_count: number | null;
  total_revenue: number | null;
  conversion_rate: number | null;
  sell_through_rate: number | null;
  started_at: string | null;
  ended_at: string | null;
  duration_hours: number | null;
  created_at: string;
};

// Blocked Users System Types
export type BlockedUser = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
};

// ========================================
// SYSTÈME COMPLET DE POINTS BONUS
// ========================================

// Daily Streak Types
export type DailyStreak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string;
  total_logins: number;
  created_at: string;
  updated_at: string;
};

// Survey Types
export type SurveyQuestion = {
  id: number;
  type: 'rating' | 'multiple_choice' | 'text' | 'yes_no';
  question: string;
  options?: string[];
  required: boolean;
};

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  questions: SurveyQuestion[];
  points_reward: number;
  category: 'feedback' | 'product' | 'service' | 'general';
  target_audience: string[];
  min_level: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  max_responses: number | null;
  current_responses: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SurveyResponse = {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, any>;
  points_earned: number;
  completed_at: string;
};

// Seller of Month Types
export type SellerOfMonth = {
  id: string;
  seller_id: string;
  month: number;
  year: number;
  total_sales: number;
  total_orders: number;
  average_rating: number;
  positive_reviews_count: number;
  response_time_hours: number | null;
  reward_points: number;
  reward_description: string | null;
  badge_url: string | null;
  is_awarded: boolean;
  awarded_at: string | null;
  created_at: string;
};

export type SellerMonthlyStats = {
  id: string;
  seller_id: string;
  month: number;
  year: number;
  total_sales: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_rating: number;
  total_reviews: number;
  positive_reviews: number;
  negative_reviews: number;
  average_response_time_hours: number | null;
  average_shipping_time_days: number | null;
  performance_score: number;
  created_at: string;
  updated_at: string;
};

// Merchandising Types
export type MerchandiseCategory = 't-shirt' | 'cap' | 'mug' | 'sticker' | 'bag';

export type MerchandiseItem = {
  id: string;
  name: string;
  description: string | null;
  category: MerchandiseCategory;
  size: string | null;
  color: string | null;
  image_url: string | null;
  images: string[] | null;
  price_points: number | null;
  price_cash: number | null;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type MerchandiseOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'points' | 'cash' | 'mixed';

export type MerchandiseOrder = {
  id: string;
  user_id: string;
  merchandise_id: string;
  quantity: number;
  payment_method: PaymentMethod;
  points_used: number;
  cash_paid: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string | null;
  status: MerchandiseOrderStatus;
  tracking_number: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  merchandise?: MerchandiseItem;
};

// Charitable Types
export type CharitableCauseCategory = 'education' | 'health' | 'environment' | 'poverty' | 'animals';

export type CharitableCause = {
  id: string;
  name: string;
  description: string;
  organization: string;
  category: CharitableCauseCategory;
  goal_amount: number | null;
  current_amount: number;
  image_url: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CharitableDonation = {
  id: string;
  user_id: string;
  cause_id: string;
  points_donated: number;
  amount_converted: number;
  is_anonymous: boolean;
  message: string | null;
  created_at: string;
  cause?: CharitableCause;
};

// Extended Points Transaction Types
export type PointsTransactionType =
  | 'purchase'
  | 'review'
  | 'referral'
  | 'redemption'
  | 'bonus'
  | 'welcome'
  | 'daily_streak'
  | 'survey'
  | 'seller_of_month'
  | 'merchandise'
  | 'charity';

export type ExtendedPointsTransaction = {
  id: string;
  user_id: string;
  points: number;
  type: PointsTransactionType;
  description: string | null;
  reference_id: string | null;
  created_at: string;
};

// Rewards Catalog Types (Extended)
export type RewardCategory = 'discount' | 'boost' | 'premium' | 'gift';

export type RewardsCatalogItem = {
  id: string;
  title: string;
  description: string | null;
  category: RewardCategory;
  points_cost: number;
  value: number | null;
  duration_days: number | null;
  icon: string | null;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
};

export type UserReward = {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: 'active' | 'used' | 'expired';
  expires_at: string | null;
  used_at: string | null;
  order_id: string | null;
  created_at: string;
  reward?: RewardsCatalogItem;
};

// API Response Types
export type WelcomeBonusResponse = {
  success: boolean;
  error?: string;
  points_earned?: number;
  message?: string;
};

export type DailyStreakResponse = {
  success: boolean;
  already_logged_today: boolean;
  current_streak: number;
  longest_streak?: number;
  points_earned: number;
  total_logins?: number;
};

export type SurveySubmissionResponse = {
  success: boolean;
  error?: string;
  points_earned?: number;
  message?: string;
};

export type DonationResponse = {
  success: boolean;
  error?: string;
  points_donated?: number;
  amount_converted?: number;
  cause_name?: string;
  remaining_points?: number;
  message?: string;
};

export type MerchandiseOrderResponse = {
  success: boolean;
  error?: string;
  order_id?: string;
  points_used?: number;
  cash_paid?: number;
  message?: string;
  available_stock?: number;
  required?: number;
  available?: number;
};
