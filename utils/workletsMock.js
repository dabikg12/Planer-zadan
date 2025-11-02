// Pusty mock dla react-native-worklets na platformie webowej
// Worklets nie działają na webie, więc zwracamy puste implementacje
// Ten mock zapobiega błędom podczas inicjalizacji react-native-reanimated na webie

// Funkcje pomocnicze
const noop = () => {};
const identity = (x) => x;

// Mock dla Worklets API
const WorkletsModule = {
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
};

// Mock dla JSWorklets (używane przez reanimated)
const JSWorklets = {
  createSerializableObject: () => {
    // Nie powinno być wywoływane na webie, ale zwracamy pusty obiekt na wszelki wypadek
    return {};
  },
  cloneWorklet: (worklet) => worklet,
  clonePlainJSObject: (obj) => obj,
  createSerializableNative: () => ({}),
  cloneObjectProperties: (target, source) => Object.assign(target, source),
};

module.exports = {
  // Główny eksport
  default: {
    Worklets: WorkletsModule,
    JSWorklets: JSWorklets,
  },
  Worklets: WorkletsModule,
  JSWorklets: JSWorklets,
  useSharedValue: identity,
  useAnimatedStyle: () => ({}),
  withSpring: identity,
  withTiming: identity,
  withSequence: (...args) => args[args.length - 1] || identity,
  createWorklet: identity,
  runOnUI: identity,
  runOnJS: identity,
  // Eksportuj wszystkie funkcje jako właściwości modułu
  ...WorkletsModule,
};

