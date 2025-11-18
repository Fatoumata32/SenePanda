import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

/**
 * Page d'accueil initiale de l'application
 * Redirige automatiquement vers la bonne page selon l'état d'authentification
 */
export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Pas connecté → Aller à la page de connexion
        router.replace('/simple-auth');
        return;
      }

      // Connecté → Vérifier si le rôle a été sélectionné
      const role = await AsyncStorage.getItem('user_preferred_role');

      if (!role) {
        // Connecté mais pas de rôle → Aller à la sélection du rôle
        router.replace('/role-selection');
        return;
      }

      // Connecté avec un rôle → Aller à l'application (page d'accueil)
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error checking auth:', error);
      // En cas d'erreur, aller quand même vers la connexion
      router.replace('/simple-auth');
    }
  };

  // Afficher un loader pendant la vérification
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primaryOrange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
  },
});
