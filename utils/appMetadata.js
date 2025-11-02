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
    userName: null,
    theme: 'light',
    notifications: true,
    language: 'pl',
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
const METADATA_TABLE = 'app_metadata';

const initMetadataDb = async () => {
  if (isWeb) return null;
  
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
    return null;
  }
};

const getMetadataFromDb = async (key) => {
  if (isWeb || !metadataDb) return null;
  
  try {
    const result = await metadataDb.getFirstAsync(
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
  if (isWeb || !metadataDb) return;
  
  try {
    const now = new Date().toISOString();
    await metadataDb.runAsync(
      `INSERT OR REPLACE INTO ${METADATA_TABLE} (key, value, updatedAt) VALUES (?, ?, ?)`,
      [key, JSON.stringify(metadata), now]
    );
  } catch (error) {
    console.error('[Metadata] Error saving to database:', error);
  }
};

// Główna funkcja do inicjalizacji metadanych
export const initializeMetadata = async () => {
  // Inicjalizuj bazę danych dla mobile
  if (!isWeb) {
    await initMetadataDb();
  }
  
  const existing = isWeb 
    ? getMetadataFromStorage() 
    : await getMetadataFromDb('metadata');
  
  const now = new Date().toISOString();
  const appVersion = '1.0.0'; // Z app.json - można w przyszłości dynamicznie
  
  if (!existing) {
    // Pierwsze uruchomienie
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
    // Kolejne uruchomienie - aktualizuj tylko lastLaunchDate
    const updatedMetadata = {
      ...existing,
      lastLaunchDate: now,
      // Zachowaj istniejące preferencje
      preferences: {
        ...defaultMetadata.preferences,
        ...(existing.preferences || {}),
      },
    };
    
    if (isWeb) {
      saveMetadataToStorage(updatedMetadata);
    } else {
      await saveMetadataToDb('metadata', updatedMetadata);
    }
    
    return { metadata: updatedMetadata, isFirstLaunch: false };
  }
};

// Pobierz aktualne metadane
export const getMetadata = async () => {
  if (isWeb) {
    return getMetadataFromStorage() || defaultMetadata;
  } else {
    if (!metadataDb) await initMetadataDb();
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
    if (!metadataDb) await initMetadataDb();
    await saveMetadataToDb('metadata', updated);
  }
  
  return updated;
};

// Zaktualizuj status onboarding
export const setOnboardingCompleted = async (completed = true) => {
  const current = await getMetadata();
  const updated = {
    ...current,
    onboardingCompleted: completed,
  };
  
  if (isWeb) {
    saveMetadataToStorage(updated);
  } else {
    if (!metadataDb) await initMetadataDb();
    await saveMetadataToDb('metadata', updated);
  }
  
  return updated;
};

