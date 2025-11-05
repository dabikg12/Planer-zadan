import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Pressable,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IOSButton from '../components/IOSButton';
import { colors } from '../utils/colors';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { inputStyles, HIT_SLOP } from '../utils/inputStyles';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import useAppStore from '../store/useAppStore';
import { formatDateLocal, parseDueDate } from '../utils/dateHelpers';

// Import DateTimePicker
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { metadata, saveUserData, loadMetadata } = useAppStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Załaduj dane użytkownika przy montowaniu
  useEffect(() => {
    loadUserData();
  }, [metadata]);

  const loadUserData = () => {
    const userData = metadata?.preferences?.userData || {};
    const currentFirstName = userData.firstName || '';
    const currentLastName = userData.lastName || '';
    const currentBirthDate = userData.birthDate ? parseDueDate(userData.birthDate) : null;
    
    setFirstName(currentFirstName);
    setLastName(currentLastName);
    setBirthDate(currentBirthDate);
    setHasChanges(false);
  };

  // Sprawdź czy są zmiany
  useEffect(() => {
    const userData = metadata?.preferences?.userData || {};
    const currentFirstName = userData.firstName || '';
    const currentLastName = userData.lastName || '';
    const currentBirthDate = userData.birthDate ? parseDueDate(userData.birthDate) : null;
    
    // Porównaj daty - konwertuj na stringi dla porównania
    const currentBirthDateStr = currentBirthDate ? formatDateLocal(currentBirthDate) : null;
    const birthDateStr = birthDate ? formatDateLocal(birthDate) : null;
    
    const changed = 
      firstName !== currentFirstName || 
      lastName !== currentLastName || 
      birthDateStr !== currentBirthDateStr;
    setHasChanges(changed);
  }, [firstName, lastName, birthDate, metadata]);

  const handleSave = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert('Błąd', 'Wprowadź przynajmniej imię lub nazwisko');
      notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSaving(true);
    
    try {
      await saveUserData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? formatDateLocal(birthDate) : null,
      });
      
      notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
      Alert.alert('Sukces', 'Dane zostały zapisane');
    } catch (error) {
      console.error('[Settings] Error saving user data:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać danych. Spróbuj ponownie.');
      notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Odrzuć zmiany?',
      'Czy na pewno chcesz odrzucić wprowadzone zmiany?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Odrzuć',
          style: 'destructive',
          onPress: () => {
            loadUserData();
            impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      
      {/* Nagłówek */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
          onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text
          style={{
            fontSize: 28,
            fontWeight: getFontWeight('bold'),
            color: colors.text,
            fontFamily: getFontFamily('bold', 'display'),
          }}
        >
          Ustawienia
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sekcja Dane użytkownika */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: getFontWeight('bold'),
              color: colors.text,
              marginBottom: 16,
              fontFamily: getFontFamily('bold', 'display'),
            }}
          >
            Dane użytkownika
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Imię */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: getFontWeight('600'),
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontFamily: getFontFamily('600', 'text'),
                }}
              >
                Imię
              </Text>
              <View style={inputStyles.container}>
                <TextInput
                  placeholder="Wprowadź imię"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={inputStyles.input}
                  placeholderTextColor={colors.textTertiary}
                  textContentType="givenName"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Nazwisko */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: getFontWeight('600'),
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontFamily: getFontFamily('600', 'text'),
                }}
              >
                Nazwisko
              </Text>
              <View style={inputStyles.container}>
                <TextInput
                  placeholder="Wprowadź nazwisko"
                  value={lastName}
                  onChangeText={setLastName}
                  style={inputStyles.input}
                  placeholderTextColor={colors.textTertiary}
                  textContentType="familyName"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Data urodzenia */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: getFontWeight('600'),
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontFamily: getFontFamily('600', 'text'),
                }}
              >
                Data urodzenia
              </Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    setShowDatePicker(true);
                  }
                  impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={inputStyles.container}
                hitSlop={HIT_SLOP}
              >
                <Text
                  style={[
                    inputStyles.input,
                    !birthDate && { color: colors.textTertiary },
                  ]}
                >
                  {birthDate ? formatDateLocal(birthDate) : 'Wybierz datę urodzenia'}
                </Text>
                {birthDate ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setBirthDate(null);
                      impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      padding: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    hitSlop={HIT_SLOP}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                ) : (
                  <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                )}
              </Pressable>
            </View>

            {/* Przyciski akcji */}
            {hasChanges && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <IOSButton
                  title="Odrzuć"
                  onPress={handleDiscard}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
                <IOSButton
                  title="Zapisz"
                  onPress={handleSave}
                  variant="primary"
                  loading={isSaving}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>
        </View>

        {/* Sekcja Testy */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: getFontWeight('bold'),
              color: colors.text,
              marginBottom: 16,
              fontFamily: getFontFamily('bold', 'display'),
            }}
          >
            Testy i narzędzia
          </Text>
          
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={() => {
                impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/buttons-test');
              }}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.activeBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="apps" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: getFontWeight('600'),
                      color: colors.text,
                      marginBottom: 4,
                      fontFamily: getFontFamily('600', 'display'),
                    }}
                  >
                    Test Przycisków iOS
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      fontFamily: getFontFamily('normal', 'text'),
                    }}
                  >
                    Przetestuj różne warianty przycisków iOS
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Informacje */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: getFontWeight('600'),
              color: colors.primary,
              marginBottom: 8,
              fontFamily: getFontFamily('600', 'text'),
            }}
          >
            Informacje
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 20,
              fontFamily: getFontFamily('normal', 'text'),
            }}
          >
            Wprowadź swoje dane, aby aplikacja mogła Cię lepiej rozpoznać. Możesz je zmienić w dowolnym momencie.
          </Text>
        </View>
      </ScrollView>

      {/* Date Picker dla Android */}
      {showDatePicker && Platform.OS === 'android' && DateTimePicker && (
        <DateTimePicker
          value={birthDate || new Date(new Date().setFullYear(new Date().getFullYear() - 20))}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === 'set' && date) {
              setBirthDate(date);
              impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 13))}
          minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
          locale="pl_PL"
          textColor={colors.text}
          accentColor={colors.primary}
        />
      )}

      {/* Date Picker dla iOS w modalu */}
      {Platform.OS === 'ios' && showDatePicker && DateTimePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
          statusBarTranslucent={true}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colors.overlay,
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowDatePicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
                maxHeight: '90%',
              }}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    fontFamily: getFontFamily('600', 'text'),
                  }}
                >
                  Wybierz datę urodzenia
                </Text>
                <Pressable
                  onPress={() => {
                    setShowDatePicker(false);
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: getFontWeight('600'),
                      color: colors.primary,
                      fontFamily: getFontFamily('600', 'text'),
                    }}
                  >
                    Gotowe
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={birthDate || new Date(new Date().setFullYear(new Date().getFullYear() - 20))}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    setBirthDate(date);
                  }
                }}
                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 13))}
                minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                locale="pl_PL"
                textColor={colors.text}
                accentColor={colors.primary}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

