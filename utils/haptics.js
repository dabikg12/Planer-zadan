import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const safeHaptic = (fn) => {
  try {
    if (Platform.OS !== 'web') {
      fn();
    }
  } catch (error) {
    // Ignore haptic errors on unsupported platforms
    console.log('Haptic feedback not available');
  }
};

export const impactAsync = (style) => {
  safeHaptic(() => {
    Haptics.impactAsync(style);
  });
};

export const notificationAsync = (type) => {
  safeHaptic(() => {
    Haptics.notificationAsync(type);
  });
};

export { Haptics };

