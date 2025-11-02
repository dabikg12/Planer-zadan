import { Platform } from 'react-native';
import { cacheStorage } from '../utils/cacheStorage';

// Wykrywanie platformy - wcześniejsze sprawdzenie dla optymalizacji
// Używamy tylko Platform.OS, ponieważ jest najbardziej niezawodne
const isWeb = Platform.OS === 'web';

const STORAGE_KEY = 'flineo-planer-tasks';
let nextId = 1;

// SQLite implementation (mobile) - tylko dla platform mobilnych
let db = null;
let SQLite = null; // Lazy loaded only for mobile

// Lazy load SQLite only when needed (mobile platforms)
const loadSQLite = async () => {
  if (isWeb || SQLite) return SQLite;
  
  try {
    // Dynamic import tylko dla mobilnych platform
    SQLite = await import('expo-sqlite');
    console.log('[DB] SQLite module loaded successfully');
    return SQLite;
  } catch (error) {
    console.error('[DB] Failed to load SQLite module:', error);
    throw error;
  }
};

// LocalStorage helpers for web
const getStoredTasks = () => {
  if (!isWeb) {
    return [];
  }
  
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    console.warn('[DB] localStorage not available');
    return [];
  }
  
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    
    if (!stored || stored === 'null' || stored === 'undefined') {
      nextId = 1;
      return [];
    }
    
    const tasks = JSON.parse(stored);
    
    // Validate that tasks is an array
    if (!Array.isArray(tasks)) {
      console.warn('[DB] Stored data is not an array, resetting');
      window.localStorage.removeItem(STORAGE_KEY);
      nextId = 1;
      return [];
    }
    
    // Update nextId based on stored tasks
    if (tasks.length > 0) {
      const maxId = Math.max(...tasks.map(t => (t && t.id) ? Number(t.id) : 0));
      nextId = Math.max(nextId, maxId + 1);
    } else {
      nextId = 1;
    }
    
    return tasks;
  } catch (error) {
    console.error('[DB] Error reading from localStorage:', error);
    // Reset on error
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (cleanupError) {
      console.error('[DB] Error cleaning up localStorage:', cleanupError);
    }
    nextId = 1;
    return [];
  }
};

const saveTasksToStorage = (tasks) => {
  if (!isWeb) return;
  
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    console.warn('[DB] localStorage not available, cannot save');
    return;
  }
  
  try {
    const jsonString = JSON.stringify(tasks);
    window.localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (error) {
    console.error('[DB] Error saving to localStorage:', error);
    if (error.name === 'QuotaExceededError') {
      console.error('[DB] localStorage quota exceeded, try clearing old data');
    }
  }
};

// Promise, który rozwiązuje się, gdy baza danych jest gotowa
// Tylko dla platform mobilnych - na webie od razu rozwiązuje
const initializationPromise = new Promise(async (resolve, reject) => {
  if (isWeb) {
    // Na webie nie używamy SQLite, więc od razu kończymy
    resolve(null);
    return;
  }

  try {
    // Lazy load SQLite module
    const SQLiteModule = await loadSQLite();
    if (!SQLiteModule) {
      throw new Error('SQLite module not available');
    }
    
    const database = await SQLiteModule.openDatabaseAsync('flineo-planer.db');
    
    await database.execAsync(`
      PRAGMA encoding = 'UTF-8';
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        dueDate TEXT,
        priority TEXT DEFAULT 'medium',
        calendarEventId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Indeksy dla optymalizacji zapytań
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate);
      CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks(createdAt);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed_dueDate ON tasks(completed, dueDate);
    `);
    
    db = database;
    resolve(database);
  } catch (error) {
    console.error('[DB] FATAL: Database initialization failed!', error);
    reject(error);
  }
});

// Funkcja, która zapewnia dostęp do bazy danych PO inicjalizacji
const getDb = async () => {
  if (isWeb) return null;
  return initializationPromise;
};

// --- FUNKCJE OPERUJĄCE NA BAZIE DANYCH ---

