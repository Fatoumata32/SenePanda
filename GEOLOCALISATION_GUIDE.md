# 📍 GUIDE DU SYSTÈME DE GÉOLOCALISATION

## 🎯 Vue d'ensemble

Le système de géolocalisation permet de **trouver les vendeurs et produits les plus proches** de l'acheteur, avec une **priorité automatique aux vendeurs premium**.

### Priorité de tri automatique:
1. **Abonnés Premium** (⭐ affichés en premier)
2. **Abonnés Pro**
3. **Abonnés Starter**
4. **Vendeurs gratuits** (affichés en dernier)

Au sein de chaque catégorie, les vendeurs sont triés par:
- Distance (plus proche en premier)
- Note moyenne
- Nombre d'avis

---

## 🚀 DÉMARRAGE RAPIDE (3 étapes)

### Étape 1️⃣ : Exécuter la Migration SQL

```bash
# Dans Supabase Dashboard > SQL Editor
# Copier et exécuter: supabase/migrations/add_geolocation_system.sql
```

**Résultat attendu:**
```
✅ SYSTÈME DE GÉOLOCALISATION INSTALLÉ
✅ Colonnes ajoutées: latitude, longitude, location_updated_at
✅ Fonction calculate_distance() créée
✅ Fonction find_nearby_sellers() créée
✅ Fonction find_nearby_products() créée
```

### Étape 2️⃣ : Utiliser le Hook dans votre composant

```tsx
import { useUserLocation } from '@/hooks/useUserLocation';

function MyComponent() {
  const { coords, address, requestAndSaveLocation, isSaved } = useUserLocation(true, true);

  useEffect(() => {
    requestAndSaveLocation();
  }, []);

  return (
    <View>
      {coords && (
        <Text>Position: {coords.latitude}, {coords.longitude}</Text>
      )}
      <Text>Sauvegardé: {isSaved ? 'Oui' : 'Non'}</Text>
    </View>
  );
}
```

### Étape 3️⃣ : Afficher les Vendeurs Proches

```tsx
import NearbySellersGrid from '@/components/NearbySellersGrid';

function HomePage() {
  const { coords } = useUserLocation(true, true);

  if (!coords) return <Loading />;

  return (
    <NearbySellersGrid
      userLatitude={coords.latitude}
      userLongitude={coords.longitude}
      maxDistance={20} // 20 km de rayon
      limit={20}
    />
  );
}
```

---

## 📚 FONCTIONNALITÉS

### 1. Recherche de Vendeurs Proches

**Fonction SQL:** `find_nearby_sellers()`

```tsx
import { findNearbySellers } from '@/lib/geolocation';

const sellers = await findNearbySellers(
  14.6928,  // Latitude utilisateur
  -17.4467, // Longitude utilisateur
  50,       // Distance max: 50 km
  20        // Limite: 20 résultats
);

// Résultat automatiquement trié:
// 1. Vendeurs Premium (⭐)
// 2. Vendeurs Pro
// 3. Vendeurs Starter
// 4. Vendeurs gratuits
// Dans chaque catégorie: par distance croissante
```

**Résultat:**
```typescript
[
  {
    seller_id: "...",
    shop_name: "Boutique Premium",
    distance_km: 2.5,
    subscription_plan: "premium", // ⭐ Priorité 1
    average_rating: 4.8,
    ...
  },
  {
    seller_id: "...",
    shop_name: "Boutique Pro",
    distance_km: 1.8,
    subscription_plan: "pro", // Priorité 2
    average_rating: 4.5,
    ...
  },
  {
    seller_id: "...",
    shop_name: "Boutique Free",
    distance_km: 0.5,
    subscription_plan: null, // Priorité 4 (même si plus proche!)
    average_rating: 4.9,
    ...
  }
]
```

### 2. Recherche de Produits Proches

**Fonction SQL:** `find_nearby_products()`

