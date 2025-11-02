import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Animated,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from '../utils/animationHelpers';
import { impactAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { colors } from '../utils/colors';

export default function StatCard({ label, value, backgroundColor, borderColor, onPress }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15 });
          impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={{
          backgroundColor,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor,
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: getFontWeight('600'),
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          fontFamily: getFontFamily('600', 'text'),
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: 32,
          fontWeight: getFontWeight('bold'),
          color: colors.text,
          fontFamily: getFontFamily('bold', 'display'),
        }}>
          {value}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

