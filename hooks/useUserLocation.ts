/**
 * =============================================
 * HOOK: useUserLocation
 * =============================================
 *
 * Hook personnalisé pour gérer la géolocalisation de l'utilisateur
 * et la sauvegarder automatiquement dans Supabase
 *
 * Fonctionnalités:
 * - Récupère la position GPS de l'utilisateur
 * - Sauvegarde automatiquement dans la base de données
 * - Gère les permissions
 * - Gestion d'erreurs
 */

import { useState, useEffect } from 'react';
import { useLocation, type LocationCoords } from './useLocation';
import { updateUserLocation } from '@/lib/geolocation';
import { supabase } from '@/lib/supabase';

export interface UseUserLocationReturn {
  coords: LocationCoords | null;
  address: string | null;
  city: string | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isSaved: boolean; // Indique si la localisation est sauvegardée dans Supabase
  requestAndSaveLocation: () => Promise<void>;
  saveLocation: () => Promise<boolean>;
}

/**
 * Hook pour gérer la localisation de l'utilisateur avec sauvegarde automatique
 *
 * @param autoRequest - Demander automatiquement la localisation au montage
 * @param autoSave - Sauvegarder automatiquement la localisation dans Supabase
 *
 * @example
 * ```tsx
 * const { coords, address, requestAndSaveLocation, isSaved } = useUserLocation(true, true);
 *
 * // Utiliser les coordonnées
 * if (coords) {
 *   console.log(`Position: ${coords.latitude}, ${coords.longitude}`);
 *   console.log(`Sauvegardé: ${isSaved}`);
 * }
 * ```
 */
export function useUserLocation(
  autoRequest: boolean = false,
  autoSave: boolean = false
): UseUserLocationReturn {
  const {
    coords,
    address,
    city,
    isLoading: locationLoading,
    error: locationError,
    hasPermission,
    requestLocation,
    getAddressFromCoords,
  } = useLocation(autoRequest);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Effet pour sauvegarder automatiquement quand la localisation change
  useEffect(() => {
    if (autoSave && coords && !isSaved && !isSaving) {
      saveLocation();
    }
  }, [coords, autoSave, isSaved, isSaving]);

  /**
   * Sauvegarde la localisation actuelle dans Supabase
   */
  const saveLocation = async (): Promise<boolean> => {
    if (!coords) {
      setSaveError('Aucune coordonnée à sauvegarder');
      return false;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      // Récupérer l'utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSaveError('Utilisateur non connecté');
        setIsSaving(false);
        return false;
      }

      // Sauvegarder la localisation
      const response = await updateUserLocation(
        user.id,
        coords.latitude,
        coords.longitude,
        address || undefined,
        city || undefined
      );

      if (response.success) {
        console.log('✅ Localisation sauvegardée:', response);
        setIsSaved(true);
        return true;
      } else {
        setSaveError(response.error || 'Erreur de sauvegarde');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la sauvegarde';
      setSaveError(errorMessage);
      console.error('Erreur saveLocation:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Demande la localisation et la sauvegarde automatiquement
   */
  const requestAndSaveLocation = async (): Promise<void> => {
    try {
      // 1. Demander la localisation
      await requestLocation();

      // 2. La sauvegarder (sera fait automatiquement par useEffect si autoSave = true)
      if (!autoSave) {
        await saveLocation();
      }
    } catch (error: any) {
      console.error('Erreur requestAndSaveLocation:', error);
    }
  };

  return {
    coords,
    address,
    city,
    isLoading: locationLoading || isSaving,
    error: locationError || saveError,
    hasPermission,
    isSaved,
    requestAndSaveLocation,
    saveLocation,
  };
}
