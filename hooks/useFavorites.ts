import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

// Gestionnaire d'événements pour synchroniser les favoris entre les composants
class FavoritesEventEmitter {
  private listeners: Set<(productId: string, isFavorite: boolean) => void> = new Set();

  subscribe(listener: (productId: string, isFavorite: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(productId: string, isFavorite: boolean) {
    this.listeners.forEach(listener => listener(productId, isFavorite));
  }
}

export const favoritesEvents = new FavoritesEventEmitter();

export function useFavorite(productId: string) {
  const { user, loading: authLoading } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si le produit est en favoris
  const checkFavorite = useCallback(async () => {
    if (!user || authLoading) {
      setIsFavorite(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
        return;
      }

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error in checkFavorite:', error);
    }
  }, [user, authLoading, productId]);

  // Charger l'état initial
  useEffect(() => {
    checkFavorite();
  }, [user?.id, authLoading, productId]);

  // S'abonner aux changements de favoris
  useEffect(() => {
    const unsubscribe = favoritesEvents.subscribe((changedProductId, newIsFavorite) => {
      if (changedProductId === productId) {
        setIsFavorite(newIsFavorite);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [productId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    if (authLoading || isLoading) {
      return false;
    }

    if (!user) {
      return null; // Indique que l'utilisateur n'est pas connecté
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Retirer des favoris
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) {
          console.error('Error removing favorite:', error);
          return false;
        }

        setIsFavorite(false);
        // Notifier les autres composants
        favoritesEvents.emit(productId, false);
        return true;
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        if (error) {
          console.error('Error adding favorite:', error);
          return false;
        }

        setIsFavorite(true);
        // Notifier les autres composants
        favoritesEvents.emit(productId, true);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, isFavorite, isLoading, productId]);

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
  };
}
