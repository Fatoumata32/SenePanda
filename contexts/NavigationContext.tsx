import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationService from '@/lib/navigation';

type NavigationContextType = {
  isAuthenticated: boolean | null;
  hasRoleSelected: boolean | null;
  isLoading: boolean;
  userRole: 'buyer' | 'seller' | null;
  setUserRole: (role: 'buyer' | 'seller' | null) => void;
  refreshAuth: () => Promise<void>;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRoleSelected, setHasRoleSelected] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Vérifier l'authentification et le rôle
  const checkAuthAndRole = async () => {
    try {
      // Vérifier l'auth
      const { data: { user } } = await supabase.auth.getUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Vérifier le rôle
        const role = await AsyncStorage.getItem('user_preferred_role');
        setHasRoleSelected(!!role);
        setUserRole(role as 'buyer' | 'seller' | null);
      } else {
        setHasRoleSelected(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking auth and role:', error);
      setIsAuthenticated(false);
      setHasRoleSelected(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la navigation selon l'état
  const handleNavigationLogic = async () => {
    if (isAuthenticated === null) return;

    const currentPath = segments.join('/');

    // Liste des patterns de routes à ne JAMAIS rediriger
    const allowedPaths = [
      'simple-auth',
      'role-selection',
      'onboarding',
      'search',
      'settings',
      'wallet',
      'notifications',
      'product',
      'shop',
      'category',
      'rewards',
      'referral',
      'orders',
      'checkout',
      'chat',
      'review',
      'user',
      'seller',
      'help-support',
      'my-benefits',
      'charity',
      'merchandise',
      'surveys',
      'vendor',
    ];

    // Si le path contient un de ces patterns, ne pas rediriger
    if (currentPath === '' || allowedPaths.some(path => currentPath.includes(path))) {
      return;
    }

    // Ne rediriger que si on est sur une tab et non authentifié
    if (!isAuthenticated && currentPath.includes('(tabs)')) {
      const isProfileOrHome = currentPath.includes('profile') || currentPath.includes('home');
      if (!isProfileOrHome) {
        NavigationService.goToLogin();
      }
    }
  };

  // Refresh auth (appelé après login/logout)
  const refreshAuth = async () => {
    setIsLoading(true);
    await checkAuthAndRole();
  };

  // Initial check
  useEffect(() => {
    checkAuthAndRole();
  }, []);

  // Écouter les changements d'auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authenticated = !!session?.user;
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const role = await AsyncStorage.getItem('user_preferred_role');
          setHasRoleSelected(!!role);
          setUserRole(role as 'buyer' | 'seller' | null);

          // Si c'est un nouveau login, gérer la redirection
          if (event === 'SIGNED_IN') {
            // Vérifier si c'est un vendeur sans boutique
            if (role === 'seller' && session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('shop_name')
                .eq('id', session.user.id)
                .maybeSingle();

              if (!profile?.shop_name) {
                // Vendeur sans boutique → créer la boutique
                router.replace('/seller/shop-wizard');
                return;
              }
            }

            await NavigationService.handlePostLogin();
          }
        } else {
          setHasRoleSelected(false);
          setUserRole(null);

          // Si c'est un logout, gérer la redirection
          if (event === 'SIGNED_OUT') {
            NavigationService.handlePostLogout();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Gérer la navigation quand l'état change (uniquement pour auth et role, pas segments)
  useEffect(() => {
    if (!isLoading && isAuthenticated !== null) {
      handleNavigationLogic();
    }
  }, [isAuthenticated, hasRoleSelected, isLoading]);

  return (
    <NavigationContext.Provider
      value={{
        isAuthenticated,
        hasRoleSelected,
        isLoading,
        userRole,
        setUserRole,
        refreshAuth,
      }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
