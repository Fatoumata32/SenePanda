// Cart & Favorites
export { useCart, cartEvents } from './useCart';
export { useFavorite, favoritesEvents } from './useFavorites';

// Bonus System
export {
  useBonusSystem,
  useDailyStreak,
  useSurveys,
  useCharitableCauses,
  useMerchandise,
  useRewards,
  usePointsHistory,
} from './useBonusSystem';

// Auth & Navigation
export { useProtectedRoute } from './useProtectedRoute';
export { useFrameworkReady } from './useFrameworkReady';

// Utilities
export { useCache } from './useCache';
export { useSearchHistory } from './useSearchHistory';
export { usePromoCode } from './usePromoCode';

// Network
export { useNetworkStatus } from './useNetworkStatus';

// Performance
export {
  useDebounce,
  useThrottle,
  useAfterInteractions,
  useKeyExtractor,
  useFlatListOptimization,
  useMountedState,
  usePrevious,
  useLazyInit,
} from './usePerformance';

// UI
export { useConfirmation } from './useConfirmation';

// Security
export { useBiometric } from './useBiometric';

// Shopping
export { useProductComparison } from './useProductComparison';
export { useOrderTracking } from './useOrderTracking';

// Voice & Search
export { useVoiceSearch } from './useVoiceSearch';

// Chat
export { useChat } from './useChat';
