import { Platform } from 'react-native';
import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';

// Cache dla wykrywania platformy - tylko raz sprawdzamy
// Użyj wielu metod wykrywania, aby upewnić się, że wykryjemy web poprawnie
const isWeb = 
  (typeof Platform !== 'undefined' && Platform.OS === 'web') ||
  (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') ||
  (typeof document !== 'undefined') ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative' === false);

let Reanimated;
let useSharedValue;
let useAnimatedStyle;
let withSpring;
let withTiming;
let withSequence;
let Easing;
let createAnimatedComponent;
let AnimatedView;
let AnimatedScrollView;
let useAnimatedScrollHandler;
let runOnJS;

// Ładowanie reanimated tylko jeśli nie jesteśmy na webie (optymalizacja)
if (!isWeb) {
  try {
    Reanimated = require('react-native-reanimated');
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withSpring = Reanimated.withSpring;
    withTiming = Reanimated.withTiming;
    withSequence = Reanimated.withSequence;
    Easing = Reanimated.Easing;
    createAnimatedComponent = Reanimated.default?.createAnimatedComponent || Reanimated.createAnimatedComponent;
    AnimatedView = Reanimated.default?.View || Reanimated.View || View;
    AnimatedScrollView = Reanimated.default?.ScrollView || Reanimated.ScrollView || ScrollView;
    useAnimatedScrollHandler = Reanimated.useAnimatedScrollHandler;
    runOnJS = Reanimated.runOnJS;
  } catch (error) {
    console.error('[Animation] Failed to load reanimated:', error);
  }
}

// Optymalizowane implementacje dla webu - minimalizują re-rendery
if (isWeb || !Reanimated) {
  // useSharedValue dla web - używa useRef (bez re-renderów!)
  useSharedValue = (initialValue) => {
    const ref = useRef({ value: initialValue });
    
    return useMemo(() => ({
      get value() {
        return ref.current.value;
      },
      set value(val) {
        ref.current.value = val;
      }
    }), []);
  };
  
  // useAnimatedStyle dla web - zwraca styl obliczony tylko raz przy mount
  // Zoptymalizowane - używa useMemo aby uniknąć niepotrzebnych obliczeń przy każdym renderze
  // Na webie shared values nie powodują re-renderów, więc style są statyczne
  useAnimatedStyle = (styleFn) => {
    const style = useMemo(() => {
      try {
        return styleFn() || {};
      } catch (error) {
        console.warn('[Animation] Error in animated style:', error);
        return {};
      }
    }, []); // Pusta tablica - oblicz tylko raz przy mount

    return style;
  };
  
  // withSpring dla web - zwraca wartość bez animacji (natychmiast)
  withSpring = useCallback((toValue) => {
    return toValue;
  }, []);

  // withTiming dla web - zwraca wartość bez animacji (natychmiast)
  // Obsługuje callback jako trzeci argument
  withTiming = useCallback((toValue, options, callback) => {
    // Jeśli jest callback, wywołaj go asynchronicznie z finished=true
    if (callback && typeof callback === 'function') {
      // Użyj setTimeout aby symulować asynchroniczność
      setTimeout(() => {
        callback(true);
      }, 0);
    }
    return toValue;
  }, []);

  // withSequence dla web - zwraca ostatnią wartość
  // Obsługuje callback jeśli ostatnia animacja to withTiming z callbackiem
  withSequence = useCallback((...animations) => {
    if (animations.length === 0) return;
    
    // Znajdź ostatnią animację (może być withTiming z 3 argumentami)
    const lastAnimation = animations[animations.length - 1];
    
    // Sprawdź czy jest to wynik withTiming z callbackiem
    // Na web, withTiming zwraca wartość, ale możemy sprawdzić czy była wywołana z callbackiem
    // przez przeanalizowanie argumentów. Ponieważ nie możemy tego zrobić bezpośrednio,
    // po prostu zwracamy wartość - callback zostanie obsłużony przez withTiming
    
    return lastAnimation;
  }, []);

  // Easing dla web - prosty obiekt (singleton)
  Easing = {
    linear: () => (t) => t,
    ease: () => (t) => t,
    quad: () => (t) => t * t,
    cubic: () => (t) => t * t * t,
    poly: () => (t) => t * t * t * t,
    sin: () => (t) => 1 - Math.cos((t * Math.PI) / 2),
    circle: () => (t) => 1 - Math.sqrt(1 - t * t),
    exp: () => (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    elastic: () => (t) => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI),
    back: () => (t) => {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    bounce: () => (t) => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    },
    in: (fn) => fn,
    out: (fn) => fn,
    inOut: (fn) => fn,
  };

  // createAnimatedComponent dla web - zwraca normalny komponent (zero overhead)
  createAnimatedComponent = useCallback((Component) => {
    return Component;
  }, []);

  // AnimatedView dla web - zwykły View
  AnimatedView = View;

  // AnimatedScrollView dla web - zwykły ScrollView
  AnimatedScrollView = ScrollView;

  // useAnimatedScrollHandler dla web - zwraca prosty handler (no-op, ale bezpieczny)
  useAnimatedScrollHandler = useCallback((handlers) => {
    return (event) => {
      // Na webie nie potrzebujemy animowanych scroll handlerów
      // Po prostu zwracamy funkcję, która nic nie robi
      // Ale możemy zapisać wartość do shared value jeśli potrzeba
      if (handlers?.onScroll && event?.nativeEvent?.contentOffset) {
        // Zapisz offset do shared value jeśli jest dostępny
        try {
          handlers.onScroll({ contentOffset: event.nativeEvent.contentOffset });
        } catch (e) {
          // Ignore errors on web
        }
      }
    };
  }, []);

  // runOnJS dla web - zwraca funkcję bez zmian (no-op)
  runOnJS = useCallback((fn) => {
    return fn;
  }, []);
}

// Export domyślnego Animated obiektu (memoizowany)
const Animated = {
  View: AnimatedView || View,
  Pressable: createAnimatedComponent ? createAnimatedComponent(Pressable) : Pressable,
  ScrollView: AnimatedScrollView || ScrollView,
  createAnimatedComponent,
};

export { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  Easing,
  createAnimatedComponent,
  AnimatedView,
  AnimatedScrollView,
  useAnimatedScrollHandler,
  runOnJS,
  Animated,
};