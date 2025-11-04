# Composants Utiles SenePanda

Cette documentation présente les composants utilitaires ajoutés au projet pour améliorer l'expérience utilisateur et la cohérence du design.

## 📊 Badge

Composant pour afficher des badges de notification, statuts et labels.

### Utilisation

```tsx
import Badge from '@/components/Badge';

// Badge avec compteur
<Badge count={5} variant="danger" size="medium" />

// Badge avec label
<Badge label="NEW" variant="new" size="small" />

// Badge point (dot)
<Badge dot variant="success" size="small" />

// Badge premium
<Badge label="Premium" variant="premium" size="large" />
```

### Props

- `label?: string` - Texte du badge
- `count?: number` - Nombre à afficher (affiche "99+" si > 99)
- `variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'new' | 'premium'`
- `size?: 'small' | 'medium' | 'large'`
- `dot?: boolean` - Afficher comme un point au lieu d'un badge
- `style?: ViewStyle` - Styles personnalisés

---

## 💀 SkeletonLoader

Composant de chargement animé pour améliorer l'expérience utilisateur pendant les chargements.

### Utilisation

```tsx
import SkeletonLoader from '@/components/SkeletonLoader';

// Rectangle simple
<SkeletonLoader variant="rect" width={200} height={100} />

// Cercle/Avatar
<SkeletonLoader variant="circle" height={50} />

// Lignes de texte
<SkeletonLoader variant="text" lines={3} />

// Avatar avec info
<SkeletonLoader variant="avatar" />

// Card complète
<SkeletonLoader variant="card" />

// Product card
<SkeletonLoader variant="product" />
```

### Props

- `variant?: 'rect' | 'circle' | 'text' | 'avatar' | 'card' | 'product'`
- `width?: DimensionValue` - Largeur (défaut: '100%')
- `height?: number` - Hauteur (défaut: 20)
- `lines?: number` - Nombre de lignes pour variant 'text' (défaut: 3)
- `animated?: boolean` - Activer l'animation shimmer (défaut: true)
- `style?: ViewStyle` - Styles personnalisés

---

## 🟢 StatusIndicator

Indicateur de statut avec animation pour afficher les états en ligne/hors ligne.

### Utilisation

```tsx
import StatusIndicator from '@/components/StatusIndicator';

// Statut en ligne avec label
<StatusIndicator status="online" showLabel={true} />

// Statut hors ligne
<StatusIndicator status="offline" size="small" />

// Statut occupé avec animation
<StatusIndicator status="busy" animated={true} />

// Statut personnalisé
<StatusIndicator status="away" label="En pause" showLabel={true} />
```

### Props

- `status: 'online' | 'offline' | 'away' | 'busy' | 'active'`
- `size?: 'small' | 'medium' | 'large'`
- `showLabel?: boolean` - Afficher le label textuel
- `label?: string` - Label personnalisé
- `animated?: boolean` - Animation pulse pour online/active (défaut: true)
- `style?: ViewStyle` - Styles personnalisés

---

## 🌊 WaveDivider

Diviseur ondulé animé pour séparer les sections avec style.

### Utilisation

```tsx
import WaveDivider from '@/components/WaveDivider';
import { Colors } from '@/constants/Colors';

// Wave simple
<WaveDivider />

// Wave avec couleurs personnalisées
<WaveDivider
  backgroundColor={Colors.backgroundLemon}
  waveColor={Colors.white}
  height={60}
/>

// Wave avec variant
<WaveDivider variant="smooth" animated={true} />

// Double wave
<WaveDivider variant="double-wave" height={80} />
```

### Props

- `backgroundColor?: string` - Couleur du fond (défaut: Colors.backgroundLemon)
- `waveColor?: string` - Couleur de la vague (défaut: Colors.white)
- `height?: number` - Hauteur du diviseur (défaut: 60)
- `variant?: 'wave' | 'curve' | 'double-wave' | 'smooth'` - Style de vague
- `animated?: boolean` - Animation subtile (défaut: true)

---

## 📭 EmptyState

Composant pour afficher un état vide avec action optionnelle.

### Utilisation

```tsx
import EmptyState from '@/components/EmptyState';
import { ShoppingBag } from 'lucide-react-native';

<EmptyState
  icon={ShoppingBag}
  title="Aucun produit"
  description="Vous n'avez pas encore ajouté de produits à votre panier"
  actionLabel="Explorer les produits"
  onAction={() => router.push('/explore')}
/>
```

### Props

- `icon?: React.ComponentType` - Icône Lucide à afficher
- `title: string` - Titre de l'état vide
- `description?: string` - Description optionnelle
- `actionLabel?: string` - Label du bouton d'action
- `onAction?: () => void` - Callback du bouton d'action
- `style?: ViewStyle` - Styles personnalisés

---

## 💰 PriceTag

Composant pour afficher les prix avec remises et formatage cohérent.

### Utilisation

```tsx
import PriceTag from '@/components/PriceTag';

// Prix simple
<PriceTag price={15000} currency="XOF" />

// Prix avec remise
<PriceTag
  price={12000}
  originalPrice={15000}
  currency="XOF"
  size="large"
/>

// Prix avec pourcentage de remise
<PriceTag
  price={12000}
  discount={20}
  size="medium"
/>
```

### Props

- `price: number` - Prix actuel
- `currency?: string` - Devise (défaut: 'XOF')
- `originalPrice?: number` - Prix original (pour afficher la remise)
- `discount?: number` - Pourcentage de remise manuel
- `size?: 'small' | 'medium' | 'large'`
- `showCurrency?: boolean` - Afficher la devise (défaut: true)
- `bold?: boolean` - Texte en gras (défaut: true)
- `style?: ViewStyle` - Styles personnalisés

---

## 🎨 Bonnes pratiques

### Cohérence des couleurs
Tous les composants utilisent les constantes de couleurs de `@/constants/Colors`:
- `Colors.primary*` pour les couleurs principales
- `Colors.text*` pour les textes
- `Colors.background*` pour les fonds

### Accessibilité
Les composants incluent:
- `accessibilityRole` pour les éléments interactifs
- `accessibilityLabel` pour les descriptions
- `accessibilityState` pour les états

### Performance
- Animations optimisées avec `useNativeDriver: true`
- Mémoïsation des calculs coûteux
- Gestion appropriée des états de chargement

---

## 📝 Exemples d'intégration

### Page de produits avec skeleton
```tsx
{loading ? (
  <View style={styles.grid}>
    {[1, 2, 3, 4].map(i => (
      <SkeletonLoader key={i} variant="product" />
    ))}
  </View>
) : products.length > 0 ? (
  <ProductGrid products={products} />
) : (
  <EmptyState
    icon={ShoppingBag}
    title="Aucun produit"
    description="Aucun produit disponible pour le moment"
  />
)}
```

### Notification badge sur icône
```tsx
<View style={styles.iconContainer}>
  <Bell size={24} color={Colors.textPrimary} />
  <Badge count={3} variant="danger" size="small" style={styles.badge} />
</View>
```

### Prix avec remise
```tsx
<PriceTag
  price={product.price}
  originalPrice={product.original_price}
  size="large"
  bold={true}
/>
```
