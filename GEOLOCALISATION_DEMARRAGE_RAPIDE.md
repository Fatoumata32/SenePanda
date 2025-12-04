# 🚀 GÉOLOCALISATION AVEC PRIORITÉ PREMIUM - DÉMARRAGE RAPIDE

## ✅ TOUT EST PRÊT!

Système complet de géolocalisation qui **priorise automatiquement les vendeurs premium** dans les résultats de recherche.

---

## 🎯 Comment ça marche?

### Priorité de tri automatique:

```
1. ⭐ Vendeurs PREMIUM (affichés EN PREMIER, même si + loin)
2. 💜 Vendeurs PRO
3. 💙 Vendeurs STARTER
4. ⚪ Vendeurs GRATUITS (affichés EN DERNIER, même s'ils sont à 100m!)
```

**Au sein de chaque catégorie:** tri par distance croissante, puis note.

---

## 📋 INSTALLATION (3 étapes - 5 minutes)

### Étape 1️⃣ : Exécuter la Migration SQL (2 min)

```bash
# Aller dans Supabase Dashboard > SQL Editor
# Copier TOUT le fichier: supabase/migrations/add_geolocation_system.sql
# Coller et cliquer RUN
```

**Message attendu:**
```
✅ SYSTÈME DE GÉOLOCALISATION INSTALLÉ
  • Colonnes ajoutées: latitude, longitude, location_updated_at
  • Fonction calculate_distance() créée
  • Fonction find_nearby_sellers() créée (avec priorité premium!)
  • Fonction find_nearby_products() créée
  • Index de performance créés
```

### Étape 2️⃣ : Tester les Fonctions SQL (1 min)

```sql
-- Test 1: Trouver des vendeurs dans un rayon de 10 km
SELECT * FROM find_nearby_sellers(14.6928, -17.4467, 10, 20);

-- Résultat: Vendeurs PREMIUM en premier, puis PRO, puis STARTER, puis FREE
```

### Étape 3️⃣ : Utiliser dans votre App (2 min)

```tsx
import { useUserLocation } from '@/hooks/useUserLocation';
import NearbySellersGrid from '@/components/NearbySellersGrid';

function HomeScreen() {
  // Récupérer la position de l'utilisateur et sauvegarder automatiquement
  const { coords } = useUserLocation(true, true);

  if (!coords) return <LoadingScreen />;

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

**Résultat automatique:**
- ✅ Badge "PREMIUM" en orange sur les vendeurs premium
- ✅ Badge "PRO" en violet sur les vendeurs pro
- ✅ Badge "STARTER" en bleu sur les vendeurs starter
- ✅ Distance affichée (ex: "2.5 km")
- ✅ **Vendeurs PREMIUM TOUJOURS EN PREMIER**

---

## 📁 FICHIERS CRÉÉS

### Backend (SQL)
- ✅ `supabase/migrations/add_geolocation_system.sql` (script principal)
  - Ajoute colonnes `latitude`, `longitude`, `location_updated_at`
  - Crée fonction `find_nearby_sellers()` avec **priorité premium**
  - Crée fonction `find_nearby_products()` avec **priorité premium**
  - Crée fonction `update_user_location()`
  - Crée indexes de performance

### Frontend (TypeScript/React Native)
- ✅ `types/database.ts` mis à jour
  - Types `NearbySeller`, `NearbyProduct`, `LocationUpdateResponse`
  - Type `Profile` avec `latitude`, `longitude`

- ✅ `lib/geolocation.ts` (service principal)
  - `findNearbySellers()` - Chercher vendeurs proches
  - `findNearbyProducts()` - Chercher produits proches
  - `updateUserLocation()` - Sauvegarder localisation
  - `calculateDistance()` - Calculer distance
  - `formatDistance()` - Formater distance
  - `getPremiumBadge()` - Obtenir infos badge premium

- ✅ `hooks/useUserLocation.ts` (hook avancé)
  - Récupère position GPS
  - Sauvegarde automatiquement dans Supabase
  - Gère les permissions
  - État `isSaved` pour savoir si la localisation est sauvegardée

- ✅ `components/NearbySellersGrid.tsx` (UI)
  - Grille de vendeurs avec badge premium
  - Distance affichée
  - Note et avis
  - Badge vérifié (✓)
  - **Tri automatique par priorité premium**

### Documentation
- ✅ `GEOLOCALISATION_GUIDE.md` (guide complet - 500+ lignes)
- ✅ `GEOLOCALISATION_DEMARRAGE_RAPIDE.md` (ce fichier)

---

## 🎨 EXEMPLE D'UTILISATION COMPLET

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUserLocation } from '@/hooks/useUserLocation';
import NearbySellersGrid from '@/components/NearbySellersGrid';

export default function NearbyVendorsScreen() {
  const {
    coords,
    address,
    city,
    isLoading,
    hasPermission,
    isSaved,
    requestAndSaveLocation,
  } = useUserLocation();

  useEffect(() => {
    // Demander et sauvegarder la localisation au montage
    requestAndSaveLocation();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Recherche de votre position...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Permission de localisation requise</Text>
      </View>
    );
  }

  if (!coords) {
    return (
      <View style={styles.center}>
        <Text>Impossible d'obtenir votre position</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Informations de localisation */}
      <View style={styles.header}>
        <Text style={styles.title}>Vendeurs près de vous</Text>
        {city && <Text style={styles.subtitle}>{city}</Text>}
        {address && <Text style={styles.address}>{address}</Text>}
        <Text style={styles.saved}>
          {isSaved ? '✅ Localisation sauvegardée' : '⏳ En cours de sauvegarde...'}
        </Text>
      </View>

      {/* Grille de vendeurs proches */}
      <NearbySellersGrid
        userLatitude={coords.latitude}
        userLongitude={coords.longitude}
        maxDistance={20}
        limit={20}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  address: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  saved: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
  },
});
```

