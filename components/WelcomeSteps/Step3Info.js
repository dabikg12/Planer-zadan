import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { textStyles } from '../../utils/textStyles';
import { resetAnimationValues, startStepAnimations } from '../../utils/commonAnimations';

export default function Step3Info({ isActive = true }) {
  // Animacje dla nagłówka
  const headerOpacity = useRef(new Animated.Value(1)).current; // Na stałe widoczny (bez fade-in)
  const headerTranslateY = useRef(new Animated.Value(20)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  // Animacje dla opisu i funkcji
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const descriptionTranslateY = useRef(new Animated.Value(20)).current;

  // Animacje dla listy funkcji
  const featureOpacities = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const featureTranslateYs = useRef([
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
  ]).current;

  useEffect(() => {
    if (!isActive) {
      // Reset animacji gdy krok jest nieaktywny
      headerTranslateY.setValue(20);
      resetAnimationValues(
        { 
          iconScale, iconOpacity,
          descriptionOpacity, descriptionTranslateY 
        },
        { 
          iconScale: 0.8, iconOpacity: 0,
          descriptionOpacity: 0, descriptionTranslateY: 20
        },
        [[featureOpacities, featureTranslateYs]]
      );
      return;
    }

    // Uruchom animacje wejścia
    startStepAnimations({
      header: { opacity: headerOpacity, translateY: headerTranslateY },
      section: { 
        type: 'slideUp',
        opacity: descriptionOpacity, 
        translateY: descriptionTranslateY 
      },
      items: Array.from({ length: 3 }).map((_, index) => ({
        opacity: featureOpacities[index],
        translateY: featureTranslateYs[index]
      }))
    }, { sectionDelay: 200 });

    // Ikona ma osobną animację z fadeScale
    startStepAnimations({
      section: {
        type: 'fadeScale',
        opacity: iconOpacity,
        scale: iconScale,
        initialScale: 0.8,
        initialOpacity: 0
      }
    }, { sectionDelay: 150 });
    
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
        <Animated.View
          style={[
            styles.iconCircle,
            {
              transform: [{ scale: iconScale }],
              opacity: iconOpacity,
            },
          ]}
        >
          <Ionicons name="calendar" size={48} color={colors.primary} />
        </Animated.View>
        <Text style={textStyles.titleMedium}>Zacznij od zaplanowania dnia</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: descriptionOpacity,
            transform: [{ translateY: descriptionTranslateY }],
          },
        ]}
      >
        <Text style={textStyles.description}>
          Zaplanowanie dnia to klucz do efektywnego zarządzania czasem. 
          Dzięki naszemu planerowi możesz:
        </Text>

        <View style={styles.featuresList}>
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureOpacities[0],
                transform: [{ translateY: featureTranslateYs[0] }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <Text style={textStyles.featureText}>Dodawać zadania z datą i godziną</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureOpacities[1],
                transform: [{ translateY: featureTranslateYs[1] }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <Text style={textStyles.featureText}>Śledzić postęp w kalendarzu</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureOpacities[2],
                transform: [{ translateY: featureTranslateYs[2] }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <Text style={textStyles.featureText}>Organizować swój czas z łatwością</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.activeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  content: {
    alignItems: 'center',
  },
  featuresList: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

