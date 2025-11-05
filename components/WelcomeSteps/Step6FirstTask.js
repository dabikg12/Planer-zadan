import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { impactAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { Animated, useAnimatedStyle, useSharedValue } from '../../utils/animationHelpers';
import { textStyles } from '../../utils/textStyles';
import { colors } from '../../utils/colors';
import { 
  startStepAnimations,
  animateInputFocus,
  animateButtonAppear,
  animateIconPress,
} from '../../utils/commonAnimations';
import { inputStyles, getInputContainerStyle, HIT_SLOP } from '../../utils/inputStyles';

const taskSuggestions = [
  { text: 'Zrobić zakupy', icon: 'cart-outline' },
  { text: 'Zadzwonić do lekarza', icon: 'medical-outline' },
  { text: 'Trening na siłowni', icon: 'fitness-outline' },
  { text: 'Spotkanie z przyjacielem', icon: 'people-outline' },
  { text: 'Nauka nowej umiejętności', icon: 'school-outline' },
  { text: 'Posprzątać mieszkanie', icon: 'home-outline' },
  { text: 'Przeczytać książkę', icon: 'book-outline' },
  { text: 'Przygotować prezentację', icon: 'document-text-outline' },
  { text: 'Napisć email do szefa', icon: 'mail-outline' },
  { text: 'Zaplanować podróż', icon: 'airplane-outline' },
  { text: 'Odebrać pranie', icon: 'shirt-outline' },
  { text: 'Przygotować obiad', icon: 'restaurant-outline' },
  { text: 'Zrobić poranne ćwiczenia', icon: 'barbell-outline' },
  { text: 'Medytacja', icon: 'leaf-outline' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export default function Step6FirstTask({ onDataChange, initialTask = null, isActive = true }) {
  const [taskTitle, setTaskTitle] = useState(initialTask?.title || '');
  const [taskDescription, setTaskDescription] = useState(initialTask?.description || '');
  const [selectedIcon, setSelectedIcon] = useState('document-text-outline');

  // Animacje dla nagłówka
  const headerOpacity = useRef(new RNAnimated.Value(1)).current; // Na stałe widoczny (bez fade-in)
  const headerTranslateY = useRef(new RNAnimated.Value(20)).current;

  // Update parent when data changes
  useEffect(() => {
    onDataChange?.({ title: taskTitle, description: taskDescription });
  }, [taskTitle, taskDescription, onDataChange]);

  // Znajdź ikonę dla aktualnego tytułu
  const getIconForTitle = (title) => {
    const suggestion = taskSuggestions.find(s => s.text === title);
    return suggestion ? suggestion.icon : 'document-text-outline';
  };

  // Aktualizuj ikonę gdy tytuł się zmienia
  useEffect(() => {
    const icon = getIconForTitle(taskTitle);
    setSelectedIcon(icon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskTitle]);

  // Animacje wejścia
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

  const handleSuggestionPress = (suggestionText, suggestionIcon) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTaskTitle(suggestionText);
    setSelectedIcon(suggestionIcon);
  };

  // Animacja dla input container
  const borderColor = useSharedValue(colors.border);
  const inputScale = useSharedValue(1);
  const inputShadow = useSharedValue(0);

  useEffect(() => {
    animateInputFocus(
      { borderColor, scale: inputScale, shadow: inputShadow },
      taskTitle.trim().length > 0,
      { focusedBorderColor: colors.primary, blurredBorderColor: colors.border }
    );
  }, [taskTitle]);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    transform: [{ scale: inputScale.value }],
    elevation: inputShadow.value,
    shadowOpacity: inputShadow.value * 0.15,
    shadowRadius: inputShadow.value * 0.5,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={Platform.OS === 'ios'}
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
        <Text style={textStyles.titleMedium}>Co chcesz osiągnąć?</Text>
        <Text style={textStyles.h2Heading}>Wybierz pierwsze zadanie</Text>
      </RNAnimated.View>

      <View style={styles.content}>
        <View style={styles.inputSection}>
          <View style={styles.labelContainer}>
            <Text style={textStyles.label}>Tytuł zadania</Text>
            <Text style={textStyles.required}>*</Text>
          </View>
          <AnimatedView style={[getInputContainerStyle('icon'), inputAnimatedStyle]}>
            <View style={styles.inputIconContainer}>
              <Ionicons 
                name={selectedIcon} 
                size={20} 
                color={colors.card} 
              />
            </View>
            <TextInput
              style={inputStyles.inputLarge}
              placeholder="Wpisz tytuł zadania"
              placeholderTextColor={colors.textTertiary}
              value={taskTitle}
              onChangeText={setTaskTitle}
              autoCapitalize="sentences"
              autoCorrect={true}
            />
          </AnimatedView>
        </View>

        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <View style={styles.divider} />
            <Text style={styles.suggestionsLabel}>Lub wybierz sugestię</Text>
            <View style={styles.divider} />
          </View>
          <ScrollView 
            style={styles.suggestionsContainer}
            contentContainerStyle={styles.suggestionsContent}
            showsVerticalScrollIndicator={false}
          >
            {taskSuggestions.map((suggestion, index) => (
              <SuggestionButton
                key={index}
                text={suggestion.text}
                icon={suggestion.icon}
                index={index}
                onPress={() => handleSuggestionPress(suggestion.text, suggestion.icon)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const SuggestionButton = ({ text, icon, index, onPress }) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    // Staggered animation - each button appears with a delay
    const delay = index * 50 + 100; // Start after 100ms, then stagger
    animateButtonAppear(
      { opacity, translateY, scale },
      { delay, initialTranslateY: 15, initialScale: 0.9 }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    animateIconPress(scale, 0.97, { useSpring: true });
  };

  const handlePressOut = () => {
    animateIconPress(scale, 1, { useSpring: true });
  };

  return (
    <AnimatedPressable
      style={[inputStyles.suggestionButton, animatedStyle]}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionIconContainer}>
          <Ionicons name={icon} size={20} color={colors.card} />
        </View>
        <Text style={[textStyles.suggestionText, { flex: 1 }]}>{text}</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  inputSection: {
    marginBottom: 28,
    ...inputStyles.welcomeInputGroup,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionsSection: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  suggestionsLabel: {
    ...textStyles.captionSmall,
    marginHorizontal: 16,
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  suggestionsContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
