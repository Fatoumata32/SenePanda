import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useNavigation } from '@/contexts/NavigationContext';

/**
 * AuthGuard amélioré qui utilise NavigationContext
 * Affiche un loader pendant la vérification de l'authentification
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading } = useNavigation();

  // Afficher un loader pendant la vérification
  if (isLoading) {
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
