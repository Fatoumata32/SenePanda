import React, { useState, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Search, X, Mic } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useDebounce } from '@/hooks/usePerformance';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  onVoiceSearch?: () => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  showVoiceButton?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  accessibilityLabel?: string;
}

function SearchInputComponent({
  value,
  onChangeText,
  onSearch,
  onClear,
  onVoiceSearch,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  loading = false,
  showVoiceButton = false,
  autoFocus = false,
  style,
  inputStyle,
  accessibilityLabel = 'Champ de recherche',
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the search value
  const debouncedValue = useDebounce(value, debounceMs);

  // Trigger search on debounced value change
  React.useEffect(() => {
    if (debouncedValue && onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
  }, [onChangeText, onClear]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primaryOrange} />
        ) : (
          <Search size={20} color={isFocused ? Colors.primaryOrange : Colors.gray} />
        )}
      </View>

      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Saisissez votre recherche"
      />

      <View style={styles.actionsContainer}>
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.actionButton}
            accessible={true}
            accessibilityLabel="Effacer la recherche"
            accessibilityRole="button"
          >
            <X size={18} color={Colors.gray} />
          </TouchableOpacity>
        )}

        {showVoiceButton && !value && onVoiceSearch && (
          <TouchableOpacity
            onPress={onVoiceSearch}
            style={styles.actionButton}
            accessible={true}
            accessibilityLabel="Recherche vocale"
            accessibilityRole="button"
          >
            <Mic size={18} color={Colors.primaryOrange} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: Colors.primaryOrange,
    backgroundColor: Colors.white,
  },
  iconContainer: {
    marginRight: 8,
    width: 24,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
});

export const SearchInput = memo(SearchInputComponent);
export default SearchInput;
