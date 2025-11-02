import { StyleSheet } from 'react-native';
import { getFontFamily, getFontWeight } from './fontHelpers';
import { colors } from './colors';

/**
 * Wspólne style tekstowe dla całej aplikacji
 * Wszystkie style tekstu powinny być zdefiniowane tutaj dla łatwej edycji
 * 
 * Użycie:
 * import { textStyles } from '../../utils/textStyles';
 * <Text style={textStyles.label}>Label</Text>
 */

export const textStyles = StyleSheet.create({
  // ===== LABELS (Etykiety nad inputami) =====
  label: {
    fontSize: 14,
    fontWeight: getFontWeight('600'),
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: getFontFamily('600', 'text'),
  },
  
  // Label z brązowym kolorem (podstawowy kolor aplikacji)
  labelPrimary: {
    fontSize: 14,
    fontWeight: getFontWeight('600'),
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: getFontFamily('600', 'text'),
  },

  // ===== TITLES (Tytuły) =====
  titleLarge: {
    fontSize: 36,
    fontWeight: getFontWeight('bold'),
    color: colors.text,
    textAlign: 'center',
    fontFamily: getFontFamily('bold', 'display'),
    marginBottom: 12,
  },
  
  titleMedium: {
    fontSize: 32,
    fontWeight: getFontWeight('bold'),
    color: colors.text,
    textAlign: 'center',
    fontFamily: getFontFamily('bold', 'display'),
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  // ===== SUBTITLES =====
  subtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: getFontFamily('normal', 'text'),
  },

  subtitleMedium: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: getFontFamily('normal', 'text'),
    lineHeight: 24,
  },

  // ===== BODY TEXT (Główny tekst) =====
  body: {
    fontSize: 17,
    color: colors.text,
    fontFamily: getFontFamily('normal', 'text'),
  },

  bodyMedium: {
    fontSize: 16,
    color: colors.text,
    fontFamily: getFontFamily('normal', 'text'),
  },

  bodySmall: {
    fontSize: 15,
    color: colors.text,
    fontFamily: getFontFamily('normal', 'text'),
  },

  // ===== INPUT TEXT =====
  input: {
    fontSize: 17,
    color: colors.text,
    fontFamily: getFontFamily('normal', 'text'),
  },

  inputLarge: {
    fontSize: 18,
    fontWeight: getFontWeight('600'),
    color: colors.text,
    fontFamily: getFontFamily('600', 'text'),
  },

  // ===== SUGGESTION TEXT =====
  suggestionText: {
    fontSize: 18,
    fontWeight: getFontWeight('600'),
    color: colors.primary,
    fontFamily: getFontFamily('600', 'text'),
    letterSpacing: 0.2,
  },

  // ===== CAPTION (Małe teksty pomocnicze) =====
  caption: {
    fontSize: 14,
    color: colors.textTertiary,
    fontFamily: getFontFamily('normal', 'text'),
  },

  captionSmall: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: getFontFamily('500', 'text'),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ===== REQUIRED MARKER =====
  required: {
    fontSize: 15,
    fontWeight: getFontWeight('600'),
    color: '#E63946',
    marginLeft: 4,
    fontFamily: getFontFamily('600', 'text'),
  },

  // ===== BENEFIT/CARD TEXTS =====
  benefitTitle: {
    fontSize: 18,
    fontWeight: getFontWeight('600'),
    color: colors.text,
    marginBottom: 4,
    fontFamily: getFontFamily('600', 'display'),
  },

  benefitDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: getFontFamily('normal', 'text'),
  },

  featureText: {
    fontSize: 17,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    fontFamily: getFontFamily('normal', 'text'),
  },

  // ===== DESCRIPTION =====
  description: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    fontFamily: getFontFamily('normal', 'text'),
  },

  // ===== MODAL TEXTS =====
  modalTitle: {
    fontSize: 18,
    fontWeight: getFontWeight('600'),
    color: colors.text,
    fontFamily: getFontFamily('600', 'text'),
  },

  modalTitleLarge: {
    fontSize: 20,
    fontWeight: getFontWeight('600'),
    color: colors.text,
    fontFamily: getFontFamily('600', 'text'),
  },

  modalCloseText: {
    fontSize: 16,
    fontWeight: getFontWeight('600'),
    color: colors.primary,
    fontFamily: getFontFamily('600', 'text'),
  },

  modalDateDisplay: {
    fontSize: 24,
    fontWeight: getFontWeight('bold'),
    color: colors.primary,
    fontFamily: getFontFamily('bold', 'display'),
  },

  // ===== PICKER TEXTS =====
  pickerItemText: {
    fontSize: 20,
    color: colors.textTertiary,
    fontFamily: getFontFamily('normal', 'text'),
    opacity: 0.4,
  },

  pickerItemTextSelected: {
    fontSize: 32,
    color: colors.textSecondary,
    fontWeight: getFontWeight('bold'),
    fontFamily: getFontFamily('bold', 'display'),
    opacity: 1,
  },

  // ===== HINT TEXT =====
  hintText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    fontFamily: getFontFamily('normal', 'text'),
  },

  // ===== PLACEHOLDER TEXT =====
  placeholderText: {
    color: colors.textTertiary,
  },
});