```tsx
import { findNearbyProducts } from '@/lib/geolocation';

const products = await findNearbyProducts(
  14.6928,     // Latitude utilisateur
  -17.4467,    // Longitude utilisateur
  30,          // Distance max: 30 km
  'category-id', // Optionnel: filtrer par catégorie
  50           // Limite: 50 résultats
);

// Résultat trié de la même façon:
// Produits des vendeurs premium en premier
```

### 3. Mise à Jour de Localisation

**Fonction SQL:** `update_user_location()`

```tsx
import { updateUserLocation } from '@/lib/geolocation';

const result = await updateUserLocation(
  userId,
  14.6928,  // Latitude
  -17.4467, // Longitude
  'Rue de la République, Dakar', // Adresse
  'Dakar'   // Ville
);

if (result.success) {
  console.log('✅ Localisation sauvegardée');
}
```

### 4. Calcul de Distance

```tsx
import { calculateDistance, formatDistance } from '@/lib/geolocation';

// Calculer la distance
const distanceKm = calculateDistance(
  14.6928, -17.4467, // Point 1
  14.7646, -17.3673  // Point 2
);
// => 12.5 km

// Formater pour l'affichage
const formatted = formatDistance(distanceKm);
// => "12.5 km"

const formatted2 = formatDistance(0.8);
// => "800 m"
```

---

## 🎨 COMPOSANTS UI

### NearbySellersGrid

Composant clé pour afficher les vendeurs proches avec badges premium.

```tsx
<NearbySellersGrid
  userLatitude={coords.latitude}
  userLongitude={coords.longitude}
  maxDistance={50}  // Rayon en km
  limit={20}        // Nombre max de vendeurs
  onSellerPress={(sellerId) => {
    router.push(`/seller/${sellerId}`);
  }}
/>
```

**Affichage automatique:**
- ✅ Badge "PREMIUM" / "PRO" / "STARTER" en haut à gauche
- ✅ Distance affichée (ex: "2.5 km")
- ✅ Badge vérifié (✓) si `verified_seller = true`
- ✅ Note et nombre d'avis
- ✅ Nom de la boutique et ville
- ✅ Tri automatique par priorité premium

---

## 🔧 HOOKS DISPONIBLES

### useLocation

Hook de base pour la géolocalisation (déjà existant).

```tsx
import { useLocation } from '@/hooks/useLocation';

const {
  coords,
  address,
  city,
  isLoading,
  hasPermission,
  requestLocation,
  calculateDistance,
  formatDistance,
} = useLocation(true); // autoRequest = true

// Demander la localisation
await requestLocation();
```

### useUserLocation (Nouveau)

Hook avancé avec sauvegarde automatique dans Supabase.

```tsx
import { useUserLocation } from '@/hooks/useUserLocation';

const {
  coords,
  address,
  city,
  isLoading,
  hasPermission,
  isSaved, // ✅ Indique si sauvegardé dans Supabase
  requestAndSaveLocation,
  saveLocation,
} = useUserLocation(
  true,  // autoRequest: demander la localisation au montage
  true   // autoSave: sauvegarder automatiquement dans Supabase
);
```

---

## 📊 STRUCTURE DE LA BASE DE DONNÉES

### Colonnes ajoutées à `profiles`:

```sql
latitude              DOUBLE PRECISION  -- GPS latitude
longitude             DOUBLE PRECISION  -- GPS longitude
location_updated_at   TIMESTAMP         -- Dernière mise à jour
```

### Fonctions SQL créées:

```sql
calculate_distance(lat1, lon1, lat2, lon2) → DOUBLE PRECISION
  -- Calcule la distance en km (formule Haversine)

find_nearby_sellers(latitude, longitude, max_km, limit) → TABLE
  -- Trouve les vendeurs proches avec priorité premium

find_nearby_products(latitude, longitude, max_km, category_id, limit) → TABLE
  -- Trouve les produits proches avec priorité premium

update_user_location(user_id, latitude, longitude, address, city) → JSON
  -- Met à jour la localisation d'un utilisateur
```

### Vue créée:

