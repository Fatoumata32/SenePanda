# ⚡ Guide d'Optimisation des Performances

## 🎯 Objectif

Améliorer les performances de l'application SenePanda en réduisant les ralentissements, optimisant les rendus et améliorant la réactivité.

## 🔍 Problèmes Courants de Performance

### 1. Re-renders Excessifs
```tsx
// ❌ MAUVAIS - Re-render à chaque changement
const MyComponent = () => {
  const [data, setData] = useState([]);

  const handlePress = () => {
    // Fonction recréée à chaque render
    doSomething();
  };

  return <Button onPress={handlePress} />;
};

// ✅ BON - Optimisé avec useCallback
const MyComponent = () => {
  const [data, setData] = useState([]);

  const handlePress = useCallback(() => {
    doSomething();
  }, []); // Fonction mémorisée

  return <Button onPress={handlePress} />;
};
```

### 2. Calculs Lourds dans Render
```tsx
// ❌ MAUVAIS - Calcul à chaque render
const MyComponent = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <Text>{total}</Text>;
};

// ✅ BON - Calcul mémorisé
const MyComponent = ({ items }) => {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  return <Text>{total}</Text>;
};
```

### 3. Listes Non Optimisées
```tsx
// ❌ MAUVAIS - ScrollView avec .map()
<ScrollView>
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</ScrollView>

// ✅ BON - FlatList avec optimisations
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={item => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 4. Images Non Optimisées
```tsx
// ❌ MAUVAIS - Images pleine résolution
<Image source={{ uri: fullResImage }} style={{ width: 100 }} />

// ✅ BON - Images optimisées
import { getOptimizedImageUri } from '@/lib/performance';

<Image
  source={{ uri: getOptimizedImageUri(fullResImage, 100) }}
  style={{ width: 100 }}
/>
```

### 5. Requêtes Non Cachées
```tsx
// ❌ MAUVAIS - Requête à chaque fois
const loadProfile = async (userId) => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
};

// ✅ BON - Avec cache
import { profileCache } from '@/lib/performance';

const loadProfile = async (userId) => {
  // Vérifier le cache
  const cached = profileCache.get(userId);
  if (cached) return cached;

  // Requête si pas en cache
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Sauvegarder en cache
  profileCache.set(userId, data);
  return data;
};
```

## 🛠️ Solutions d'Optimisation

### 1. Utiliser React.memo pour les Composants

```tsx
// Composant qui ne doit se re-render que si ses props changent
const ProductCard = memo(({ product, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{product.title}</Text>
      <Text>{product.price} FCFA</Text>
    </TouchableOpacity>
  );
});

// Usage
<ProductCard product={product} onPress={handlePress} />
```

### 2. Debounce pour les Recherches

```tsx
import { useDebounce } from '@/lib/performance';

const SearchScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <TextInput
      value={searchTerm}
      onChangeText={setSearchTerm}
      placeholder="Rechercher..."
    />
  );
};
```

### 3. Pagination pour Grandes Listes

```tsx
import { usePagination } from '@/lib/performance';

const ProductList = ({ products }) => {
  const { items, loadMore, hasMore } = usePagination(products, 20);

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ProductCard product={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={hasMore ? <ActivityIndicator /> : null}
    />
  );
};
```

### 4. Lazy Loading pour les Données

```tsx
import { useLazyLoad } from '@/lib/performance';

const ProfileScreen = ({ userId }) => {
  const { data: profile, loading } = useLazyLoad(
    async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
    [userId]
  );

  if (loading) return <LoadingSpinner />;

  return <ProfileView profile={profile} />;
};
```

### 5. InteractionManager pour Animations

```tsx
import { useInteractionManager } from '@/lib/performance';

const AnimatedScreen = () => {
  const [dataLoaded, setDataLoaded] = useState(false);

  // Charger les données après les animations
  useInteractionManager(() => {
    loadHeavyData().then(() => setDataLoaded(true));
  }, []);

  return <View>{dataLoaded && <Content />}</View>;
};
```

## 📊 Optimisations par Écran

### Profile Screen

```tsx
// Avant
const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  return (/* ... */);
};

