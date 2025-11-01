import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const STORAGE_KEY = 'flineo-planer-tasks';

// Sprawdź czy jesteśmy na web
const isWeb = Platform.OS === 'web';

// Web storage implementation (localStorage)
let webDb = {
  tasks: [],
  nextId: 1,
};

// Inicjalizacja web storage
if (isWeb) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      webDb = JSON.parse(stored);
      // Upewnij się, że nextId jest ustawione poprawnie
      if (!webDb.nextId && webDb.tasks && webDb.tasks.length > 0) {
        // Ustaw nextId na maksymalne ID + 1
        webDb.nextId = Math.max(...webDb.tasks.map(t => Number(t.id) || 0)) + 1;
      } else if (!webDb.nextId) {
        webDb.nextId = 1;
      }
      console.log('[DB] Web DB loaded from localStorage:', webDb.tasks?.length || 0, 'tasks, nextId:', webDb.nextId);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    webDb = { tasks: [], nextId: 1 };
  }
}

// Zapisz do localStorage
const saveWebDb = () => {
  try {
    const dataToSave = JSON.stringify(webDb);
    localStorage.setItem(STORAGE_KEY, dataToSave);
    console.log('[DB] Web DB saved to localStorage:', webDb.tasks?.length || 0, 'tasks, nextId:', webDb.nextId);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw error;
  }
};

// SQLite implementation (mobile)
let db = null;
let isInitialized = false;

// Funkcja do inicjalizacji bazy danych
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      // Web: już załadowane z localStorage
      console.log('[DB] Database initialized successfully (web)');
      isInitialized = true;
      resolve();
      return;
    }

    // Jeśli już zainicjalizowana, zwróć natychmiast
    if (isInitialized && db) {
      console.log('[DB] Database already initialized');
      resolve();
      return;
    }

    // Otwórz bazę danych asynchronicznie (ważne dla iOS)
    try {
      console.log('[DB] Opening SQLite database...');
      console.log('[DB] Platform:', Platform.OS);
      console.log('[DB] SQLite module:', SQLite ? 'available' : 'not available');
      
      // Sprawdź czy dostępne jest nowe async API (expo-sqlite v16+)
      if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
        console.log('[DB] Using openDatabaseAsync (new API)');
        SQLite.openDatabaseAsync('flineo-planer.db')
          .then((database) => {
            db = database;
            console.log('[DB] Database opened successfully with async API');
            // Kontynuuj inicjalizację tabeli
            initializeTable();
          })
          .catch((error) => {
            console.error('[DB] Error opening database with async API:', error);
            console.warn('[DB] Trying legacy API...');
            tryLegacyDatabase();
          });
      } else if (SQLite && typeof SQLite.openDatabase === 'function') {
        console.log('[DB] Using openDatabase (legacy API)');
        tryLegacyDatabase();
      } else {
        console.error('[DB] No SQLite API available');
        console.warn('[DB] Using in-memory fallback');
        isInitialized = true;
        resolve();
        return;
      }

      function tryLegacyDatabase() {
        try {
          db = SQLite.openDatabase('flineo-planer.db');
          console.log('[DB] Database object:', db ? 'created' : 'null');

          if (!db) {
            console.error('[DB] SQLite.openDatabase returned null');
            console.warn('[DB] Using in-memory fallback');
            isInitialized = true;
            resolve();
            return;
          }

          // Kontynuuj inicjalizację tabeli
          initializeTable();
        } catch (error) {
          console.error('[DB] Error in legacy database:', error);
          isInitialized = true;
          resolve();
        }
      }

      function initializeTable() {
        if (!db) {
          console.error('[DB] Database is null, cannot initialize table');
          isInitialized = true;
          resolve();
          return;
        }

        // Sprawdź czy baza używa nowego async API czy legacy API
        if (typeof db.execAsync === 'function') {
          // Nowe async API (expo-sqlite v16+)
          console.log('[DB] Using async API for table creation');
          db.execAsync(`
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
            )
          `)
            .then(() => {
              console.log('[DB] Database initialized successfully (iOS/Android) - async API');
              isInitialized = true;
              resolve();
            })
            .catch((error) => {
              console.error('[DB] Database initialization error:', error);
              console.error('[DB] Error details:', JSON.stringify(error, null, 2));
              console.warn('[DB] Continuing despite error');
              isInitialized = true;
              resolve();
            });
        } else {
          // Legacy API (callback-based)
          console.log('[DB] Using legacy API for table creation');
          db.transaction(
            (tx) => {
              tx.executeSql(
                `CREATE TABLE IF NOT EXISTS tasks (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  completed INTEGER DEFAULT 0,
                  dueDate TEXT,
                  priority TEXT DEFAULT 'medium',
                  calendarEventId TEXT,
                  createdAt TEXT NOT NULL,
                  updatedAt TEXT NOT NULL
                )`,
                [],
                () => {
                  console.log('[DB] Database initialized successfully (iOS/Android) - legacy API');
                  isInitialized = true;
                  resolve();
                },
                (_, error) => {
                  console.error('[DB] Database initialization error:', error);
                  console.error('[DB] Error details:', JSON.stringify(error, null, 2));
                  console.warn('[DB] Continuing despite error');
                  isInitialized = true;
                  resolve();
                }
              );
            },
            (error) => {
              console.error('[DB] Transaction error:', error);
              console.error('[DB] Transaction error details:', JSON.stringify(error, null, 2));
              console.warn('[DB] Continuing despite transaction error');
              isInitialized = true;
              resolve();
            },
            () => {
              console.log('[DB] Transaction completed successfully');
            }
          );
        }
      }
    } catch (error) {
      console.error('[DB] Error opening database:', error);
      console.error('[DB] Error stack:', error.stack);
      console.warn('[DB] Continuing despite error');
      isInitialized = true;
      resolve();
    }
  });
};

