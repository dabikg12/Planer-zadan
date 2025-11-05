import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from '../utils/animationHelpers';
import { Animated } from '../utils/animationHelpers';
import { colors } from '../utils/colors';

export default function WelcomeBackgroundGraphics({ currentStep }) {
  const { width, height } = Dimensions.get('window');
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  
  // Animacje dla różnych elementów
  const gradientOpacity = useSharedValue(0.6);
  const floatOffset1 = useSharedValue(0);
  const floatOffset2 = useSharedValue(0);
  const floatOffset3 = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const waveOffset = useSharedValue(0);
  
  useEffect(() => {
    // Reset animacji przy zmianie kroku
    gradientOpacity.value = 0.6;
    floatOffset1.value = 0;
    floatOffset2.value = 0;
    floatOffset3.value = 0;
    pulseScale.value = 1;
    rotation.value = 0;
    waveOffset.value = 0;
    
    // Gradient opacity - delikatne pulsowanie
    gradientOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    
    // Floating animations - różne prędkości dla różnych elementów
    floatOffset1.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(-10, { duration: 4000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    
    floatOffset2.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
        withTiming(8, { duration: 5000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    
    floatOffset3.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
        withTiming(-12, { duration: 3500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    
    // Rotation dla zegara (tylko na kroku 5)
    if (currentStep === 5) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    }
    
    // Wave offset dla falowanych linii
    waveOffset.value = withRepeat(
      withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [currentStep]);
  
  // Animated styles
  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));
  
  const floatStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatOffset1.value }],
  }));
  
  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatOffset2.value }],
  }));
  
  const floatStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatOffset3.value }],
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveOffset.value }],
  }));
  
  // Renderuj różne grafiki w zależności od kroku
  const renderStepGraphics = () => {
    switch (currentStep) {
      case 0: // Step1Intro - Witaj w Planerze
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'rgba(196, 164, 132, 0.08)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Prosta ilustracja "Hello" w stylu rysunkowym */}
            <Animated.View style={floatStyle1}>
              <Svg width={width} height={height} style={styles.svgIllustration}>
                {/* Uśmiechnięta buźka */}
                <Circle
                  cx={centerX}
                  cy={centerY - 50}
                  r="80"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                {/* Oczy */}
                <Circle cx={centerX - 25} cy={centerY - 70} r="8" fill={colors.primary} opacity={0.2} />
                <Circle cx={centerX + 25} cy={centerY - 70} r="8" fill={colors.primary} opacity={0.2} />
                {/* Uśmiech */}
                <Path
                  d={`M ${centerX - 35} ${centerY - 35} Q ${centerX} ${centerY - 20}, ${centerX + 35} ${centerY - 35}`}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                {/* Falowana linia "Hello" */}
                <Path
                  d={`M ${centerX - 60} ${centerY + 50} Q ${centerX - 30} ${centerY + 35}, ${centerX} ${centerY + 50} T ${centerX + 60} ${centerY + 50}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2.5"
                  opacity={0.2}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
            {/* Delikatne pływające kropki */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.2, left: width * 0.2 }, floatStyle2]}>
              <Animated.View style={pulseStyle}>
                <View style={styles.dot} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.6, right: width * 0.25 }, floatStyle3]}>
              <Animated.View style={pulseStyle}>
                <View style={styles.dot} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.4, left: width * 0.1 }, floatStyle1]}>
              <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.accent, opacity: 0.15 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.8, right: width * 0.15 }, floatStyle2]}>
              <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.primaryLight, opacity: 0.12 }]} />
            </Animated.View>
          </>
        );
      
      case 1: // Step2UserData - Wprowadź swoje dane
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'rgba(160, 130, 109, 0.06)',
                  'transparent',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Prosta ilustracja profilu użytkownika */}
            <Animated.View style={floatStyle1}>
              <Svg width={width} height={height} style={styles.svgIllustration}>
                {/* Głowa */}
                <Circle
                  cx={centerX}
                  cy={centerY - 60}
                  r="50"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.18}
                  strokeLinecap="round"
                />
                {/* Ciało */}
                <Rect
                  x={centerX - 40}
                  y={centerY - 10}
                  width="80"
                  height="100"
                  rx="20"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2.5"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                {/* Prosta linia podpis */}
                <Path
                  d={`M ${centerX - 50} ${centerY + 120} Q ${centerX} ${centerY + 100}, ${centerX + 50} ${centerY + 120}`}
                  fill="none"
                  stroke={colors.primaryLight}
                  strokeWidth="2"
                  opacity={0.2}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
            {/* Pływające kropki */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.3, left: width * 0.15 }, floatStyle2]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.15 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.7, right: width * 0.2 }, floatStyle3]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, { backgroundColor: colors.accent, opacity: 0.12 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.5, left: width * 0.08 }, floatStyle1]}>
              <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.primaryLight, opacity: 0.12 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.85, right: width * 0.12 }, floatStyle2]}>
              <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.primary, opacity: 0.1 }]} />
            </Animated.View>
          </>
        );
      
      case 2: // Step3Info - Zacznij od zaplanowania dnia
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'rgba(212, 196, 176, 0.06)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Prosta ilustracja kalendarza w stylu rysunkowym */}
            <Animated.View style={floatStyle1}>
              <Svg width={width} height={height} style={styles.svgIllustration}>
                {/* Ramka kalendarza */}
                <Rect
                  x={centerX - 90}
                  y={centerY - 100}
                  width="180"
                  height="140"
                  rx="12"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.2}
                  strokeLinecap="round"
                />
                {/* Linie siatki kalendarza */}
                <Path
                  d={`M ${centerX - 90} ${centerY - 60} L ${centerX + 90} ${centerY - 60}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${centerX - 90} ${centerY - 20} L ${centerX + 90} ${centerY - 20}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${centerX - 90} ${centerY + 20} L ${centerX + 90} ${centerY + 20}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${centerX} ${centerY - 100} L ${centerX} ${centerY + 40}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                {/* Checkmark na jednym dniu */}
                <Path
                  d={`M ${centerX - 30} ${centerY - 10} L ${centerX - 15} ${centerY + 5} L ${centerX + 30} ${centerY - 20}`}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            {/* Delikatne kropki wokół */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.25, left: width * 0.1 }, floatStyle2]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.primary, opacity: 0.2 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.75, right: width * 0.15 }, floatStyle3]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.accent, opacity: 0.18 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.15, right: width * 0.2 }, floatStyle1]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primaryLight, opacity: 0.15 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.85, left: width * 0.12 }, floatStyle2]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.accent, opacity: 0.12 }]} />
            </Animated.View>
          </>
        );
      
      case 3: // Step6FirstTask - Co chcesz osiągnąć?
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'rgba(196, 164, 132, 0.06)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Prosta ilustracja listy zadań z checkboxem */}
            <Animated.View style={floatStyle1}>
              <Svg width={width} height={height} style={styles.svgIllustration}>
                {/* Ramka listy */}
                <Rect
                  x={centerX - 100}
                  y={centerY - 80}
                  width="200"
                  height="120"
                  rx="15"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.18}
                  strokeLinecap="round"
                />
                {/* Checkbox */}
                <Rect
                  x={centerX - 85}
                  y={centerY - 60}
                  width="20"
                  height="20"
                  rx="4"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2.5"
                  opacity={0.2}
                  strokeLinecap="round"
                />
                {/* Checkmark w checkboxie */}
                <Path
                  d={`M ${centerX - 80} ${centerY - 55} L ${centerX - 73} ${centerY - 48} L ${centerX - 65} ${centerY - 60}`}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="2.5"
                  opacity={0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Linia zadania */}
                <Path
                  d={`M ${centerX - 55} ${centerY - 50} Q ${centerX} ${centerY - 50}, ${centerX + 75} ${centerY - 50}`}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="2.5"
                  opacity={0.2}
                  strokeLinecap="round"
                />
                {/* Druga linia */}
                <Path
                  d={`M ${centerX - 55} ${centerY - 20} Q ${centerX} ${centerY - 20}, ${centerX + 70} ${centerY - 20}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.18}
                  strokeLinecap="round"
                />
                {/* Gwiazdka celu */}
                <Path
                  d={`M ${centerX} ${centerY + 60} L ${centerX - 8} ${centerY + 45} L ${centerX + 8} ${centerY + 45} Z M ${centerX} ${centerY + 60} L ${centerX - 8} ${centerY + 75} L ${centerX + 8} ${centerY + 75} Z`}
                  fill="none"
                  stroke={colors.primaryLight}
                  strokeWidth="2.5"
                  opacity={0.22}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            {/* Pływające kropki wokół */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.25, left: width * 0.15 }, floatStyle2]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.primary, opacity: 0.18 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.65, right: width * 0.2 }, floatStyle3]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.accent, opacity: 0.15 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.45, right: width * 0.1 }, floatStyle1]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primaryLight, opacity: 0.14 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.85, left: width * 0.18 }, floatStyle2]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primary, opacity: 0.12 }]} />
            </Animated.View>
          </>
        );
      
      case 4: // Step5BedTime - Kiedy wykonasz zadanie?
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(160, 130, 109, 0.06)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Prosta ilustracja kalendarza z datą */}
            <Animated.View style={floatStyle1}>
              <Svg width={width} height={height} style={styles.svgIllustration}>
                {/* Kalendarz - większy */}
                <Rect
                  x={centerX - 110}
                  y={centerY - 120}
                  width="220"
                  height="180"
                  rx="18"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3.5"
                  opacity={0.2}
                  strokeLinecap="round"
                />
                {/* Górna część - miesiąc */}
                <Rect
                  x={centerX - 110}
                  y={centerY - 120}
                  width="220"
                  height="50"
                  rx="18"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2.5"
                  opacity={0.15}
                  strokeLinecap="round"
                />
                {/* Wyróżniony dzień (okrąg) */}
                <Circle
                  cx={centerX}
                  cy={centerY - 30}
                  r="25"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  opacity={0.25}
                  strokeLinecap="round"
                />
                {/* Linie siatki */}
                <Path
                  d={`M ${centerX - 110} ${centerY - 70} L ${centerX + 110} ${centerY - 70}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.12}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${centerX} ${centerY - 120} L ${centerX} ${centerY + 60}`}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2"
                  opacity={0.12}
                  strokeLinecap="round"
                />
                {/* Strzałka wskazująca datę */}
                <Path
                  d={`M ${centerX} ${centerY + 80} L ${centerX} ${centerY + 50} L ${centerX - 5} ${centerY + 55} M ${centerX} ${centerY + 50} L ${centerX + 5} ${centerY + 55}`}
                  fill="none"
                  stroke={colors.primaryLight}
                  strokeWidth="2.5"
                  opacity={0.22}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            {/* Pływające kropki - daty */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.2, left: width * 0.25 }, floatStyle2]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.primary, opacity: 0.16 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.7, right: width * 0.3 }, floatStyle3]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotSmall, { backgroundColor: colors.accent, opacity: 0.14 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.35, left: width * 0.15 }, floatStyle1]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primaryLight, opacity: 0.13 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.8, right: width * 0.18 }, floatStyle2]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primary, opacity: 0.11 }]} />
            </Animated.View>
          </>
        );
      
      case 5: // Step4WakeTime - Ustaw godzinę
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'rgba(212, 196, 176, 0.06)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Prosta ilustracja zegara w stylu rysunkowym */}
            <Svg width={width} height={height} style={styles.svgIllustration}>
              {/* Tarcza zegara */}
              <Circle
                cx={centerX}
                cy={centerY - 30}
                r="100"
                fill="none"
                stroke={colors.primary}
                strokeWidth="4"
                opacity={0.2}
                strokeLinecap="round"
              />
              {/* Wewnętrzny okrąg */}
              <Circle
                cx={centerX}
                cy={centerY - 30}
                r="85"
                fill="none"
                stroke={colors.accent}
                strokeWidth="2"
                opacity={0.15}
                strokeLinecap="round"
              />
              {/* Godziny 12, 3, 6, 9 */}
              {[0, 3, 6, 9].map((hour) => {
                const angle = (hour * 30 - 90) * (Math.PI / 180);
                const x = centerX + Math.cos(angle) * 85;
                const y = (centerY - 30) + Math.sin(angle) * 85;
                return (
                  <Circle
                    key={`hour-${hour}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={colors.primary}
                    opacity={0.25}
                  />
                );
              })}
              {/* Środek zegara */}
              <Circle
                cx={centerX}
                cy={centerY - 30}
                r="6"
                fill={colors.primary}
                opacity={0.3}
              />
            </Svg>
            {/* Wskazówki - rotacja w osobnych View z SVG */}
            <Animated.View 
              style={[
                rotationStyle,
                {
                  position: 'absolute',
                  top: centerY - 30,
                  left: centerX,
                  width: 100,
                  height: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              ]}
            >
              <Svg width="100" height="100" style={{ position: 'absolute' }}>
                {/* Wskazówka godzinowa (długa) */}
                <Path
                  d="M 0 0 L 0 -50"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="4"
                  opacity={0.25}
                  strokeLinecap="round"
                />
                {/* Wskazówka minutowa (krótka) */}
                <Path
                  d="M 0 0 L 40 0"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="3"
                  opacity={0.22}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
            {/* Pływające kropki - minuty */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.25, left: width * 0.3 }, floatStyle2]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primaryLight, opacity: 0.2 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.55, right: width * 0.35 }, floatStyle3]}>
              <Animated.View style={pulseStyle}>
                <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.accent, opacity: 0.18 }]} />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.75, left: width * 0.4 }, floatStyle1]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primary, opacity: 0.15 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.35, right: width * 0.25 }, floatStyle2]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.primaryLight, opacity: 0.18 }]} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.65, left: width * 0.35 }, floatStyle3]}>
              <View style={[styles.dot, styles.dotTiny, { backgroundColor: colors.accent, opacity: 0.16 }]} />
            </Animated.View>
          </>
        );
      
      default:
        return (
          <>
            <Animated.View style={[styles.gradient1, gradientAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'rgba(196, 164, 132, 0.08)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Delikatne pływające kropki */}
            <Animated.View style={[styles.floatingDot, { top: height * 0.3, left: width * 0.2 }, floatStyle1]}>
              <View style={styles.dot} />
            </Animated.View>
            <Animated.View style={[styles.floatingDot, { top: height * 0.6, right: width * 0.25 }, floatStyle2]}>
              <View style={styles.dot} />
            </Animated.View>
          </>
        );
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderStepGraphics()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradient1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svgIllustration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotTiny: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

