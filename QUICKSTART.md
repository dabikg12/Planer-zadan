# 🚀 Quick Start Guide

## Uruchomienie aplikacji demo

### 1. Instalacja (jeśli jeszcze nie wykonana)
```bash
cd flineo-planer
npm install
```

### 2. Start serwera deweloperskiego
```bash
npm start
```

Alternatywnie:
```bash
npx expo start
```

### 3. Wybór platformy
Po uruchomieniu serwera, wybierz platformę:
- **`w`** - dla przeglądarki webowej (najszybszy start)
- **`a`** - dla Android (wymaga emulatora lub fizycznego urządzenia)
- **`i`** - dla iOS (wymaga Mac i Xcode)

## 📱 Pierwsze kroki w aplikacji

### Ekran główny (Dashboard)
1. Zobacz statystyki swoich zadań
2. Kliknij przycisk **"+"** aby dodać nowe zadanie
3. Przejdź do **"Zadania"** aby zobaczyć pełną listę
4. Przejdź do **"Kalendarz"** aby zobaczyć zadania na datach

### Dodawanie zadania
1. Kliknij przycisk **"+"** w prawym dolnym rogu
2. Wpisz tytuł zadania (wymagane)
3. Opcjonalnie dodaj opis
4. Wybierz priorytet (niski/średni/wysoki)
5. Ustaw datę zakończenia (format: RRRR-MM-DD, np. 2024-12-31)
6. Kliknij **"Dodaj zadanie"**

### Zarządzanie zadaniami
- **✓** - Oznacz zadanie jako ukończone/niedokończone
- **✏️** - Edytuj zadanie
- **🗑️** - Usuń zadanie

### Kalendarz
1. Kliknij na datę w kalendarzu, aby zobaczyć zadania na ten dzień
2. Kolorowe kropki pokazują zadania z różnymi priorytetami:
   - 🟢 Zielony - niski priorytet
   - 🟡 Żółty - średni priorytet
   - 🔴 Czerwony - wysoki priorytet
3. Dodaj zadanie klikając **"+"** po wybraniu daty

## 🧪 Testowanie funkcjonalności

### Scenariusz testowy
1. **Dodaj 3 zadania** o różnych priorytetach i datach
2. **Przejdź do Kalendarza** i sprawdź wizualizację
3. **Oznacz jedno zadanie** jako ukończone
4. **Edytuj zadanie** zmieniając jego priorytet
5. **Usuń zadanie** przez przycisk kosza
6. Sprawdź, czy statystyki się aktualizują

### Przykładowe zadania do dodania

**Zadanie 1:**
- Tytuł: "Kup prezent na urodziny"
- Priorytet: Wysoki
- Data: dzisiaj lub jutro

**Zadanie 2:**
- Tytuł: "Przeczytać książkę"
- Priorytet: Średni
- Data: Za tydzień

**Zadanie 3:**
- Tytuł: "Spacer po parku"
- Priorytet: Niski
- Data: Za 3 dni

## 🐛 Rozwiązywanie problemów

### Aplikacja nie startuje
```bash
# Wyczyść cache
npx expo start -c
```

### Błędy modułów
```bash
# Przeinstaluj zależności
rm -rf node_modules package-lock.json
npm install
```

### Problem z bazą danych
Aplikacja automatycznie tworzy bazę danych SQLite przy pierwszym uruchomieniu. Jeśli wystąpią problemy:
1. Zamknij aplikację
2. Uruchom ponownie
3. Baza zostanie utworzona automatycznie

### W przeglądarce webowej
Jeśli aplikacja nie działa w przeglądarce:
```bash
npm start --web
```

## 📚 Dodatkowe informacje
- Dane są przechowywane lokalnie w bazie SQLite
- Aplikacja działa w trybie offline
- Synchronizacja między ekranami odbywa się automatycznie
- Pull-to-refresh aktualizuje dane

## 🎯 Następne kroki
- Dodaj integrację z kalendarzem systemowym (expo-calendar)
- Dodaj powiadomienia push dla terminów zadań
- Eksportuj zadania do CSV/PDF
- Dodaj kategorie zadań
- Udostępniaj zadania z innymi użytkownikami

