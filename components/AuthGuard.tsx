import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export function useAuthGuard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(true); // Toujours true
  const router = useRouter();
  const segments = useSegments();

  const checkAuth = useCallback(async () => {
    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      const isLoggedIn = !!user;
      setIsAuthenticated(isLoggedIn);
    } catch (error) {
      console.error('Error in auth guard:', error);
      setIsAuthenticated(false);
    }
  }, []);

  const handleNavigation = useCallback(async () => {
    try {
      const currentPath = segments.join('/');
      const isOnRoleSelection = segments[0] === 'role-selection';
      const isOnRegister = segments[0] === 'register';
      const isOnProfile = currentPath === '(tabs)/profile' || currentPath === '';

      // Pages publiques accessibles sans authentification
      const publicPages = ['register', 'role-selection', '(tabs)/profile', ''];

      // Si pas connecté, rediriger vers la page de connexion SAUF si on est sur une page publique
      if (!isAuthenticated) {
        if (!publicPages.some(page => currentPath === page || currentPath.startsWith(page))) {
          setTimeout(() => router.replace('/(tabs)/profile'), 100);
        }
      } else {
        // Si connecté, vérifier si le rôle a été sélectionné
        const roleSelected = await AsyncStorage.getItem('user_preferred_role');

        if (!roleSelected && !isOnRoleSelection) {
          // Pas de rôle sélectionné → rediriger vers la sélection du rôle
          setTimeout(() => router.replace('/role-selection'), 100);
        }
      }
    } catch (error) {
      console.error('Error in navigation:', error);
    }
  }, [isAuthenticated, segments, router]);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated !== null) {
      handleNavigation();
    }
  }, [isAuthenticated, handleNavigation]);

  return { isAuthenticated, onboardingCompleted };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted } = useAuthGuard();

  // Afficher un loader pendant la vérification
  if (isAuthenticated === null || onboardingCompleted === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
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
    backgroundColor: Colors.backgroundLight,
  },
});
