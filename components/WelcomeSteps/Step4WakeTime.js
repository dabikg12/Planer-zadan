import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { impactAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { colors } from '../../utils/colors';
import { textStyles } from '../../utils/textStyles';
import { resetAnimationValues, startStepAnimations } from '../../utils/commonAnimations';
import { getFontFamily, getFontWeight } from '../../utils/fontHelpers';

// Import DateTimePicker dla iOS
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

/**
 * Generuje sloty czasowe od 8:00 do 23:45, co 15 minut (tylko dla web)
 */
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

const TIME_SLOTS = generateTimeSlots();
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = ITEM_HEIGHT * 2;

/**
 * Konwertuje string czasu "HH:MM" na Date object
 */
const timeStringToDate = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Konwertuje Date object na string "HH:MM"
 */
const dateToTimeString = (date) => {
  if (!date) return '08:00';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Komponent wyboru godziny
 * Na iOS używa natywnego pickera z animacją przewijania
 * Na web/desktop używa custom ScrollView
 */
export default function Step4WakeTime({ onTimeChange, initialTime = '08:00', isActive = true }) {
  const isIOS = Platform.OS === 'ios';
  
  // Dla iOS - użyj Date object
  const initialDate = useMemo(() => timeStringToDate(initialTime), [initialTime]);
  const [selectedTimeDate, setSelectedTimeDate] = useState(initialDate);

  // Dla web - znajdź początkowy indeks
  const initialIndex = useMemo(() => {
    const index = TIME_SLOTS.indexOf(initialTime);
    return index >= 0 ? index : 0;
  }, [initialTime]);

  // Referencje (tylko dla web)
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(initialIndex * ITEM_HEIGHT)).current;
  const currentScrollY = useRef(initialIndex * ITEM_HEIGHT);

  // Animacje wejścia
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(20)).current;
  const pickerOpacity = useRef(new Animated.Value(0)).current;
  const pickerTranslateY = useRef(new Animated.Value(20)).current;

  // Dla web - przewiń do początkowej pozycji
  useEffect(() => {
    if (!isIOS && scrollViewRef.current) {
      const scrollToY = initialIndex * ITEM_HEIGHT;
      scrollY.setValue(scrollToY);
      currentScrollY.current = scrollToY;
      
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollToY,
          animated: false,
        });
      });
    }
  }, [initialIndex, scrollY, isIOS]);

  // Dla iOS - aktualizuj wybraną godzinę
  useEffect(() => {
    if (isIOS && onTimeChange) {
      const timeString = dateToTimeString(selectedTimeDate);
      onTimeChange(timeString);
    }
  }, [selectedTimeDate, isIOS, onTimeChange]);

  // Animacje wejścia/wyjścia
  useEffect(() => {
    if (!isActive) {
      headerTranslateY.setValue(20);
      resetAnimationValues(
        { pickerOpacity, pickerTranslateY },
        { pickerOpacity: 0, pickerTranslateY: 20 }
      );
      return;
    }

    startStepAnimations({
      header: { 
        opacity: headerOpacity, 
        translateY: headerTranslateY 
      },
      section: { 
        type: 'slideUp', 
        opacity: pickerOpacity, 
        translateY: pickerTranslateY 
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  /**
   * Web: Oblicza indeks na podstawie pozycji scroll
   */
  const getIndexFromScrollY = useCallback((y) => {
    return Math.max(0, Math.min(TIME_SLOTS.length - 1, Math.round(y / ITEM_HEIGHT)));
  }, []);

  /**
   * Web: Odczytuje i przekazuje wybraną godzinę
   */
  const readTimeFromScroll = useCallback(() => {
    const index = getIndexFromScrollY(currentScrollY.current);
    const selectedTime = TIME_SLOTS[index];
    
    if (onTimeChange) {
      onTimeChange(selectedTime);
    }
    
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onTimeChange, getIndexFromScrollY]);

  /**
   * Web: Handler scrollowania - aktualizuje tylko Animated.Value (zero re-renderów)
   */
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        currentScrollY.current = event.nativeEvent.contentOffset.y;
      },
    }
  );

  /**
   * Web: Zakończenie przewijania - odczyt godziny
   */
  const handleMomentumScrollEnd = useCallback(() => {
    readTimeFromScroll();
  }, [readTimeFromScroll]);

  /**
   * iOS: Handler zmiany czasu w natywnym pickerze
   */
  const handleTimeChange = useCallback((event, date) => {
    if (date) {
      setSelectedTimeDate(date);
      impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  /**
   * Web: Renderuje element pickera z animowanymi stylami
   */
  const renderPickerItem = useCallback((time, index) => {
    const inputRange = TIME_SLOTS.map((_, i) => i * ITEM_HEIGHT);
    
    // Rozmiar tekstu
    const fontSize = scrollY.interpolate({
      inputRange,
      outputRange: TIME_SLOTS.map((_, i) => {
        const distance = Math.abs(i - index);
        return distance === 0 ? 32 : Math.max(8, 20 * (1 - distance * 0.3));
      }),
      extrapolate: 'clamp',
    });

    // Przezroczystość podstawowego tekstu
    const baseOpacity = scrollY.interpolate({
      inputRange,
      outputRange: TIME_SLOTS.map((_, i) => {
        const distance = Math.abs(i - index);
        if (distance === 0) return 0;
        return Math.max(0.2, 1 - distance * 0.3);
      }),
      extrapolate: 'clamp',
    });

    // Przezroczystość wybranego tekstu
    const selectedOpacity = scrollY.interpolate({
      inputRange,
      outputRange: TIME_SLOTS.map((_, i) => {
        const distance = Math.abs(i - index);
        return distance === 0 ? 1 : Math.max(0, 1 - distance * 0.5);
      }),
      extrapolate: 'clamp',
    });

    return (
      <View
        key={`time-${index}`}
        style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
      >
        <Animated.Text
          style={[
            styles.itemTextBase,
            { fontSize, opacity: baseOpacity }
          ]}
        >
          {time}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.selectedItemText,
            { 
              fontSize, 
              opacity: selectedOpacity,
              position: 'absolute',
            }
          ]}
        >
          {time}
        </Animated.Text>
      </View>
    );
  }, [scrollY]);

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
        <Text style={textStyles.titleLarge}>Ustaw godzinę</Text>
        <Text style={textStyles.h2Heading}>Do której planujesz skończyć zadanie</Text>
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
        {isIOS && DateTimePicker ? (
          // iOS: Natywny picker z animacją przewijania
          <View style={styles.iosPickerContainer}>
            <LinearGradient
              colors={[colors.background, 'transparent']}
              style={styles.gradientTop}
              pointerEvents="none"
            />
            <View style={styles.centerIndicator} pointerEvents="none">
              <View style={styles.centerCircle} />
            </View>
            <DateTimePicker
              value={selectedTimeDate}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              minuteInterval={15}
              locale="pl_PL"
              textColor={colors.textSecondary}
              accentColor={colors.primary}
              style={styles.iosPicker}
            />
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.gradientBottom}
              pointerEvents="none"
            />
          </View>
        ) : (
          // Web/Desktop: Custom ScrollView
          <>
            <LinearGradient
              colors={[colors.background, 'transparent']}
              style={styles.gradientTop}
              pointerEvents="none"
            />
            <View style={styles.centerIndicator} pointerEvents="none">
              <View style={styles.centerCircle} />
            </View>
            <Animated.ScrollView
              ref={scrollViewRef}
              style={styles.pickerScrollView}
              contentContainerStyle={styles.pickerContent}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
              bounces={true}
            >
              {TIME_SLOTS.map((time, index) => renderPickerItem(time, index))}
            </Animated.ScrollView>
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.gradientBottom}
              pointerEvents="none"
            />
          </>
        )}
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
  iosPickerContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPicker: {
    width: '100%',
    height: PICKER_HEIGHT,
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerContent: {
    paddingTop: CENTER_OFFSET,
    paddingBottom: CENTER_OFFSET,
    alignItems: 'center',
  },
  pickerItem: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextBase: {
    fontFamily: getFontFamily('normal', 'text'),
    fontWeight: getFontWeight('normal'),
    textAlign: 'center',
    color: colors.textTertiary,
  },
  selectedItemText: {
    fontFamily: getFontFamily('bold', 'display'),
    fontWeight: getFontWeight('bold'),
    textAlign: 'center',
    color: colors.textSecondary,
  },
  centerIndicator: {
    position: 'absolute',
    top: CENTER_OFFSET,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  centerCircle: {
    width: 200,
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET,
    zIndex: 2,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET,
    zIndex: 2,
  },
});
