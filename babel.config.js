module.exports = function(api) {
  api.cache(true);
  
  // Sprawdź czy jesteśmy na platformie webowej
  // Expo ustawia EXPO_PUBLIC_PLATFORM='web' podczas uruchamiania dla webu
  // Alternatywnie możemy sprawdzić czy jesteśmy w trybie web poprzez sprawdzenie
  // czy zmienna środowiskowa zawiera 'web' lub czy jesteśmy w trybie webowego Metro
  const isWeb = 
    process.env.EXPO_PUBLIC_PLATFORM === 'web' ||
    (typeof process !== 'undefined' && process.env && 
     (process.env.BABEL_ENV === 'web' || 
      (process.argv && process.argv.some(arg => arg.includes('--web')))));
  
  const plugins = [];
  
  // Dodaj plugin reanimated tylko dla platform natywnych (iOS/Android)
  // Plugin reanimated używa worklets, które nie działają na webie
  // WAZNE: Plugin musi być ostatnim w tablicy plugins
  if (!isWeb) {
    plugins.push('react-native-reanimated/plugin');
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};

