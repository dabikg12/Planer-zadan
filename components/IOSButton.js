import React from 'react';
import { Pressable, Text, ActivityIndicator, Platform } from 'react-native';
import { iosButtonStyles } from '../utils/iosButtonStyles';
import * as Haptics from 'expo-haptics';

/**
 * Komponent przycisku iOS - natywny wygląd zgodny z iOS Human Interface Guidelines
 * 
 * @param {string} title - Tekst przycisku
 * @param {function} onPress - Funkcja wywoływana po kliknięciu
 * @param {string} variant - Wariant przycisku: 'primary' | 'secondary' | 'plain' | 'destructive' | 'gray'
 * @param {string} size - Rozmiar przycisku: 'small' | 'medium' | 'large'
 * @param {boolean} disabled - Czy przycisk jest wyłączony
 * @param {boolean} loading - Czy przycisk pokazuje stan ładowania
 * @param {object} style - Dodatkowe style dla kontenera
 * @param {object} textStyle - Dodatkowe style dla tekstu
 */
export default function IOSButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) {
  const getButtonStyle = () => {
    const baseStyle = iosButtonStyles[variant] || iosButtonStyles.primary;
    const sizeStyle = size !== 'medium' ? iosButtonStyles[size] : {};
    const disabledStyle = disabled ? iosButtonStyles.disabled : {};
    
    return [baseStyle, sizeStyle, disabledStyle, style];
  };

  const getTextStyle = () => {
    const baseTextStyle = iosButtonStyles[`${variant}Text`] || iosButtonStyles.primaryText;
    const sizeTextStyle = size !== 'medium' ? iosButtonStyles[`${size}Text`] : {};
    
    return [baseTextStyle, sizeTextStyle, textStyle];
  };

  const getIndicatorColor = () => {
    if (variant === 'primary' || variant === 'destructive') {
      return '#FFFFFF';
    }
    return '#007AFF';
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    // Haptic feedback na iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !disabled && !loading && {
          opacity: 0.7,
        },
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={getIndicatorColor()} 
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </Pressable>
  );
}

