# Naprawa błędu: java.lang.String cannot be cast to java.lang.Boolean

## Wprowadzone zmiany

1. ✅ Usunięto `newArchEnabled: true` - może powodować problemy z konwersją typów
2. ✅ Usunięto `edgeToEdgeEnabled: true` - eksperymentalna funkcja powodująca błędy
3. ✅ Dodano `package: "com.flineo.planer"` w sekcji android

## Kroki do naprawy błędu

### Krok 1: Wyczyść cache Expo
```bash
cd flineo-planer
npx expo start -c
```

### Krok 2: Wyczyść folder .expo (jeśli istnieje)
```bash
# W PowerShell:
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Lub ręcznie usuń folder .expo
```

### Krok 3: Jeśli używasz prebuild, wyczyść i zregeneruj
```bash
# Jeśli masz folder android lub ios, usuń je:
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ios -ErrorAction SilentlyContinue

# Następnie zregeneruj:
npx expo prebuild --clean
```

### Krok 4: Sprawdź kompatybilność React (OPCJONALNE)

**UWAGA:** Expo SDK 54 jest zaprojektowane dla React 18, a aplikacja używa React 19. To może być źródłem problemów.

Jeśli błąd nadal występuje, spróbuj obniżyć wersję React do 18:

```bash
npm install react@18.3.1 react-dom@18.3.1
npx expo start -c
```

### Krok 5: Uruchom aplikację ponownie
```bash
npm run android
# lub
npx expo start --android
```

## Jeśli problem nadal występuje

1. Sprawdź pełne logi w terminalu Expo - może być więcej informacji o błędzie
2. Sprawdź logi Android:
   ```bash
   npx react-native log-android
   ```
3. Upewnij się, że masz najnowszą wersję Expo CLI:
   ```bash
   npm install -g expo-cli@latest
   ```

## Zmiany w app.json

Przed:
```json
"android": {
  "adaptiveIcon": { ... },
  "edgeToEdgeEnabled": true,
  "jsEngine": "hermes"
}
```

Po:
```json
"android": {
  "package": "com.flineo.planer",
  "adaptiveIcon": { ... },
  "jsEngine": "hermes"
}
```

Usunięto również `newArchEnabled: true` z głównej sekcji expo.

