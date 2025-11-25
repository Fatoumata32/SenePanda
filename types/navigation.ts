/**
 * Type-safe navigation routes for Expo Router
 * This file provides proper typing for router.push, router.replace, etc.
 */

// Tab routes
export type TabRoutes =
  | '/(tabs)/home'
  | '/(tabs)/explore'
  | '/(tabs)/favorites'
  | '/(tabs)/cart'
  | '/(tabs)/messages'
  | '/(tabs)/profile';

// Auth routes
export type AuthRoutes =
  | '/'
  | '/simple-auth'
  | '/role-selection'
  | '/onboarding';

// Product routes
export type ProductRoutes =
  | '/products'
  | '/search'
  | `/product/${string}`
  | `/category/${string}`;

// Shop routes
export type ShopRoutes =
  | `/shop/${string}`
  | `/user/${string}`
  | '/vendor/profile';

// Seller routes
export type SellerRoutes =
  | '/seller/setup'
  | '/seller/shop-wizard'
  | '/seller/shop-wizard-v2'
  | '/seller/shop-settings'
  | '/seller/shop-success'
  | '/seller/products'
  | '/seller/add-product'
  | `/seller/edit-product/${string}`
  | '/seller/product-success'
  | '/seller/orders'
  | '/seller/benefits'
  | '/seller/subscription-plans';

// Order routes
export type OrderRoutes =
  | '/orders'
  | '/checkout';

// Rewards routes
export type RewardsRoutes =
  | '/rewards'
  | '/rewards/shop'
  | `/rewards/redeem/${string}`
  | '/my-benefits'
  | '/referral';

// Chat routes
export type ChatRoutes =
  | '/chat'
  | `/chat/${string}`;

// Settings routes
export type SettingsRoutes =
  | '/settings'
  | '/settings/privacy'
  | '/settings/terms'
  | '/settings/delete-account';

// Other routes
export type OtherRoutes =
  | '/wallet'
  | '/notifications'
  | '/help-support'
  | '/charity'
  | '/merchandise'
  | '/surveys'
  | '/review/add-review';

// All app routes combined
export type AppRoutes =
  | TabRoutes
  | AuthRoutes
  | ProductRoutes
  | ShopRoutes
  | SellerRoutes
  | OrderRoutes
  | RewardsRoutes
  | ChatRoutes
  | SettingsRoutes
  | OtherRoutes;

// Route params for dynamic routes
export type RouteParams = {
  '/product/[id]': { id: string };
  '/category/[id]': { id: string };
  '/shop/[id]': { id: string };
  '/user/[userId]': { userId: string };
  '/seller/edit-product/[id]': { id: string };
  '/rewards/redeem/[id]': { id: string };
  '/chat/[conversationId]': { conversationId: string };
};

// Helper type for route with params
export type RouteWithParams<T extends keyof RouteParams> = {
  pathname: T;
  params: RouteParams[T];
};

// Note: These types are for reference and documentation purposes.
// Due to expo-router's internal typing, use `as const` or type assertions when needed.
// Example: router.push('/product/123' as AppRoutes)
