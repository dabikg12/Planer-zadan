import { Platform } from 'react-native';

/**
 * Helper do zarządzania czcionkami w aplikacji
 * Zapewnia właściwe czcionki dla iOS, Android i Web z odpowiednimi wagami
 */

// Domyślne czcionki dla różnych platform
export const getFontFamily = (weight = 'normal', variant = 'text') => {
  if (Platform.OS === 'ios') {
    // iOS używa SF Pro - systemowe czcionki Apple
    if (variant === 'display') {
      // SF Pro Display dla większych tekstów (tytuły, nagłówki)
      return 'SF Pro Display';
    }
    // SF Pro Text dla zwykłego tekstu
    return 'SF Pro Text';
  } else if (Platform.OS === 'android') {
    // Android używa Roboto - systemowe czcionki Google
    // Dla różnych wag używamy różnych wariantów
    if (weight === 'bold' || weight === '700' || weight === 700) {
      return 'sans-serif-bold';
    } else if (weight === '600' || weight === 600 || weight === 'semibold') {
      return 'sans-serif-medium';
    } else if (weight === '500' || weight === 500 || weight === 'medium') {
      return 'sans-serif-medium';
    } else {
      return 'sans-serif';
    }
  } else {
    // Web - użyj systemowych czcionek
    return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
};

/**
 * Helper do tworzenia stylów tekstu z właściwymi czcionkami
 */
export const createTextStyle = (fontSize, fontWeight = 'normal', variant = 'text') => {
  const fontFamily = getFontFamily(fontWeight, variant);
  
  return {
    fontSize,
    fontWeight,
    fontFamily,
  };
};

/**
 * Predefiniowane style dla różnych typów tekstu
 */
export const textStyles = {
  // Display - duże tytuły
  displayLarge: createTextStyle(34, 'bold', 'display'),
  displayMedium: createTextStyle(28, 'bold', 'display'),
  displaySmall: createTextStyle(24, 'bold', 'display'),
  
  // Headline - nagłówki
  headlineLarge: createTextStyle(22, 'bold', 'display'),
  headlineMedium: createTextStyle(20, '600', 'display'),
  headlineSmall: createTextStyle(18, '600', 'display'),
  
  // Title - podtytuły
  titleLarge: createTextStyle(17, '600', 'text'),
  titleMedium: createTextStyle(16, '600', 'text'),
  titleSmall: createTextStyle(15, '600', 'text'),
  
  // Body - tekst główny
  bodyLarge: createTextStyle(17, 'normal', 'text'),
  bodyMedium: createTextStyle(16, 'normal', 'text'),
  bodySmall: createTextStyle(15, 'normal', 'text'),
  
  // Label - etykiety
  labelLarge: createTextStyle(14, '600', 'text'),
  labelMedium: createTextStyle(13, '600', 'text'),
  labelSmall: createTextStyle(12, '600', 'text'),
  
  // Caption - małe teksty
  caption: createTextStyle(12, 'normal', 'text'),
  captionSmall: createTextStyle(11, 'normal', 'text'),
};

/**
 * Funkcja pomocnicza do uzyskania właściwego fontWeight dla platformy
 * Na Androidzie niektóre wagi mogą nie działać, więc mapujemy je odpowiednio
 */
export const getFontWeight = (weight) => {
  if (Platform.OS === 'android') {
    // Android lepiej obsługuje stringi niż liczby dla niektórych wag
    if (weight === '600' || weight === 600) {
      return '600'; // semibold
    } else if (weight === '700' || weight === 700 || weight === 'bold') {
      return '700'; // dla Android użyjemy liczby dla lepszej kompatybilności
    } else if (weight === '500' || weight === 500) {
      return '500';
    }
    return 'normal';
  }
  // iOS i Web obsługują wszystkie wagi - używamy stringi
  if (weight === 700) return '700';
  if (weight === 600) return '600';
  if (weight === 500) return '500';
  return weight;
};

