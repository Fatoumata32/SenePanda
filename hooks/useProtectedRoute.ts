/**
 * Hook pour protéger les routes et gérer la navigation
 */

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useNavigation } from '@/contexts/NavigationContext';
import NavigationService, { Route } from '@/lib/navigation';

type UseProtectedRouteOptions = {
  requireAuth?: boolean;
  requireRole?: boolean;
  redirectTo?: Route;
  onUnauthorized?: () => void;
};

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const {
    requireAuth = true,
    requireRole = true,
    redirectTo,
    onUnauthorized,
  } = options;

  const { isAuthenticated, hasRoleSelected, isLoading } = useNavigation();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentPath = segments.join('/');

    // Vérifier l'authentification si requise
    if (requireAuth && !isAuthenticated) {
      if (onUnauthorized) {
        onUnauthorized();
      } else if (redirectTo) {
        NavigationService.setRedirectAfterLogin(currentPath as Route);
        router.replace(redirectTo as any);
      } else {
        NavigationService.goToLogin(currentPath as Route);
      }
      return;
    }

    // Vérifier la sélection du rôle si requise
    if (requireRole && isAuthenticated && !hasRoleSelected) {
      NavigationService.setRedirectAfterLogin(currentPath as Route);
      NavigationService.goToRoleSelection();
    }
  }, [isAuthenticated, hasRoleSelected, isLoading, requireAuth, requireRole]);

  return {
    isAuthenticated,
    hasRoleSelected,
    isLoading,
    canAccess: isAuthenticated !== null && (!requireAuth || isAuthenticated) && (!requireRole || hasRoleSelected),
  };
}

/**
 * Hook pour naviguer de manière sécurisée
 */
export function useSafeNavigation() {
  const { isAuthenticated } = useNavigation();
  const router = useRouter();

  const navigateTo = async (route: Route) => {
    await NavigationService.navigateTo(route, isAuthenticated || false);
  };

  const goBack = () => {
    NavigationService.goBack();
  };

  const goToHome = () => {
    NavigationService.goToHome();
  };

  const goToLogin = (redirectTo?: Route) => {
    NavigationService.goToLogin(redirectTo);
  };

  const goToRoleSelection = () => {
    NavigationService.goToRoleSelection();
  };

  return {
    navigateTo,
    goBack,
    goToHome,
    goToLogin,
    goToRoleSelection,
    isAuthenticated,
  };
}
