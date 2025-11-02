import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Modal, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFontFamily } from '../../utils/fontHelpers';
import { impactAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { colors } from '../../utils/colors';
import { textStyles } from '../../utils/textStyles';
import { startStepAnimations } from '../../utils/commonAnimations';
import { inputStyles, HIT_SLOP } from '../../utils/inputStyles';

// Import DateTimePicker
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function Step5BedTime({ onDateChange, initialDate = null, isActive = true }) {
  const [selectedDate, setSelectedDate] = useState(initialDate ? new Date(initialDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState(initialDate || '');

  // Animacje dla nagłówka
  const headerOpacity = useRef(new Animated.Value(1)).current; // Na stałe widoczny (bez fade-in)
  const headerTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!isActive) {
      // Reset animacji gdy krok jest nieaktywny
      headerTranslateY.setValue(20);
      return;
    }

    // Uruchom animację nagłówka
    startStepAnimations({
      header: { opacity: headerOpacity, translateY: headerTranslateY }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}.${month}.${year}`;
  };

  const formatDateForStorage = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  React.useEffect(() => {
    const dateStr = formatDateForStorage(selectedDate);
    onDateChange?.(dateStr);
  }, [selectedDate]);

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setDateInput(formatDateForStorage(date));
        impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleDateInputChange = (text) => {
    setDateInput(text);
    if (text === '') {
      setSelectedDate(null);
      return;
    }
    const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const date = new Date(text + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const getDefaultDate = () => {
    if (selectedDate) {
      return selectedDate;
    }
    return new Date();
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // Maksymalnie rok do przodu

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
        <Text style={textStyles.titleLarge}>Kiedy wykonasz zadanie?</Text>
        <Text style={textStyles.subtitle}>Wybierz datę zadania</Text>
      </Animated.View>

      <View style={styles.inputContainer}>
        <Text style={textStyles.label}>Data (YYYY-MM-DD)</Text>
        {Platform.OS === 'web' ? (
          <View style={inputStyles.container}>
            <input
              type="date"
              value={selectedDate ? formatDateForStorage(selectedDate) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const date = new Date(e.target.value + 'T12:00:00');
                  setSelectedDate(date);
                  setDateInput(e.target.value);
                  impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              min={minDate.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              style={{
                flex: 1,
                fontSize: 17,
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.text,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                outline: 'none',
                width: '100%',
              }}
            />
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </View>
        ) : (
          <Pressable
            style={inputStyles.container}
            hitSlop={HIT_SLOP}
            onPress={() => {
              setShowDatePicker(true);
              impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <TextInput
              style={inputStyles.input}
              placeholder="Wybierz datę"
              placeholderTextColor={colors.textTertiary}
              value={dateInput}
              onChangeText={handleDateInputChange}
              keyboardType="numeric"
              editable={false}
              pointerEvents="none"
            />
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </Pressable>
        )}
        <Text style={textStyles.hintText}>
          Format: RRRR-MM-DD (np. {new Date().toISOString().split('T')[0]})
        </Text>
      </View>

      {/* Natywny Date Picker dla Android */}
      {showDatePicker && Platform.OS === 'android' && DateTimePicker && (
        <DateTimePicker
          value={selectedDate || getDefaultDate()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minDate}
          maximumDate={maxDate}
          locale="pl_PL"
          textColor={colors.text}
          accentColor={colors.primary}
        />
      )}

      {/* Natywny Date Picker dla iOS w modalu */}
      {Platform.OS === 'ios' && showDatePicker && DateTimePicker && (
        <Pressable
          style={styles.iosModalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.iosModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.iosModalHeader}>
              <Text style={textStyles.modalTitle}>Wybierz datę</Text>
              <Pressable
                onPress={() => {
                  setShowDatePicker(false);
                  impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.iosModalCloseButton}
              >
                <Text style={textStyles.modalCloseText}>Gotowe</Text>
              </Pressable>
            </View>
            {selectedDate && (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={textStyles.modalDateDisplay}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
            )}
            <DateTimePicker
              value={selectedDate || getDefaultDate()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date);
                  setDateInput(formatDateForStorage(date));
                  impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              minimumDate={minDate}
              maximumDate={maxDate}
              locale="pl_PL"
              textColor={colors.text}
              accentColor={colors.primary}
            />
          </View>
        </Pressable>
      )}

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
  inputContainer: {
    marginBottom: 32,
    ...inputStyles.welcomeInputGroup,
  },
  iosModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosModalCloseButton: {
    minHeight: 44, // Minimum target area dla mobile
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webModalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  webModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  webModalCloseButton: {
    padding: 4,
  },
  webDateInput: {
    marginTop: 8,
  },
});
