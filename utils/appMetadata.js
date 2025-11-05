import { Platform } from 'react-native';

// Wykrywanie platformy
const isWeb = Platform.OS === 'web';
const METADATA_KEY = 'flineo-planer-metadata';

// Struktura metadanych (uproszczona wersja)
const defaultMetadata = {
  lastLaunchDate: null,
  appVersion: '1.0.0',
  onboardingCompleted: false,
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'pl',
    userData: {
      firstName: '',
      lastName: '',
      age: null,
    },
    schedule: {
      wakeTime: '08:00',
      bedTime: '22:00',
    },
  },
};

// Helpery dla localStorage (web)
const getMetadataFromStorage = () => {
  if (!isWeb) return null;
  
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      console.warn('[Metadata] localStorage not available');
      return null;
    }
    
    const stored = window.localStorage.getItem(METADATA_KEY);
    if (!stored || stored === 'null' || stored === 'undefined') {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Metadata] Error reading from localStorage:', error);
    return null;
  }
};

const saveMetadataToStorage = (metadata) => {
  if (!isWeb) return;
  
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      console.warn('[Metadata] localStorage not available, cannot save');
      return;
    }
    
    window.localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('[Metadata] Error saving to localStorage:', error);
    if (error.name === 'QuotaExceededError') {
      console.error('[Metadata] localStorage quota exceeded');
    }
  }
};

// Helpery dla SQLite (mobile)
let metadataDb = null;
let metadataDbInitPromise = null;
const METADATA_TABLE = 'app_metadata';
let saveQueue = Promise.resolve(); // Kolejka sekwencyjnych zapisów

const initMetadataDb = async () => {
  if (isWeb) return null;
  
  if (metadataDbInitPromise) {
    return metadataDbInitPromise;
  }
  
  if (metadataDb) {
    return metadataDb;
  }
  
  metadataDbInitPromise = (async () => {
    try {
      const SQLiteModule = await import('expo-sqlite');
      const db = await SQLiteModule.openDatabaseAsync('flineo-planer-metadata.db');
      
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${METADATA_TABLE} (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      
      metadataDb = db;
      console.log('[Metadata] Database initialized successfully');
      return db;
    } catch (error) {
      console.error('[Metadata] Failed to initialize metadata database:', error);
      metadataDbInitPromise = null;
      return null;
    }
  })();
  
  return metadataDbInitPromise;
};

const getMetadataFromDb = async (key) => {
  if (isWeb) return null;
  
  const db = await initMetadataDb();
  if (!db) return null;
  
  try {
    const result = await db.getFirstAsync(
      `SELECT value FROM ${METADATA_TABLE} WHERE key = ?`,
      [key]
    );
    return result ? JSON.parse(result.value) : null;
  } catch (error) {
    console.error('[Metadata] Error reading from database:', error);
    return null;
  }
};

const saveMetadataToDb = async (key, metadata) => {
  if (isWeb) return;
  
  // Dodaj do kolejki sekwencyjnych zapisów - zapewnia że zapisy są wykonywane po kolei
  saveQueue = saveQueue.catch(() => {
    // Ignoruj błędy z poprzednich operacji, aby kolejka mogła kontynuować
    return Promise.resolve();
  }).then(async () => {
    const db = await initMetadataDb();
    if (!db) return;
    
    const now = new Date().toISOString();
    const valueStr = JSON.stringify(metadata);
    
    // Prosta operacja INSERT OR REPLACE - kolejka zapewnia sekwencyjność
    await db.runAsync(
      `INSERT OR REPLACE INTO ${METADATA_TABLE} (key, value, updatedAt) VALUES (?, ?, ?)`,
      [key, valueStr, now]
    );
  });
  
  // Czekaj na zakończenie operacji w kolejce
  await saveQueue.catch((error) => {
    // Loguj tylko nieoczekiwane błędy (nie "database is locked")
    if (error && error.message && !error.message.includes('database is locked')) {
      console.error('[Metadata] Error saving to database:', error);
    }
  });
};

// Główna funkcja do inicjalizacji metadanych
export const initializeMetadata = async () => {
  if (!isWeb) {
    await initMetadataDb();
  }
  
  const existing = isWeb 
    ? getMetadataFromStorage() 
    : await getMetadataFromDb('metadata');
  
  const now = new Date().toISOString();
  const appVersion = '1.0.0';
  
  if (!existing) {
    // Pierwsze uruchomienie - zapisz metadane
    const newMetadata = {
      ...defaultMetadata,
      lastLaunchDate: now,
      appVersion,
    };
    
    if (isWeb) {
      saveMetadataToStorage(newMetadata);
    } else {
      await saveMetadataToDb('metadata', newMetadata);
    }
    
    console.log('[Metadata] First launch detected, metadata initialized');
    return { metadata: newMetadata, isFirstLaunch: true };
  } else {
    // Kolejne uruchomienie - NIE zapisuj automatycznie, tylko zwróć istniejące
    // lastLaunchDate będzie aktualizowane tylko gdy użytkownik wykona jakąś akcję
    return { metadata: existing, isFirstLaunch: false };
  }
};

// Pobierz aktualne metadane
export const getMetadata = async () => {
  if (isWeb) {
    return getMetadataFromStorage() || defaultMetadata;
  } else {
    await initMetadataDb(); // Upewnij się, że baza jest zainicjalizowana
    const metadata = await getMetadataFromDb('metadata');
    return metadata || defaultMetadata;
  }
};

// Zaktualizuj preferencje
export const updatePreferences = async (preferences) => {
  const current = await getMetadata();
  const updated = {
    ...current,
    preferences: {
      ...current.preferences,
      ...preferences,
    },
  };
  
  if (isWeb) {
    saveMetadataToStorage(updated);
  } else {
    await initMetadataDb(); // Upewnij się, że baza jest zainicjalizowana
    await saveMetadataToDb('metadata', updated);
  }
  
  return updated;
};

// Zaktualizuj pełne metadane
export const updateMetadata = async (metadataUpdates) => {
  const current = await getMetadata();
  const updated = {
    ...current,
    ...metadataUpdates,
  };
  
  if (isWeb) {
    saveMetadataToStorage(updated);
  } else {
    await initMetadataDb();
    await saveMetadataToDb('metadata', updated);
  }
  
  return updated;
};

// Funkcja do resetowania metadanych do wartości domyślnych
export const resetMetadata = async () => {
  const now = new Date().toISOString();
  const resetMetadata = {
    ...defaultMetadata,
    lastLaunchDate: now,
    appVersion: '1.0.0',
    onboardingCompleted: false,
  };
  
  if (isWeb) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(METADATA_KEY);
      saveMetadataToStorage(resetMetadata);
    }
    console.log('[Metadata] Metadata reset to default (web)');
  } else {
    await initMetadataDb();
    await saveMetadataToDb('metadata', resetMetadata);
    console.log('[Metadata] Metadata reset to default (mobile)');
  }
  
  return resetMetadata;
};

