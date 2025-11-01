import { create } from 'zustand';
import * as db from '../db/database';

const normalizeTask = (task) => {
  if (!task) {
    return null;
  }

  return {
    ...task,
    completed: Boolean(task.completed),
  };
};

const useAppStore = create((set, get) => ({
  // Stan aplikacji
  tasks: [],
  selectedTask: null,
  currentDate: new Date().toISOString().split('T')[0],
  selectedDate: null,
  isLoading: false,

  // Akcje
  loadTasks: async () => {
    console.log('[Store] Loading tasks...');
    set({ isLoading: true });
    try {
      const tasks = await db.getAllTasks();
      console.log('[Store] Tasks loaded:', tasks.length);
      set({
        tasks: tasks.map(normalizeTask).filter(Boolean),
      });
    } catch (error) {
      console.error('[Store] Error loading tasks:', error);
      // W przypadku bledu, uzyj pustej tablicy
      set({ tasks: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      const taskId = await db.addTask(task);
      const persistedTask = await db.getTaskById(taskId);
      const normalizedTask = normalizeTask(
        persistedTask ?? { id: taskId, ...task, completed: false }
      );

      set((state) => ({
        tasks: normalizedTask ? [...state.tasks, normalizedTask] : state.tasks,
      }));

      return taskId;
    } catch (error) {
      console.error('Error adding task:', error);
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
          task.id === id && normalizedTask ? normalizedTask : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await db.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
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
}));

export default useAppStore;
