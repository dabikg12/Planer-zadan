import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { textStyles } from '../../utils/textStyles';
import { resetAnimationValues, startStepAnimations } from '../../utils/commonAnimations';

const benefits = [
  {
    icon: 'calendar-outline',
    title: 'Organizuj swój dzień',
    description: 'Planuj zadania i zarządzaj czasem efektywnie',
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Śledź postępy',
    description: 'Widz swoje osiągnięcia i motywuj się do działania',
  },
  {
    icon: 'trophy-outline',
    title: 'Osiągaj cele',
    description: 'Realizuj swoje marzenia krok po kroku',
  },
];

export default function Step1Intro({ isActive = true }) {
  // Animacje dla nagłówka
  const headerOpacity = useRef(new Animated.Value(1)).current; // Na stałe widoczny (bez fade-in)
  const headerTranslateY = useRef(new Animated.Value(20)).current;

  // Animacje dla kart benefitów
  const benefitOpacities = useRef(
    benefits.map(() => new Animated.Value(0))
  ).current;
  const benefitTranslateYs = useRef(
    benefits.map(() => new Animated.Value(20))
  ).current;

  useEffect(() => {
    if (!isActive) {
      // Reset animacji gdy krok jest nieaktywny
      headerTranslateY.setValue(20);
      resetAnimationValues(
        {},
        {},
        [[benefitOpacities, benefitTranslateYs]]
      );
      return;
    }

    // Uruchom animacje wejścia
    startStepAnimations({
      header: { opacity: headerOpacity, translateY: headerTranslateY },
      items: benefits.map((_, index) => ({
        opacity: benefitOpacities[index],
        translateY: benefitTranslateYs[index]
      }))
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={textStyles.titleLarge}>Witaj w Planerze!</Text>
        <Text style={textStyles.subtitle}>Planer pomaga ci...</Text>
      </Animated.View>

      <View style={styles.benefitsContainer}>
        {benefits.map((benefit, index) => (
          <Animated.View
            key={index}
            style={[
              styles.benefitCard,
              {
                opacity: benefitOpacities[index],
                transform: [{ translateY: benefitTranslateYs[index] }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={benefit.icon} size={32} color={colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={textStyles.benefitTitle}>{benefit.title}</Text>
              <Text style={textStyles.benefitDescription}>{benefit.description}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  benefitsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.activeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
});

