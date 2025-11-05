import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  BackHandler,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// PagerView - na webie używa mocka z metro.config.js
import PagerViewModule from 'react-native-pager-view';
const PagerView = PagerViewModule?.default || PagerViewModule;
import { 
  useAnimatedStyle, 
  useSharedValue, 
  Animated,
  AnimatedView,
} from '../utils/animationHelpers';
import { 
  animateTimelineProgress, 
  initializeTimelineProgress,
  animateModalFade,
  animateMenuFlash,
  animateGlassProgress,
  animateIconPress,
} from '../utils/commonAnimations';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import useAppStore from '../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FROST_NOISE_SOURCE } from '../utils/frostNoise';

import Step1Intro from './WelcomeSteps/Step1Intro';
import Step2UserData from './WelcomeSteps/Step2UserData';
import Step3Info from './WelcomeSteps/Step3Info';
import Step4WakeTime from './WelcomeSteps/Step4WakeTime';
import Step5BedTime from './WelcomeSteps/Step5BedTime';
import Step6FirstTask from './WelcomeSteps/Step6FirstTask';
import WelcomeBackgroundGraphics from './WelcomeBackgroundGraphics';
import BackButton from './BackButton';
import { colors } from '../utils/colors';

const TOTAL_STEPS = 6;

// Komponent animowanego progress dot
const AnimatedProgressDot = ({ dot, isActive, isCompleted, style }) => {
  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dot.scale.value }],
    opacity: dot.opacity.value,
    height: dot.height.value,
  }));
  
  return (
    <AnimatedView
      style={[
        styles.progressDot,
        dotAnimatedStyle,
        isActive && styles.progressDotActive,
        isCompleted && styles.progressDotCompleted,
        style,
      ]}
    />
  );
};