---

## 🔍 ALGORITHME DE PRIORITÉ

### Logique de tri (dans find_nearby_sellers):

```sql
ORDER BY
  -- 1️⃣ PRIORITÉ MAXIMALE: Plan d'abonnement
  CASE
    WHEN subscription_plan = 'premium' THEN 1  -- ⭐ TOUJOURS EN PREMIER
    WHEN subscription_plan = 'pro' THEN 2
    WHEN subscription_plan = 'starter' THEN 3
    ELSE 4  -- Plan gratuit en DERNIER
  END ASC,

  -- 2️⃣ Distance (plus proche = mieux)
  distance_km ASC,

  -- 3️⃣ Note moyenne (meilleure = mieux)
  average_rating DESC
```

### Exemple concret:

```
┌──────────────┬──────────┬──────────┬──────┬──────────────┐
│ Vendeur      │ Plan     │ Distance │ Note │ Position     │
├──────────────┼──────────┼──────────┼──────┼──────────────┤
│ Boutique A   │ Premium  │ 15 km    │ 4.5  │ 1️⃣ ⭐ Premier │
│ Boutique B   │ Premium  │ 8 km     │ 4.2  │ 2️⃣ ⭐        │
│ Boutique C   │ Pro      │ 3 km     │ 4.8  │ 3️⃣ 💜        │
│ Boutique D   │ Starter  │ 1.5 km   │ 4.9  │ 4️⃣ 💙        │
│ Boutique E   │ Free     │ 0.2 km   │ 5.0  │ 5️⃣ Dernier!  │
└──────────────┴──────────┴──────────┴──────┴──────────────┘

⚠️ Boutique E est à seulement 200m mais affichée EN DERNIER
    car elle est en plan gratuit!

✅ Boutiques A et B (premium) affichées EN PREMIER
    même si elles sont à 15 km et 8 km!
```

---

## 🎯 FONCTIONS CLÉS

### 1. Chercher des vendeurs proches

```tsx
import { findNearbySellers } from '@/lib/geolocation';

const sellers = await findNearbySellers(
  14.6928,  // Latitude utilisateur
  -17.4467, // Longitude utilisateur
  50,       // Distance max: 50 km
  20        // Limite: 20 résultats
);

// Résultat: Vendeurs PREMIUM en premier automatiquement
```

### 2. Chercher des produits proches

```tsx
import { findNearbyProducts } from '@/lib/geolocation';

const products = await findNearbyProducts(
  14.6928,
  -17.4467,
  30,          // 30 km de rayon
  'categoryId', // Optionnel: filtrer par catégorie
  50
);

// Résultat: Produits des vendeurs PREMIUM en premier
```

### 3. Sauvegarder la localisation

```tsx
import { updateUserLocation } from '@/lib/geolocation';

const result = await updateUserLocation(
  userId,
  14.6928,
  -17.4467,
  'Adresse complète',
  'Dakar'
);

if (result.success) {
  console.log('✅ Localisation sauvegardée');
}
```

---

## 🎨 BADGES PREMIUM

