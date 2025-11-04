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
    await NavigationService.handleNavigation(currentPath, isAuthenticated);
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

  // Gérer la navigation quand l'état change
  useEffect(() => {
    if (!isLoading && isAuthenticated !== null) {
      handleNavigationLogic();
    }
  }, [isAuthenticated, hasRoleSelected, segments, isLoading]);

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
