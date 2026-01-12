/**
 * Bouton cœur pour ajouter/retirer de la wishlist
 */

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useWishlist } from '../hooks/useWishlist';
import { useLogger } from '../hooks/useLogger';

interface Props {
  productId: string;
  size?: number;
  color?: string;
  fillColor?: string;
  style?: any;
  onToggle?: (isInWishlist: boolean) => void;
}

export function WishlistButton({
  productId,
  size = 24,
  color = '#64748B',
  fillColor = '#FF6B6B',
  style,
  onToggle,
}: Props) {
  const log = useLogger('WishlistButton');
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handlePress = async () => {
    setIsLoading(true);

    try {
      const added = await toggleWishlist(productId);

      if (onToggle) {
        onToggle(added);
      }

      log.track('wishlist_toggled', {
        productId,
        action: added ? 'added' : 'removed',
      });
    } catch (error) {
      log.error('Failed to toggle wishlist', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <TouchableOpacity style={[styles.button, style]} disabled>
        <ActivityIndicator size="small" color={color} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Heart
        size={size}
        color={inWishlist ? fillColor : color}
        fill={inWishlist ? fillColor : 'none'}
        strokeWidth={inWishlist ? 0 : 2}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