// Funkcja do dodawania zadania
export const addTask = async (task) => {
  const now = new Date().toISOString();
  const title = typeof task.title === 'string' ? task.title.trim() : '';
  if (!title) {
    throw new Error('Task title is required');
  }

  const description =
    typeof task.description === 'string' ? task.description.trim() : '';
  const dueDate =
    typeof task.dueDate === 'string' && task.dueDate.trim().length > 0
      ? task.dueDate.trim()
      : null;
  const priority = task.priority || 'medium';
  const calendarEventId =
    typeof task.calendarEventId === 'string' && task.calendarEventId.trim().length > 0
      ? task.calendarEventId.trim()
      : null;

  if (isWeb) {
    const newTask = {
      id: webDb.nextId++,
      title,
      description,
      completed: 0,
      dueDate,
      priority,
      calendarEventId,
      createdAt: now,
      updatedAt: now,
    };
    webDb.tasks.push(newTask);
    saveWebDb();
    return newTask.id;
  }

  if (!db) {
    throw new Error('Database not available');
  }

  // Sprawdź czy baza używa nowego async API
  if (typeof db.runAsync === 'function') {
    // Nowe async API (expo-sqlite v16+)
    try {
      const result = await db.runAsync(
        'INSERT INTO tasks (title, description, completed, dueDate, priority, calendarEventId, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, ?, ?, ?)',
        [title, description, dueDate, priority, calendarEventId, now, now]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[DB] Error adding task:', error);
      throw error;
    }
  } else {
    // Legacy API (callback-based)
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'INSERT INTO tasks (title, description, completed, dueDate, priority, calendarEventId, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, ?, ?, ?)',
            [title, description, dueDate, priority, calendarEventId, now, now],
            (_, result) => {
              resolve(result.insertId);
            },
            (_, error) => {
              console.error('[DB] Error adding task:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('[DB] Transaction error when adding task:', error);
          reject(error);
        }
      );
    });
  }
};

