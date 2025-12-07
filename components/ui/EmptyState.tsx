import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Package,
  Search,
  Heart,
  ShoppingCart,
  AlertCircle,
  Inbox,
  FileX,
  WifiOff,
} from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { GradientButton } from './GradientButton';

type EmptyStateType =
  | 'products'
  | 'search'
  | 'favorites'
  | 'cart'
  | 'orders'
  | 'error'
  | 'offline'
  | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const iconMap: Record<EmptyStateType, any> = {
  products: Package,
  search: Search,
  favorites: Heart,
  cart: ShoppingCart,
  orders: Inbox,
  error: AlertCircle,
  offline: WifiOff,
  generic: FileX,
};

const defaultContent: Record<
  EmptyStateType,
  { title: string; description: string; actionLabel?: string }
> = {
  products: {
    title: 'Aucun produit trouvé',
    description: 'Nous n\'avons trouvé aucun produit correspondant à vos critères',
    actionLabel: 'Explorer les produits',
  },
  search: {
    title: 'Aucun résultat',
    description: 'Essayez de modifier votre recherche ou d\'explorer les catégories',
    actionLabel: 'Réinitialiser la recherche',
  },
  favorites: {
    title: 'Aucun favori',
    description: 'Ajoutez des produits à vos favoris pour les retrouver facilement',
    actionLabel: 'Découvrir des produits',
  },
  cart: {
    title: 'Votre panier est vide',
    description: 'Ajoutez des produits pour commencer vos achats',
    actionLabel: 'Commencer le shopping',
  },
  orders: {
    title: 'Aucune commande',
    description: 'Vous n\'avez pas encore passé de commande',
    actionLabel: 'Découvrir des produits',
  },
  error: {
    title: 'Une erreur est survenue',
    description: 'Nous n\'avons pas pu charger les données. Veuillez réessayer.',
    actionLabel: 'Réessayer',
  },
  offline: {
    title: 'Pas de connexion',
    description: 'Vérifiez votre connexion internet et réessayez',
    actionLabel: 'Réessayer',
  },
  generic: {
    title: 'Rien à afficher',
    description: 'Il n\'y a aucun contenu pour le moment',
  },
};

/**
 * Composant EmptyState amélioré avec icônes et actions
 *
 * @example
 * <EmptyState
 *   type="products"
 *   onAction={() => router.push('/explore')}
 * />
 *
 * @example
 * <EmptyState
 *   icon={<CustomIcon />}
 *   title="Custom Title"
 *   description="Custom description"
 *   actionLabel="Custom Action"
 *   onAction={handleAction}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  const colors = useThemeColors();

  const content = defaultContent[type];
  const IconComponent = iconMap[type];

  const displayTitle = title || content.title;
  const displayDescription = description || content.description;
  const displayActionLabel = actionLabel || content.actionLabel;

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundLight }]}>
        {icon || (
          <IconComponent
            size={64}
            color={colors.textMuted}
            strokeWidth={1.5}
          />
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>{displayTitle}</Text>

      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {displayDescription}
      </Text>

      {/* Action Button */}
      {displayActionLabel && onAction && (
        <View style={styles.actionContainer}>
          <GradientButton
            variant="goldOrange"
            onPress={onAction}
            style={styles.button}
          >
            {displayActionLabel}
          </GradientButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 280,
  },
  button: {
    width: '100%',
  },
});
