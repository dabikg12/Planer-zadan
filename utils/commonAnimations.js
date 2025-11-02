import { Animated } from 'react-native';
import { withTiming, withSequence, withSpring, Easing } from './animationHelpers';

/**
 * Animacje wspólne używane w całej aplikacji
 * Pomagają unikać duplikacji kodu animacji
 */

/**
 * Animacja fade-in z efektem scale (pojawienie się)
 * Ujednolicona funkcja dla wszystkich fade-in + scale animacji
 * @param {Animated.Value} opacityValue - wartość opacity do animowania
 * @param {Animated.Value} scaleValue - wartość scale do animowania
 * @param {Object} options - opcje animacji
 * @param {number} options.duration - czas trwania animacji (domyślnie 400ms)
 * @param {number} options.delay - opóźnienie animacji (domyślnie 0ms)
 * @param {number} options.initialOpacity - początkowa wartość opacity (domyślnie 0)
 * @param {number} options.initialScale - początkowa wartość scale (domyślnie 0.9)
 * @returns {Animated.CompositeAnimation} - animacja do uruchomienia
 */
export const createFadeInScaleAnimation = (
  opacityValue,
  scaleValue,
  options = {}
) => {
  const {
    duration = 400,
    delay = 0,
    initialOpacity = 0,
    initialScale = 0.9,
  } = options;

  // Ustaw wartości początkowe
  opacityValue.setValue(initialOpacity);
  scaleValue.setValue(initialScale);

  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animacja fade-out z efektem scale (znikanie)
 * @param {Animated.Value} opacityValue - wartość opacity do animowania
 * @param {Animated.Value} scaleValue - wartość scale do animowania
 * @param {Object} options - opcje animacji
 * @param {number} options.duration - czas trwania animacji (domyślnie 400ms)
 * @param {number} options.finalOpacity - końcowa wartość opacity (domyślnie 0)
 * @param {number} options.finalScale - końcowa wartość scale (domyślnie 0.9)
 * @param {Function} options.onComplete - callback po zakończeniu animacji
 * @returns {Animated.CompositeAnimation} - animacja do uruchomienia
 */
export const createFadeOutScaleAnimation = (
  opacityValue,
  scaleValue,
  options = {}
) => {
  const {
    duration = 400,
    finalOpacity = 0,
    finalScale = 0.9,
    onComplete,
  } = options;

  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: finalOpacity,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: finalScale,
      duration,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animacja pulsowania (scale + opacity)
 * @param {Animated.Value} scaleValue - wartość scale do animowania
 * @param {Animated.Value} opacityValue - wartość opacity do animowania (opcjonalna)
 * @param {Object} options - opcje animacji
 * @param {number} options.duration - czas trwania jednego cyklu (domyślnie 1000ms)
 * @param {number} options.minScale - minimalna wartość scale (domyślnie 1)
 * @param {number} options.maxScale - maksymalna wartość scale (domyślnie 1.2)
 * @param {number} options.minOpacity - minimalna wartość opacity (domyślnie 0.6)
 * @param {number} options.maxOpacity - maksymalna wartość opacity (domyślnie 1)
 * @param {boolean} options.loop - czy animacja ma się powtarzać (domyślnie true)
 * @returns {Animated.CompositeAnimation} - animacja do uruchomienia
 */
export const createPulseAnimation = (
  scaleValue,
  opacityValue = null,
  options = {}
) => {
  const {
    duration = 1000,
    minScale = 1,
    maxScale = 1.2,
    minOpacity = 0.6,
    maxOpacity = 1,
    loop = true,
  } = options;

  const animations = [];

  if (opacityValue) {
    animations.push(
      Animated.timing(opacityValue, {
        toValue: maxOpacity,
        duration,
        useNativeDriver: true,
      })
    );
  }

  animations.push(
    Animated.timing(scaleValue, {
      toValue: maxScale,
      duration,
      useNativeDriver: true,
    })
  );

  const expandAnimation = Animated.parallel(animations);

  const shrinkAnimations = [];
  if (opacityValue) {
    shrinkAnimations.push(
      Animated.timing(opacityValue, {
        toValue: minOpacity,
        duration,
        useNativeDriver: true,
      })
    );
  }
  shrinkAnimations.push(
    Animated.timing(scaleValue, {
      toValue: minScale,
      duration,
      useNativeDriver: true,
    })
  );

  const shrinkAnimation = Animated.parallel(shrinkAnimations);
  const sequence = Animated.sequence([expandAnimation, shrinkAnimation]);

  return loop ? Animated.loop(sequence) : sequence;
};

/**
 * Animacja fade-in z lekkim pulsowaniem (dla TabNavigator)
 * @param {Animated.Value} opacityValue - wartość opacity do animowania
 * @param {Animated.Value} scaleValue - wartość scale do animowania
 * @param {Object} options - opcje animacji
 * @returns {Animated.CompositeAnimation} - animacja do uruchomienia
 */
export const createFadeInPulseAnimation = (
  opacityValue,
  scaleValue,
  options = {}
) => {
  const {
    fadeDuration = 300,
    pulseMaxScale = 1.02,
    pulseUpDuration = 250,
    pulseDownDuration = 200,
  } = options;

  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true,
    }),
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: pulseMaxScale,
        duration: pulseUpDuration,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1.0,
        duration: pulseDownDuration,
        useNativeDriver: true,
      }),
    ]),
  ]);
};

