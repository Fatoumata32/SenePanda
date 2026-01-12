/**
 * =============================================
 * HOOK: useSmartLocation
 * =============================================
 *
 * Hook React pour gérer la géolocalisation smart
 * avec cache, détection de quartier et suggestions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSmartLocation,
  saveSmartLocation,
  estimateDelivery,
  getLocationBasedSuggestions,
  formatLocationDisplay,
  getZoneInfo,
  getZoneEmoji,
  type SmartLocation,
  type DeliveryEstimate,
  type ZoneInfo,
} from '@/lib/smartGeolocation';
import { supabase } from '@/lib/supabase';

export interface UseSmartLocationReturn {
  location: SmartLocation | null;
  isLoading: boolean;
  error: string | null;
  neighborhood: string | null;
  neighborhoodEmoji: string;
  zoneInfo: ZoneInfo | null;
  displayText: string;
  suggestions: string[];

  // Actions
  requestLocation: (forceRefresh?: boolean) => Promise<void>;
  saveLocation: () => Promise<boolean>;
  estimateDeliveryTo: (sellerLat: number, sellerLon: number, sellerNeighborhood?: string) => DeliveryEstimate | null;
  refreshSuggestions: () => Promise<void>;
}

/**
 * Hook pour gérer la localisation smart
 *
 * @param autoRequest - Demander automatiquement la localisation au montage
 * @param autoSave - Sauvegarder automatiquement dans Supabase
 *
 * @example
 * ```tsx
 * const {
 *   location,
 *   neighborhood,
 *   displayText,
 *   estimateDeliveryTo
 * } = useSmartLocation(true, true);
 *
 * // Afficher la localisation
 * <Text>{displayText}</Text>
 *
 * // Estimer une livraison
 * const estimate = estimateDeliveryTo(14.7, -17.45);
 * ```
 */
export function useSmartLocation(
  autoRequest: boolean = false,
  autoSave: boolean = false
): UseSmartLocationReturn {
  const [location, setLocation] = useState<SmartLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Demander la localisation
  const requestLocation = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const smartLoc = await getSmartLocation(forceRefresh);

      if (!smartLoc) {
        setError('Impossible d\'obtenir votre localisation');
        return;
      }

      setLocation(smartLoc);

      // Auto-sauvegarder si activé
      if (autoSave) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await saveSmartLocation(user.id, smartLoc);
        }
      }
    } catch (err: any) {
      console.error('Erreur requestLocation:', err);
      setError(err.message || 'Erreur de localisation');
    } finally {
      setIsLoading(false);
    }
  }, [autoSave]);

  // Sauvegarder la localisation
  const saveLocation = useCallback(async (): Promise<boolean> => {
    if (!location) {
      setError('Aucune localisation à sauvegarder');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non connecté');
        return false;
      }

      const result = await saveSmartLocation(user.id, location);

      if (!result.success) {
        setError(result.error || 'Erreur de sauvegarde');
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('Erreur saveLocation:', err);
      setError(err.message);
      return false;
    }
  }, [location]);

  // Estimer la livraison
  const estimateDeliveryTo = useCallback((
    sellerLat: number,
    sellerLon: number,
    sellerNeighborhood?: string
  ): DeliveryEstimate | null => {
    if (!location) return null;

    return estimateDelivery(location, sellerLat, sellerLon, sellerNeighborhood);
  }, [location]);

  // Rafraîchir les suggestions
  const refreshSuggestions = useCallback(async () => {
    if (!location) return;

    try {
      const newSuggestions = await getLocationBasedSuggestions(location);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Erreur refreshSuggestions:', err);
    }
  }, [location]);

  // Auto-request au montage
  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  // Rafraîchir les suggestions quand la localisation change
  useEffect(() => {
    if (location) {
      refreshSuggestions();
    }
  }, [location]);

  // Valeurs dérivées
  const neighborhood = location?.neighborhood || null;
  const zoneInfo = getZoneInfo(neighborhood);
  const displayText = location ? formatLocationDisplay(location) : 'Localisation non disponible';
  const neighborhoodEmoji = getZoneEmoji(neighborhood);

  return {
    location,
    isLoading,
    error,
    neighborhood,
    neighborhoodEmoji,
    zoneInfo,
    displayText,
    suggestions,
    requestLocation,
    saveLocation,
    estimateDeliveryTo,
    refreshSuggestions,
  };
}