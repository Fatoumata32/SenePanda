# SellerReputationBadge - Guide d'Utilisation Rapide

## 🚀 Utilisation Basique

### 1. Pour afficher la réputation d'un vendeur spécifique

```tsx
import SellerReputationBadge from '@/components/SellerReputationBadge';
import { useSellerReputation } from '@/hooks/useSellerReputation';

function SellerCard({ sellerId }) {
  const { reputation, loading } = useSellerReputation(sellerId);

  if (loading) return <ActivityIndicator />;
  if (!reputation) return null;

  return (
    <SellerReputationBadge
      reputation={reputation}
      size="small"
      showDetails={false}
    />
  );
}
```

### 2. Pour afficher la réputation du vendeur connecté

```tsx
import { useMyReputation } from '@/hooks/useSellerReputation';

function MyProfileBadge() {
  const { reputation, loading } = useMyReputation();

  if (loading || !reputation) return null;

  return (
    <SellerReputationBadge
      reputation={reputation}
      size="large"
      showDetails={true}
      showProgress={true}
    />
  );
}
```

## 🎨 Tailles Disponibles

```tsx
// Petit badge (40px) - pour les cartes, listes
<SellerReputationBadge reputation={data} size="small" />

// Badge moyen (60px) - pour les profils, détails
<SellerReputationBadge reputation={data} size="medium" />

// Grand badge (80px) - pour les pages dédiées
<SellerReputationBadge reputation={data} size="large" />
```

## 📊 Options d'Affichage

```tsx
<SellerReputationBadge
  reputation={reputation}
  size="medium"
  showDetails={true}    // Affiche notes, avis, votes
  showProgress={true}   // Affiche barre de progression
/>
```

## 💡 Exemples Pratiques

### Liste de vendeurs

```tsx
function SellersList({ sellers }) {
  return (
    <FlatList
      data={sellers}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text>{item.shopName}</Text>
          <SellerReputationBadge
            reputation={item.reputation}
            size="small"
            showDetails={false}
          />
        </View>
      )}
    />
  );
}
```

### Page profil vendeur complète

```tsx
function SellerProfile({ sellerId }) {
  const { reputation } = useSellerReputation(sellerId);

  return (
    <ScrollView>
      <View style={styles.header}>
        {/* Avatar, nom, etc. */}
      </View>

      <View style={styles.reputationSection}>
        <SellerReputationBadge
          reputation={reputation}
          size="large"
          showDetails={true}
          showProgress={true}
        />
      </View>

      {/* Autres infos */}
    </ScrollView>
  );
}
```

### Top vendeurs avec classement

```tsx
import { useTopSellersByReputation } from '@/hooks/useSellerReputation';

function TopSellers() {
  const { sellers, loading } = useTopSellersByReputation(10);

  return (
    <View>
      <Text style={styles.title}>🏆 Top Vendeurs</Text>
      {sellers.map((seller, index) => (
        <View key={seller.sellerId} style={styles.rankItem}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <SellerReputationBadge
            reputation={seller.reputation}
            size="medium"
            showDetails={true}
          />
        </View>
      ))}
    </View>
  );
}
```

## 🧮 Calcul Manuel du Score

```tsx
import { calculateReputation } from '@/lib/reputationSystem';

// Calculer la réputation avec des données personnalisées
const reputation = calculateReputation({
  averageRating: 4.7,
  totalReviews: 85,
  totalVotes: 150,
  responseRate: 92,
  completionRate: 96,
});

// Résultat :
// {
//   level: 'gold',
//   averageRating: 4.7,
//   totalReviews: 85,
//   totalVotes: 150,
//   score: 78,
//   nextLevelScore: 80,
//   progress: 90
// }
```

## 🎯 Types de Données

