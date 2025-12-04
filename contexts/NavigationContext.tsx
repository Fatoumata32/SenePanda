import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        } else {
          setHasRoleSelected(false);
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
