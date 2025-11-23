import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { CartItem, Product } from '@/types/database';
import { Alert } from 'react-native';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculer le nombre d'articles et le total
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  // Charger le panier au montage et à chaque changement d'utilisateur
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Rafraîchir le panier
  const refreshCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas encore, retourner un tableau vide sans erreur
        if (error.message?.includes('does not exist') || error.code === 'PGRST200') {
          console.warn('Table cart_items not found. Please apply the migration.');
          setCartItems([]);
          return;
        }
        throw error;
      }
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Ne pas faire crasher l'app, juste afficher un panier vide
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter au panier
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      Alert.alert('Non connecté', 'Veuillez vous connecter pour ajouter des articles au panier');
      return;
    }

    try {
      setLoading(true);

      // Vérifier si le produit existe et est actif
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        Alert.alert('Erreur', 'Ce produit n\'est pas disponible');
        return;
      }

      // Vérifier le stock
      if (product.stock < quantity) {
        Alert.alert('Stock insuffisant', `Seulement ${product.stock} article(s) disponible(s)`);
        return;
      }

      // Vérifier si le produit est déjà dans le panier (vérifier en base de données)
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingItem) {
        // Mettre à jour la quantité
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          Alert.alert('Stock insuffisant', `Seulement ${product.stock} article(s) disponible(s)`);
          return;
        }

        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Ajouter un nouvel article
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity
          });

        if (error) throw error;
      }

      await refreshCart();
      Alert.alert('Succès', 'Article ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'article au panier');
    } finally {
      setLoading(false);
    }
  };

  // Retirer du panier
  const removeFromCart = async (cartItemId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshCart();
      Alert.alert('Succès', 'Article retiré du panier');
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Erreur', 'Impossible de retirer l\'article du panier');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la quantité
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      setLoading(true);

      // Vérifier le stock
      const cartItem = cartItems.find(item => item.id === cartItemId);
      if (cartItem?.product && quantity > cartItem.product.stock) {
        Alert.alert('Stock insuffisant', `Seulement ${cartItem.product.stock} article(s) disponible(s)`);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la quantité');
    } finally {
      setLoading(false);
    }
  };

  // Vider le panier
  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Erreur', 'Impossible de vider le panier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
