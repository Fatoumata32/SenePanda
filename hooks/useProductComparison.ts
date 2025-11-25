import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const COMPARISON_KEY = '@senepanda_product_comparison';
const MAX_COMPARISON_ITEMS = 4;

export interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category_id: string;
  rating?: number;
  stock?: number;
  specifications?: Record<string, any>;
  added_at: number;
}

export function useProductComparison() {
  const [comparisonList, setComparisonList] = useState<ComparisonProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load comparison list on mount
  useEffect(() => {
    loadComparisonList();
  }, []);

  // Save to storage whenever list changes
  useEffect(() => {
    if (!isLoading) {
      saveComparisonList();
    }
  }, [comparisonList, isLoading]);

  const loadComparisonList = async () => {
    try {
      const data = await AsyncStorage.getItem(COMPARISON_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setComparisonList(parsed);
      }
    } catch (error) {
      console.error('Error loading comparison list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveComparisonList = async () => {
    try {
      await AsyncStorage.setItem(COMPARISON_KEY, JSON.stringify(comparisonList));
    } catch (error) {
      console.error('Error saving comparison list:', error);
    }
  };

  const addToComparison = useCallback((product: ComparisonProduct) => {
    setComparisonList(current => {
      // Check if already in comparison
      if (current.some(p => p.id === product.id)) {
        return current;
      }

      // Check if limit reached
      if (current.length >= MAX_COMPARISON_ITEMS) {
        // Remove oldest item
        const newList = current.slice(1);
        return [...newList, { ...product, added_at: Date.now() }];
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return [...current, { ...product, added_at: Date.now() }];
    });
  }, []);

  const removeFromComparison = useCallback((productId: string) => {
    setComparisonList(current => current.filter(p => p.id !== productId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const clearComparison = useCallback(async () => {
    setComparisonList([]);
    await AsyncStorage.removeItem(COMPARISON_KEY);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return comparisonList.some(p => p.id === productId);
  }, [comparisonList]);

  const canAddMore = useCallback(() => {
    return comparisonList.length < MAX_COMPARISON_ITEMS;
  }, [comparisonList.length]);

  const getComparisonCount = useCallback(() => {
    return comparisonList.length;
  }, [comparisonList.length]);

  // Get comparison matrix for specific attributes
  const getComparisonMatrix = useCallback(() => {
    if (comparisonList.length === 0) {
      return null;
    }

    // Get all unique specification keys
    const allSpecs = new Set<string>();
    comparisonList.forEach(product => {
      if (product.specifications) {
        Object.keys(product.specifications).forEach(key => allSpecs.add(key));
      }
    });

    return {
      products: comparisonList,
      specifications: Array.from(allSpecs),
      price: {
        min: Math.min(...comparisonList.map(p => p.price)),
        max: Math.max(...comparisonList.map(p => p.price)),
        average: comparisonList.reduce((sum, p) => sum + p.price, 0) / comparisonList.length,
      },
      rating: {
        min: Math.min(...comparisonList.map(p => p.rating || 0)),
        max: Math.max(...comparisonList.map(p => p.rating || 0)),
        average: comparisonList.reduce((sum, p) => sum + (p.rating || 0), 0) / comparisonList.length,
      },
    };
  }, [comparisonList]);

  // Get best value product (based on price and rating)
  const getBestValue = useCallback(() => {
    if (comparisonList.length === 0) {
      return null;
    }

    return comparisonList.reduce((best, current) => {
      const bestScore = (best.rating || 0) / best.price;
      const currentScore = (current.rating || 0) / current.price;
      return currentScore > bestScore ? current : best;
    });
  }, [comparisonList]);

  // Get cheapest product
  const getCheapest = useCallback(() => {
    if (comparisonList.length === 0) {
      return null;
    }

    return comparisonList.reduce((cheapest, current) =>
      current.price < cheapest.price ? current : cheapest
    );
  }, [comparisonList]);

  // Get highest rated product
  const getHighestRated = useCallback(() => {
    if (comparisonList.length === 0) {
      return null;
    }

    return comparisonList.reduce((highest, current) =>
      (current.rating || 0) > (highest.rating || 0) ? current : highest
    );
  }, [comparisonList]);

  return {
    comparisonList,
    isLoading,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddMore,
    getComparisonCount,
    getComparisonMatrix,
    getBestValue,
    getCheapest,
    getHighestRated,
    maxItems: MAX_COMPARISON_ITEMS,
  };
}

export default useProductComparison;
