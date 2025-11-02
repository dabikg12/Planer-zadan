// Mock dla react-native-reanimated na platformie webowej
// Reanimated nie działa na webie, więc zwracamy implementacje które używają animationHelpers

// Funkcje pomocnicze
const identity = (x) => x;

// Eksportuj obiekt zgodny z API react-native-reanimated
// Ale używamy fallbacków z animationHelpers zamiast prawdziwego reanimated
module.exports = {
  // Hooks
  useSharedValue: identity,
  useAnimatedStyle: () => ({}),
  useAnimatedScrollHandler: () => identity,
  
  // Animations
  withSpring: identity,
  withTiming: identity,
  withSequence: (...args) => args[args.length - 1] || identity,
  withRepeat: identity,
  withDelay: identity,
  
  // Components
  View: require('react-native').View,
  ScrollView: require('react-native').ScrollView,
  Text: require('react-native').Text,
  Image: require('react-native').Image,
  createAnimatedComponent: (Component) => Component,
  
  // Utilities
  runOnJS: identity,
  runOnUI: identity,
  Easing: {
    linear: identity,
    ease: identity,
    quad: identity,
    cubic: identity,
    poly: identity,
    sin: identity,
    circle: identity,
    exp: identity,
    elastic: identity,
    back: identity,
    bounce: identity,
    in: identity,
    out: identity,
    inOut: identity,
  },
  
  // Default export
  default: {
    useSharedValue: identity,
    useAnimatedStyle: () => ({}),
    withSpring: identity,
    withTiming: identity,
    View: require('react-native').View,
    createAnimatedComponent: (Component) => Component,
  },
};

