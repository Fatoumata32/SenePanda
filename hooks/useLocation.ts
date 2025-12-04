import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface LocationData {
  coords: LocationCoords | null;
  address: string | null;
  city: string | null;
  country: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseLocationReturn extends LocationData {
  requestLocation: () => Promise<void>;
  getCurrentPosition: () => Promise<LocationCoords | null>;
  getAddressFromCoords: (latitude: number, longitude: number) => Promise<string>;
  hasPermission: boolean;
}

/**
 * Hook personnalisé pour gérer la géolocalisation
 *
 * Fonctionnalités :
 * - Demande automatique de permission
 * - Récupération de la position GPS
 * - Géocodage inversé (coordonnées → adresse)
 * - Gestion des erreurs
 * - État de chargement
 *
 * @example
 * const { coords, address, city, requestLocation, isLoading } = useLocation();
 *
 * // Demander la localisation
 * await requestLocation();
 *
 * // Utiliser les données
 * console.log(`Position: ${coords?.latitude}, ${coords?.longitude}`);
 * console.log(`Adresse: ${address}`);
 * console.log(`Ville: ${city}`);
 */
export function useLocation(autoRequest: boolean = false): UseLocationReturn {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Vérifier la permission au montage
  useEffect(() => {
    checkPermission();
  }, []);

  // Demander automatiquement la localisation si autoRequest = true
  useEffect(() => {
    if (autoRequest && hasPermission && !coords) {
      requestLocation();
    }
  }, [autoRequest, hasPermission]);

  /**
   * Vérifier si la permission de localisation est accordée
   */
  const checkPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error('Erreur vérification permission:', err);
      return false;
    }
  };

  /**
   * Demander la permission de localisation
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        Alert.alert(
          'Permission requise',
          'SenePanda a besoin d\'accéder à votre localisation pour vous montrer les produits et services près de chez vous.',
          [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Paramètres',
              onPress: () => {
                // Ouvrir les paramètres de l'app
                Location.requestForegroundPermissionsAsync();
              },
            },
          ]
        );
        return false;
      }

      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      console.error('Erreur permission:', err);
      return false;
    }
  };

  /**
   * Obtenir la position GPS actuelle
   */
  const getCurrentPosition = async (): Promise<LocationCoords | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier/demander la permission
      const permitted = hasPermission || await requestPermission();
      if (!permitted) {
        setIsLoading(false);
        return null;
      }

      // Obtenir la position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Équilibre entre précision et vitesse
      });

      const newCoords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      setCoords(newCoords);
      return newCoords;
    } catch (err) {
      const errorMessage = 'Impossible d\'obtenir votre position';
      setError(errorMessage);
      console.error('Erreur getCurrentPosition:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Convertir des coordonnées GPS en adresse (géocodage inversé)
   */
  const getAddressFromCoords = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];

        // Construire l'adresse complète
        const parts = [
          result.streetNumber,
          result.street,
          result.district,
          result.city,
          result.region,
          result.country,
        ].filter(Boolean);

        const fullAddress = parts.join(', ');

        // Mettre à jour les états
        setAddress(fullAddress);
        setCity(result.city || result.region || null);
        setCountry(result.country || null);

        return fullAddress;
      }

      return 'Adresse non disponible';
    } catch (err) {
      console.error('Erreur géocodage inversé:', err);
      return 'Adresse non disponible';
    }
  };

  /**
   * Demander la localisation complète (coordonnées + adresse)
   */
  const requestLocation = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Obtenir les coordonnées
      const position = await getCurrentPosition();

      if (!position) {
        setIsLoading(false);
        return;
      }

      // 2. Convertir en adresse
      await getAddressFromCoords(position.latitude, position.longitude);
    } catch (err) {
      const errorMessage = 'Erreur lors de la récupération de la localisation';
      setError(errorMessage);
      console.error('Erreur requestLocation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    coords,
    address,
    city,
    country,
    isLoading,
    error,
    hasPermission,
    requestLocation,
    getCurrentPosition,
    getAddressFromCoords,
  };
}

/**
 * Fonction utilitaire pour calculer la distance entre deux coordonnées (en km)
 * Utilise la formule de Haversine
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formater la distance pour l'affichage
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