// Après (Optimisé)
const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  // Charger profil en priorité
  useEffect(() => {
    loadProfile();
  }, []);

  // Charger stats après les interactions
  useInteractionManager(() => {
    loadStats();
  }, []);

  // Mémoriser les calculs
  const totalPoints = useMemo(
    () => profile?.panda_coins || 0,
    [profile]
  );

  // Mémoriser les callbacks
  const handleEdit = useCallback(() => {
    openEditModal();
  }, []);

  return (/* ... */);
};
```

### Product List

```tsx
// Avant
<ScrollView>
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</ScrollView>

// Après (Optimisé)
const renderProduct = useCallback(({ item }) => (
  <ProductCard product={item} />
), []);

const keyExtractor = useCallback((item) => item.id, []);

<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={keyExtractor}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
/>
```

### Live Shopping

```tsx
// Optimisations spécifiques
const LiveScreen = ({ sessionId }) => {
  // Throttle les mises à jour du chat
  const throttledUpdateChat = useThrottle((message) => {
    addMessageToChat(message);
  }, 100);

  // Debounce les réactions
  const debouncedSendReaction = useDebounce((emoji) => {
    sendReaction(sessionId, emoji);
  }, 300);

  // Pagination pour le chat
  const { items: messages } = usePagination(allMessages, 50);

  return (/* ... */);
};
```

## 🎯 Checklist d'Optimisation

### Pour Chaque Composant

- [ ] Utiliser `React.memo` si le composant reçoit les mêmes props souvent
- [ ] Utiliser `useCallback` pour les fonctions passées en props
- [ ] Utiliser `useMemo` pour les calculs coûteux
- [ ] Extraire les composants lourds en composants séparés
- [ ] Éviter les inline functions dans JSX

### Pour les Listes

- [ ] Utiliser `FlatList` au lieu de `ScrollView` + `.map()`
- [ ] Définir `getItemLayout` si la hauteur est fixe
- [ ] Utiliser `windowSize` approprié (5-10)
- [ ] Activer `removeClippedSubviews`
- [ ] Implémenter la pagination pour >100 items

### Pour les Images

- [ ] Utiliser `getOptimizedImageUri` pour redimensionner
- [ ] Précharger les images critiques avec `preloadImages`
- [ ] Utiliser `resizeMode="cover"` plutôt que `contain`
- [ ] Compresser les images (quality: 80%)

### Pour les Requêtes

- [ ] Implémenter le cache avec TTL
- [ ] Grouper les requêtes similaires (batch)
- [ ] Utiliser `select()` avec colonnes spécifiques
- [ ] Ajouter des index sur les colonnes filtrées
- [ ] Limiter avec `.limit()` quand possible

### Pour les Animations

- [ ] Utiliser `useNativeDriver: true`
- [ ] Charger les données lourdes après animations
- [ ] Utiliser `InteractionManager`
- [ ] Éviter les animations pendant le scroll

## 📈 Mesure de Performance

### Avant Optimisation

```tsx
import { PerformanceMonitor } from '@/lib/performance';

const MyComponent = () => {
  useEffect(() => {
    PerformanceMonitor.measureAsync('loadData', async () => {
      await loadData();
    });
  }, []);
};
```

### Console Logs

```
⏱️ [Performance] loadData: 1250ms  ❌ LENT
⏱️ [Performance] renderList: 890ms  ❌ LENT
```

### Après Optimisation

```
⏱️ [Performance] loadData: 120ms  ✅ RAPIDE
⏱️ [Performance] renderList: 45ms  ✅ RAPIDE
```

## 🚀 Quick Wins (Gains Immédiats)

### 1. Activer Hermes (Déjà fait)
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### 2. Optimiser les Images
```tsx
// Utiliser partout
import { getOptimizedImageUri } from '@/lib/performance';
```

### 3. FlatList au lieu de ScrollView
```tsx
// Remplacer tous les ScrollView avec .map()
<FlatList />
```

### 4. Cache Supabase
```tsx
// Ajouter partout
import { profileCache, productsCache } from '@/lib/performance';
```

### 5. Debounce Search
```tsx
// Dans tous les champs de recherche
const debouncedSearch = useDebounce(searchTerm, 500);
```

## 📱 Optimisations Spécifiques Mobile

### Android

```tsx
// TextInput avec Android optimization
<TextInput
  {...props}
  underlineColorAndroid="transparent"
  autoCorrect={false}
  autoCompleteType="off"
