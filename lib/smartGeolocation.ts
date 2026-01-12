/**
 * =============================================
 * SERVICE DE GÉOLOCALISATION SMART
 * =============================================
 *
 * Fonctionnalités intelligentes:
 * - Détection automatique du quartier/zone
 * - Suggestions contextuelles basées sur la localisation
 * - Estimation de temps de livraison
 * - Zones de livraison des vendeurs
 * - Cache intelligent pour économiser la batterie
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { calculateDistance, formatDistance } from './geolocation';

// Types
export interface SmartLocation {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  address: string | null;
  city: string | null;
  neighborhood: string | null; // Quartier
  postalCode: string | null;
  country: string;
  timestamp: number;
}

export interface DeliveryEstimate {
  distanceKm: number;
  distanceFormatted: string;
  estimatedMinutes: number;
  estimatedTimeText: string;
  deliveryFee: number;
  canDeliver: boolean;
  reason?: string;
}

export interface ZoneInfo {
  name: string;
  type: 'urban' | 'suburban' | 'rural';
  popularAreas: string[];
  deliverySpeed: 'fast' | 'normal' | 'slow';
}

// =============================================
// CONSTANTES
// =============================================

const CACHE_KEY = 'smart_location_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const DAKAR_BOUNDS = {
  north: 14.8,
  south: 14.6,
  east: -17.3,
  west: -17.6,
};

// Quartiers de Dakar et environs
const DAKAR_NEIGHBORHOODS: Record<string, ZoneInfo> = {
  'Plateau': {
    name: 'Plateau',
    type: 'urban',
    popularAreas: ['Centre-ville', 'Place de l\'Indépendance'],
    deliverySpeed: 'fast',
  },
  'Médina': {
    name: 'Médina',
    type: 'urban',
    popularAreas: ['Marché Sandaga', 'Tilène'],
    deliverySpeed: 'fast',
  },
  'Parcelles Assainies': {
    name: 'Parcelles Assainies',
    type: 'urban',
    popularAreas: ['Unité 1', 'Unité 10', 'Unité 25'],
    deliverySpeed: 'normal',
  },
  'Almadies': {
    name: 'Almadies',
    type: 'suburban',
    popularAreas: ['Ngor', 'Yoff', 'Ouakam'],
    deliverySpeed: 'normal',
  },
  'Grand Dakar': {
    name: 'Grand Dakar',
    type: 'urban',
    popularAreas: ['HLM', 'Grand Yoff'],
    deliverySpeed: 'fast',
  },
  'Pikine': {
    name: 'Pikine',
    type: 'suburban',
    popularAreas: ['Thiaroye', 'Guinaw Rails'],
    deliverySpeed: 'normal',
  },
  'Guédiawaye': {
    name: 'Guédiawaye',
    type: 'suburban',
    popularAreas: ['Golf Sud', 'Sam Notaire'],
    deliverySpeed: 'normal',
  },
  'Rufisque': {
    name: 'Rufisque',
    type: 'rural',
    popularAreas: ['Bargny', 'Diamniadio'],
    deliverySpeed: 'slow',
  },
};

// =============================================
// CACHE
// =============================================

/**
 * Récupère la localisation depuis le cache
 */
async function getCachedLocation(): Promise<SmartLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const location: SmartLocation = JSON.parse(cached);
    const age = Date.now() - location.timestamp;

    if (age < CACHE_DURATION) {
      console.log('📍 Localisation depuis le cache (âge:', Math.round(age / 1000), 's)');
      return location;
    }

    return null;
  } catch (error) {
    console.error('Erreur lecture cache:', error);
    return null;
  }
}

/**
 * Sauvegarde la localisation dans le cache
 */
async function cacheLocation(location: SmartLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(location));
    console.log('✅ Localisation mise en cache');
  } catch (error) {
    console.error('Erreur sauvegarde cache:', error);
  }
}

// =============================================
// DÉTECTION DE QUARTIER
// =============================================

/**
 * Détermine le quartier approximatif basé sur les coordonnées
 */
