import { create } from 'zustand';
import { Platform } from 'react-native';
import * as db from '../db/database';
import { getMetadata, updatePreferences, updateMetadata, resetMetadata } from '../utils/appMetadata';

const normalizeTask = (task) => {
  if (!task || typeof task !== 'object') {
    return null;
  }

  // Konwertuj completed z INTEGER (0/1) na Boolean
  // SQLite i localStorage przechowują completed jako INTEGER (0/1)
  const completed = task.completed === 1 || 
                    task.completed === true || 
                    task.completed === '1' ||
                    (typeof task.completed === 'string' && task.completed.toLowerCase() === 'true');
  
  // Upewnij się, że id jest liczbą
  let taskId = task.id;
  if (taskId !== undefined && taskId !== null) {
    taskId = Number(taskId);
    if (isNaN(taskId)) {
      return null;
    }
  } else {
    return null;
  }
  
  return {
    ...task,
    completed: Boolean(completed),
    id: taskId,
  };
};

const getTimestamp = (value) => {
  if (!value) {
    return 0;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const sortByCreatedAtDesc = (a, b) => getTimestamp(b?.createdAt) - getTimestamp(a?.createdAt);

const useAppStore = create((set, get) => ({
  // Stan aplikacji
  tasks: [],
  selectedTask: null,
  currentDate: new Date().toISOString().split('T')[0],
  currentTabIndex: 0, // Aktualny indeks zakładki (0=index, 1=tasks, 2=calendar)
  selectedDate: null,
  isLoading: false,
  metadata: null,
  isFirstLaunch: false,
  isAppInitializing: false,
  isAppInitialized: false,
  shouldShowWelcomeModal: false,
  shouldShowLoader: false,

  // Akcje
  loadTasks: async () => {
    set({ isLoading: true });
    
    try {
      const tasks = await db.getAllTasks();
      
      if (!Array.isArray(tasks)) {
        set({ tasks: [], isLoading: false });
        return;
      }
      
      const normalizedTasks = tasks
        .map(normalizeTask)
        .filter(Boolean)
        .sort(sortByCreatedAtDesc);
      
      set({
        tasks: normalizedTasks,
        isLoading: false,
      });
    } catch (error) {
      console.error('[Store] Error loading tasks:', error);
      set({ tasks: [], isLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      const dbResult = await db.addTask(task);
      const nowISO = new Date().toISOString();

      const persistedTask =
        dbResult && typeof dbResult === 'object'
          ? dbResult
          : await db.getTaskById(dbResult);

      const fallbackTask = {
        id: typeof dbResult === 'number' ? Number(dbResult) : undefined,
        ...task,
        completed: 0,
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      const normalizedTask = normalizeTask(persistedTask ?? fallbackTask);

      if (normalizedTask) {
        set((state) => {
          const tasksWithoutCurrent = state.tasks.filter(
            (existing) => existing.id !== normalizedTask.id
          );
          const newTasks = [...tasksWithoutCurrent, normalizedTask].sort(sortByCreatedAtDesc);
          return { tasks: newTasks };
        });
      }

      return normalizedTask?.id ?? fallbackTask.id ?? null;
    } catch (error) {
      console.error('[Store] Error adding task:', error);
      throw error;
    }
  },

  updateTask: async (id, updatedTask) => {
    try {
      const existingTask = get().tasks.find((task) => task.id === id);

      if (!existingTask) {
        throw new Error(`Task with id ${id} not found in state`);
      }

      const mergedTask = {
        ...existingTask,
        ...updatedTask,
      };

      await db.updateTask(id, mergedTask);
      const persistedTask = await db.getTaskById(id);
      const normalizedTask = normalizeTask(persistedTask ?? mergedTask);

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? (normalizedTask || task) : task
        ),
      }));
    } catch (error) {
      console.error('[Store] Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      // Normalizuj ID do liczby, aby upewnić się, że porównanie działa poprawnie
      const normalizedId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
      
      // Optymistyczne usuwanie - najpierw usuń ze stanu (natychmiastowe znikanie z widoku)
      const previousTasks = get().tasks;
      set((state) => ({
        tasks: state.tasks.filter((task) => {
          const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : Number(task.id);
          return taskId !== normalizedId;
        }),
      }));
      
      try {
        // Następnie usuń z bazy danych
        await db.deleteTask(normalizedId);
        console.log(`[Store] Task ${normalizedId} deleted successfully`);
      } catch (dbError) {
        // Jeśli błąd przy usuwaniu z bazy, przywróć zadanie do stanu
        console.error('[Store] Error deleting task from database:', dbError);
        set({ tasks: previousTasks });
        throw dbError;
      }
    } catch (error) {
      console.error('[Store] Error deleting task:', error);
      throw error;
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task) {
      await get().updateTask(id, { completed: !task.completed });
    }
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCurrentDate: (date) => set({ currentDate: date }),

  // Metadane aplikacji
  loadMetadata: async () => {
    try {
      const metadata = await getMetadata();
      set({ metadata });
      return metadata;
    } catch (error) {
      console.error('[Store] Error loading metadata:', error);
      return null;
    }
  },

  updateMetadataPreferences: async (preferences) => {
    try {
      const updated = await updatePreferences(preferences);
      set({ metadata: updated });
      return updated;
    } catch (error) {
      console.error('[Store] Error updating preferences:', error);
      throw error;
    }
  },

  // Funkcje do zarządzania onboardingiem
  setOnboardingCompleted: async (completed = true) => {
    try {
      const updated = await updateMetadata({ onboardingCompleted: completed });
      set({ metadata: updated });
      return updated;
    } catch (error) {
      console.error('[Store] Error setting onboarding completed:', error);
      throw error;
    }
  },

  saveUserData: async (userData) => {
    try {
      const current = await getMetadata();
      await updatePreferences({
        userData: {
          ...current.preferences?.userData,
          ...userData,
        },
      });
      const updated = await getMetadata();
      set({ metadata: updated });
      return updated;
    } catch (error) {
      console.error('[Store] Error saving user data:', error);
      throw error;
    }
  },

  saveSchedulePreferences: async (schedule) => {
    try {
      const current = await getMetadata();
      await updatePreferences({
        schedule: {
          ...current.preferences?.schedule,
          ...schedule,
        },
      });
      const updated = await getMetadata();
      set({ metadata: updated });
      return updated;
    } catch (error) {
      console.error('[Store] Error saving schedule:', error);
      throw error;
    }
  },

  // Inicjalizacja aplikacji - ładuje wszystkie dane z bazy
  initializeApp: async () => {
    if (get().isAppInitializing || get().isAppInitialized) {
      return; // Już trwa lub została zakończona
    }

    set({ isAppInitializing: true });
    console.log('[Store] Starting app initialization...');

    try {
      // Załaduj metadane
      const metadata = await get().loadMetadata();
      
      // Załaduj zadania
      await get().loadTasks();
      
      console.log('[Store] App initialization complete.');
      
      // Sprawdź czy pokazać modal powitalny - tylko gdy onboarding nie został ukończony
      const onboardingCompleted = metadata?.onboardingCompleted === true;
      const shouldShowWelcome = !onboardingCompleted;
      
      set({ 
        isAppInitialized: true, 
        isAppInitializing: false,
        shouldShowWelcomeModal: shouldShowWelcome,
      });
    } catch (error) {
      console.error('[Store] Error initializing app:', error);
      // Nawet przy błędzie oznaczamy jako zainicjalizowane, aby aplikacja mogła działać
      set({ 
        isAppInitialized: true, 
        isAppInitializing: false,
        shouldShowWelcomeModal: false,
      });
    }
  },

  // Funkcja do resetowania aplikacji (czyści wszystkie dane)
  resetApp: async () => {
    try {
      console.log('[Store] Starting app reset...');
      
      // Wyczyść wszystkie zadania
      await db.clearAllTasks();
      
      // Zresetuj metadane do wartości domyślnych
      await resetMetadata();
      
      // Wyczyść stan aplikacji
      set({
        tasks: [],
        selectedTask: null,
        metadata: null,
        isFirstLaunch: false,
        isAppInitializing: false,
        isAppInitialized: false,
        shouldShowWelcomeModal: true, // Pokaż welcome modal po resecie
        shouldShowLoader: true, // Pokaż loader z animacją
      });
      
      // Załaduj domyślne metadane
      const defaultMetadata = await getMetadata();
      set({ metadata: defaultMetadata });
      
      console.log('[Store] App reset completed successfully');
    } catch (error) {
      console.error('[Store] Error resetting app:', error);
      throw error;
    }
  },

  // Funkcje pomocnicze
  setCurrentTabIndex: (index) => set({ currentTabIndex: index }),
}));

export default useAppStore;

