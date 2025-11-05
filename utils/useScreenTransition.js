import React from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from './animationHelpers';

/**
 * Hook do animacji przejścia między ekranami
 * Odzwierciedla natywne animacje iOS (slide z prawej) i Android (slide z dołu)
 */
export function useScreenTransition() {
  const isWeb = Platform.OS === 'web';
  
  // Na mobile używamy shared values
  const translateX = useSharedValue(Platform.OS === 'ios' ? 50 : 0);
  const translateY = useSharedValue(Platform.OS === 'android' ? 50 : 0);
  const opacity = useSharedValue(0);

  // Dla web zwracamy pusty styl - ekran będzie widoczny od razu bez animacji
  if (isWeb) {
    return {}; 
  }

  useFocusEffect(
    React.useCallback(() => {
      // Animacja wejścia tylko na mobile
      if (Platform.OS === 'ios') {
        // iOS: slide z prawej (horizontal)
        translateX.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else if (Platform.OS === 'android') {
        // Android: slide z dołu (vertical)
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      }

      return () => {
        // Reset wartości przy wyjściu (animacja wyjścia będzie obsłużona przez nowy ekran)
        if (Platform.OS === 'ios') {
          translateX.value = 50;
        } else if (Platform.OS === 'android') {
          translateY.value = 50;
        }
        opacity.value = 0;
      };
    }, [translateX, translateY, opacity])
  );

  // Dla mobile używamy useAnimatedStyle
  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'ios') {
      return {
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }],
      };
    } else if (Platform.OS === 'android') {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    } else {
      return {
        opacity: opacity.value,
      };
    }
  });

  return animatedStyle;
}

