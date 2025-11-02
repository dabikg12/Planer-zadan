import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { impactAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { 
  useSharedValue, 
  withTiming, 
  useAnimatedStyle,
  withSequence,
  Animated 
} from '../utils/animationHelpers';
import { colors } from '../utils/colors';

export default function BackButton({ onPress, style, iconName = 'arrow-back', iconSize = 24 }) {
  const glassProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Delikatna animacja pulsu przy pierwszym pojawieniu się
  useEffect(() => {
    pulseScale.value = withSequence(
      withTiming(1.15, { duration: 300 }),
      withTiming(1, { duration: 400 })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Uruchom tylko raz przy montowaniu

  const handlePressIn = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    glassProgress.value = withTiming(1, { duration: 220 });
  };

  const handlePressOut = () => {
    glassProgress.value = withTiming(0, { duration: 260 });
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const AnimatedPressable = Animated.createAnimatedComponent 
    ? Animated.createAnimatedComponent(Pressable)
    : Pressable;

  return (
    <AnimatedPressable
      style={[styles.backButton, style, animatedPulseStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Ionicons name={iconName} size={iconSize} color={colors.iconActive} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 56 : Platform.OS === 'web' ? 81 : 76,
    left: 16,
    zIndex: 100,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cardTransparent,
    borderWidth: 1,
    borderColor: colors.accentTransparent,
  },
});

