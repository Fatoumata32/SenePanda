import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@/contexts/NavigationContext';
import { Colors } from '@/constants/Colors';

type RoleSwitchButtonProps = {
  size?: number;
  color?: string;
};

/**
 * Bouton de changement de rôle rapide
 * Permet de basculer entre les interfaces acheteur/vendeur
 */
export function RoleSwitchButton({ size = 24, color = Colors.primaryOrange }: RoleSwitchButtonProps) {
  const { userRole, setUserRole } = useNavigation();
  const router = useRouter();

  const handleSwitch = () => {
    const newRole = userRole === 'buyer' ? 'seller' : 'buyer';
    const roleLabel = newRole === 'buyer' ? 'Acheteur' : 'Vendeur';

    Alert.alert(
      'Changer de rôle',
      `Voulez-vous passer en mode ${roleLabel} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await setUserRole(newRole);

              // Rediriger vers l'interface appropriée
              if (newRole === 'seller') {
                router.replace('/seller/my-shop' as any);
              } else {
                router.replace('/(tabs)' as any);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de changer de rôle');
            }
          },
        },
      ]
    );
  };

  // Afficher l'icône correspondant au rôle opposé (ce vers quoi on peut basculer)
  const iconName = userRole === 'buyer' ? 'storefront' : 'cart';
  const accessibilityLabel = userRole === 'buyer'
    ? 'Passer en mode vendeur'
    : 'Passer en mode acheteur';

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSwitch}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button">
      <Ionicons name={iconName} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
  },
});
