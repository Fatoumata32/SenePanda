import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { CartItem } from '@/types/database';

// Gestionnaire d'événements pour synchroniser le panier entre les composants
class CartEventEmitter {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const cartEvents = new CartEventEmitter();

export function useCart() {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les articles du panier
  const loadCart = useCallback(async (isRefreshing = false) => {
    if (!user || authLoading) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            *,
            seller:profiles!seller_id(
              id,
              shop_name,
              shop_logo_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cart:', error);
        throw error;
      }

      setCartItems(data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  // Charger le panier au démarrage
  useEffect(() => {
    loadCart();
  }, [user?.id, authLoading]);

  // S'abonner aux changements du panier
  useEffect(() => {
    const unsubscribe = cartEvents.subscribe(() => {
      loadCart();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Ajouter un produit au panier
  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user) {
      return null; // Indique que l'utilisateur n'est pas connecté
    }

    try {
      // Vérifier si le produit existe déjà dans le panier
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        // Mettre à jour la quantité
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Ajouter un nouveau produit
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

        if (error) throw error;
      }

      // Recharger le panier et notifier les autres composants
      await loadCart();
      cartEvents.emit();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }, [user, loadCart]);

  // Mettre à jour la quantité d'un article
  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return removeItem(itemId);
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      // Recharger le panier et notifier
      await loadCart();
      cartEvents.emit();
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }, [loadCart]);

  // Supprimer un article du panier
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Recharger le panier et notifier
      await loadCart();
      cartEvents.emit();
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  }, [loadCart]);

  // Vider le panier
  const clearCart = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Recharger le panier et notifier
      await loadCart();
      cartEvents.emit();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }, [user, loadCart]);

  // Calculer le total
  const calculateTotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  }, [cartItems]);

  // Obtenir le nombre total d'articles
  const getTotalItems = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Fonction de rafraîchissement mémorisée
  const refresh = useCallback(() => {
    loadCart(true);
  }, [loadCart]);

  return {
    cartItems,
    loading,
    refreshing,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    calculateTotal,
    getTotalItems,
    refresh,
  };
}