```sql
sellers_with_location
  -- Vue de tous les vendeurs avec localisation
  -- Pré-triés par priorité premium
```

---

## 🧪 EXEMPLES D'UTILISATION

### Exemple 1: Page d'accueil avec vendeurs proches

```tsx
import { useState, useEffect } from 'react';
import { useUserLocation } from '@/hooks/useUserLocation';
import NearbySellersGrid from '@/components/NearbySellersGrid';

export default function HomeScreen() {
  const { coords, requestAndSaveLocation, isLoading } = useUserLocation();

  useEffect(() => {
    requestAndSaveLocation();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!coords) {
    return <LocationPermissionScreen />;
  }

  return (
    <ScrollView>
      <Text style={styles.title}>Vendeurs près de vous</Text>
      <NearbySellersGrid
        userLatitude={coords.latitude}
        userLongitude={coords.longitude}
        maxDistance={20}
        limit={12}
      />
    </ScrollView>
  );
}
```

### Exemple 2: Recherche de produits par proximité

```tsx
import { findNearbyProducts } from '@/lib/geolocation';

function ProductSearchScreen() {
  const { coords } = useUserLocation(true, true);
  const [products, setProducts] = useState([]);

  const searchNearby = async (categoryId?: string) => {
    if (!coords) return;

    const results = await findNearbyProducts(
      coords.latitude,
      coords.longitude,
      30, // 30 km de rayon
      categoryId,
      50
    );

    setProducts(results);
  };

  return (
    <View>
      <SearchBar onSearch={(category) => searchNearby(category)} />
      <ProductList products={products} />
    </View>
  );
}
```

### Exemple 3: Sauvegarder la localisation manuellement

```tsx
function SettingsScreen() {
  const { coords, address, saveLocation, isSaved } = useUserLocation();

  const handleUpdateLocation = async () => {
    const success = await saveLocation();
    if (success) {
      Alert.alert('Succès', 'Localisation mise à jour');
    }
  };

  return (
    <View>
      {coords && (
        <>
          <Text>Latitude: {coords.latitude}</Text>
          <Text>Longitude: {coords.longitude}</Text>
          <Text>Adresse: {address}</Text>
          <Text>Sauvegardé: {isSaved ? 'Oui' : 'Non'}</Text>

          <Button
            title="Mettre à jour ma localisation"
            onPress={handleUpdateLocation}
          />
        </>
      )}
    </View>
  );
}
```

---

## 🎯 LOGIQUE DE PRIORISATION

### Algorithme de tri des vendeurs:

```sql
ORDER BY
  -- PRIORITÉ 1: Plan d'abonnement
  CASE
    WHEN subscription_plan = 'premium' THEN 1  -- ⭐ Priorité maximale
    WHEN subscription_plan = 'pro' THEN 2
    WHEN subscription_plan = 'starter' THEN 3
    ELSE 4  -- Plan gratuit
  END ASC,

  -- PRIORITÉ 2: Distance (plus proche = mieux)
  distance_km ASC,

  -- PRIORITÉ 3: Note moyenne (meilleure note = mieux)
  average_rating DESC,

  -- PRIORITÉ 4: Nombre d'avis (plus d'avis = mieux)
  total_reviews DESC
```

**Exemple de résultat:**

| Vendeur | Plan | Distance | Note | Position |
|---------|------|----------|------|----------|
| Boutique A | Premium | 10 km | 4.5 | **1** ⭐ |
| Boutique B | Premium | 5 km | 4.2 | **2** ⭐ |
| Boutique C | Pro | 2 km | 4.8 | **3** |
| Boutique D | Free | 0.5 km | 5.0 | **4** (même si + proche!) |

---

## 🔍 HELPERS & UTILITAIRES

### getPremiumBadge()

Retourne les infos du badge premium à afficher.

