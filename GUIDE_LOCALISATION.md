# 📍 Guide de Localisation Directe

## 🎯 Fonctionnalité Implémentée

Le système de localisation GPS directe permet aux utilisateurs de partager leur position en un clic pour :
- Voir les produits disponibles près de chez eux
- Calculer les frais de livraison
- Trouver des vendeurs locaux
- Recevoir des recommandations personnalisées

---

## 📁 Fichiers Créés

### 1. **hooks/useLocation.ts**
Hook React personnalisé pour la géolocalisation

**Fonctionnalités :**
- ✅ Demande automatique de permission
- ✅ Récupération de la position GPS
- ✅ Géocodage inversé (coordonnées → adresse)
- ✅ Gestion des erreurs
- ✅ État de chargement
- ✅ Calcul de distance entre deux points

**Exemple d'utilisation :**
```typescript
import { useLocation } from '../hooks/useLocation';

function MyComponent() {
  const {
    coords,
    address,
    city,
    isLoading,
    requestLocation,
  } = useLocation();

  return (
    <View>
      <Button onPress={requestLocation} title="Obtenir ma position" />
      {coords && (
        <Text>
          Position: {coords.latitude}, {coords.longitude}
          Adresse: {address}
          Ville: {city}
        </Text>
      )}
    </View>
  );
}
```

---

### 2. **components/LocationPicker.tsx**
Composants prêts à l'emploi pour sélectionner la localisation

**Composants :**
- **LocationPicker** - Bouton pour sélectionner la position
- **LocationDisplay** - Affichage en lecture seule de la position

**Exemple LocationPicker :**
```typescript
import { LocationPicker } from '../components/LocationPicker';

<LocationPicker
  onLocationSelected={(coords, address) => {
    console.log('Position:', coords);
    console.log('Adresse:', address);
    // Sauvegarder dans Supabase
  }}
  showAddress={true}
  buttonText="📍 Utiliser ma position actuelle"
/>
```

**Exemple LocationDisplay :**
```typescript
import { LocationDisplay } from '../components/LocationPicker';

// Affiche automatiquement la position (auto-request)
<LocationDisplay />
```

---

### 3. **app/settings/edit-location.tsx**
Page complète pour modifier la localisation

**Fonctionnalités :**
- ✅ Affichage de la localisation actuelle
- ✅ Sélection de nouvelle position
- ✅ Sauvegarde dans Supabase (colonne `location` de `profiles`)
- ✅ Affichage des avantages de la localisation
- ✅ Message de confidentialité

**Navigation :**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/settings/edit-location');
```

---

## 🚀 Installation

### Package installé
```bash
npm install expo-location
```

### Configuration App.json

Ajouter les permissions dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "SenePanda a besoin d'accéder à votre localisation pour vous montrer les produits près de chez vous."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "SenePanda utilise votre localisation pour vous montrer les produits disponibles près de chez vous.",
        "NSLocationAlwaysUsageDescription": "SenePanda utilise votre localisation pour améliorer votre expérience d'achat."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

---

## 📊 Base de Données

La localisation est stockée dans la table `profiles` :

```sql
-- La colonne existe déjà (ajoutée par COMPLETE_FIX_ALL.sql)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
```

**Mise à jour :**
```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    location: address,
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

**Lecture :**
```typescript
const { data } = await supabase
  .from('profiles')
  .select('location')
  .eq('id', userId)
  .single();
```

---

## 🧪 Tests

### Test 1 : Hook useLocation
```typescript
import { useLocation } from '../hooks/useLocation';

const TestLocation = () => {
  const { coords, address, requestLocation } = useLocation();

  return (
    <View>
      <Button onPress={requestLocation} title="Test Localisation" />
      <Text>Coords: {JSON.stringify(coords)}</Text>
      <Text>Adresse: {address}</Text>
    </View>
  );
};
```

### Test 2 : LocationPicker
```typescript
import { LocationPicker } from '../components/LocationPicker';

<LocationPicker
  onLocationSelected={(coords, address) => {
    console.log('✅ Position reçue:', coords);
    console.log('✅ Adresse reçue:', address);
  }}
  showAddress={true}
/>
```

### Test 3 : Page Edit Location
```bash
# Naviguer vers la page
# Dans l'app, aller à : Paramètres > Modifier ma localisation
```

---

## 🎨 Intégration dans le Profil

Pour ajouter un bouton dans la page profil :

```typescript
// Dans app/(tabs)/profile.tsx

import { LocationDisplay } from '../components/LocationPicker';

// Dans le render
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/settings/edit-location')}
>
  <MapPin size={24} color={Colors.primary} />
  <Text>Ma Localisation</Text>
  <ChevronRight size={20} color={Colors.gray} />
</TouchableOpacity>

// Afficher la localisation actuelle
<LocationDisplay />
```

---

## 🛡️ Gestion de la Confidentialité

### Messages à l'utilisateur

**Permission refusée :**
```
"SenePanda a besoin d'accéder à votre localisation pour vous montrer
les produits et services près de chez vous."
```

**Confidentialité :**
```
"🔒 Votre position exacte n'est jamais partagée.
Seule votre ville/quartier est visible."
```

