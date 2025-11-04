# Composants Utiles SenePanda 🎨

Cette documentation présente les composants utilitaires ajoutés au projet pour améliorer l'expérience utilisateur et la cohérence du design.

## 🆕 Nouveaux Composants Profil

### 📊 AnimatedCounter
Compteur animé avec transitions fluides pour afficher des statistiques.

```tsx
import AnimatedCounter from '@/components/AnimatedCounter';

<AnimatedCounter
  end={1250}
  start={0}
  duration={1500}
  suffix=" FCFA"
  prefix="+"
  decimals={2}
/>
```

**Props:**
- `end: number` - Valeur finale
- `start?: number` - Valeur de départ (défaut: 0)
- `duration?: number` - Durée de l'animation en ms (défaut: 1500)
- `suffix?: string` - Suffixe (ex: " FCFA", " pts")
- `prefix?: string` - Préfixe (ex: "+", "$")
- `decimals?: number` - Nombre de décimales (défaut: 0)

---

### 🔮 GlassmorphicCard
Carte avec effet glassmorphism moderne et élégant.

```tsx
import GlassmorphicCard from '@/components/GlassmorphicCard';

<GlassmorphicCard
  intensity={40}
  tint="light"
  bordered={true}>
  <Text>Contenu avec effet verre</Text>
</GlassmorphicCard>
```

**Props:**
- `children: ReactNode` - Contenu de la carte
- `intensity?: number` - Intensité du blur (défaut: 40)
- `tint?: 'light' | 'dark' | 'default'` - Teinte du blur
- `bordered?: boolean` - Bordure glassmorphique (défaut: true)

---

### 🏆 AchievementBadge
Badge d'achievement animé avec progression.

```tsx
import AchievementBadge from '@/components/AchievementBadge';
import { Trophy } from 'lucide-react-native';

<AchievementBadge
  icon={Trophy}
  title="Premier achat"
  description="Effectuez votre premier achat"
  unlocked={true}
  progress={75}
  color={Colors.primaryGold}
  delay={200}
/>
```

**Props:**
- `icon: React.ComponentType` - Icône Lucide
- `title: string` - Titre de l'achievement
- `description: string` - Description
- `unlocked: boolean` - Achievement débloqué
- `progress?: number` - Progression 0-100 (si non débloqué)
- `color?: string` - Couleur du badge
- `delay?: number` - Délai d'animation en ms

---

### 📈 StatsCard
Carte de statistiques avec animations et icône.

```tsx
import StatsCard from '@/components/StatsCard';
import { ShoppingBag } from 'lucide-react-native';

<StatsCard
  icon={ShoppingBag}
  value={1250}
  label="Achats"
  suffix=" produits"
  gradient={['#FF6B35', '#FF8E53']}
  delay={0}
/>
```

**Props:**
- `icon: React.ComponentType` - Icône Lucide
- `value: number` - Valeur à afficher
- `label: string` - Label de la statistique
- `suffix?: string` - Suffixe
- `prefix?: string` - Préfixe
- `color?: string` - Couleur principale
- `delay?: number` - Délai d'animation en ms
- `gradient?: readonly [string, string, ...string[]]` - Gradient personnalisé

---

### 🔥 StreakIndicator
Indicateur de série (streak) avec animations flamme.

```tsx
import StreakIndicator from '@/components/StreakIndicator';

<StreakIndicator
  currentStreak={7}
  bestStreak={15}
/>
```

**Props:**
- `currentStreak: number` - Série actuelle en jours
- `bestStreak: number` - Meilleure série

**Features:**
- Animation flamme pulsante
- Affichage du record personnel
- Emojis décoratifs animés

---

### 👤 ProfileHeader3D
Header de profil avec effets 3D, particules et glassmorphism.

```tsx
import ProfileHeader3D from '@/components/ProfileHeader3D';

<ProfileHeader3D
  avatarUri="https://..."
  username="john_doe"
  fullName="John Doe"
  isPremium={true}
  onAvatarPress={() => handleAvatarChange()}
/>
```

**Props:**
- `avatarUri?: string | null` - URL de l'avatar
- `username: string` - Nom d'utilisateur
- `fullName: string` - Nom complet
- `isPremium?: boolean` - Utilisateur premium
- `onAvatarPress?: () => void` - Callback changement avatar

**Features:**
- Animation float 3D de l'avatar
- Particules animées ✨
- Effet glow pour premium
- Badge premium avec Crown icon
- Bouton caméra pour changer l'avatar
- Cercles décoratifs animés

---

### ⚡ QuickActions
Grille d'actions rapides avec animations.

```tsx
import QuickActions from '@/components/QuickActions';
import { ShoppingBag, MessageCircle, Heart, Settings } from 'lucide-react-native';

<QuickActions
  actions={[
    {
      icon: ShoppingBag,
      label: 'Achats',
      onPress: () => router.push('/orders'),
      gradient: ['#FFD700', '#FF8C00'] as const,
      badge: 3,
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      onPress: () => router.push('/messages'),
      gradient: ['#3B82F6', '#1D4ED8'] as const,
      badge: 5,
    },
    // ...
  ]}
/>
```

**Props:**
- `actions: QuickActionButton[]` - Liste d'actions

**QuickActionButton:**
- `icon: React.ComponentType` - Icône Lucide
- `label: string` - Label de l'action
- `onPress: () => void` - Callback
- `gradient: readonly [string, string, ...string[]]` - Gradient
- `badge?: number` - Nombre de notifications

---

## 📊 Composants Utilitaires

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