### Badge PREMIUM (⭐ orange/gold)
```tsx
{
  label: 'PREMIUM',
  color: '#FFFFFF',
  bgColor: '#F59E0B', // Orange/Gold
  icon: 'star'
}
```

### Badge PRO (💜 violet)
```tsx
{
  label: 'PRO',
  color: '#FFFFFF',
  bgColor: '#8B5CF6', // Violet
  icon: 'trending-up'
}
```

### Badge STARTER (💙 bleu)
```tsx
{
  label: 'STARTER',
  color: '#FFFFFF',
  bgColor: '#3B82F6', // Bleu
  icon: 'flash'
}
```

---

## ✅ CHECKLIST FINALE

- [ ] Migration SQL exécutée dans Supabase
- [ ] Test: `SELECT * FROM find_nearby_sellers(14.6928, -17.4467, 10, 20);`
- [ ] Résultat: vendeurs premium en premier ✅
- [ ] Hook `useUserLocation` importé dans l'app
- [ ] Composant `NearbySellersGrid` ajouté à la page d'accueil
- [ ] Badge "PREMIUM" visible sur les vendeurs premium
- [ ] Distance affichée correctement (ex: "2.5 km")
- [ ] Permissions de localisation configurées (iOS + Android)
- [ ] Test sur appareil réel effectué

---

## 📊 RÉSULTAT FINAL

### Ce que l'utilisateur voit:

1. **Page d'accueil:**
   - Liste de vendeurs proches
   - Badge **"PREMIUM"** ⭐ en orange sur les abonnés premium
   - Badge **"PRO"** 💜 en violet sur les abonnés pro
   - Badge **"STARTER"** 💙 en bleu sur les abonnés starter
   - Distance (ex: "2.5 km" ou "500 m")
   - Note et avis (ex: "4.8 ⭐ (127)")
   - Ville (ex: "Dakar")

2. **Ordre garanti:**
   - ⭐ **Vendeurs PREMIUM toujours en premier**
   - 💜 Puis vendeurs PRO
   - 💙 Puis vendeurs STARTER
   - ⚪ Puis vendeurs gratuits (même s'ils sont plus proches!)

3. **Automatique:**
   - Localisation récupérée automatiquement
   - Sauvegarde automatique dans Supabase
   - Tri automatique par priorité premium
   - Pas besoin d'intervention de l'utilisateur

---

## 🆘 DÉPANNAGE

### Problème: "Aucun vendeur trouvé"

**Solutions:**
1. Vérifier que des vendeurs ont des coordonnées GPS dans la base:
   ```sql
   SELECT COUNT(*) FROM profiles
   WHERE is_seller = TRUE
     AND latitude IS NOT NULL
     AND longitude IS NOT NULL;
   ```

2. Augmenter le rayon de recherche:
   ```tsx
   <NearbySellersGrid maxDistance={100} /> // 100 km au lieu de 20
   ```

3. Ajouter manuellement des coordonnées de test:
   ```sql
   UPDATE profiles
   SET latitude = 14.6928, longitude = -17.4467
   WHERE id = 'seller-id';
   ```

### Problème: "Permission refusée"

**Solutions:**
1. Vérifier `app.json`:
   ```json
   {
     "android": {
       "permissions": ["ACCESS_FINE_LOCATION"]
     },
     "ios": {
       "infoPlist": {
         "NSLocationWhenInUseUsageDescription": "Message ici"
       }
     }
   }
   ```

2. Redemander la permission:
   ```tsx
   await requestAndSaveLocation();
   ```

### Problème: "Vendeurs premium pas en premier"

**Cause:** Les vendeurs n'ont probablement pas de `subscription_plan` défini.

**Solution:**
```sql
-- Vérifier les plans:
SELECT id, shop_name, subscription_plan, latitude, longitude
FROM profiles
WHERE is_seller = TRUE;

-- Mettre à jour un vendeur en premium:
UPDATE profiles
SET subscription_plan = 'premium'
WHERE id = 'seller-id';
```

---

## 📖 DOCUMENTATION COMPLÈTE

Pour plus de détails, consultez: **`GEOLOCALISATION_GUIDE.md`**

Contient:
- Exemples de code complets
- Tous les helpers et utilitaires
- Tests SQL détaillés
- Configuration des permissions
- API complète de toutes les fonctions

---

**✨ Le système de géolocalisation avec priorité premium est maintenant opérationnel!**

**🚀 Les vendeurs PREMIUM sont TOUJOURS affichés en PREMIER, quel que soit leur distance!**

**🎯 Cela encourage fortement les vendeurs à prendre un abonnement premium pour être plus visibles!**
