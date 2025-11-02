# Flineo Planer 📱✨

Aplikacja mobilna do planowania zadań z integracją kalendarza, zbudowana z Expo.

## 🎯 Funkcjonalności

- ✅ **Zarządzanie zadaniami** - Tworzenie, edycja, usuwanie i oznaczanie zadań jako ukończone
- ✅ **Integracja z kalendarzem** - Wyświetlanie zadań na kalendarzu i wizualizacja priorytetów
- ✅ **Priorytety zadań** - 3 poziomy priorytetów (niski, średni, wysoki) z wizualnym oznaczeniem
- ✅ **Filtrowanie** - Podgląd zadań według daty i statusu ukończenia
- ✅ **Lokalna baza danych** - SQLite do przechowywania danych offline
- ✅ **Nowoczesny interfejs** - Material Design z NativeWind/Tailwind CSS

## 🛠️ Technologie

- **Expo** - Framework React Native
- **Expo Router** - Routing oparty na systemie plików
- **NativeWind** - Tailwind CSS dla React Native
- **Zustand** - Zarządzanie stanem aplikacji
- **SQLite (expo-sqlite)** - Lokalna baza danych
- **expo-calendar** - Integracja z kalendarzem systemowym
- **react-native-calendars** - Komponent kalendarza
- **@expo/vector-icons** - Ikonki Ionicons

## 🚀 Instalacja

```bash
npm install
```

## ▶️ Uruchomienie

```bash
npm start
```

Następnie:
- Naciśnij `a` dla Android
- Naciśnij `i` dla iOS
- Naciśnij `w` dla Web

## 📁 Struktura projektu

```
flineo-planer/
├── app/
│   ├── _layout.js          # Główny layout aplikacji
│   ├── index.js            # Strona główna (Dashboard)
│   ├── tasks.js            # Ekran listy zadań
│   ├── calendar.js         # Ekran kalendarza
│   └── components/
│       ├── TaskItem.js     # Komponent pojedynczego zadania
│       └── TaskForm.js     # Formularz dodawania/edycji
├── store/
│   └── useAppStore.js      # Główny store aplikacji (Zustand)
├── db/
│   └── database.js         # Funkcje do pracy z bazą SQLite
├── global.css              # Globalne style Tailwind
├── tailwind.config.js      # Konfiguracja Tailwind
└── babel.config.js         # Konfiguracja Babel
```

## 💡 Użycie

### Ekran główny (Dashboard)
- Przegląd statystyk (aktywne/ukończone zadania)
- Ostatnie 5 zadań aktywnych
- Szybka nawigacja do wszystkich zadań lub kalendarza

### Lista zadań
- Wyświetlanie wszystkich zadań (aktywne i ukończone)
- Oznaczanie jako ukończone
- Edycja i usuwanie zadań
- Filtrowanie według statusu

### Kalendarz
- Wizualizacja zadań na datach
- Kolorowe oznaczenia priorytetów
- Kliknięcie daty pokazuje zadania na ten dzień
- Szybkie dodawanie zadań do wybranej daty

### Formularz zadania
- Tytuł zadania (wymagany)
- Opis (opcjonalny)
- Priorytet (niski/średni/wysoki)
- Data zakończenia

## 🎨 Schemat kolorów

- **Niebieski (#3b82f6)** - Główny kolor aplikacji
- **Czerwony** - Wysoki priorytet
- **Żółty** - Średni priorytet
- **Zielony** - Niski priorytet

## 📝 Licencja

Private project

