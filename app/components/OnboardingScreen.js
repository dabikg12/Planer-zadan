import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from '../../utils/animationHelpers';
import { impactAsync, notificationAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { updatePreferences, setOnboardingCompleted } from '../../utils/appMetadata';
import { getFontFamily, getFontWeight } from '../../utils/fontHelpers';

// Color palette - brown/beige theme
const colors = {
  background: '#F5F1E8',
  card: '#FEFCFB',
  primary: '#8B6F47',
  primaryLight: '#A0826D',
  accent: '#C4A484',
  text: '#2A1F15',
  textSecondary: '#6B5238',
  textTertiary: '#A0826D',
  border: '#E8DDD1',
  active: '#C4A484',
  activeBg: '#F0E6D2',
};

export default function OnboardingScreen({ visible, onComplete }) {
  const [userName, setUserName] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  
  const fadeOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeOpacity.value = withTiming(1, { duration: 300 });
    } else {
      fadeOpacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    // Walidacja imienia: minimum 2 znaki, maksimum 30 znaków
    const trimmed = userName.trim();
    setIsNameValid(trimmed.length >= 2 && trimmed.length <= 30);
  }, [userName]);

  const handleComplete = async () => {
    try {
      // Zapisz imię do preferencji
      if (userName.trim()) {
        await updatePreferences({ userName: userName.trim() });
      }
      
      // Oznacz onboarding jako ukończony
      await setOnboardingCompleted(true);
      
      notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } catch (error) {
      console.error('[Onboarding] Error completing onboarding:', error);
      // Mimo błędu kontynuuj, żeby użytkownik nie utknął
      onComplete();
    }
  };

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: 'rgba(42, 31, 21, 0.7)',
          },
          fadeAnimatedStyle,
        ]}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: '90%',
            maxWidth: 500,
            maxHeight: '85%',
            backgroundColor: colors.background,
            borderRadius: 32,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            boxShadow: '0 8px 24px rgba(42, 31, 21, 0.2)',
            elevation: 16,
          }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>
                {/* Ikona i powitanie */}
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                  <View style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: colors.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    boxShadow: '0 4px 12px rgba(139, 111, 71, 0.1)',
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    <Ionicons name="person-add" size={64} color={colors.primary} />
                  </View>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: getFontWeight('bold'),
                    color: colors.text,
                    textAlign: 'center',
                    marginBottom: 12,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    {userName.trim() && isNameValid ? `Witaj, ${userName.trim()}!` : 'Witaj w Planerze!'}
                  </Text>
                  <Text style={{
                    fontSize: 17,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 24,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Zacznijmy od tego, jak mamy Cię nazywać?
                  </Text>
                </View>

                {/* Pole do wprowadzenia imienia */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    marginBottom: 12,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Wprowadź swoje imię
                  </Text>
                  <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Wprowadź swoje imię"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={30}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isNameValid ? colors.primary : colors.border,
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      fontSize: 17,
                      color: colors.text,
                      fontFamily: getFontFamily('normal', 'text'),
                    }}
                  />
                  {userName.length > 0 && !isNameValid && (
                    <Text style={{
                      fontSize: 13,
                      color: colors.accent,
                      marginTop: 8,
                      fontFamily: getFontFamily('normal', 'text'),
                    }}>
                      Imię musi mieć 2-30 znaków
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Footer z przyciskiem */}
            <View style={{
              paddingHorizontal: 24,
              paddingBottom: 24,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <Animated.Pressable
                onPress={handleComplete}
                onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                disabled={!isNameValid}
                style={{
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: isNameValid ? colors.primary : colors.border,
                  opacity: isNameValid ? 1 : 0.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: '#FFFFFF',
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                }}>
                  Rozpocznij
                </Text>
              </Animated.Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}
