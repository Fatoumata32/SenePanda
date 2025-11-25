import React, { ReactNode, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  FlatList,
  FlatListProps,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface PullToRefreshScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  progressBackgroundColor?: string;
  colors?: string[];
  tintColor?: string;
}

export function PullToRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  progressBackgroundColor = Colors.white,
  colors = [Colors.primaryOrange, Colors.primaryGold],
  tintColor = Colors.primaryOrange,
  ...scrollViewProps
}: PullToRefreshScrollViewProps) {
  const handleRefresh = useCallback(() => {
    const result = onRefresh();
    if (result instanceof Promise) {
      result.catch(console.error);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          progressBackgroundColor={progressBackgroundColor}
          colors={colors}
          tintColor={tintColor}
        />
      }
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

interface PullToRefreshFlatListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  progressBackgroundColor?: string;
  colors?: string[];
  tintColor?: string;
}

export function PullToRefreshFlatList<T>({
  refreshing,
  onRefresh,
  progressBackgroundColor = Colors.white,
  colors = [Colors.primaryOrange, Colors.primaryGold],
  tintColor = Colors.primaryOrange,
  ...flatListProps
}: PullToRefreshFlatListProps<T>) {
  const handleRefresh = useCallback(() => {
    const result = onRefresh();
    if (result instanceof Promise) {
      result.catch(console.error);
    }
  }, [onRefresh]);

  return (
    <FlatList<T>
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          progressBackgroundColor={progressBackgroundColor}
          colors={colors}
          tintColor={tintColor}
        />
      }
      {...flatListProps}
    />
  );
}

export default PullToRefreshScrollView;
