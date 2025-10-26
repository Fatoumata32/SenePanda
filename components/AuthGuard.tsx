import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function useAuthGuard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(true); // Toujours true
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      const isLoggedIn = !!user;
      setIsAuthenticated(isLoggedIn);

      // Logique de navigation
      const currentPath = segments.join('/');
      const isOnRoleSelection = segments[0] === 'role-selection';

      // Si pas connecté, rediriger vers la page de connexion
      if (!isLoggedIn) {
        if (currentPath !== '(tabs)/profile' && currentPath !== '') {
          router.replace('/(tabs)/profile');
        }
      } else {
        // Si connecté, vérifier si le rôle a été sélectionné
        const roleSelected = await AsyncStorage.getItem('user_preferred_role');

        if (!roleSelected && !isOnRoleSelection) {
          // Pas de rôle sélectionné → rediriger vers la sélection du rôle
          router.replace('/role-selection');
        }
      }
    } catch (error) {
      console.error('Error in auth guard:', error);
      setIsAuthenticated(false);
    }
  };

  return { isAuthenticated, onboardingCompleted };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted } = useAuthGuard();

  // Afficher un loader pendant la vérification
  if (isAuthenticated === null || onboardingCompleted === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
