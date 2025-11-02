import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Modal, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { impactAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { Animated, useAnimatedStyle, useSharedValue } from '../../utils/animationHelpers';
import { colors } from '../../utils/colors';
import { textStyles } from '../../utils/textStyles';
import { startStepAnimations, animateInputFocus } from '../../utils/commonAnimations';
import { inputStyles, HIT_SLOP } from '../../utils/inputStyles';

const AnimatedView = Animated.View;

// Import DateTimePicker
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function Step2UserData({ onDataChange, initialData = {}, isActive = true }) {
  const [firstName, setFirstName] = useState(initialData.firstName || '');
  const [lastName, setLastName] = useState(initialData.lastName || '');
  const [birthDate, setBirthDate] = useState(initialData.birthDate ? new Date(initialData.birthDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animacje dla nagłówka
  const headerOpacity = useRef(new RNAnimated.Value(1)).current; // Na stałe widoczny (bez fade-in)
  const headerTranslateY = useRef(new RNAnimated.Value(20)).current;

  // Animacje dla input container - firstName
  const firstNameBorderColor = useSharedValue(colors.border);
  const firstNameScale = useSharedValue(1);
  const firstNameShadow = useSharedValue(0);

  // Animacje dla input container - lastName
  const lastNameBorderColor = useSharedValue(colors.border);
  const lastNameScale = useSharedValue(1);
  const lastNameShadow = useSharedValue(0);

  // Animacje dla input container - birthDate
  const birthDateBorderColor = useSharedValue(colors.border);
  const birthDateScale = useSharedValue(1);
  const birthDateShadow = useSharedValue(0);

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

  const formatDateForWeb = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  React.useEffect(() => {
    onDataChange?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate,
    });
  }, [firstName, lastName, birthDate]);

  // Animacje dla firstName input
  useEffect(() => {
    animateInputFocus(
      { borderColor: firstNameBorderColor, scale: firstNameScale, shadow: firstNameShadow },
      firstName.trim().length > 0,
      { focusedBorderColor: colors.primary, blurredBorderColor: colors.border }
    );
  }, [firstName]);

  // Animacje dla lastName input
  useEffect(() => {
    animateInputFocus(
      { borderColor: lastNameBorderColor, scale: lastNameScale, shadow: lastNameShadow },
      lastName.trim().length > 0,
      { focusedBorderColor: colors.primary, blurredBorderColor: colors.border }
    );
  }, [lastName]);

  // Animacje dla birthDate input
  useEffect(() => {
    animateInputFocus(
      { borderColor: birthDateBorderColor, scale: birthDateScale, shadow: birthDateShadow },
      !!birthDate,
      { focusedBorderColor: colors.primary, blurredBorderColor: colors.border }
    );
  }, [birthDate]);

  const firstNameAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: firstNameBorderColor.value,
    transform: [{ scale: firstNameScale.value }],
    elevation: firstNameShadow.value,
    shadowOpacity: firstNameShadow.value * 0.15,
    shadowRadius: firstNameShadow.value * 0.5,
  }));

  const lastNameAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: lastNameBorderColor.value,
    transform: [{ scale: lastNameScale.value }],
    elevation: lastNameShadow.value,
    shadowOpacity: lastNameShadow.value * 0.15,
    shadowRadius: lastNameShadow.value * 0.5,
  }));

  const birthDateAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: birthDateBorderColor.value,
    transform: [{ scale: birthDateScale.value }],
    elevation: birthDateShadow.value,
    shadowOpacity: birthDateShadow.value * 0.15,
    shadowRadius: birthDateShadow.value * 0.5,
  }));

  const handleDateChange = (event, selectedDate) => {
    // Na Androidzie obsługujemy wybór daty
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      
      if (event.type === 'set' && selectedDate) {
        setBirthDate(selectedDate);
        impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (event.type === 'dismissed') {
        // Użytkownik anulował wybór
      }
    }
    // Na iOS obsługujemy to w inline pickerze w modalu
  };

  const getDefaultDate = () => {
    if (birthDate) {
      return birthDate;
    }
    // Domyślnie pokaż datę sprzed 20 lat
    const date = new Date();
    date.setFullYear(date.getFullYear() - 20);
    return date;
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13); // Minimum 13 lat

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120); // Maksymalnie 120 lat wstecz

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <RNAnimated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={textStyles.titleLarge}>Wprowadź swoje dane</Text>
        <Text style={textStyles.subtitle}>Pozwól nam lepiej Cię poznać</Text>
      </RNAnimated.View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={textStyles.label}>Imię</Text>
          <AnimatedView style={[inputStyles.container, firstNameAnimatedStyle]}>
            <TextInput
              style={inputStyles.input}
              placeholder="Wpisz swoje imię"
              placeholderTextColor={colors.textTertiary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </AnimatedView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={textStyles.label}>Nazwisko</Text>
          <AnimatedView style={[inputStyles.container, lastNameAnimatedStyle]}>
            <TextInput
              style={inputStyles.input}
              placeholder="Wpisz swoje nazwisko"
              placeholderTextColor={colors.textTertiary}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </AnimatedView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={textStyles.label}>Data urodzenia</Text>
          <AnimatedView 
            style={[inputStyles.container, birthDateAnimatedStyle]}
          >
            <Pressable
              onPress={() => {
                setShowDatePicker(true);
                impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={HIT_SLOP}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
            >
              <Text style={[inputStyles.input, !birthDate && textStyles.placeholderText]}>
                {birthDate ? formatDate(birthDate) : 'Wybierz datę urodzenia'}
              </Text>
              <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          </AnimatedView>
        </View>
      </View>

      {/* Natywny Date Picker dla Android */}
      {showDatePicker && Platform.OS === 'android' && DateTimePicker && (
        <DateTimePicker
          value={birthDate || getDefaultDate()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
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
              <Text style={textStyles.modalTitle}>Wybierz datę urodzenia</Text>
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
            <DateTimePicker
              value={birthDate || getDefaultDate()}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                // Na iOS aktualizujemy datę w czasie rzeczywistym podczas przewijania
                if (selectedDate) {
                  setBirthDate(selectedDate);
                }
              }}
              maximumDate={maxDate}
              minimumDate={minDate}
              locale="pl_PL"
              textColor={colors.text}
              accentColor={colors.primary}
            />
          </View>
        </Pressable>
      )}

      {/* Fallback dla web - natywny input daty HTML */}
      {Platform.OS === 'web' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.webModalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.webModalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.webModalHeader}>
                <Text style={textStyles.modalTitleLarge}>Wybierz datę urodzenia</Text>
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={styles.webModalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              <View style={styles.webDateInput}>
                {/* Używamy natywnego inputa HTML dla web */}
                <input
                  type="date"
                  value={birthDate ? formatDateForWeb(birthDate) : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value + 'T12:00:00');
                      setBirthDate(date);
                      setShowDatePicker(false);
                      impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  max={maxDate.toISOString().split('T')[0]}
                  min={minDate.toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: 17,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.completedBg,
                    color: colors.text,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderStyle: 'solid',
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </KeyboardAvoidingView>
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
    marginBottom: 40,
    alignItems: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  inputGroup: {
    marginBottom: 8,
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
    minHeight: 44, // Minimum target area dla mobile
    minWidth: 44,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webDateInput: {
    marginTop: 8,
  },
});
