// Wspólna paleta kolorów dla całej aplikacji
export const colors = {
  background: '#1A0F0A',
  card: '#2A1F15',
  primary: '#C4A484',
  primaryLight: '#A0826D',
  accent: '#D4C4B0',
  text: '#F5F1E8',
  textSecondary: '#DDD0C2',
  textTertiary: '#C4A484',
  border: '#3A2F25',
  active: '#D4C4B0',
  completed: '#A0826D',
  activeBg: '#3A2F25',
  completedBg: '#4A3625',
  // Kolory dla menu (CustomTabBar)
  menuBg: '#1A0F0A',
  menuBgLight: '#2A1F15',
  iconActive: '#D4C4B0',
  iconInactive: '#8B6F47',
  textActive: '#D4C4B0',
  textInactive: '#A0826D',
  // Kolory funkcjonalne
  white: '#FFFFFF',
  black: '#000000',
  error: '#D32F2F',
  errorBg: '#FFEBEE',
  errorBorder: '#D32F2F',
  // Kolory dla efektów przezroczystości (używane z opacity)
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
  glassBg: 'rgba(255, 255, 255, 0.085)',
  glassBorder: 'rgba(255, 255, 255, 0.93)',
  glassHighlight: 'rgba(255, 255, 255, 0.761)',
  glassGradientStart: 'rgba(255, 255, 255, 0.135)',
  glassGradientEnd: 'rgba(255, 255, 255, 0.27)',
  // Kolory dla cieni
  shadowColor: '#000000',
  shadowColorPrimary: '#8B6F47',
  // Kolory dla komponentów specjalnych
  cardTransparent: 'rgba(42, 31, 21, 0.6)',
  accentTransparent: 'rgba(212, 196, 176, 0.3)',
  cardTransparentDark: 'rgba(42, 31, 21, 0.8)',
  cardTransparentDarker: 'rgba(42, 31, 21, 0.95)',
  accentTransparentLight: 'rgba(212, 196, 176, 0.2)',
  whiteTransparent: 'rgba(255, 255, 255, 0.25)',
  // Kolory dla gradientów tła (WelcomeBackgroundGraphics)
  primaryGradientLight: 'rgba(196, 164, 132, 0.08)',
  primaryGradientMedium: 'rgba(196, 164, 132, 0.06)',
  primaryLightGradient: 'rgba(160, 130, 109, 0.06)',
  accentGradient: 'rgba(212, 196, 176, 0.06)',
  primaryShadow: 'rgba(196, 164, 132, 0.3)',
};

// Konfiguracja kolorów priorytetów
export const priorityConfig = {
  high: {
    label: 'Wysoki',
    color: '#FF6B6B',
    bgColor: '#3A2626',
    borderColor: '#5A3636',
  },
  medium: {
    label: 'Średni',
    color: '#FFA726',
    bgColor: '#3A2F1F',
    borderColor: '#5A4A2F',
  },
  low: {
    label: 'Niski',
    color: '#66BB6A',
    bgColor: '#2A3A2A',
    borderColor: '#4A5A4A',
  },
};

export const getPriorityConfig = (priority) =>
  priorityConfig[priority] || priorityConfig.medium;

// Kolory priorytetów dla kalendarza (kropki)
export const priorityColors = {
  high: '#FF6B6B',
  medium: '#FFA726',
  low: '#66BB6A',
};

// Tablica priorytetów dla formularzy
export const priorities = [
  { value: 'low', label: 'Niski', color: '#66BB6A', bgColor: '#2A3A2A', borderColor: '#4A5A4A' },
  { value: 'medium', label: 'Średni', color: '#FFA726', bgColor: '#3A2F1F', borderColor: '#5A4A2F' },
  { value: 'high', label: 'Wysoki', color: '#FF6B6B', bgColor: '#3A2626', borderColor: '#5A3636' },
];

