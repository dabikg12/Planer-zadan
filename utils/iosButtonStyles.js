import { StyleSheet, Platform } from 'react-native';

/**
 * Style przycisków iOS - natywne style zgodne z iOS Human Interface Guidelines
 * Wszystkie style przycisków iOS powinny używać tych stylów dla spójności
 * 
 * Użycie:
 * import { iosButtonStyles } from '../utils/iosButtonStyles';
 * <View style={iosButtonStyles.primary}>
 *   <Text style={iosButtonStyles.primaryText}>Przycisk</Text>
 * </View>
 */

// Standardowe kolory iOS
const iosColors = {
  blue: '#007AFF',      // iOS Blue (primary)
  red: '#FF3B30',       // iOS Red (destructive)
  gray: '#E5E5EA',      // iOS Gray (secondary)
  grayText: '#000000',  // Ciemny tekst na szarym tle
  white: '#FFFFFF',
  black: '#000000',
  separator: '#C6C6C8', // iOS separator color
};

export const iosButtonStyles = StyleSheet.create({
  // ===== PRIMARY BUTTON (Filled) =====
  // Niebieski wypełniony przycisk - główny akcent iOS
  primary: {
    backgroundColor: iosColors.blue,
    borderRadius: 10, // iOS używa 8-10px
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 44, // iOS standardowa wysokość przycisku
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: iosColors.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  primaryText: {
    color: iosColors.white,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },

  // ===== SECONDARY BUTTON (Bordered) =====
  // Biały przycisk z obramowaniem - alternatywny styl
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: iosColors.blue,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: iosColors.blue,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },

  // ===== PLAIN BUTTON =====
  // Tekstowy przycisk bez tła - minimalny styl
  plain: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plainText: {
    color: iosColors.blue,
    fontSize: 17,
    fontWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },

  // ===== DESTRUCTIVE BUTTON =====
  // Czerwony przycisk dla akcji destrukcyjnych
  destructive: {
    backgroundColor: iosColors.red,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: iosColors.red,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  destructiveText: {
    color: iosColors.white,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },

  // ===== GRAY BUTTON =====
  // Szary przycisk drugorzędny
  gray: {
    backgroundColor: iosColors.gray,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayText: {
    color: iosColors.grayText,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },

  // ===== LARGE BUTTON =====
  // Większy przycisk (np. dla głównej akcji)
  large: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 50,
  },
  largeText: {
    fontSize: 18,
    fontWeight: '600',
  },

  // ===== SMALL BUTTON =====
  small: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  smallText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ===== DISABLED STATE =====
  disabled: {
    opacity: 0.4,
  },
});

// Eksport kolorów iOS dla użycia w innych miejscach
export const iosButtonColors = iosColors;