/**
 * Animacja wejścia dla elementów listy (fade-in + slide-up z opóźnieniem)
 * @param {Animated.Value} opacityValue - wartość opacity do animowania
 * @param {Animated.Value} translateYValue - wartość translateY do animowania
 * @param {Object} options - opcje animacji
 * @param {number} options.delay - opóźnienie animacji w ms
 * @param {number} options.duration - czas trwania animacji (domyślnie 400ms)
 * @param {number} options.translateY - wartość translateY (domyślnie 20)
 * @returns {Animated.CompositeAnimation} - animacja do uruchomienia
 */
export const createSlideUpFadeInAnimation = (
  opacityValue,
  translateYValue,
  options = {}
) => {
  const {
    delay = 0,
    duration = 400,
    translateY = 20,
  } = options;

  // Ustaw wartości początkowe
  opacityValue.setValue(0);
  translateYValue.setValue(translateY);

  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }),
    Animated.timing(translateYValue, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animuje progress dots w timeline przy zmianie etapu
 * Używa Reanimated (shared values)
 * @param {Array} progressDots - tablica obiektów z shared values: { scale, opacity, height }
 * @param {number} currentStep - aktualny krok (0-based)
 * @param {Object} options - opcje animacji
 * @param {number} options.completedHeight - wysokość dla zakończonych kroków (domyślnie 4)
 * @param {number} options.activeHeight - wysokość dla aktywnego kroku (domyślnie 5)
 * @param {number} options.futureHeight - wysokość dla przyszłych kroków (domyślnie 3)
 * @param {number} options.activeScaleMax - maksymalna skala dla aktywnego kroku (domyślnie 1.4)
 * @param {number} options.activeScaleEnd - końcowa skala dla aktywnego kroku (domyślnie 1.15)
 */
export const animateTimelineProgress = (progressDots, currentStep, options = {}) => {
  const {
    completedHeight = 4,
    activeHeight = 5,
    futureHeight = 3,
    activeScaleMax = 1.4,
    activeScaleEnd = 1.15,
    activeScaleDuration = 250,
    activeScaleEndDuration = 200,
    heightDuration = 350,
    opacityDuration = 300,
    scaleDuration = 300,
  } = options;

  progressDots.forEach((dot, index) => {
    if (index < currentStep) {
      // Zakończone kroki - pełna wysokość, pełna opacity
      dot.height.value = withTiming(completedHeight, { 
        duration: heightDuration, 
        easing: Easing.out(Easing.cubic) 
      });
      dot.opacity.value = withTiming(1, { 
        duration: opacityDuration, 
        easing: Easing.out(Easing.quad) 
      });
      dot.scale.value = withTiming(1, { 
        duration: scaleDuration 
      });
    } else if (index === currentStep) {
      // Aktywny krok - animacja skali z efektem bounce
      dot.scale.value = withSequence(
        withTiming(activeScaleMax, { 
          duration: activeScaleDuration, 
          easing: Easing.out(Easing.back(1.7)) 
        }),
        withTiming(activeScaleEnd, { 
          duration: activeScaleEndDuration, 
          easing: Easing.inOut(Easing.quad) 
        })
      );
      dot.height.value = withTiming(activeHeight, { 
        duration: heightDuration, 
        easing: Easing.out(Easing.cubic) 
      });
      dot.opacity.value = withTiming(1, { 
        duration: opacityDuration, 
        easing: Easing.out(Easing.quad) 
      });
    } else {
      // Przyszłe kroki - zmniejszona wysokość i opacity
      dot.height.value = withTiming(futureHeight, { 
        duration: heightDuration, 
        easing: Easing.in(Easing.quad) 
      });
      dot.opacity.value = withTiming(0.4, { 
        duration: opacityDuration, 
        easing: Easing.inOut(Easing.quad) 
      });
      dot.scale.value = withTiming(1, { 
        duration: scaleDuration 
      });
    }
  });
};

/**
 * Inicjalizuje animacje timeline przy pierwszym renderze
 * @param {Array} progressDots - tablica obiektów z shared values: { scale, opacity, height }
 * @param {number} currentStep - aktualny krok (0-based)
 * @param {Object} options - opcje animacji
 */
export const initializeTimelineProgress = (progressDots, currentStep, options = {}) => {
  const {
    completedHeight = 4,
    activeHeight = 5,
    futureHeight = 3,
    activeScale = 1.15,
  } = options;

  progressDots.forEach((dot, index) => {
    if (index <= currentStep) {
      dot.height.value = index === currentStep ? activeHeight : completedHeight;
      dot.opacity.value = index === currentStep ? 1 : 0.8;
      dot.scale.value = index === currentStep ? activeScale : 1;
    } else {
      dot.height.value = futureHeight;
      dot.opacity.value = 0.4;
      dot.scale.value = 1;
    }
  });
};

/**
 * Animacja fade in/out dla modali lub komponentów
 * Używa Reanimated (shared values)
 * @param {SharedValue} opacityValue - shared value dla opacity
 * @param {boolean} visible - czy element jest widoczny
 * @param {Object} options - opcje animacji
 * @param {number} options.fadeInDuration - czas trwania fade in (domyślnie 300ms)
 * @param {number} options.fadeOutDuration - czas trwania fade out (domyślnie 200ms)
 */
export const animateModalFade = (opacityValue, visible, options = {}) => {
  const {
    fadeInDuration = 300,
    fadeOutDuration = 200,
  } = options;

  if (visible) {
    opacityValue.value = withTiming(1, { duration: fadeInDuration });
  } else {
    opacityValue.value = withTiming(0, { duration: fadeOutDuration });
  }
};

/**
 * Animacja błysku menu/przycisku
 * Używa Reanimated (shared values)
 * @param {SharedValue} flashValue - shared value dla opacity błysku
 * @param {Object} options - opcje animacji
 * @param {number} options.maxOpacity - maksymalna wartość opacity (domyślnie 0.4 dla zmiany kroku, 0.3 dla kliknięcia)
 * @param {number} options.riseDuration - czas animacji w górę (domyślnie 100ms dla zmiany kroku, 80ms dla kliknięcia)
 * @param {number} options.fallDuration - czas animacji w dół (domyślnie 200ms dla zmiany kroku, 150ms dla kliknięcia)
 */
export const animateMenuFlash = (flashValue, options = {}) => {
  const {
    maxOpacity = 0.4,
    riseDuration = 100,
    fallDuration = 200,
  } = options;

  flashValue.value = withTiming(maxOpacity, { duration: riseDuration }, () => {
    flashValue.value = withTiming(0, { duration: fallDuration });
  });
};

/**
 * Animacja glassmorphism effect (glass progress) przy interakcji
 * Używa Reanimated (shared values)
 * @param {SharedValue} glassProgressValue - shared value dla glass progress (0-1)
 * @param {number} targetValue - wartość docelowa (0 lub 1)
 * @param {Object} options - opcje animacji
 * @param {number} options.pressInDuration - czas animacji przy naciśnięciu (domyślnie 220ms)
 * @param {number} options.pressOutDuration - czas animacji przy zwolnieniu (domyślnie 260ms)
 */
export const animateGlassProgress = (glassProgressValue, targetValue, options = {}) => {
  const {
    pressInDuration = 220,
    pressOutDuration = 260,
  } = options;

  const duration = targetValue === 1 ? pressInDuration : pressOutDuration;
  glassProgressValue.value = withTiming(targetValue, { duration });
};

/**
 * Animacja skali przycisku/ikony przy interakcji
 * Używa Reanimated (shared values)
 * Ujednolicona funkcja dla wszystkich press animacji
 * @param {SharedValue} scaleValue - shared value dla scale
 * @param {number} targetValue - wartość docelowa (1 dla normalnej, 0.92 dla naciśniętej)
 * @param {Object} options - opcje animacji
 * @param {number} options.duration - czas trwania animacji dla timing (domyślnie 150ms)
 * @param {boolean} options.useSpring - czy używać spring zamiast timing (domyślnie false)
 * @param {number} options.damping - damping dla spring (domyślnie 15)
 * @param {number} options.stiffness - stiffness dla spring (domyślnie 300)
 */
export const animateIconPress = (scaleValue, targetValue, options = {}) => {
  const {
    duration = 150,
    useSpring = false,
    damping = 15,
    stiffness = 300,
  } = options;

  if (useSpring) {
    scaleValue.value = withSpring(targetValue, { damping, stiffness });
  } else {
    scaleValue.value = withTiming(targetValue, { duration });
  }
};

/**
 * Animacja input focus - zmiana border color, scale i shadow
 * Używa Reanimated (shared values)
 * @param {Object} inputValues - obiekt z shared values: { borderColor, scale, shadow }
 * @param {boolean} hasValue - czy input ma wartość (true = focus, false = blur)
 * @param {Object} options - opcje animacji
 * @param {string} options.focusedBorderColor - kolor border przy focus (domyślnie colors.primary)
 * @param {string} options.blurredBorderColor - kolor border przy blur (domyślnie colors.border)
 * @param {number} options.focusedScale - skala przy focus (domyślnie 1.01)
 * @param {number} options.focusedShadow - wartość shadow przy focus (domyślnie 8)
 * @param {number} options.duration - czas trwania animacji (domyślnie 200ms)
 */
export const animateInputFocus = (inputValues, hasValue, options = {}) => {
  const {
    focusedBorderColor,
    blurredBorderColor,
    focusedScale = 1.01,
    focusedShadow = 8,
    duration = 200,
  } = options;

  if (hasValue) {
    // Focus state
    inputValues.borderColor.value = withTiming(
      focusedBorderColor, 
      { duration, easing: Easing.out(Easing.quad) }
    );
    inputValues.scale.value = withSpring(focusedScale, { damping: 12, stiffness: 200 });
    inputValues.shadow.value = withTiming(focusedShadow, { duration });
  } else {
    // Blur state
    inputValues.borderColor.value = withTiming(
      blurredBorderColor, 
      { duration, easing: Easing.out(Easing.quad) }
    );
    inputValues.scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    inputValues.shadow.value = withTiming(0, { duration });
  }
};


/**
 * Animacja przycisku - fade in z translateY i scale (dla list items)
 * Używa Reanimated (shared values)
 * @param {Object} buttonValues - obiekt z shared values: { opacity, translateY, scale }
 * @param {Object} options - opcje animacji
 * @param {number} options.delay - opóźnienie animacji w ms (domyślnie 0)
 * @param {number} options.duration - czas trwania fade in (domyślnie 400ms)
 * @param {number} options.initialTranslateY - początkowa wartość translateY (domyślnie 15)
 * @param {number} options.initialScale - początkowa wartość scale (domyślnie 0.9)
 */
export const animateButtonAppear = (buttonValues, options = {}) => {
  const {
    delay = 0,
    duration = 400,
    initialTranslateY = 15,
    initialScale = 0.9,
  } = options;

  setTimeout(() => {
    buttonValues.opacity.value = withTiming(1, { 
      duration, 
      easing: Easing.out(Easing.quad) 
    });
    buttonValues.translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    buttonValues.scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, delay);
};

/**
 * Resetuje wartości animacji do stanu początkowego
 * Używa React Native Animated API (nie Reanimated)
 * @param {Object} animationValues - obiekt z wartościami Animated.Value
 * @param {Object} initialValues - obiekt z wartościami początkowymi
 * @param {Array} arrayValues - opcjonalna tablica par [opacities[], translateYs[]] do resetowania
 */
export const resetAnimationValues = (animationValues, initialValues = {}, arrayValues = []) => {
  // Reset pojedynczych wartości
  Object.entries(initialValues).forEach(([key, value]) => {
    if (animationValues[key]) {
      animationValues[key].setValue(value);
    }
  });

  // Reset wartości w tablicach (np. opacities[], translateYs[])
  arrayValues.forEach(([opacityArray, translateYArray]) => {
    if (opacityArray && Array.isArray(opacityArray)) {
      opacityArray.forEach((opacity) => opacity.setValue(0));
    }
    if (translateYArray && Array.isArray(translateYArray)) {
      translateYArray.forEach((translateY) => translateY.setValue(20));
    }
  });
};

/**
 * Uruchamia animacje wejścia dla kroku onboarding
 * Wspólna logika uruchamiania animacji z opóźnieniami
 * @param {Object} animations - obiekt z konfiguracją animacji
 * @param {Object} animations.header - { opacity, translateY }
 * @param {Object} animations.section - { opacity, translateY }
 * @param {Array} animations.items - [{ opacity, translateY, delay }]
 * @param {Object} options - opcje
 * @param {number} options.headerDelay - opóźnienie nagłówka (domyślnie 100)
 * @param {number} options.sectionDelay - opóźnienie sekcji (domyślnie 200)
 * @param {number} options.itemDelayIncrement - przyrost opóźnienia dla itemów (domyślnie 100)
 */
export const startStepAnimations = (animations, options = {}) => {
  const {
    headerDelay = 100,
    sectionDelay = 200,
    itemDelayIncrement = 100,
  } = options;

  // Animacja nagłówka - tylko slide-up (bez fade-in)
  if (animations.header) {
    Animated.timing(animations.header.translateY, {
      toValue: 0,
      duration: 400,
      delay: headerDelay,
      useNativeDriver: true,
    }).start();
  }

  // Animacja sekcji (ikona, picker, input, etc.)
  if (animations.section) {
    if (animations.section.type === 'slideUp') {
      const sectionAnimation = createSlideUpFadeInAnimation(
        animations.section.opacity,
        animations.section.translateY,
        { duration: 400, delay: sectionDelay }
      );
      sectionAnimation.start();
    } else if (animations.section.type === 'fadeScale') {
      const sectionAnimation = createFadeInScaleAnimation(
        animations.section.opacity,
        animations.section.scale,
        { 
          duration: 500, 
          delay: sectionDelay,
          initialScale: animations.section.initialScale || 0.8,
          initialOpacity: animations.section.initialOpacity || 0
        }
      );
      sectionAnimation.start();
    }
  }

  // Animacje itemów z opóźnieniem
  if (animations.items && Array.isArray(animations.items)) {
    animations.items.forEach((item, index) => {
      const itemAnimation = createSlideUpFadeInAnimation(
        item.opacity,
        item.translateY,
        { duration: 400, delay: sectionDelay + index * itemDelayIncrement }
      );
      itemAnimation.start();
    });
  }
};