```tsx
import { getPremiumBadge } from '@/lib/geolocation';

const badge = getPremiumBadge('premium');
// {
//   label: 'PREMIUM',
//   color: '#FFFFFF',
//   bgColor: '#F59E0B', // Orange/Gold
//   icon: 'star'
// }

const badge2 = getPremiumBadge('pro');
// { label: 'PRO', color: '#FFFFFF', bgColor: '#8B5CF6', icon: 'trending-up' }
```

### isValidCoordinates()

Vérifie si des coordonnées sont valides.

```tsx
import { isValidCoordinates } from '@/lib/geolocation';

isValidCoordinates(14.6928, -17.4467);  // true
isValidCoordinates(null, -17.4467);     // false
isValidCoordinates(95, -17.4467);       // false (latitude invalide)
```

### getSellerPriority()

Obtient le niveau de priorité numérique.

```tsx
import { getSellerPriority } from '@/lib/geolocation';

getSellerPriority('premium');  // 1 (priorité maximale)
getSellerPriority('pro');      // 2
getSellerPriority('starter');  // 3
getSellerPriority(null);       // 4 (plan gratuit)
```

---

## 📝 TESTS SQL

### Test 1: Trouver des vendeurs proches (Dakar)

```sql
-- Dakar: 14.6928, -17.4467
SELECT * FROM find_nearby_sellers(14.6928, -17.4467, 10, 20);
```

### Test 2: Trouver des produits électroniques proches

```sql
-- Avec filtrage par catégorie
SELECT * FROM find_nearby_products(
  14.6928,
  -17.4467,
  30,
  'category-id-electronique',
  50
);
```

### Test 3: Mettre à jour sa localisation

```sql
SELECT update_user_location(
  'user-id-ici',
  14.6928,
  -17.4467,
  'Rue de la République',
  'Dakar'
);
```

### Test 4: Calculer une distance

```sql
SELECT calculate_distance(
  14.6928, -17.4467,  -- Dakar
  14.7646, -17.3673   -- Yoff
);
-- Résultat: ~12.5 km
```

---

## 🚨 GESTION DES PERMISSIONS

### Android (app.json)

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### iOS (app.json)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "SenePanda a besoin d'accéder à votre localisation pour vous montrer les vendeurs et produits près de chez vous."
      }
    }
  }
}
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Migration SQL exécutée dans Supabase
- [ ] Colonnes `latitude`, `longitude`, `location_updated_at` ajoutées
- [ ] Fonctions SQL créées et testées
- [ ] Index de performance créés
- [ ] Types TypeScript mis à jour
- [ ] Hooks `useUserLocation` implémenté
- [ ] Service `lib/geolocation.ts` créé
- [ ] Composant `NearbySellersGrid` ajouté
- [ ] Permissions de localisation configurées (Android + iOS)
- [ ] Tests effectués sur appareil réel
- [ ] Badge premium affiché correctement
- [ ] Tri par priorité premium fonctionnel

---

## 🎉 RÉSULTAT FINAL

Quand tout est configuré, voici ce que l'utilisateur voit:

1. **Page d'accueil:**
   - Vendeurs proches affichés automatiquement
   - Badge **"PREMIUM"** en orange/gold sur les abonnés premium
   - Badge **"PRO"** en violet sur les abonnés pro
   - Badge **"STARTER"** en bleu sur les abonnés starter
   - Distance affichée (ex: "2.5 km")
   - Note et avis affichés
   - Badge vérifié (✓) si applicable

2. **Ordre d'affichage:**
   - ⭐ Vendeurs Premium **toujours en premier** (même si + loin)
   - Puis vendeurs Pro
   - Puis vendeurs Starter
   - Puis vendeurs gratuits (même s'ils sont à 100m!)

3. **Expérience utilisateur:**
   - Recherche automatique au chargement
   - Pas besoin de rafraîchir manuellement
   - Localisation sauvegardée pour la prochaine fois
   - Tri intelligent et automatique

---

**✨ Le système de géolocalisation avec priorité premium est maintenant opérationnel!**

**🚀 Les vendeurs premium sont TOUJOURS affichés en premier, quel que soit leur distance!**
