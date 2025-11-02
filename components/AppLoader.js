import React, { useEffect, useRef } from 'react';
import { View, Text, Platform, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import {
  createFadeInScaleAnimation,
  createFadeOutScaleAnimation,
  createPulseAnimation,
} from '../utils/commonAnimations';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';

export default function AppLoader({ isExiting = false, onExitComplete }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const shadowScaleAnim = useRef(new Animated.Value(1)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0.2)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.9)).current;
  const iconAnimationRef = useRef(null);
  const shadowAnimationRef = useRef(null);

  useEffect(() => {
    // Animacja pojawienia się loadera (fade-in + scale)
    const fadeInAnimation = createFadeInScaleAnimation(
      containerOpacity,
      containerScale,
      { duration: 400 }
    );
    fadeInAnimation.start();

    // Animacja pulsowania ikony - scale i opacity
    const iconAnimation = createPulseAnimation(
      scaleAnim,
      opacityAnim,
      {
        duration: 1000,
        minScale: 1,
        maxScale: 1.2,
        minOpacity: 0.6,
        maxOpacity: 1,
        loop: true,
      }
    );

    // Animacja cienia - pulsuje razem z ikoną
    const shadowAnimation = createPulseAnimation(
      shadowScaleAnim,
      shadowOpacityAnim,
      {
        duration: 1000,
        minScale: 1,
        maxScale: 1.3,
        minOpacity: 0.2,
        maxOpacity: 0.4,
        loop: true,
      }
    );

    iconAnimationRef.current = iconAnimation;
    shadowAnimationRef.current = shadowAnimation;

    iconAnimation.start();
    shadowAnimation.start();

    return () => {
      if (iconAnimationRef.current) {
        iconAnimationRef.current.stop();
      }
      if (shadowAnimationRef.current) {
        shadowAnimationRef.current.stop();
      }
    };
  }, []);

  // Animacja zamykania loadera (odwrotność animacji pojawienia)
  useEffect(() => {
    if (isExiting) {
      // Zatrzymaj animacje pulsowania
      if (iconAnimationRef.current) {
        iconAnimationRef.current.stop();
      }
      if (shadowAnimationRef.current) {
        shadowAnimationRef.current.stop();
      }

      // Wykonaj odwrotną animację: fade-out (1 → 0) + scale (1 → 0.9)
      const exitAnimation = createFadeOutScaleAnimation(
        containerOpacity,
        containerScale,
        {
          duration: 400,
          finalOpacity: 0,
          finalScale: 0.9,
        }
      );

      exitAnimation.start((finished) => {
        // Po zakończeniu animacji wywołaj callback tylko jeśli animacja się zakończyła
        if (finished && onExitComplete) {
          onExitComplete();
        }
      });
    }
  }, [isExiting, onExitComplete]);

  return (
    <Animated.View style={{ 
      flex: 1, 
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: containerOpacity,
      transform: [{ scale: containerScale }],
    }}>
      <StatusBar style="light" />
      
      {/* Główny kontener z ikoną */}
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Cień za ikoną dla efektu głębi */}
        <Animated.View style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.primary,
          transform: [{ scale: shadowScaleAnim }],
          opacity: shadowOpacityAnim,
        }} />

        {/* Ikona check z animacją pulsowania */}
        <Animated.View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.primary,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          ...(Platform.OS !== 'web' ? {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
          } : {
            boxShadow: `0 8px 24px ${colors.primaryShadow}`,
          }),
        }}>
          <Ionicons 
            name="checkmark-circle" 
            size={56} 
            color={colors.primary} 
          />
        </Animated.View>

        {/* Nazwa aplikacji */}
        <Text style={{
          marginTop: 32,
          fontSize: 32,
          fontWeight: getFontWeight('bold'),
          color: colors.text,
          fontFamily: getFontFamily('bold', 'display'),
          letterSpacing: 0.5,
        }}>
          Planer
        </Text>

        {/* Podtytuł */}
        <Text style={{
          marginTop: 12,
          fontSize: 17,
          color: colors.textSecondary,
          fontFamily: getFontFamily('normal', 'text'),
          opacity: 0.8,
        }}>
          Ładowanie aplikacji...
        </Text>
      </View>
    </Animated.View>
  );
}

