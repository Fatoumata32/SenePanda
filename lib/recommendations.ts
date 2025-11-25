/**
 * Product Recommendation Engine
 * Uses collaborative filtering and content-based filtering
 */

import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  category_id: string;
  price: number;
  rating?: number;
  view_count?: number;
  purchase_count?: number;
  tags?: string[];
}

export interface UserInteraction {
  user_id: string;
  product_id: string;
  interaction_type: 'view' | 'cart' | 'purchase' | 'favorite';
  created_at: string;
}

/**
 * Get personalized recommendations for a user
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 10
): Promise<Product[]> {
  try {
    // Get user's interaction history
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('product_id, interaction_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!interactions || interactions.length === 0) {
      // Return popular products for new users
      return getPopularProducts(limit);
    }

    // Get products the user has interacted with
    const interactedProductIds = interactions.map(i => i.product_id);

    // Get similar products based on collaborative filtering
    const similarProducts = await getCollaborativeFilteringRecommendations(
      userId,
      interactedProductIds,
      limit
    );

    return similarProducts;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

/**
 * Get collaborative filtering recommendations
 * Find users with similar taste and recommend their liked products
 */
async function getCollaborativeFilteringRecommendations(
  userId: string,
  interactedProductIds: string[],
  limit: number
): Promise<Product[]> {
  try {
    // Find similar users (users who liked the same products)
    const { data: similarUsers } = await supabase
      .from('user_interactions')
      .select('user_id')
      .in('product_id', interactedProductIds)
      .neq('user_id', userId)
      .limit(100);

    if (!similarUsers || similarUsers.length === 0) {
      return getContentBasedRecommendations(interactedProductIds, limit);
    }

    const similarUserIds = [...new Set(similarUsers.map(u => u.user_id))];

    // Get products liked by similar users
    const { data: recommendedProducts } = await supabase
      .from('user_interactions')
      .select('product_id, products (*)')
      .in('user_id', similarUserIds)
      .not('product_id', 'in', `(${interactedProductIds.join(',')})`)
      .eq('interaction_type', 'purchase')
      .limit(limit * 2);

    if (!recommendedProducts) {
      return [];
    }

    // Score and rank products
    const productScores = new Map<string, number>();
    recommendedProducts.forEach(item => {
      const current = productScores.get(item.product_id) || 0;
      productScores.set(item.product_id, current + 1);
    });

    // Sort by score and return top products
    const sortedProducts = Array.from(productScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => {
        const item = recommendedProducts.find(p => p.product_id === productId);
        return item?.products as unknown as Product;
      })
      .filter((p): p is Product => p !== null && p !== undefined);

    return sortedProducts;
  } catch (error) {
    console.error('Error in collaborative filtering:', error);
    return [];
  }
}

/**
 * Get content-based recommendations
 * Recommend similar products based on category, price range, etc.
 */
async function getContentBasedRecommendations(
  interactedProductIds: string[],
  limit: number
): Promise<Product[]> {
  try {
    // Get details of interacted products
    const { data: interactedProducts } = await supabase
      .from('products')
      .select('*')
      .in('id', interactedProductIds);

    if (!interactedProducts || interactedProducts.length === 0) {
      return [];
    }

    // Extract categories and price ranges
    const categories = [...new Set(interactedProducts.map(p => p.category_id))];
    const avgPrice = interactedProducts.reduce((sum, p) => sum + p.price, 0) / interactedProducts.length;
    const priceRange = {
      min: avgPrice * 0.7,
      max: avgPrice * 1.3,
    };

    // Find similar products
    const { data: similarProducts } = await supabase
      .from('products')
      .select('*')
      .in('category_id', categories)
      .gte('price', priceRange.min)
      .lte('price', priceRange.max)
      .not('id', 'in', `(${interactedProductIds.join(',')})`)
      .order('rating', { ascending: false })
      .limit(limit);

    return similarProducts || [];
  } catch (error) {
    console.error('Error in content-based filtering:', error);
    return [];
  }
}

/**
 * Get popular products (trending)
 */
export async function getPopularProducts(limit: number = 10): Promise<Product[]> {
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('view_count', { ascending: false })
      .order('purchase_count', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Error getting popular products:', error);
    return [];
  }
}

/**
 * Get similar products to a specific product
 */
export async function getSimilarProducts(
  productId: string,
  limit: number = 6
): Promise<Product[]> {
  try {
    // Get the product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return [];

    // Find products in same category with similar price
    const priceRange = {
      min: product.price * 0.8,
      max: product.price * 1.2,
    };

    const { data: similarProducts } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', product.category_id)
      .neq('id', productId)
      .gte('price', priceRange.min)
      .lte('price', priceRange.max)
      .order('rating', { ascending: false })
      .limit(limit);

    return similarProducts || [];
  } catch (error) {
    console.error('Error getting similar products:', error);
    return [];
  }
}

/**
 * Get frequently bought together products
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 4
): Promise<Product[]> {
  try {
    // Find orders that contain this product
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', productId);

    if (!orderItems || orderItems.length === 0) {
      return [];
    }

    const orderIds = orderItems.map(item => item.order_id);

    // Find other products in those orders
    const { data: relatedItems } = await supabase
      .from('order_items')
      .select('product_id, products (*)')
      .in('order_id', orderIds)
      .neq('product_id', productId);

    if (!relatedItems) return [];

    // Count occurrences
    const productCounts = new Map<string, number>();
    relatedItems.forEach(item => {
      const count = productCounts.get(item.product_id) || 0;
      productCounts.set(item.product_id, count + 1);
    });

    // Sort by frequency and return top products
    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => {
        const item = relatedItems.find(i => i.product_id === productId);
        return item?.products as unknown as Product;
      })
      .filter((p): p is Product => p !== null && p !== undefined);

    return topProducts;
  } catch (error) {
    console.error('Error getting frequently bought together:', error);
    return [];
  }
}

/**
 * Track user interaction for future recommendations
 */
export async function trackInteraction(
  userId: string,
  productId: string,
  interactionType: UserInteraction['interaction_type']
): Promise<void> {
  try {
    await supabase.from('user_interactions').insert({
      user_id: userId,
      product_id: productId,
      interaction_type: interactionType,
      created_at: new Date().toISOString(),
    });

    // Update product view/purchase counters
    if (interactionType === 'view') {
      await supabase.rpc('increment_view_count', { product_id: productId });
    } else if (interactionType === 'purchase') {
      await supabase.rpc('increment_purchase_count', { product_id: productId });
    }
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
}

export default {
  getPersonalizedRecommendations,
  getPopularProducts,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  trackInteraction,
};