/>

// FlatList Android optimization
<FlatList
  removeClippedSubviews={true}  // Android only
  {...props}
/>
```

### iOS

```tsx
// Optimisation scrolling iOS
<FlatList
  scrollEventThrottle={16}  // 60fps
  {...props}
/>
```

## 🎓 Exemples Complets

### ProductCard Optimisé

```tsx
import React, { memo } from 'react';
import { getOptimizedImageUri } from '@/lib/performance';

const ProductCard = memo(({ product, onPress }) => {
  const optimizedImage = useMemo(
    () => getOptimizedImageUri(product.image, 200),
    [product.image]
  );

  return (
    <TouchableOpacity onPress={onPress}>
      <Image
        source={{ uri: optimizedImage }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text>{product.title}</Text>
      <Text>{product.price} FCFA</Text>
    </TouchableOpacity>
  );
});

export default ProductCard;
```

### Search Optimisé

```tsx
import { useDebounce } from '@/lib/performance';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      searchProducts(debouncedQuery).then(setResults);
    }
  }, [debouncedQuery]);

  return (
    <>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher..."
      />
      <FlatList
        data={results}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
      />
    </>
  );
};
```

## 🔧 Outils de Debug

### React DevTools Profiler

```bash
# Installer React DevTools
npm install -g react-devtools

# Lancer
react-devtools
```

### Performance Monitor

```tsx
// Activer dans dev
import { PerformanceMonitor } from '@/lib/performance';

// Mesurer partout
PerformanceMonitor.start('screenRender');
// ... code ...
PerformanceMonitor.end('screenRender');
```

### Flipper (Recommandé)

```bash
# Installer Flipper
# https://fbflipper.com/

# Activer dans l'app
# Voir les renders, network, etc.
```

## 📊 Résultats Attendus

### Avant Optimisation
- Temps de chargement: 3-5s
- FPS pendant scroll: 30-40fps
- Mémoire utilisée: 200-300MB
- Re-renders inutiles: ~50%

### Après Optimisation
- Temps de chargement: 1-2s ✅ (-60%)
- FPS pendant scroll: 55-60fps ✅ (+50%)
- Mémoire utilisée: 150-200MB ✅ (-30%)
- Re-renders inutiles: ~10% ✅ (-80%)

## 🎯 Plan d'Action

### Phase 1: Quick Wins (1 jour)
1. ✅ Créer `lib/performance.ts`
2. ⏳ Remplacer ScrollView par FlatList
3. ⏳ Ajouter cache Supabase
4. ⏳ Optimiser images
5. ⏳ Debounce search

### Phase 2: Composants (2-3 jours)
1. ⏳ Mémoriser tous les composants lourds
2. ⏳ Ajouter useCallback partout
3. ⏳ useMemo pour calculs
4. ⏳ Pagination grandes listes

### Phase 3: Requêtes (1-2 jours)
1. ⏳ Cache avec TTL
2. ⏳ Batch queries
3. ⏳ Index Supabase
4. ⏳ Optimiser selects

### Phase 4: Tests (1 jour)
1. ⏳ Mesurer avec PerformanceMonitor
2. ⏳ Profiler React DevTools
3. ⏳ Tests utilisateurs
4. ⏳ Ajustements finaux

---

**Date**: 3 Janvier 2026
**Objectif**: Performances +200%
**Status**: 🚧 En cours
**Priority**: 🔥 HAUTE
