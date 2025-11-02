import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { impactAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { colors } from '../../utils/colors';
import { textStyles } from '../../utils/textStyles';
import { resetAnimationValues, startStepAnimations } from '../../utils/commonAnimations';

// Generate time slots from 8:00 to 23:45, every 15 minutes
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Constants for iOS-style picker
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function Step4WakeTime({ onTimeChange, initialTime = '08:00', isActive = true }) {
  const initialIndex = timeSlots.indexOf(initialTime);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [confirmedIndex, setConfirmedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const scrollViewRef = useRef(null);

  // Animacje dla nagłówka i pickera
  const headerOpacity = useRef(new Animated.Value(1)).current; // Na stałe widoczny (bez fade-in)
  const headerTranslateY = useRef(new Animated.Value(20)).current;
  const pickerOpacity = useRef(new Animated.Value(0)).current;
  const pickerTranslateY = useRef(new Animated.Value(20)).current;

  const selectedTime = useMemo(() => timeSlots[confirmedIndex], [confirmedIndex]);

  // Only update parent when confirmed (centered)
  React.useEffect(() => {
    onTimeChange?.(selectedTime);
  }, [selectedTime]);

  // Scroll to initial position when component mounts
  useEffect(() => {
    if (scrollViewRef.current && initialIndex >= 0) {
      scrollViewRef.current.scrollTo({
        y: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, []);

  // Animacje wejścia
  useEffect(() => {
    if (!isActive) {
      // Reset animacji gdy krok jest nieaktywny
      headerTranslateY.setValue(20);
      resetAnimationValues(
        { pickerOpacity, pickerTranslateY },
        { 
          pickerOpacity: 0, pickerTranslateY: 20
        }
      );
      return;
    }

    // Uruchom animacje wejścia
    startStepAnimations({
      header: { opacity: headerOpacity, translateY: headerTranslateY },
      section: { type: 'slideUp', opacity: pickerOpacity, translateY: pickerTranslateY }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const handleScroll = (event) => {
    // Only update visual selection (no heavy operations)
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(timeSlots.length - 1, index));
    
    if (clampedIndex !== selectedIndex) {
      setSelectedIndex(clampedIndex);
    }
  };

  const handleScrollEndDrag = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(timeSlots.length - 1, index));
    const targetY = clampedIndex * ITEM_HEIGHT;
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: true,
      });
    }
    
    // Confirm selection when centered
    setConfirmedIndex(clampedIndex);
    setSelectedIndex(clampedIndex);
  };

  const handleMomentumScrollEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(timeSlots.length - 1, index));
    
    // Confirm selection when centered
    setConfirmedIndex(clampedIndex);
    setSelectedIndex(clampedIndex);
    
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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
        <Text style={textStyles.titleLarge}>O której godzinie?</Text>
        <Text style={textStyles.subtitle}>Wybierz godzinę zadania</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.pickerContainer,
          {
            opacity: pickerOpacity,
            transform: [{ translateY: pickerTranslateY }],
          },
        ]}
      >
        {/* Top gradient fade */}
        <LinearGradient
          colors={[colors.background, 'transparent']}
          style={styles.gradientTop}
          pointerEvents="none"
        />

        {/* ScrollView with time slots */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.pickerScrollView}
          contentContainerStyle={styles.pickerContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={32}
          bounces={true}
        >
          {timeSlots.map((time, index) => {
            const isSelected = index === selectedIndex;
            return (
              <View
                key={index}
                style={[
                  styles.pickerItem,
                  { height: ITEM_HEIGHT },
                ]}
              >
                <Text
                  style={[
                    textStyles.pickerItemText,
                    isSelected && textStyles.pickerItemTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom gradient fade */}
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.gradientBottom}
          pointerEvents="none"
        />
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
  pickerContainer: {
    height: PICKER_HEIGHT,
    position: 'relative',
    marginVertical: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerContent: {
    paddingTop: ITEM_HEIGHT * 2,
    paddingBottom: ITEM_HEIGHT * 2,
    alignItems: 'center',
  },
  pickerItem: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    // Selected item styling handled via text style
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
  },
});

