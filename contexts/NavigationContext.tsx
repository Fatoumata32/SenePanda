import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_STORAGE_KEY = 'user_preferred_role';

type NavigationContextType = {
  isAuthenticated: boolean | null;
  hasRoleSelected: boolean | null;
  isLoading: boolean;
  userRole: 'buyer' | 'seller' | null;
  setUserRole: (role: 'buyer' | 'seller') => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRoleSelected, setHasRoleSelected] = useState<boolean | null>(null);
  const [userRole, setUserRoleState] = useState<'buyer' | 'seller' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour sauvegarder le rôle à la fois en DB et AsyncStorage
  const setUserRole = async (role: 'buyer' | 'seller') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 1. Sauvegarder en base de données (source de vérité)
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_role: role,
          is_seller: role === 'seller' // Mettre à jour is_seller en même temps
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // 2. Sauvegarder en AsyncStorage pour la performance
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);

      // 3. Mettre à jour l'état local
      setUserRoleState(role);
      setHasRoleSelected(true);
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  };

  // Récupérer le rôle depuis la base de données (vérifie is_seller et subscription_plan)
  const fetchRoleFromDB = async (userId: string): Promise<'buyer' | 'seller' | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_role, is_seller, subscription_plan')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching role from DB:', error);
        return null;
      }

      // Priorité: preferred_role > subscription_plan > is_seller > null
      if (data?.preferred_role) {
        return data.preferred_role;
      }
      
      // Si l'utilisateur a un abonnement, c'est forcément un vendeur
      if (data?.subscription_plan && data.subscription_plan !== 'none') {
        console.log('🏪 Utilisateur détecté comme vendeur via subscription_plan:', data.subscription_plan);
        return 'seller';
      }
      
      // Si pas de preferred_role mais is_seller = true, c'est un vendeur
      if (data?.is_seller === true) {
        console.log('🏪 Utilisateur détecté comme vendeur via is_seller');
        return 'seller';
      }

      return null;
    } catch (error) {
      console.error('Error in fetchRoleFromDB:', error);
      return null;
    }
  };

  // Vérifier l'authentification et le rôle
  const checkAuthAndRole = async () => {
    try {
      // Vérifier l'auth
      const { data: { user } } = await supabase.auth.getUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);

      if (authenticated && user) {
        // 1. Vérifier d'abord en base de données (source de vérité)
        const roleFromDB = await fetchRoleFromDB(user.id);

        if (roleFromDB) {
          // Le rôle existe en DB, l'utiliser
          setUserRoleState(roleFromDB);
          setHasRoleSelected(true);

          // Synchroniser avec AsyncStorage pour les prochains démarrages
          await AsyncStorage.setItem(ROLE_STORAGE_KEY, roleFromDB);
        } else {
          // Pas de rôle en DB, vérifier AsyncStorage (migration d'anciennes versions)
          const roleFromStorage = await AsyncStorage.getItem(ROLE_STORAGE_KEY);

          if (roleFromStorage === 'buyer' || roleFromStorage === 'seller') {
            // Migrer vers la DB
            await setUserRole(roleFromStorage);
          } else {
            // Aucun rôle sélectionné -> Définir "buyer" par défaut automatiquement
            console.log('🔄 Aucun rôle trouvé, définition automatique de "buyer"');
            try {
              // Définir buyer par défaut
              await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'buyer');
              setUserRoleState('buyer');
              setHasRoleSelected(true);
              
              // Sauvegarder en DB aussi
              await supabase
                .from('profiles')
                .update({ preferred_role: 'buyer' })
                .eq('id', user.id);
              
              console.log('✅ Rôle "buyer" défini par défaut');
            } catch (roleError) {
              console.error('Erreur définition rôle par défaut:', roleError);
              // En cas d'erreur, définir quand même localement
              setUserRoleState('buyer');
              setHasRoleSelected(true);
            }
          }
        }
      } else {
        setHasRoleSelected(false);
        setUserRoleState(null);
        // Nettoyer AsyncStorage
        await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error checking auth and role:', error);
      setIsAuthenticated(false);
      setHasRoleSelected(false);
      setUserRoleState(null);
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

        if (authenticated && session?.user) {
          // Récupérer le rôle depuis la DB
          let roleFromDB = await fetchRoleFromDB(session.user.id);
          
          // Si pas de rôle, définir "buyer" par défaut
          if (!roleFromDB) {
            console.log('🔄 [AuthChange] Aucun rôle, définition de "buyer" par défaut');
            roleFromDB = 'buyer';
            
            // Sauvegarder en DB
            await supabase
              .from('profiles')
              .update({ preferred_role: 'buyer' })
              .eq('id', session.user.id);
          }
          
          setUserRoleState(roleFromDB);
          setHasRoleSelected(true);

          // Synchroniser avec AsyncStorage
          await AsyncStorage.setItem(ROLE_STORAGE_KEY, roleFromDB);
        } else {
          setHasRoleSelected(false);
          setUserRoleState(null);
          await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
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