```typescript
import { ReputationData, ReputationLevel } from '@/components/SellerReputationBadge';

// Niveaux possibles
type ReputationLevel =
  | 'nouveau'    // 0-19 points
  | 'bronze'     // 20-39 points
  | 'silver'     // 40-59 points
  | 'gold'       // 60-79 points
  | 'platinum'   // 80-94 points
  | 'diamond';   // 95-100 points

// Structure des données
interface ReputationData {
  level: ReputationLevel;
  averageRating: number;      // 0-5
  totalReviews: number;
  totalVotes: number;
  score: number;              // 0-100
  nextLevelScore?: number;
  progress?: number;          // 0-100
}
```

## 🎨 Personnalisation Visuelle

### Badge avec style personnalisé

```tsx
<View style={{
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  elevation: 5
}}>
  <SellerReputationBadge
    reputation={reputation}
    size="medium"
    showDetails={true}
  />
</View>
```

### Badge avec titre

```tsx
<View>
  <Text style={styles.sectionTitle}>Réputation du vendeur</Text>
  <SellerReputationBadge
    reputation={reputation}
    size="medium"
  />
</View>
```

## 🔄 Rafraîchissement des Données

```tsx
function RefreshableReputation({ sellerId }) {
  const { reputation, loading, refresh } = useSellerReputation(sellerId);

  return (
    <View>
      <SellerReputationBadge reputation={reputation} />
      <TouchableOpacity onPress={refresh}>
        <Text>🔄 Actualiser</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 📱 Responsive Design

```tsx
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

function ResponsiveBadge({ reputation }) {
  const size = width < 350 ? 'small' : width < 500 ? 'medium' : 'large';

  return (
    <SellerReputationBadge
      reputation={reputation}
      size={size}
      showDetails={width > 350}
    />
  );
}
```

## ⚡ Performance

### Mise en cache avec React Query

```tsx
import { useQuery } from '@tanstack/react-query';

function CachedReputation({ sellerId }) {
  const { data: reputation } = useQuery({
    queryKey: ['reputation', sellerId],
    queryFn: () => fetchSellerReputation(sellerId),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  return <SellerReputationBadge reputation={reputation} />;
}
```

### Lazy loading pour listes

```tsx
function SellerList({ sellers }) {
  return (
    <FlatList
      data={sellers}
      renderItem={({ item }) => (
        <LazyLoadReputation sellerId={item.id} />
      )}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
}
```

## 🧪 Tests

```tsx
import { render } from '@testing-library/react-native';

describe('SellerReputationBadge', () => {
  const mockReputation = {
    level: 'gold',
    averageRating: 4.7,
    totalReviews: 85,
    totalVotes: 150,
    score: 78,
    nextLevelScore: 80,
    progress: 90,
  };

  it('affiche le badge correctement', () => {
    const { getByText } = render(
      <SellerReputationBadge
        reputation={mockReputation}
        size="medium"
      />
    );

    expect(getByText('Or')).toBeTruthy();
    expect(getByText('4.7')).toBeTruthy();
  });
});
```

## 🎁 Bonus : Helpers Utiles

### Obtenir la description du niveau

```tsx
import { getReputationLevelDescription } from '@/lib/reputationSystem';

const description = getReputationLevelDescription('gold');
// "Excellent vendeur - Qualité reconnue"
```

### Vérifier l'éligibilité au badge vérifié

```tsx
import { shouldAwardVerifiedBadge } from '@/lib/reputationSystem';

const isVerified = shouldAwardVerifiedBadge({
  averageRating: 4.8,
  totalReviews: 120,
  responseRate: 95,
  completionRate: 98,
});
// true si critères remplis
```

### Obtenir des conseils d'amélioration

```tsx
import { getReputationImprovementTips } from '@/lib/reputationSystem';

const tips = getReputationImprovementTips({
  averageRating: 4.2,
  totalReviews: 15,
  totalVotes: 20,
});

// Retourne un tableau de conseils personnalisés
tips.forEach(tip => console.log(`💡 ${tip}`));
```

---

**Prêt à l'emploi ! 🎉**

Pour plus d'informations, consultez le [Guide Complet](../GUIDE_REPUTATION_VENDEUR.md).
