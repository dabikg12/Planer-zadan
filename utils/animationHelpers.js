import { Platform } from 'react-native';
import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';

const isWeb = Platform.OS === 'web';

// Na webie Metro automatycznie użyje mocka z metro.config.js
// Na mobile wymagamy prawdziwego react-native-reanimated
let Reanimated = null;
if (!isWeb) {
  try {
    Reanimated = require('react-native-reanimated');
  } catch (e) {
    console.warn('[animationHelpers] react-native-reanimated not available');
  }
}

let useSharedValue;
let useAnimatedStyle;
let withSpring;
let withTiming;
let withSequence;
let withRepeat;
let Easing;
let createAnimatedComponent;
let AnimatedView;
let AnimatedScrollView;
let useAnimatedScrollHandler;
let useAnimatedReaction;
let runOnJS;

  // Na webie zawsze używamy fallbacków, na mobile używamy Reanimated jeśli dostępne
  if (!isWeb && Reanimated) {
    // Native implementations
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withSpring = Reanimated.withSpring;
    withTiming = Reanimated.withTiming;
    withSequence = Reanimated.withSequence;
    withRepeat = Reanimated.withRepeat;
    Easing = Reanimated.Easing;
    createAnimatedComponent = Reanimated.default?.createAnimatedComponent || Reanimated.createAnimatedComponent;
    AnimatedView = Reanimated.default?.View || Reanimated.View || View;
    AnimatedScrollView = Reanimated.default?.ScrollView || Reanimated.ScrollView || ScrollView;
    useAnimatedScrollHandler = Reanimated.useAnimatedScrollHandler;
    useAnimatedReaction = Reanimated.useAnimatedReaction;
    runOnJS = Reanimated.runOnJS;
} else {
  // Web fallback implementations
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
      return styleFn() || {};
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

  // withRepeat dla web - zwraca wartość bez powtórzeń (natychmiast)
  withRepeat = useCallback((animation, numberOfReps = -1, reverse = false) => {
    // Na webie zwracamy po prostu animację bez powtórzeń
    return animation;
  }, []);

  // Easing dla web - prosty obiekt (singleton)
  // Musi pasować do struktury Reanimated.Easing dla kompatybilności
  // W Reanimated, easing functions są funkcjami (t) => number, nie funkcjami które zwracają funkcje
  const easeFn = (t) => {
    // Standard cubic-bezier ease function
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };
  const linearFn = (t) => t;
  const quadFn = (t) => t * t;
  
  Easing = {
    linear: linearFn,
    ease: easeFn,
    quad: quadFn,
    cubic: (t) => t * t * t,
    poly: (t) => t * t * t * t,
    sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
    circle: (t) => 1 - Math.sqrt(1 - t * t),
    exp: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    elastic: (t) => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI),
    back: (t) => {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    bounce: (t) => {
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
    in: (fn) => {
      // Easing.in takes an easing function and returns it wrapped
      if (typeof fn === 'function') {
        return (t) => fn(t);
      }
      return fn;
    },
    out: (fn) => {
      // Easing.out takes an easing function and returns the reversed version
      if (typeof fn === 'function') {
        return (t) => 1 - fn(1 - t);
      }
      return (t) => 1 - fn(1 - t);
    },
    inOut: (fn) => {
      // Easing.inOut combines in and out
      if (typeof fn === 'function') {
        return (t) => t < 0.5 ? fn(2 * t) / 2 : 1 - fn(2 - 2 * t) / 2;
      }
      return (t) => t < 0.5 ? fn(2 * t) / 2 : 1 - fn(2 - 2 * t) / 2;
    },
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
        handlers.onScroll({ contentOffset: event.nativeEvent.contentOffset });
      }
    };
  }, []);

  // useAnimatedReaction dla web - symulacja reakcji na zmiany
  useAnimatedReaction = (getValue, onValueChange) => {
    const prevValueRef = useRef(null);
    
    useEffect(() => {
      const checkValue = () => {
        try {
          const currentValue = typeof getValue === 'function' ? getValue() : getValue?.value;
          if (currentValue !== prevValueRef.current) {
            prevValueRef.current = currentValue;
            if (typeof onValueChange === 'function') {
              onValueChange(currentValue);
            }
          }
        } catch (e) {
          // Ignoruj błędy
        }
      };
      
      const interval = setInterval(checkValue, 16); // ~60fps
      return () => clearInterval(interval);
    }, [getValue, onValueChange]);
  };

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
  withRepeat,
  Easing,
  createAnimatedComponent,
  AnimatedView,
  AnimatedScrollView,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  runOnJS,
  Animated,
};