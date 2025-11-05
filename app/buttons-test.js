import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IOSButton from '../components/IOSButton';
import { colors } from '../utils/colors';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';

// Warunkowy import expo-notifications
let Notifications;
let scheduleNotificationAsync;
try {
  const notificationsModule = require('expo-notifications');
  Notifications = notificationsModule.default;
  scheduleNotificationAsync = notificationsModule.scheduleNotificationAsync;
} catch (e) {
  console.warn('expo-notifications not available');
}

export default function ButtonsTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loadingButton, setLoadingButton] = useState(false);
  const [clickInfo, setClickInfo] = useState('');

  // Funkcje testowe
  const handleAlertTest = () => {
    Alert.alert(
      'Test Alert iOS',
      'To jest natywny alert iOS. Działa na wszystkich platformach.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
          onPress: () => setClickInfo('Anulowano'),
        },
        {
          text: 'OK',
          onPress: () => setClickInfo('Kliknięto OK'),
        },
      ],
      { cancelable: true }
    );
  };

  const handleActionSheetTest = () => {
    if (Platform.OS === 'ios') {
      // Na iOS można użyć ActionSheetIOS
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Anuluj', 'Opcja 1', 'Opcja 2', 'Opcja 3'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setClickInfo('Wybrano: Opcja 1');
          } else if (buttonIndex === 2) {
            setClickInfo('Wybrano: Opcja 2');
          } else if (buttonIndex === 3) {
            setClickInfo('Wybrano: Opcja 3 (destructive)');
          } else {
            setClickInfo('Anulowano');
          }
        }
      );
    } else {
      Alert.alert('Info', 'Action Sheet jest dostępny tylko na iOS');
    }
  };

  const handleNotificationTest = async () => {
    if (!scheduleNotificationAsync) {
      Alert.alert(
        'Info',
        'expo-notifications nie jest zainstalowane. Zainstaluj: npm install expo-notifications'
      );
      return;
    }

    try {
      // Zażądaj uprawnień
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Błąd', 'Uprawnienia do powiadomień nie zostały przyznane');
        return;
      }

      // Zaplanuj powiadomienie za 2 sekundy
      await scheduleNotificationAsync({
        content: {
          title: 'Test powiadomienia iOS',
          body: 'To jest testowe powiadomienie lokalne!',
          sound: true,
          badge: 1,
        },
        trigger: {
          seconds: 2,
        },
      });

      setClickInfo('Powiadomienie zaplanowane na 2 sekundy');
      Alert.alert('Sukces', 'Powiadomienie zostało zaplanowane');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Błąd', 'Nie udało się zaplanować powiadomienia');
    }
  };

  const handleLoadingTest = () => {
    setLoadingButton(true);
    setClickInfo('Symulowanie ładowania...');
    
    setTimeout(() => {
      setLoadingButton(false);
      setClickInfo('Ładowanie zakończone!');
    }, 3000);
  };

  const handleHapticTest = (type) => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setClickInfo('Haptic: Light');
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setClickInfo('Haptic: Medium');
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setClickInfo('Haptic: Heavy');
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setClickInfo('Haptic: Success');
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setClickInfo('Haptic: Warning');
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setClickInfo('Haptic: Error');
          break;
      }
    } else {
      setClickInfo('Haptic feedback dostępny tylko na iOS');
    }
  };

  const Section = ({ title, children }) => (
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
        {title}
      </Text>
      {children}
    </View>
  );

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
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </Pressable>
        <Text
          style={{
            fontSize: 28,
            fontWeight: getFontWeight('bold'),
            color: colors.text,
            fontFamily: getFontFamily('bold', 'display'),
          }}
        >
          Test Przycisków iOS
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
        {/* Informacja o kliknięciu */}
        {clickInfo ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontFamily: getFontFamily('600', 'text'),
                marginBottom: 4,
              }}
            >
              Ostatnia akcja:
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.text,
                fontFamily: getFontFamily('normal', 'text'),
              }}
            >
              {clickInfo}
            </Text>
          </View>
        ) : null}

        {/* Warianty przycisków */}
        <Section title="Warianty przycisków">
          <View style={{ gap: 12 }}>
            <IOSButton
              title="Primary (Niebieski)"
              onPress={() => setClickInfo('Kliknięto: Primary')}
              variant="primary"
            />
            <IOSButton
              title="Secondary (Z obramowaniem)"
              onPress={() => setClickInfo('Kliknięto: Secondary')}
              variant="secondary"
            />
            <IOSButton
              title="Plain (Tekstowy)"
              onPress={() => setClickInfo('Kliknięto: Plain')}
              variant="plain"
            />
            <IOSButton
              title="Destructive (Czerwony)"
              onPress={() => setClickInfo('Kliknięto: Destructive')}
              variant="destructive"
            />
            <IOSButton
              title="Gray (Szary)"
              onPress={() => setClickInfo('Kliknięto: Gray')}
              variant="gray"
            />
          </View>
        </Section>

        {/* Rozmiary */}
        <Section title="Rozmiary">
          <View style={{ gap: 12 }}>
            <IOSButton
              title="Small"
              onPress={() => setClickInfo('Kliknięto: Small')}
              variant="primary"
              size="small"
            />
            <IOSButton
              title="Medium (domyślny)"
              onPress={() => setClickInfo('Kliknięto: Medium')}
              variant="primary"
              size="medium"
            />
            <IOSButton
              title="Large"
              onPress={() => setClickInfo('Kliknięto: Large')}
              variant="primary"
              size="large"
            />
          </View>
        </Section>

        {/* Stany */}
        <Section title="Stany">
          <View style={{ gap: 12 }}>
            <IOSButton
              title="Disabled"
              onPress={() => {}}
              variant="primary"
              disabled={true}
            />
            <IOSButton
              title={loadingButton ? 'Ładowanie...' : 'Test Loading'}
              onPress={handleLoadingTest}
              variant="primary"
              loading={loadingButton}
            />
          </View>
        </Section>

        {/* Funkcjonalności testowe */}
        <Section title="Funkcjonalności testowe">
          <View style={{ gap: 12 }}>
            <IOSButton
              title="Test Alert iOS"
              onPress={handleAlertTest}
              variant="primary"
            />
            
            {Platform.OS === 'ios' && (
              <IOSButton
                title="Test Action Sheet"
                onPress={handleActionSheetTest}
                variant="secondary"
              />
            )}

            <IOSButton
              title="Test Powiadomienia iOS"
              onPress={handleNotificationTest}
              variant="primary"
            />

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: getFontWeight('600'),
                  color: colors.textSecondary,
                  marginBottom: 12,
                  fontFamily: getFontFamily('600', 'text'),
                }}
              >
                Haptic Feedback (tylko iOS):
              </Text>
              <View style={{ gap: 8 }}>
                <IOSButton
                  title="Light Impact"
                  onPress={() => handleHapticTest('light')}
                  variant="secondary"
                  size="small"
                />
                <IOSButton
                  title="Medium Impact"
                  onPress={() => handleHapticTest('medium')}
                  variant="secondary"
                  size="small"
                />
                <IOSButton
                  title="Heavy Impact"
                  onPress={() => handleHapticTest('heavy')}
                  variant="secondary"
                  size="small"
                />
                <IOSButton
                  title="Success Notification"
                  onPress={() => handleHapticTest('success')}
                  variant="secondary"
                  size="small"
                />
                <IOSButton
                  title="Warning Notification"
                  onPress={() => handleHapticTest('warning')}
                  variant="secondary"
                  size="small"
                />
                <IOSButton
                  title="Error Notification"
                  onPress={() => handleHapticTest('error')}
                  variant="secondary"
                  size="small"
                />
              </View>
            </View>
          </View>
        </Section>

        {/* Przykłady użycia */}
        <Section title="Przykłady użycia">
          <View style={{ gap: 12 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  fontFamily: getFontFamily('normal', 'text'),
                }}
              >
                Grupa przycisków (np. w formularzu):
              </Text>
              <View style={{ gap: 8 }}>
                <IOSButton
                  title="Zapisz"
                  onPress={() => setClickInfo('Zapisz')}
                  variant="primary"
                />
                <IOSButton
                  title="Anuluj"
                  onPress={() => setClickInfo('Anuluj')}
                  variant="secondary"
                />
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  fontFamily: getFontFamily('normal', 'text'),
                }}
              >
                Akcja destrukcyjna:
              </Text>
              <IOSButton
                title="Usuń konto"
                onPress={() => setClickInfo('Usuń konto')}
                variant="destructive"
              />
            </View>
          </View>
        </Section>

        {/* Informacje o platformie */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 8,
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
            Informacje:
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 20,
              fontFamily: getFontFamily('normal', 'text'),
            }}
          >
            Platforma: {Platform.OS === 'ios' ? 'iOS' : Platform.OS}
            {'\n'}
            Action Sheet: {Platform.OS === 'ios' ? 'Dostępny' : 'Niedostępny'}
            {'\n'}
            Haptic Feedback: {Platform.OS === 'ios' ? 'Dostępny' : 'Niedostępny'}
            {'\n'}
            Powiadomienia: {scheduleNotificationAsync ? 'Dostępne' : 'Wymaga instalacji expo-notifications'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