function detectNeighborhood(
  latitude: number,
  longitude: number,
  addressComponents?: any
): string | null {
  // Vérifier si on est dans les limites de Dakar
  if (
    latitude < DAKAR_BOUNDS.south ||
    latitude > DAKAR_BOUNDS.north ||
    longitude < DAKAR_BOUNDS.west ||
    longitude > DAKAR_BOUNDS.east
  ) {
    return null;
  }

  // Logique simple de détection par zone géographique
  // Zone Plateau (centre)
  if (latitude >= 14.66 && latitude <= 14.69 && longitude >= -17.47 && longitude <= -17.43) {
    return 'Plateau';
  }

  // Zone Almadies (ouest)
  if (latitude >= 14.72 && latitude <= 14.78 && longitude >= -17.52 && longitude <= -17.45) {
    return 'Almadies';
  }

  // Zone Parcelles Assainies (nord-est)
  if (latitude >= 14.74 && latitude <= 14.79 && longitude >= -17.42 && longitude <= -17.35) {
    return 'Parcelles Assainies';
  }

  // Zone Médina (proche centre)
  if (latitude >= 14.68 && latitude <= 14.71 && longitude >= -17.46 && longitude <= -17.43) {
    return 'Médina';
  }

  // Zone Pikine (est)
  if (latitude >= 14.72 && latitude <= 14.78 && longitude >= -17.38 && longitude <= -17.30) {
    return 'Pikine';
  }

  // Zone Guédiawaye (nord)
  if (latitude >= 14.77 && latitude <= 14.82 && longitude >= -17.42 && longitude <= -17.35) {
    return 'Guédiawaye';
  }

  return null;
}

/**
 * Obtient les informations de zone pour un quartier
 */
export function getZoneInfo(neighborhood: string | null): ZoneInfo | null {
  if (!neighborhood) return null;
  return DAKAR_NEIGHBORHOODS[neighborhood] || null;
}

// =============================================
// LOCALISATION SMART
// =============================================

/**
 * Obtient la localisation intelligente de l'utilisateur
 * avec cache et détection de quartier
 */
export async function getSmartLocation(
  forceRefresh: boolean = false
): Promise<SmartLocation | null> {
  try {
    // 1. Vérifier le cache si pas de refresh forcé
    if (!forceRefresh) {
      const cached = await getCachedLocation();
      if (cached) return cached;
    }

    // 2. Vérifier les permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Permission de localisation refusée');
      return null;
    }

    console.log('🌍 Récupération de la localisation GPS...');

    // 3. Obtenir la position GPS
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Balance entre précision et batterie
    });

    const { latitude, longitude, accuracy } = position.coords;

    // 4. Géocodage inversé pour obtenir l'adresse
    let address = null;
    let city = null;
    let postalCode = null;

    try {
      const geocoded = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocoded && geocoded[0]) {
        const location = geocoded[0];
        address = [
          location.name,
          location.street,
          location.district,
        ].filter(Boolean).join(', ');

        city = location.city || location.subregion || 'Dakar';
        postalCode = location.postalCode;
      }
    } catch (geocodeError) {
      console.warn('Géocodage inversé échoué:', geocodeError);
    }

    // 5. Détecter le quartier
    const neighborhood = detectNeighborhood(latitude, longitude);

    // 6. Construire l'objet SmartLocation
    const smartLocation: SmartLocation = {
      coords: {
        latitude,
        longitude,
        accuracy,
      },
      address,
      city,
      neighborhood,
      postalCode,
      country: 'Sénégal',
      timestamp: Date.now(),
    };

    // 7. Mettre en cache
    await cacheLocation(smartLocation);

    console.log('✅ Localisation smart obtenue:', {
      city,
      neighborhood,
      accuracy: accuracy ? `${Math.round(accuracy)}m` : 'N/A',
    });

    return smartLocation;
  } catch (error) {
    console.error('❌ Erreur getSmartLocation:', error);
    return null;
  }
}

// =============================================
// ESTIMATION DE LIVRAISON
// =============================================

/**
 * Calcule l'estimation de livraison basée sur la distance
 */
