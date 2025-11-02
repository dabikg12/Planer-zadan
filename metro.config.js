// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure UTF-8 encoding support
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Zawsze dodaj alias dla react-native-worklets i react-native-pager-view na webie
// Metro resolver sprawdzi czy jesteśmy na webie podczas resolve
// Na platformach natywnych normalny moduł będzie używany
// Na webie zostanie użyty mock
const defaultResolver = config.resolver || {};
config.resolver = {
  ...defaultResolver,
  resolveRequest: (context, moduleName, platform) => {
    // Jeśli ktoś próbuje załadować react-native-worklets na webie, użyj mocka
    if (moduleName === 'react-native-worklets' && platform === 'web') {
      return {
        filePath: path.resolve(__dirname, 'utils/workletsMock.js'),
        type: 'sourceFile',
      };
    }
    // Jeśli ktoś próbuje załadować react-native-pager-view na webie, użyj mocka
    if (moduleName === 'react-native-pager-view' && platform === 'web') {
      return {
        filePath: path.resolve(__dirname, 'utils/pagerViewMock.js'),
        type: 'sourceFile',
      };
    }
    // Jeśli ktoś próbuje załadować react-native-reanimated na webie, użyj mocka
    if (moduleName === 'react-native-reanimated' && platform === 'web') {
      return {
        filePath: path.resolve(__dirname, 'utils/reanimatedMock.js'),
        type: 'sourceFile',
      };
    }
    // Dla innych modułów użyj domyślnego resolve z Expo
    if (defaultResolver.resolveRequest) {
      return defaultResolver.resolveRequest(context, moduleName, platform);
    }
    // Fallback do domyślnego resolve
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: './global.css' });


