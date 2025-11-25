import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface Segment {
  id: string;
  label: string;
  badge?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedId: string;
  onChange: (id: string) => void;
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
}

function SegmentedControlComponent({
  segments,
  selectedId,
  onChange,
  backgroundColor = Colors.lightGray,
  activeColor = Colors.primaryOrange,
  inactiveColor = Colors.textSecondary,
}: SegmentedControlProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const segmentWidths = useRef<number[]>([]);
  const containerWidth = useRef<number>(0);

  const selectedIndex = segments.findIndex((s) => s.id === selectedId);

  useEffect(() => {
    if (segmentWidths.current.length === segments.length && containerWidth.current > 0) {
      // Calculate position
      let position = 0;
      for (let i = 0; i < selectedIndex; i++) {
        position += segmentWidths.current[i];
      }

      Animated.spring(translateX, {
        toValue: position,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [selectedIndex, segments.length]);

  const handlePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(id);
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    containerWidth.current = event.nativeEvent.layout.width;
  };

  const handleSegmentLayout = (event: LayoutChangeEvent, index: number) => {
    segmentWidths.current[index] = event.nativeEvent.layout.width;
  };

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      onLayout={handleContainerLayout}
    >
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: containerWidth.current / segments.length,
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Segments */}
      {segments.map((segment, index) => {
        const isSelected = segment.id === selectedId;

        return (
          <TouchableOpacity
            key={segment.id}
            style={styles.segment}
            onPress={() => handlePress(segment.id)}
            activeOpacity={0.7}
            onLayout={(e) => handleSegmentLayout(e, index)}
            accessible={true}
            accessibilityLabel={segment.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isSelected ? activeColor : inactiveColor },
                isSelected && styles.segmentTextActive,
              ]}
            >
              {segment.label}
            </Text>

            {segment.badge !== undefined && segment.badge > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isSelected ? activeColor : inactiveColor },
                ]}
              >
                <Text style={styles.badgeText}>
                  {segment.badge > 99 ? '99+' : segment.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: Colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
});

export const SegmentedControl = memo(SegmentedControlComponent);
export default SegmentedControl;