// Funkcja do dodawania zadania
export const addTask = async (task) => {
  const now = new Date().toISOString();
  const title = typeof task.title === 'string' ? task.title.trim() : '';
  if (!title) {
    throw new Error('Task title is required');
  }

  const description = typeof task.description === 'string' ? task.description.trim() : '';
  const dueDate = typeof task.dueDate === 'string' && task.dueDate.trim().length > 0
    ? task.dueDate.trim()
    : null;
  const priority = task.priority || 'medium';
  const calendarEventId = typeof task.calendarEventId === 'string' && task.calendarEventId.trim().length > 0
    ? task.calendarEventId.trim()
    : null;

  // Web mode: use localStorage
  if (isWeb) {
    try {
      const tasks = getStoredTasks();
      const newTask = {
        id: nextId++,
        title,
        description,
        completed: 0,
        dueDate,
        priority,
        calendarEventId,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(newTask);
      saveTasksToStorage(tasks);
      
      // Po udanym dodaniu, invaliduj cache
      await cacheStorage.invalidateTasksCache();
      
      return { ...newTask };
    } catch (error) {
      console.error('[DB] Error saving task to localStorage:', error);
      throw error;
    }
  }

  // Mobile mode: use SQLite
  const dbInstance = await getDb();
  if (!dbInstance) {
    throw new Error("Database not available.");
  }

  try {
    const result = await dbInstance.runAsync(
      'INSERT INTO tasks (title, description, completed, dueDate, priority, calendarEventId, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, ?, ?, ?)',
      [title, description, dueDate, priority, calendarEventId, now, now]
    );

    let taskId = undefined;
    if (result && typeof result.lastInsertRowId !== 'undefined') {
      taskId = Number(result.lastInsertRowId);
    } else if (result && typeof result.insertId !== 'undefined') {
      taskId = Number(result.insertId);
    }

    if (!Number.isInteger(taskId)) {
      try {
        const fallbackRow = await dbInstance.getFirstAsync('SELECT last_insert_rowid() AS id');
        if (fallbackRow) {
          taskId = Number(fallbackRow.id ?? fallbackRow.last_insert_rowid ?? fallbackRow.lastInsertRowId);
        }
      } catch (fallbackError) {
        console.warn('[DB] Failed to resolve last_insert_rowid fallback:', fallbackError);
      }
    }

    if (!Number.isInteger(taskId)) {
      throw new Error('Could not determine new task identifier.');
    }

    const persistedTask = await getTaskById(taskId);
    
    // Po udanym dodaniu, invaliduj cache
    await cacheStorage.invalidateTasksCache();
    
    if (persistedTask) {
      return persistedTask;
    }

    // Fallback
    return {
      id: taskId,
      title,
      description,
      completed: 0,
      dueDate,
      priority,
      calendarEventId,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('[DB] Error inserting task:', error);
    throw error;
  }
};

// Funkcja do aktualizacji zadania
export const updateTask = async (id, task) => {
  const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  const now = new Date().toISOString();
  const title = typeof task.title === 'string' ? task.title.trim() : '';
  if (!title) {
    throw new Error('Task title is required');
  }

  const description = typeof task.description === 'string' ? task.description.trim() : '';
  const dueDate = typeof task.dueDate === 'string' && task.dueDate.trim().length > 0
    ? task.dueDate.trim()
    : null;
  const priority = task.priority || 'medium';
  const completed = task.completed ? 1 : 0;
  const calendarEventId = typeof task.calendarEventId === 'string' && task.calendarEventId.trim().length > 0
    ? task.calendarEventId.trim()
    : null;

  // Web mode: use localStorage
  if (isWeb) {
    try {
      const tasks = getStoredTasks();
      const index = tasks.findIndex(t => t.id === normalizedId);
      if (index === -1) {
        throw new Error(`Task with id ${normalizedId} not found`);
      }
      tasks[index] = {
        ...tasks[index],
        title,
        description,
        completed,
        dueDate,
        priority,
        calendarEventId,
        updatedAt: now,
      };
      saveTasksToStorage(tasks);
      
      // Po udanej aktualizacji, invaliduj cache
      await cacheStorage.invalidateTasksCache();
      
      return;
    } catch (error) {
      console.error('[DB] Error updating task in localStorage:', error);
      throw error;
    }
  }

  // Mobile mode: use SQLite
  const dbInstance = await getDb();
  if (!dbInstance) {
    throw new Error("Database not available.");
  }

  await dbInstance.runAsync(
    'UPDATE tasks SET title = ?, description = ?, completed = ?, dueDate = ?, priority = ?, calendarEventId = ?, updatedAt = ? WHERE id = ?',
    [title, description, completed, dueDate, priority, calendarEventId, now, normalizedId]
  );
  
  // Po udanej aktualizacji, invaliduj cache
  await cacheStorage.invalidateTasksCache();
};

// Funkcja do usuwania zadania
export const deleteTask = async (id) => {
  const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  
  if (isNaN(normalizedId) || normalizedId <= 0) {
    throw new Error(`Invalid task ID: ${id}`);
  }
  
  // Web mode: use localStorage
  if (isWeb) {
    try {
      const tasks = getStoredTasks();
      const taskExists = tasks.some(t => t.id === normalizedId);
      
      if (!taskExists) {
        console.warn(`[DB] Task with id ${normalizedId} not found in localStorage`);
        return;
      }
      
      const filtered = tasks.filter(t => t.id !== normalizedId);
      saveTasksToStorage(filtered);
      
      // Weryfikacja: sprawdź czy zadanie zostało usunięte
      const tasksAfterDelete = getStoredTasks();
      const stillExists = tasksAfterDelete.some(t => t.id === normalizedId);
      
      if (stillExists) {
        throw new Error(`Failed to delete task ${normalizedId} from localStorage`);
      }
      
      // Po udanym usunięciu, invaliduj cache
      await cacheStorage.invalidateTasksCache();
      
      console.log(`[DB] Task ${normalizedId} successfully deleted from localStorage`);
      return;
    } catch (error) {
      console.error('[DB] Error deleting task from localStorage:', error);
      throw error;
    }
  }

  // Mobile mode: use SQLite
  const dbInstance = await getDb();
  if (!dbInstance) {
    throw new Error("Database not available.");
  }
  
  try {
    // Sprawdź czy zadanie istnieje przed usunięciem
    const existingTask = await dbInstance.getFirstAsync('SELECT id FROM tasks WHERE id = ?', [normalizedId]);
    
    if (!existingTask) {
      console.warn(`[DB] Task with id ${normalizedId} not found in database`);
      return;
    }
    
    // Usuń zadanie z bazy danych
    const result = await dbInstance.runAsync('DELETE FROM tasks WHERE id = ?', [normalizedId]);
    
    // Weryfikacja: sprawdź czy zadanie zostało usunięte
    const taskAfterDelete = await dbInstance.getFirstAsync('SELECT id FROM tasks WHERE id = ?', [normalizedId]);
    
    if (taskAfterDelete) {
      throw new Error(`Failed to delete task ${normalizedId} from database`);
    }
    
    // Po udanym usunięciu, invaliduj cache
    await cacheStorage.invalidateTasksCache();
    
    console.log(`[DB] Task ${normalizedId} successfully deleted from database`);
  } catch (error) {
    console.error(`[DB] Error deleting task ${normalizedId} from database:`, error);
    throw error;
  }
};

// Funkcja do pobierania zadania po ID
export const getTaskById = async (id) => {
  const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  
  // Web mode: use localStorage
  if (isWeb) {
    try {
      const tasks = getStoredTasks();
      const task = tasks.find(t => t.id === normalizedId);
      return task || null;
    } catch (error) {
      console.error('[DB] Error getting task from localStorage:', error);
      return null;
    }
  }

  // Mobile mode: use SQLite
  const dbInstance = await getDb();
  if (!dbInstance) {
    return null;
  }
  
  try {
    const result = await dbInstance.getFirstAsync('SELECT * FROM tasks WHERE id = ?', [normalizedId]);
    return result || null;
  } catch (error) {
    console.error('[DB] Error in getTaskById:', error);
    throw error;
  }
};

// Funkcja do pobierania zadań według daty
export const getTasksByDate = async (date) => {
  // Sprawdź cache
  const cached = await cacheStorage.getCachedTasksByDate(date);
  if (cached) {
    return cached;
  }
  
  // Web mode: use localStorage
  if (isWeb) {
    try {
      const tasks = getStoredTasks();
      const filtered = tasks.filter(t => t.dueDate && t.dueDate.startsWith(date));
      const sorted = filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      await cacheStorage.cacheTasksByDate(date, sorted);
      return sorted;
    } catch (error) {
      console.error('[DB] Error getting tasks by date from localStorage:', error);
      return [];
    }
  }

  // Mobile mode: use SQLite
  const dbInstance = await getDb();
  if (!dbInstance) {
    return [];
  }

  const result = await dbInstance.getAllAsync(
    'SELECT * FROM tasks WHERE dueDate LIKE ? ORDER BY createdAt DESC',
    [date + '%']
  );
  
  const tasks = result || [];
  await cacheStorage.cacheTasksByDate(date, tasks);
  
  return tasks;
};

// Funkcja do pobierania wszystkich zadań
export const getAllTasks = async (forceRefresh = false) => {
  // Sprawdź cache jeśli nie wymuszamy odświeżenia
  if (!forceRefresh) {
    const cached = await cacheStorage.getCachedTasks();
    if (cached) {
      return cached;
    }
  }

  // Web mode: use localStorage
  if (isWeb) {
    try {
      const tasks = getStoredTasks();
      
      // Filter out any invalid tasks
      const validTasks = tasks.filter(t => t && typeof t === 'object' && t.id);
      
      // Sort by createdAt
      const sorted = validTasks.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending (newest first)
      });
      
      // Zapisz do cache
      await cacheStorage.cacheTasks(sorted);
      
      return sorted;
    } catch (error) {
      console.error('[DB] Error loading tasks from localStorage:', error);
      return [];
    }
  }

  // Mobile mode: use SQLite
  const dbInstance = await getDb();
  if (!dbInstance) {
    return [];
  }

  try {
    const result = await dbInstance.getAllAsync('SELECT * FROM tasks ORDER BY createdAt DESC', []);
    const tasks = result || [];
    
    // Zapisz do cache
    await cacheStorage.cacheTasks(tasks);
    
    return tasks;
  } catch (error) {
    console.error('[DB] Error loading SQLite tasks:', error);
    return [];
  }
};

// Eksportujemy tylko funkcje operujące na bazie, nie samą bazę
export { initializationPromise };

// Eksportuj funkcję do ręcznego invalidowania cache (przydatne przy pull-to-refresh)
export const invalidateTasksCache = () => {
  return cacheStorage.invalidateTasksCache();
};
