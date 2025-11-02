import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Wspólne style dla inputów i przycisków w całej aplikacji
 * Wszystkie pola formularzy powinny używać tych stylów dla spójności
 * 
 * Użycie:
 * import { inputStyles } from '../../utils/inputStyles';
 * <View style={inputStyles.container}>
 *   <TextInput style={inputStyles.input} />
 * </View>
 */

export const inputStyles = StyleSheet.create({
  // ===== CONTAINER (Wspólny kontener dla inputów) =====
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.completedBg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Wariant z większym paddingiem (dla ważnych pól)
  containerLarge: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.completedBg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Wariant z ikoną (borderRadius 18, borderWidth 2)
  containerWithIcon: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  // ===== INPUT TEXT =====
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  inputLarge: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // ===== BUTTON STYLES =====
  button: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Suggestion button (dla list sugestii)
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 64,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // ===== PRIORITY BUTTON =====
  priorityButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  // ===== CLOSE BUTTON =====
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.completedBg,
  },

  // ===== WSPÓLNY STYL DLA KONTENERÓW INPUTÓW W MODALU POWITALNYM =====
  welcomeInputGroup: {
    height: 88,
    width: '100%',
  },
});

/**
 * Mapuje style dla różnych wariantów inputów
 * Użycie: getInputContainerStyle('default') lub getInputContainerStyle('icon')
 */
export const getInputContainerStyle = (variant = 'default') => {
  switch (variant) {
    case 'icon':
      return inputStyles.containerWithIcon;
    case 'large':
      return inputStyles.containerLarge;
    default:
      return inputStyles.container;
  }
};

/**
 * Standardowe hitSlop dla przycisków (zwiększa obszar klikalności)
 */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * HitSlop dla małych przycisków
 */
export const HIT_SLOP_SMALL = { top: 4, bottom: 4, left: 4, right: 4 };

/**
 * HitSlop dla dużych przycisków
 */
export const HIT_SLOP_LARGE = { top: 10, bottom: 10, left: 10, right: 10 };