// Funkcja do aktualizacji zadania
export const updateTask = async (id, task) => {
  // Normalizuj ID do liczby dla porównania
  const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  
  const now = new Date().toISOString();
  const title = typeof task.title === 'string' ? task.title.trim() : '';
  if (!title) {
    throw new Error('Task title is required');
  }

  const description =
    typeof task.description === 'string' ? task.description.trim() : '';
  const dueDate =
    typeof task.dueDate === 'string' && task.dueDate.trim().length > 0
      ? task.dueDate.trim()
      : null;
  const priority = task.priority || 'medium';
  const completed = task.completed ? 1 : 0;
  const calendarEventId =
    typeof task.calendarEventId === 'string' && task.calendarEventId.trim().length > 0
      ? task.calendarEventId.trim()
      : null;

  if (isWeb) {
    const index = webDb.tasks.findIndex((t) => {
      const taskId = typeof t.id === 'string' ? parseInt(t.id, 10) : Number(t.id);
      return taskId === normalizedId;
    });
    if (index !== -1) {
      webDb.tasks[index] = {
        ...webDb.tasks[index],
        title,
        description,
        dueDate,
        priority,
        calendarEventId,
        completed,
        updatedAt: now,
      };
      saveWebDb();
      return;
    } else {
      throw new Error('Task not found');
    }
  }

  if (!db) {
    throw new Error('Database not available');
  }

  // Sprawdź czy baza używa nowego async API
  if (typeof db.runAsync === 'function') {
    // Nowe async API (expo-sqlite v16+)
    try {
      await db.runAsync(
        'UPDATE tasks SET title = ?, description = ?, completed = ?, dueDate = ?, priority = ?, calendarEventId = ?, updatedAt = ? WHERE id = ?',
        [title, description, completed, dueDate, priority, calendarEventId, now, normalizedId]
      );
    } catch (error) {
      console.error('[DB] Error updating task:', error);
      throw error;
    }
  } else {
    // Legacy API (callback-based)
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, dueDate = ?, priority = ?, calendarEventId = ?, updatedAt = ? WHERE id = ?',
            [title, description, completed, dueDate, priority, calendarEventId, now, normalizedId],
            (_, result) => {
              resolve(result);
            },
            (_, error) => {
              console.error('[DB] Error updating task:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('[DB] Transaction error when updating task:', error);
          reject(error);
        }
      );
    });
  }
};

// Funkcja do usuwania zadania
export const deleteTask = async (id) => {
  // Normalizuj ID do liczby dla porównania
  const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  
  if (isWeb) {
    const beforeCount = webDb.tasks.length;
    webDb.tasks = webDb.tasks.filter(t => {
      const taskId = typeof t.id === 'string' ? parseInt(t.id, 10) : Number(t.id);
      return taskId !== normalizedId;
    });
    const afterCount = webDb.tasks.length;
    console.log('[DB] deleteTask web - before:', beforeCount, 'after:', afterCount, 'id:', normalizedId);
    saveWebDb();
    return;
  }

  if (!db) {
    throw new Error('Database not available');
  }

  // Sprawdź czy baza używa nowego async API
  if (typeof db.runAsync === 'function') {
    // Nowe async API (expo-sqlite v16+)
    try {
      const result = await db.runAsync(
        'DELETE FROM tasks WHERE id = ?',
        [normalizedId]
      );
      console.log('[DB] deleteTask SQLite - changes:', result.changes, 'id:', normalizedId);
    } catch (error) {
      console.error('[DB] deleteTask error:', error);
      throw error;
    }
  } else {
    // Legacy API (callback-based)
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'DELETE FROM tasks WHERE id = ?',
            [normalizedId],
            (_, result) => {
              console.log('[DB] deleteTask SQLite - rowsAffected:', result.rowsAffected, 'id:', normalizedId);
              resolve(result);
            },
            (_, error) => {
              console.error('[DB] deleteTask error:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('[DB] Transaction error when deleting task:', error);
          reject(error);
        }
      );
    });
  }
};

