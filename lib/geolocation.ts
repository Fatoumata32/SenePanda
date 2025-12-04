/**
 * =============================================
 * SERVICE DE GÉOLOCALISATION
 * =============================================
 *
 * Fonctionnalités:
 * - Mise à jour de la localisation de l'utilisateur
 * - Recherche de vendeurs proches avec priorité premium
 * - Recherche de produits proches avec priorité premium
 * - Calcul de distance entre deux points
 */

import { supabase } from './supabase';
import type {
  NearbySeller,
  NearbyProduct,
  LocationUpdateResponse,
} from '@/types/database';

// =============================================
// MISE À JOUR DE LA LOCALISATION
// =============================================

/**
 * Met à jour la localisation GPS de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param latitude - Latitude GPS
 * @param longitude - Longitude GPS
 * @param address - Adresse optionnelle
 * @param city - Ville optionnelle
 */
export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
  address?: string,
  city?: string
): Promise<LocationUpdateResponse> {
  try {
    const { data, error } = await supabase.rpc('update_user_location', {
      p_user_id: userId,
      p_latitude: latitude,
      p_longitude: longitude,
      p_address: address || null,
      p_city: city || null,
    });

    if (error) {
      console.error('Erreur mise à jour localisation:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as LocationUpdateResponse;
  } catch (error: any) {
    console.error('Erreur updateUserLocation:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
    };
  }
}

// =============================================
// RECHERCHE DE VENDEURS PROCHES
// =============================================

/**
 * Trouve les vendeurs proches de l'utilisateur
 * AVEC PRIORITÉ AUX VENDEURS PREMIUM
 *
 * @param userLatitude - Latitude de l'utilisateur
 * @param userLongitude - Longitude de l'utilisateur
 * @param maxDistanceKm - Distance maximum en km (défaut: 50 km)
 * @param limit - Nombre max de résultats (défaut: 20)
 * @returns Liste des vendeurs triés par: 1) Premium, 2) Distance, 3) Note
 */
export async function findNearbySellers(
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number = 50,
  limit: number = 20
): Promise<NearbySeller[]> {
  try {
    const { data, error } = await supabase.rpc('find_nearby_sellers', {
      p_user_latitude: userLatitude,
      p_user_longitude: userLongitude,
      p_max_distance_km: maxDistanceKm,
      p_limit: limit,
    });

    if (error) {
      console.error('Erreur recherche vendeurs proches:', error);
      return [];
    }

    return (data || []) as NearbySeller[];
  } catch (error) {
    console.error('Erreur findNearbySellers:', error);
    return [];
  }
}

// =============================================
// RECHERCHE DE PRODUITS PROCHES
// =============================================

/**
 * Trouve les produits des vendeurs proches de l'utilisateur
 * AVEC PRIORITÉ AUX VENDEURS PREMIUM
 *
 * @param userLatitude - Latitude de l'utilisateur
 * @param userLongitude - Longitude de l'utilisateur
 * @param maxDistanceKm - Distance maximum en km (défaut: 50 km)
 * @param categoryId - ID de catégorie optionnel pour filtrer
 * @param limit - Nombre max de résultats (défaut: 20)
 * @returns Liste des produits triés par: 1) Premium, 2) Distance, 3) Note
 */
export async function findNearbyProducts(
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number = 50,
  categoryId?: string,
  limit: number = 20
): Promise<NearbyProduct[]> {
  try {
    const { data, error } = await supabase.rpc('find_nearby_products', {
      p_user_latitude: userLatitude,
      p_user_longitude: userLongitude,
      p_max_distance_km: maxDistanceKm,
      p_category_id: categoryId || null,
      p_limit: limit,
    });

    if (error) {
      console.error('Erreur recherche produits proches:', error);
      return [];
    }

    return (data || []) as NearbyProduct[];
  } catch (error) {
    console.error('Erreur findNearbyProducts:', error);
    return [];
  }
}

// =============================================
// CALCUL DE DISTANCE
// =============================================

/**
 * Calcule la distance entre deux points GPS (formule Haversine)
 * @param lat1 - Latitude du point 1
 * @param lon1 - Longitude du point 1
 * @param lat2 - Latitude du point 2
 * @param lon2 - Longitude du point 2
 * @returns Distance en kilomètres
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
 * Formate la distance pour l'affichage
 * @param distanceKm - Distance en kilomètres
 * @returns Distance formatée (ex: "1.5 km" ou "500 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// =============================================
// HELPERS
// =============================================

/**
 * Vérifie si des coordonnées GPS sont valides
 */
export function isValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  if (latitude === null || latitude === undefined) return false;
  if (longitude === null || longitude === undefined) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Obtient le badge premium à afficher selon le plan
 */
export function getPremiumBadge(subscriptionPlan: string | null): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} | null {
  switch (subscriptionPlan) {
    case 'premium':
      return {
        label: 'PREMIUM',
        color: '#FFFFFF',
        bgColor: '#F59E0B', // Orange/Gold
        icon: 'star',
      };
    case 'pro':
      return {
        label: 'PRO',
        color: '#FFFFFF',
        bgColor: '#8B5CF6', // Purple
        icon: 'trending-up',
      };
    case 'starter':
      return {
        label: 'STARTER',
        color: '#FFFFFF',
        bgColor: '#3B82F6', // Blue
        icon: 'flash',
      };
    default:
      return null;
  }
}

/**
 * Obtient la couleur de priorité pour un vendeur
 * (pour indiquer visuellement l'ordre de priorité)
 */
export function getSellerPriority(subscriptionPlan: string | null): number {
  switch (subscriptionPlan) {
    case 'premium':
      return 1; // Priorité maximale
    case 'pro':
      return 2;
    case 'starter':
      return 3;
    default:
      return 4; // Priorité minimale (free)
  }
}