export function estimateDelivery(
  userLocation: SmartLocation,
  sellerLatitude: number,
  sellerLongitude: number,
  sellerNeighborhood?: string | null
): DeliveryEstimate {
  const distanceKm = calculateDistance(
    userLocation.coords.latitude,
    userLocation.coords.longitude,
    sellerLatitude,
    sellerLongitude
  );

  const distanceFormatted = formatDistance(distanceKm);

  // Déterminer le type de zone
  const userZone = getZoneInfo(userLocation.neighborhood);
  const sellerZone = getZoneInfo(sellerNeighborhood || null);

  // Vitesse moyenne de livraison (km/h)
  let speedKmH = 15; // Vitesse par défaut (moto en ville)

  // Ajuster selon les zones
  if (userZone?.deliverySpeed === 'fast' && sellerZone?.deliverySpeed === 'fast') {
    speedKmH = 20; // Zones urbaines rapides
  } else if (userZone?.deliverySpeed === 'slow' || sellerZone?.deliverySpeed === 'slow') {
    speedKmH = 10; // Zones rurales plus lentes
  }

  // Temps estimé en minutes
  const estimatedMinutes = Math.ceil((distanceKm / speedKmH) * 60);

  // Texte formaté
  let estimatedTimeText = '';
  if (estimatedMinutes < 30) {
    estimatedTimeText = `${estimatedMinutes} minutes`;
  } else if (estimatedMinutes < 60) {
    estimatedTimeText = '30-60 minutes';
  } else {
    const hours = Math.ceil(estimatedMinutes / 60);
    estimatedTimeText = `${hours}h`;
  }

  // Frais de livraison (basé sur la distance)
  let deliveryFee = 0;
  if (distanceKm <= 5) {
    deliveryFee = 500; // 500 FCFA pour moins de 5km
  } else if (distanceKm <= 10) {
    deliveryFee = 1000; // 1000 FCFA pour 5-10km
  } else if (distanceKm <= 20) {
    deliveryFee = 2000; // 2000 FCFA pour 10-20km
  } else {
    deliveryFee = 3000; // 3000 FCFA pour plus de 20km
  }

  // Vérifier si la livraison est possible
  const maxDistance = 50; // 50 km max
  const canDeliver = distanceKm <= maxDistance;
  const reason = !canDeliver ? `Distance trop grande (max ${maxDistance}km)` : undefined;

  return {
    distanceKm,
    distanceFormatted,
    estimatedMinutes,
    estimatedTimeText,
    deliveryFee,
    canDeliver,
    reason,
  };
}

// =============================================
// SUGGESTIONS SMART
// =============================================

/**
 * Obtient des suggestions de recherche basées sur la localisation
 */
export async function getLocationBasedSuggestions(
  location: SmartLocation
): Promise<string[]> {
  const suggestions: string[] = [];

  // Suggestions basées sur le quartier
  if (location.neighborhood) {
    const zone = getZoneInfo(location.neighborhood);
    if (zone) {
      suggestions.push(`Vendeurs à ${zone.name}`);
      suggestions.push(`Livraison rapide ${zone.name}`);
    }
  }

  // Suggestions basées sur la ville
  if (location.city) {
    suggestions.push(`Vendeurs à ${location.city}`);
  }

  // Suggestions générales de proximité
  suggestions.push('Vendeurs à moins de 5 km');
  suggestions.push('Livraison rapide près de moi');

  return suggestions;
}

// =============================================
// SAUVEGARDE DANS SUPABASE
// =============================================

/**
 * Sauvegarde la localisation smart dans Supabase
 */
export async function saveSmartLocation(
  userId: string,
  location: SmartLocation
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('update_user_location', {
      p_user_id: userId,
      p_latitude: location.coords.latitude,
      p_longitude: location.coords.longitude,
      p_address: location.address,
      p_city: location.city || 'Dakar',
    });

    if (error) {
      console.error('Erreur sauvegarde localisation:', error);
      return { success: false, error: error.message };
    }

    // Sauvegarder aussi le quartier dans le profil si disponible
    if (location.neighborhood) {
      await supabase
        .from('profiles')
        .update({ location: `${location.neighborhood}, ${location.city}` })
        .eq('id', userId);
    }

    console.log('✅ Localisation smart sauvegardée');
    return { success: true };
  } catch (error: any) {
    console.error('Erreur saveSmartLocation:', error);
    return { success: false, error: error.message };
  }
}

// =============================================
// HELPERS
// =============================================

/**
 * Formate une adresse pour l'affichage
 */
export function formatLocationDisplay(location: SmartLocation): string {
  const parts: string[] = [];

  if (location.neighborhood) {
    parts.push(location.neighborhood);
  }

  if (location.city && location.city !== location.neighborhood) {
    parts.push(location.city);
  }

  return parts.length > 0 ? parts.join(', ') : 'Localisation inconnue';
}

/**
 * Obtient une icône emoji selon le type de zone
 */
export function getZoneEmoji(neighborhood: string | null): string {
  if (!neighborhood) return '📍';

  const zone = getZoneInfo(neighborhood);
  if (!zone) return '📍';

  switch (zone.type) {
    case 'urban':
      return '🏙️';
    case 'suburban':
      return '🏘️';
    case 'rural':
      return '🌳';
    default:
      return '📍';
  }
}