import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Debounce a value - useful for search inputs
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle a callback function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        lastRan.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          callback(...args);
        }, delay - (now - lastRan.current));
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Run expensive operations after animations complete
 */
export function useAfterInteractions(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => task.cancel();
  }, deps);
}

/**
 * Memoize FlatList key extractor
 */
export function useKeyExtractor<T extends { id: string }>(
  idField: keyof T = 'id' as keyof T
) {
  return useCallback((item: T) => String(item[idField]), [idField]);
}

/**
 * Optimize FlatList performance with common configurations
 */
export function useFlatListOptimization<T>(
  data: T[],
  options: {
    itemHeight?: number;
    numColumns?: number;
    initialNumToRender?: number;
    maxToRenderPerBatch?: number;
    windowSize?: number;
  } = {}
) {
  const {
    itemHeight,
    numColumns = 1,
    initialNumToRender = 10,
    maxToRenderPerBatch = 10,
    windowSize = 5,
  } = options;

  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;

    return (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * Math.floor(index / numColumns),
      index,
    });
  }, [itemHeight, numColumns]);

  const keyExtractor = useCallback((item: T, index: number) => {
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as any).id);
    }
    return String(index);
  }, []);

  return {
    data,
    keyExtractor,
    getItemLayout,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 50,
  };
}

/**
 * Track component mount state to prevent memory leaks
 */
export function useMountedState() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Previous value hook - useful for comparisons
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Lazy initialization for expensive computations
 */
export function useLazyInit<T>(init: () => T): T {
  const ref = useRef<{ value: T } | null>(null);

  if (ref.current === null) {
    ref.current = { value: init() };
  }

  return ref.current.value;
}

export default {
  useDebounce,
  useThrottle,
  useAfterInteractions,
  useKeyExtractor,
  useFlatListOptimization,
  useMountedState,
  usePrevious,
  useLazyInit,
};
