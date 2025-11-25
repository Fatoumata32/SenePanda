import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterChipsProps {
  options: FilterOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showCheckmark?: boolean;
  multiSelect?: boolean;
  selectedIds?: string[];
  onMultiSelect?: (ids: string[]) => void;
}

function FilterChipsComponent({
  options,
  selectedId,
  onSelect,
  showCheckmark = false,
  multiSelect = false,
  selectedIds = [],
  onMultiSelect,
}: FilterChipsProps) {
  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (multiSelect && onMultiSelect) {
      const newSelectedIds = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id];
      onMultiSelect(newSelectedIds);
    } else {
      onSelect(id);
    }
  };

  const isSelected = (id: string) => {
    if (multiSelect) {
      return selectedIds.includes(id);
    }
    return selectedId === id;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const selected = isSelected(option.id);

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.chip,
              selected && styles.chipSelected,
            ]}
            onPress={() => handleSelect(option.id)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            {option.icon && (
              <View style={styles.iconContainer}>
                {option.icon}
              </View>
            )}

            <Text
              style={[
                styles.label,
                selected && styles.labelSelected,
              ]}
            >
              {option.label}
            </Text>

            {showCheckmark && selected && (
              <Check size={14} color={Colors.white} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  iconContainer: {
    marginRight: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  labelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export const FilterChips = memo(FilterChipsComponent);
export default FilterChips;
