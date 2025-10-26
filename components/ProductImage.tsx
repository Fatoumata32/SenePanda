import { Image, ImageProps, StyleSheet } from 'react-native';

interface ProductImageProps extends Omit<ImageProps, 'source'> {
  imageUrl?: string | null;
  images?: string[] | null;
  fallbackIcon?: React.ReactNode;
  priority?: boolean; // Pour le préchargement
}

/**
 * Composant optimisé pour afficher les images de produits
 * Gère les images multiples, les fallbacks et le cache
 */
export function ProductImage({
  imageUrl,
  images,
  fallbackIcon,
  priority = false,
  style,
  ...props
}: ProductImageProps) {
  // Déterminer quelle image afficher
  const getImageSource = () => {
    // Priorité 1: image_url principale
    if (imageUrl) {
      return { uri: imageUrl };
    }

    // Priorité 2: première image du tableau images
    if (images && images.length > 0) {
      return { uri: images[0] };
    }

    // Priorité 3: image par défaut (placeholder en ligne)
    return { uri: 'https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg' };
  };

  const source = getImageSource();

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      resizeMode="cover"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#F3F4F6', // Placeholder color pendant le chargement
  },
});
