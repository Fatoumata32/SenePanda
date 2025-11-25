import React, { memo, useCallback } from 'react';
import { FlatList, FlatListProps, ViewToken } from 'react-native';

interface OptimizedFlatListProps<T> extends FlatListProps<T> {
  itemKey?: (item: T, index: number) => string;
}

/**
 * Optimized FlatList with best practices for performance
 */
function OptimizedFlatListComponent<T>(props: OptimizedFlatListProps<T>) {
  const {
    data,
    renderItem,
    itemKey,
    onEndReached,
    onEndReachedThreshold = 0.5,
    removeClippedSubviews = true,
    maxToRenderPerBatch = 10,
    updateCellsBatchingPeriod = 50,
    initialNumToRender = 10,
    windowSize = 10,
    ...rest
  } = props;

  const keyExtractor = useCallback(
    (item: T, index: number) => {
      if (itemKey) {
        return itemKey(item, index);
      }
      // Fallback to index if no key provided
      return `item-${index}`;
    },
    [itemKey]
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: 100, // Approximate item height
      offset: 100 * index,
      index,
    }),
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Can be used for analytics or lazy loading
      if (__DEV__) {
        console.log('Viewable items:', viewableItems.length);
      }
    },
    []
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      removeClippedSubviews={removeClippedSubviews}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      initialNumToRender={initialNumToRender}
      windowSize={windowSize}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onViewableItemsChanged={onViewableItemsChanged}
      // Enable for uniform item heights
      // getItemLayout={getItemLayout}
      {...rest}
    />
  );
}

export const OptimizedFlatList = memo(OptimizedFlatListComponent) as typeof OptimizedFlatListComponent;
