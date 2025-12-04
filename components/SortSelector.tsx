import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, Flame, Clock, Trophy } from 'lucide-react-native';
import { memo } from 'react';
import { SortOption } from '@/hooks/useProductRecommendations';
import { Spacing } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface SortSelectorProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isDark?: boolean;
}

const sortOptions: { key: SortOption; label: string; Icon: any; color: string }[] = [
  { key: 'smart', label: 'Pour vous', Icon: Sparkles, color: '#7C3AED' },
  { key: 'trending', label: 'Tendance', Icon: Flame, color: '#EF4444' },
  { key: 'newest', label: 'Nouveaux', Icon: Clock, color: '#10B981' },
  { key: 'popular', label: 'Top ventes', Icon: Trophy, color: '#F59E0B' },
];

function SortSelector({ currentSort, onSortChange, isDark = false }: SortSelectorProps) {
  const handlePress = (sort: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSortChange(sort);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {sortOptions.map((option) => {
        const isSelected = currentSort === option.key;
        const IconComponent = option.Icon;

        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              isDark && !isSelected && styles.chipDark,
            ]}
            onPress={() => handlePress(option.key)}
            activeOpacity={0.7}
          >
            <IconComponent
              size={16}
              color={isSelected ? '#FFFFFF' : option.color}
              strokeWidth={2.5}
            />
            <Text style={[
              styles.chipText,
              isSelected && styles.chipTextSelected,
              isDark && !isSelected && styles.chipTextDark,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default memo(SortSelector);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  chipSelected: {
    backgroundColor: '#FF8C00',
  },
  chipDark: {
    backgroundColor: '#374151',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextDark: {
    color: '#D1D5DB',
  },
});