export default function WelcomeModal({ visible, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({ firstName: '', lastName: '', birthDate: null });
  const [taskTime, setTaskTime] = useState('08:00');
  const [taskDate, setTaskDate] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  
  const pagerRef = useRef(null);
  const opacity = useSharedValue(0);
  const glassProgress = useSharedValue(0);
  const menuFlash = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const prevStep = React.useRef(currentStep);
  const isBlockingScroll = React.useRef(false);
  const { saveUserData, addTask, setOnboardingCompleted } = useAppStore();
  
  // Animacje dla timeline - tworzymy wszystkie shared values bezwarunkowo
  const dot0Scale = useSharedValue(1);
  const dot0Opacity = useSharedValue(0.4);
  const dot0Height = useSharedValue(4);
  const dot1Scale = useSharedValue(1);
  const dot1Opacity = useSharedValue(0.4);
  const dot1Height = useSharedValue(4);
  const dot2Scale = useSharedValue(1);
  const dot2Opacity = useSharedValue(0.4);
  const dot2Height = useSharedValue(4);
  const dot3Scale = useSharedValue(1);
  const dot3Opacity = useSharedValue(0.4);
  const dot3Height = useSharedValue(4);
  const dot4Scale = useSharedValue(1);
  const dot4Opacity = useSharedValue(0.4);
  const dot4Height = useSharedValue(4);
  const dot5Scale = useSharedValue(1);
  const dot5Opacity = useSharedValue(0.4);
  const dot5Height = useSharedValue(4);
  
  // Tworzymy tablicę z referencjami do shared values - używamy useMemo aby nie tworzyć nowej tablicy przy każdym renderze
  const progressDots = React.useMemo(() => [
    { scale: dot0Scale, opacity: dot0Opacity, height: dot0Height },
    { scale: dot1Scale, opacity: dot1Opacity, height: dot1Height },
    { scale: dot2Scale, opacity: dot2Opacity, height: dot2Height },
    { scale: dot3Scale, opacity: dot3Opacity, height: dot3Height },
    { scale: dot4Scale, opacity: dot4Opacity, height: dot4Height },
    { scale: dot5Scale, opacity: dot5Opacity, height: dot5Height },
  ], []);

  const AnimatedBlurView = Animated.createAnimatedComponent
    ? Animated.createAnimatedComponent(BlurView)
    : BlurView;
  const AnimatedNoiseImage = Animated.createAnimatedComponent
    ? Animated.createAnimatedComponent(Image)
    : Image;

  useEffect(() => {
    animateModalFade(opacity, visible);
  }, [visible, opacity]);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep > 0) {
        goToStep(currentStep - 1);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, currentStep]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glassProgress.value * 0.35,
  }));

  const noiseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + glassProgress.value * 0.15,
    transform: [
      { scale: 1 + glassProgress.value * 0.06 },
      { translateX: glassProgress.value * 5 },
      { translateY: glassProgress.value * 5 },
    ],
  }));

  // Animacja błysku menu przy zmianie kroku lub kliknięciu
  const flashStyle = useAnimatedStyle(() => ({
    opacity: menuFlash.value,
  }));

  // Animacja ikony
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Wykryj zmianę kroku i dodaj błysk + animacje timeline
  React.useEffect(() => {
    if (prevStep.current !== currentStep) {
      // Delikatny błysk przy zmianie kroku
      animateMenuFlash(menuFlash, { maxOpacity: 0.4, riseDuration: 100, fallDuration: 200 });
      
      // Animacje timeline
      animateTimelineProgress(progressDots, currentStep);
      
      prevStep.current = currentStep;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, menuFlash]);
  
  // Inicjalizacja animacji timeline przy pierwszym renderze
  React.useEffect(() => {
    if (visible) {
      initializeTimelineProgress(progressDots, currentStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currentStep]);

  const goToStep = (step) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
      if (pagerRef.current) {
        pagerRef.current.setPage(step);
      }
      impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      // Save data before moving to next step
      if (currentStep === 1) {
        // Step 2 - Save user data
        await saveUserData(userData);
      }
      
      goToStep(currentStep + 1);
    } else {
      // Last step - complete onboarding
      await handleComplete(null, null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleComplete = async (finalTaskTitle, finalTaskDescription) => {
    // Use provided title/description or fallback to state
      const title = finalTaskTitle || taskTitle;
      const description = finalTaskDescription || taskDescription;
      
      // Create task from collected data (time from Step4/now at index 5, date from Step5, title/description from Step6/now at index 3)
      if (title && title.trim()) {
        const taskData = {
          title: title.trim(),
          description: (description || '').trim() || '',
          priority: 'medium',
          time: taskTime || null,
          dueDate: taskDate || null,
        };
        
        console.log('[WelcomeModal] Creating task with data:', taskData);
        await addTask(taskData);
        console.log('[WelcomeModal] Task created successfully');
      } else {
        console.warn('[WelcomeModal] Cannot create task - title is empty');
      }

      // Mark onboarding as completed
      await setOnboardingCompleted(true);
      
      notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.();
  };

  const handleTaskComplete = (task) => {
    console.log('[WelcomeModal] handleTaskComplete called with:', task);
    console.log('[WelcomeModal] Current task data:', {
      taskTime,
      taskDate,
      taskTitle,
      taskDescription,
    });
    
    // Store title and description from Step6 for potential state updates
    setTaskTitle(task.title || '');
    setTaskDescription(task.description || '');
    
    // Complete the onboarding and create task with provided data
    // Pass all collected data: time from Step4/now at index 5, date from Step5, title/description from Step6/now at index 3
    handleComplete(task.title, task.description);
  };

  const handlePageSelected = (e) => {
    // Ignoruj jeśli blokujemy scroll (zapobiega nieskończonej pętli)
    if (isBlockingScroll.current) {
      return;
    }
    
    const page = e.nativeEvent.position;
    const previousStep = prevStep.current;
    
    // Walidacja: nie pozwól przejść do następnej strony jeśli formularz nie jest wypełniony
    // Sprawdzamy czy próbujemy przejść do przodu (nie wstecz)
    if (page > previousStep) {
      // Walidacja dla kroku 2 (imię)
      if (previousStep === 1 && userData.firstName.trim().length === 0) {
        // Wróć do poprzedniej strony
        isBlockingScroll.current = true;
        if (pagerRef.current) {
          pagerRef.current.setPage(previousStep);
        }
        // Reset flagi w następnym ticku
        queueMicrotask(() => {
          isBlockingScroll.current = false;
        });
        return;
      }
      // Walidacja dla kroku 4 (tytuł zadania)
      if (previousStep === 3 && taskTitle.trim().length === 0) {
        // Wróć do poprzedniej strony
        isBlockingScroll.current = true;
        if (pagerRef.current) {
          pagerRef.current.setPage(previousStep);
        }
        // Reset flagi w następnym ticku
        queueMicrotask(() => {
          isBlockingScroll.current = false;
        });
        return;
      }
    }
    
    setCurrentStep(page);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: // Step 2 - User data
        return userData.firstName.trim().length > 0;
      case 3: // Step 4 - Task (now at index 3)
        return taskTitle.trim().length > 0;
      default:
        return true;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Back Button - Left Top Corner */}
        {currentStep > 0 && (
          <BackButton onPress={handleBack} />
        )}
        
        {/* Background Graphics */}
        <WelcomeBackgroundGraphics currentStep={currentStep} />
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
              const dot = progressDots[index];
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <AnimatedProgressDot
                  key={index}
                  dot={dot}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
              );
            })}
          </View>
        </View>

        {/* Pager View - na webie używa mocka z metro.config.js */}
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={handlePageSelected}
          scrollEnabled={false} // Disable swipe, use buttons only
        >
          <View key="step1">
            <Step1Intro isActive={currentStep === 0} />
          </View>
          <View key="step2">
            <Step2UserData 
              onDataChange={setUserData}
              initialData={userData}
              isActive={currentStep === 1}
            />
          </View>
          <View key="step3">
            <Step3Info isActive={currentStep === 2} />
          </View>
          <View key="step4">
            <Step6FirstTask 
              onDataChange={(task) => {
                setTaskTitle(task.title || '');
                setTaskDescription(task.description || '');
              }}
              initialTask={{ title: taskTitle, description: taskDescription }}
              isActive={currentStep === 3}
            />
          </View>
          <View key="step5">
            <Step5BedTime 
              onDateChange={setTaskDate}
              initialDate={taskDate}
              isActive={currentStep === 4}
            />
          </View>
          <View key="step6">
            <Step4WakeTime 
              onTimeChange={setTaskTime}
              initialTime={taskTime}
              isActive={currentStep === 5}
            />
          </View>
        </PagerView>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
            <View style={styles.shadowContainer}>
              <AnimatedBlurView
                tint={Platform.OS === 'ios' ? 'light' : 'default'}
                intensity={Platform.OS === 'ios' ? 96 : Platform.OS === 'android' ? 80 : 50}
                style={[
                  styles.blurContainer,
                  Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                ]}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              >
                <View style={styles.menuCard}>
                  <LinearGradient
                    colors={[colors.glassGradientStart, colors.glassGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradientCard}
                  >
                    {/* Błysk przy zmianie kroku lub kliknięciu */}
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.flashOverlay, flashStyle]}
                    />
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.highlightOverlay, highlightStyle]}
                    />
                    <AnimatedNoiseImage
                      pointerEvents="none"
                      source={FROST_NOISE_SOURCE}
                      resizeMode="cover"
                      style={[styles.noiseTexture, noiseStyle]}
                    />
                    <View style={styles.navigationContent}>
                      <Pressable
                        style={[styles.nextButton, !canGoNext() && styles.nextButtonDisabled]}
                        onPress={handleNext}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPressIn={() => {
                          impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          animateGlassProgress(glassProgress, 1);
                          animateMenuFlash(menuFlash, { maxOpacity: 0.3, riseDuration: 80, fallDuration: 150 });
                          animateIconPress(iconScale, 0.92);
                        }}
                        onPressOut={() => {
                          animateGlassProgress(glassProgress, 0);
                          animateIconPress(iconScale, 1);
                        }}
                        disabled={!canGoNext()}
                      >
                        <Text style={styles.nextButtonText}>
                          {currentStep === TOTAL_STEPS - 1 ? 'Zakończ' : 'Dalej'}
                        </Text>
                        <Animated.View style={iconAnimatedStyle}>
                          <Ionicons 
                            name={currentStep === TOTAL_STEPS - 1 ? "checkmark-circle" : "chevron-forward"} 
                            size={20} 
                            color={colors.iconActive} 
                          />
                        </Animated.View>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </View>
              </AnimatedBlurView>
            </View>
          </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 16,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  progressDot: {
    flex: 1,
    minHeight: 3,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.accent,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexGrow: 1,
  },
  navigation: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shadowContainer: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 24px 54px rgba(0, 0, 0, 0.22)',
    }),
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'transparent',
  },
  menuCard: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.accentTransparent,
    width: '100%',
    backgroundColor: colors.cardTransparentDark,
  },
  gradientCard: {
    borderRadius: 32,
    width: '100%',
    overflow: 'hidden',
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accentTransparentLight,
    ...(Platform.OS === 'web' && {
      mixBlendMode: 'soft-light',
    }),
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.whiteTransparent,
    zIndex: 2,
  },
  noiseTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
    zIndex: 1,
  },
  navigationContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    width: '100%',
    zIndex: 10,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 18,
    minHeight: 56, // Minimum 56px dla lepszej klikalności na mobile
    paddingVertical: 20,
    paddingHorizontal: 28,
    gap: 10,
    zIndex: 11,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18, // Zwiększone dla lepszej czytelności
    fontWeight: getFontWeight('600'),
    color: colors.iconActive,
    fontFamily: getFontFamily('600', 'text'),
  },
});

