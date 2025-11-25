import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ArrowUpDown, Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { BottomSheet } from './BottomSheet';
import * as Haptics from 'expo-haptics';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popular';

interface SortOptionsProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Plus récent' },
  { id: 'oldest', label: 'Plus ancien' },
  { id: 'price_asc', label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' },
  { id: 'rating', label: 'Meilleures notes' },
  { id: 'popular', label: 'Populaire' },
];

function SortOptionsComponent({
  visible,
  onClose,
  selectedSort,
  onSelectSort,
}: SortOptionsProps) {
  const handleSelect = (sort: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectSort(sort);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height="auto"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <ArrowUpDown size={20} color={Colors.text} />
          <Text style={styles.title}>Trier par</Text>
        </View>

        <View style={styles.options}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                selectedSort === option.id && styles.optionSelected,
              ]}
              onPress={() => handleSelect(option.id)}
              accessible={true}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedSort === option.id }}
            >
              <Text
                style={[
                  styles.optionLabel,
                  selectedSort === option.id && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>

              {selectedSort === option.id && (
                <Check size={20} color={Colors.primaryOrange} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

// Button to trigger sort options
interface SortButtonProps {
  onPress: () => void;
  currentSort: SortOption;
}

export function SortButton({ onPress, currentSort }: SortButtonProps) {
  const currentLabel = sortOptions.find(o => o.id === currentSort)?.label || 'Trier';

  return (
    <TouchableOpacity
      style={styles.sortButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessible={true}
      accessibilityLabel={`Trier par: ${currentLabel}`}
      accessibilityRole="button"
    >
      <ArrowUpDown size={16} color={Colors.text} />
      <Text style={styles.sortButtonText}>{currentLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  options: {
    gap: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  optionSelected: {
    backgroundColor: `${Colors.primaryOrange}15`,
    borderWidth: 1,
    borderColor: Colors.primaryOrange,
  },
  optionLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
});

export const SortOptions = memo(SortOptionsComponent);
export default SortOptions;