// Funkcja do pobierania zadania po ID
export const getTaskById = async (id) => {
  // Normalizuj ID do liczby dla porównania
  const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  
  if (isWeb) {
    const task = webDb.tasks.find(t => {
      const taskId = typeof t.id === 'string' ? parseInt(t.id, 10) : Number(t.id);
      return taskId === normalizedId;
    });
    return task || null;
  }

  if (!db) {
    throw new Error('Database not available');
  }

  // Sprawdź czy baza używa nowego async API
  if (typeof db.getFirstAsync === 'function') {
    // Nowe async API (expo-sqlite v16+)
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM tasks WHERE id = ?',
        [normalizedId]
      );
      return result || null;
    } catch (error) {
      console.error('[DB] Error getting task by ID:', error);
      throw error;
    }
  } else {
    // Legacy API (callback-based)
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT * FROM tasks WHERE id = ?',
            [normalizedId],
            (_, { rows }) => {
              resolve(rows._array[0]);
            },
            (_, error) => {
              console.error('[DB] Error getting task by ID:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('[DB] Transaction error when getting task:', error);
          reject(error);
        }
      );
    });
  }
};

// Funkcja do pobierania zadań według daty
export const getTasksByDate = async (date) => {
  if (isWeb) {
    const tasks = webDb.tasks.filter(task => 
      task.dueDate && task.dueDate.startsWith(date)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return tasks;
  }

  if (!db) {
    throw new Error('Database not available');
  }

  // Sprawdź czy baza używa nowego async API
  if (typeof db.getAllAsync === 'function') {
    // Nowe async API (expo-sqlite v16+)
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM tasks WHERE dueDate LIKE ? ORDER BY createdAt DESC',
        [date + '%']
      );
      return result || [];
    } catch (error) {
      console.error('[DB] Error getting tasks by date:', error);
      throw error;
    }
  } else {
    // Legacy API (callback-based)
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT * FROM tasks WHERE dueDate LIKE ? ORDER BY createdAt DESC',
            [date + '%'],
            (_, { rows }) => {
              resolve(rows._array);
            },
            (_, error) => {
              console.error('[DB] Error getting tasks by date:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('[DB] Transaction error when getting tasks by date:', error);
          reject(error);
        }
      );
    });
  }
};

// Funkcja do pobierania wszystkich zadań
export const getAllTasks = async () => {
  console.log('[DB] getAllTasks called, isWeb:', isWeb);
  if (isWeb) {
    try {
      const tasks = [...webDb.tasks].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      console.log('[DB] Web tasks loaded:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('[DB] Error loading web tasks:', error);
      return [];
    }
  }

  if (!db) {
    console.warn('[DB] Database not available, returning empty array');
    return [];
  }

  // Sprawdź czy baza używa nowego async API
  if (typeof db.getAllAsync === 'function') {
    // Nowe async API (expo-sqlite v16+)
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM tasks ORDER BY createdAt DESC',
        []
      );
      console.log('[DB] SQLite tasks loaded:', result?.length || 0);
      return result || [];
    } catch (error) {
      console.error('[DB] Error loading SQLite tasks:', error);
      return [];
    }
  } else {
    // Legacy API (callback-based)
    return new Promise((resolve) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT * FROM tasks ORDER BY createdAt DESC',
            [],
            (_, { rows }) => {
              console.log('[DB] SQLite tasks loaded:', rows._array.length);
              resolve(rows._array);
            },
            (_, error) => {
              console.error('[DB] Error loading SQLite tasks:', error);
              resolve([]);
            }
          );
        },
        (error) => {
          console.error('[DB] Transaction error when loading tasks:', error);
          resolve([]);
        }
      );
    });
  }
};

export default db;