### Niveaux de précision

Le hook utilise `Location.Accuracy.Balanced` par défaut (précision moyenne, économie de batterie).

Modifier la précision :
```typescript
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High, // Haute précision
});
```

Niveaux disponibles :
- `Lowest` - Précision la plus basse
- `Low` - Basse précision
- `Balanced` - **Recommandé** - Équilibre
- `High` - Haute précision
- `Highest` - Précision maximale
- `BestForNavigation` - Pour navigation GPS

---

## 🔧 Fonctions Utilitaires

### Calculer la distance

```typescript
import { calculateDistance, formatDistance } from '../hooks/useLocation';

const distance = calculateDistance(
  userLat, userLon,
  productLat, productLon
);

console.log(formatDistance(distance)); // "2.5 km"
```

### Obtenir juste l'adresse

```typescript
const { getAddressFromCoords } = useLocation();

const address = await getAddressFromCoords(latitude, longitude);
console.log(address); // "123 Rue Example, Dakar, Sénégal"
```

---

## 📱 Utilisation Avancée

### Auto-request de la localisation

```typescript
// La localisation est demandée automatiquement au montage
const { coords, address } = useLocation(true);
```

### Vérifier la permission avant

```typescript
const { hasPermission, requestLocation } = useLocation();

if (!hasPermission) {
  Alert.alert('Permission requise', 'Veuillez activer la localisation');
} else {
  await requestLocation();
}
```

### Mise à jour continue

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    await requestLocation();
  }, 60000); // Toutes les minutes

  return () => clearInterval(interval);
}, []);
```

---

## 🎯 Cas d'Usage

### 1. Filtrer les produits par proximité

```typescript
import { calculateDistance } from '../hooks/useLocation';

const nearbyProducts = products.filter(product => {
  const distance = calculateDistance(
    userCoords.latitude,
    userCoords.longitude,
    product.seller_latitude,
    product.seller_longitude
  );
  return distance <= 10; // Dans un rayon de 10km
});
```

### 2. Calculer les frais de livraison

```typescript
const deliveryFee = calculateDeliveryFee(distance);

function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm < 5) return 1000; // 1000 FCFA
  if (distanceKm < 15) return 2000;
  if (distanceKm < 30) return 3500;
  return 5000;
}
```

### 3. Afficher la distance sur les produits

```typescript
import { formatDistance } from '../hooks/useLocation';

<Text>
  📍 {formatDistance(distance)} de vous
</Text>
```

---

## ❓ Dépannage

### Erreur : "Permission denied"

**Solution :**
- Vérifier que les permissions sont dans `app.json`
- Désinstaller et réinstaller l'app
- Vérifier les paramètres du téléphone

### Erreur : "Location not available"

**Solutions :**
1. Vérifier que le GPS est activé
2. Tester en extérieur (meilleur signal)
3. Utiliser `Accuracy.Low` au lieu de `High`

### Géocodage échoue

**Solutions :**
1. Vérifier la connexion internet
2. Vérifier que les coordonnées sont valides
3. Essayer avec des coordonnées de test connues

---

## 🚀 Prochaines Améliorations

### Suggestions

1. **Carte interactive**
   - Intégrer `react-native-maps`
   - Permettre de sélectionner manuellement sur la carte

2. **Adresses favorites**
   - Sauvegarder plusieurs adresses (maison, bureau, etc.)
   - Sélection rapide

3. **Historique des positions**
   - Tracker les déplacements pour recommandations
   - Analytics de zones populaires

4. **Géofencing**
   - Notifications quand produits disponibles près de vous
   - Alertes vendeurs locaux

---

## 📚 Ressources

### Documentation Expo Location
https://docs.expo.dev/versions/latest/sdk/location/

### API Reference
- `getCurrentPositionAsync()` - Position actuelle
- `reverseGeocodeAsync()` - Coordonnées → Adresse
- `geocodeAsync()` - Adresse → Coordonnées
- `watchPositionAsync()` - Suivi en temps réel

---

## ✅ Checklist de Déploiement

- [x] Package `expo-location` installé
- [x] Hook `useLocation` créé
- [x] Composants `LocationPicker` créés
- [x] Page `edit-location` créée
- [ ] Permissions ajoutées dans `app.json`
- [ ] Tests en conditions réelles (Android/iOS)
- [ ] Intégration dans la page profil
- [ ] Intégration dans le filtre de produits
- [ ] Calcul des frais de livraison

---

## 🎉 Résumé

**Vous pouvez maintenant :**
- ✅ Demander la localisation de l'utilisateur en 1 clic
- ✅ Afficher l'adresse complète
- ✅ Sauvegarder dans Supabase
- ✅ Calculer des distances
- ✅ Filtrer par proximité

**Fichiers créés :**
- `hooks/useLocation.ts` (Hook)
- `components/LocationPicker.tsx` (Composants)
- `app/settings/edit-location.tsx` (Page)
- `GUIDE_LOCALISATION.md` (Ce guide)

**Package installé :**
- `expo-location@^~18.0.8`

---

**Prochaine étape :** Ajouter les permissions dans `app.json` et tester sur un appareil réel ! 📱
