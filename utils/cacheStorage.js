import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const isWeb = Platform.OS === 'web';
const CACHE_TABLE = 'app_cache';
const CACHE_DB_NAME = 'flineo-planer-cache.db';

let cacheDb = null;
let AsyncStorage = null;

// Funkcja inicjalizacji cache DB dla mobile
const initCacheDb = async () => {
  if (cacheDb) return cacheDb;
  if (isWeb) return null;
  
  try {
    cacheDb = await SQLite.openDatabaseAsync(CACHE_DB_NAME);
    await cacheDb.execAsync(`
      CREATE TABLE IF NOT EXISTS ${CACHE_TABLE} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expiresAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON ${CACHE_TABLE}(expiresAt);
    `);
    return cacheDb;
  } catch (error) {
    console.error('[Cache] Failed to initialize cache DB:', error);
    return null;
  }
};

// Lazy load AsyncStorage dla web
if (isWeb) {
  // Na webie użyj localStorage
  AsyncStorage = {
    getItem: async (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignore quota errors
      }
    },
    removeItem: async (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    },
  };
}

// Cache configuration
const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minut dla cache zadań
  MAX_SIZE: 100, // Maksymalna liczba wpisów cache
};

// Helper functions
const getCacheKey = (type, id = '') => `cache_${type}_${id}`;

// Tworzenie obiektu cacheStorage z metodami
const createCacheStorage = () => {
  const storage = {
    // Zapis do cache z TTL
    set: async (key, value, ttl = CACHE_CONFIG.TTL) => {
      const expiresAt = Date.now() + ttl;
      const cacheValue = JSON.stringify({
        value,
        expiresAt,
        timestamp: Date.now(),
      });

      if (isWeb) {
        await AsyncStorage.setItem(key, cacheValue);
      } else {
        const db = await initCacheDb();
        if (!db) return;
        
        try {
          await db.runAsync(
            `INSERT OR REPLACE INTO ${CACHE_TABLE} (key, value, timestamp, expiresAt) VALUES (?, ?, ?, ?)`,
            [key, cacheValue, Date.now(), expiresAt]
          );
          
          // Cleanup starych wpisów
          await db.runAsync(
            `DELETE FROM ${CACHE_TABLE} WHERE expiresAt < ?`,
            [Date.now()]
          );
        } catch (error) {
          console.error('[Cache] Error setting cache:', error);
        }
      }
    },

    // Pobierz z cache
    get: async (key) => {
      try {
        let cacheData = null;
        
        if (isWeb) {
          const stored = await AsyncStorage.getItem(key);
          cacheData = stored ? JSON.parse(stored) : null;
        } else {
          const db = await initCacheDb();
          if (!db) return null;
          
          const result = await db.getFirstAsync(
            `SELECT value, expiresAt FROM ${CACHE_TABLE} WHERE key = ?`,
            [key]
          );
          
          if (result) {
            cacheData = JSON.parse(result.value);
            cacheData.expiresAt = result.expiresAt;
          }
        }
        
        if (!cacheData) return null;
        
        // Sprawdź czy cache wygasł
        if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
          await storage.remove(key);
          return null;
        }
        
        return cacheData.value;
      } catch (error) {
        console.error('[Cache] Error getting cache:', error);
        return null;
      }
    },

    // Usuń z cache
    remove: async (key) => {
      try {
        if (isWeb) {
          await AsyncStorage.removeItem(key);
        } else {
          const db = await initCacheDb();
          if (!db) return;
          
          await db.runAsync(`DELETE FROM ${CACHE_TABLE} WHERE key = ?`, [key]);
        }
      } catch (error) {
        console.error('[Cache] Error removing cache:', error);
      }
    },

    // Wyczyść cały cache
    clear: async () => {
      try {
        if (isWeb) {
          const keys = Object.keys(window.localStorage);
          keys.forEach(key => {
            if (key.startsWith('cache_')) {
              window.localStorage.removeItem(key);
            }
          });
        } else {
          const db = await initCacheDb();
          if (!db) return;
          
          await db.runAsync(`DELETE FROM ${CACHE_TABLE}`);
        }
      } catch (error) {
        console.error('[Cache] Error clearing cache:', error);
      }
    },

    // Wyczyść wygasłe wpisy
    cleanup: async () => {
      try {
        if (isWeb) {
          // Dla web cleanup jest automatyczny przy get()
          return;
        } else {
          const db = await initCacheDb();
          if (!db) return;
          
          await db.runAsync(
            `DELETE FROM ${CACHE_TABLE} WHERE expiresAt < ?`,
            [Date.now()]
          );
        }
      } catch (error) {
        console.error('[Cache] Error cleaning up cache:', error);
      }
    },

    // Helper dla cache zadań
    cacheTasks: async (tasks) => {
      await storage.set(getCacheKey('tasks', 'all'), tasks);
    },

    getCachedTasks: async () => {
      return await storage.get(getCacheKey('tasks', 'all'));
    },

    cacheTasksByDate: async (date, tasks) => {
      await storage.set(getCacheKey('tasks', `date_${date}`), tasks, CACHE_CONFIG.TTL);
    },

    getCachedTasksByDate: async (date) => {
      return await storage.get(getCacheKey('tasks', `date_${date}`));
    },

    invalidateTasksCache: async () => {
      if (isWeb) {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_tasks_')) {
            window.localStorage.removeItem(key);
          }
        });
      } else {
        const db = await initCacheDb();
        if (!db) return;
        
        await db.runAsync(
          `DELETE FROM ${CACHE_TABLE} WHERE key LIKE ?`,
          ['cache_tasks_%']
        );
      }
    },
  };
  
  return storage;
};

// API dla cache
export const cacheStorage = createCacheStorage();