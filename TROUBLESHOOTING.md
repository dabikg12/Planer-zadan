# 🔧 Troubleshooting Guide

## Problem: Babel Plugin Error

### Błąd
```
.plugins is not a valid Plugin property
```

### Rozwiązanie ✅
W NativeWind v4 **nie dodawaj** `'nativewind/babel'` do babel.config.js

**Poprawna konfiguracja:**

`babel.config.js`:
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // ❌ NIE dodawaj: plugins: ['nativewind/babel']
  };
};
```

**NativeWind v4** automatycznie obsługuje konfigurację przez Metro:

`metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

## Inne problemy

### Cache problems
```bash
# Wyczyść cache
npx expo start -c

# Albo usuń folder .expo
rm -rf .expo
npx expo start
```

### Module resolution errors
```bash
# Przeinstaluj zależności
rm -rf node_modules package-lock.json
npm install
```

### Web build fails
```bash
# Sprawdź wersje zależności
npx expo install --check

# Napraw automatycznie
npx expo install --fix
```

### Styling not working
1. Sprawdź czy `global.css` jest w korzeniu
2. Upewnij się że `metro.config.js` ma `withNativeWind`
3. **NIE** dodawaj babel plugin dla NativeWind v4

## Kontakt
Jeśli problemy nadal występują, sprawdź logi w terminalu.



