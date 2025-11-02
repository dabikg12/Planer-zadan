import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from '../utils/animationHelpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import useAppStore from '../store/useAppStore.js';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';
import OnboardingScreen from './components/OnboardingScreen';
import { initializeMetadata, getMetadata } from '../utils/appMetadata';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';

// Color palette - brown/beige theme
const colors = {
  background: '#F5F1E8',
  card: '#FEFCFB',
  primary: '#8B6F47',
  primaryLight: '#A0826D',
  accent: '#C4A484',
  text: '#2A1F15',
  textSecondary: '#6B5238',
  textTertiary: '#A0826D',
  border: '#E8DDD1',
  active: '#C4A484',
  completed: '#A0826D',
  activeBg: '#F0E6D2',
  completedBg: '#E8DDD1',
};

// StatCard Component
const StatCard = ({ label, value, backgroundColor, borderColor, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15 });
          impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={{
          backgroundColor,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor,
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: getFontWeight('600'),
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          fontFamily: getFontFamily('600', 'text'),
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: 32,
          fontWeight: getFontWeight('bold'),
          color: colors.text,
          fontFamily: getFontFamily('bold', 'display'),
        }}>
          {value}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { tasks, loadTasks, deleteTask, toggleTask, addTask: addTaskToStore, updateTask: updateTaskInStore } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [taskFilter, setTaskFilter] = useState('active'); // 'active' lub 'completed'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState(null);

  const contentOpacity = useSharedValue(1);

  useEffect(() => {
    initializeApp();
  }, []);

  // Automatycznie otwórz formularz gdy przybywamy z parametrem openForm
  useFocusEffect(
    React.useCallback(() => {
      if (params?.openForm === 'true' || params?.openForm === true) {
        // Małe opóźnienie aby upewnić się, że ekran jest w pełni załadowany
        setTimeout(() => {
          setEditingTask(null);
          setShowForm(true);
          // Wyczyść parametr z URL
          router.setParams({ openForm: undefined });
        }, 100);
      }
    }, [params?.openForm, router])
  );

  const initializeApp = async () => {
    console.log('[App] Starting initialization...');
    try {
      // Inicjalizuj metadane aplikacji (wykrywa pierwsze uruchomienie)
      const { metadata, isFirstLaunch } = await initializeMetadata();
      
      if (isFirstLaunch) {
        console.log('[App] First launch detected!');
        // Wyświetl ekran powitalny przy pierwszym uruchomieniu
        setShowOnboarding(true);
      } else {
        console.log('[App] Regular launch');
        // Sprawdź czy onboarding został ukończony
        if (!metadata.onboardingCompleted) {
          setShowOnboarding(true);
        } else {
          // Załaduj imię użytkownika jeśli jest dostępne
          if (metadata.preferences?.userName) {
            setUserName(metadata.preferences.userName);
          }
        }
      }
      
      // Załaduj zadania
      await loadTasks();
      console.log('[App] Initialization complete.');
    } catch (error) {
      console.error('[App] Error initializing app:', error);
    } finally {
      setInitialized(true);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Odśwież metadane aby załadować imię użytkownika
    try {
      const metadata = await getMetadata();
      if (metadata.preferences?.userName) {
        setUserName(metadata.preferences.userName);
      }
    } catch (error) {
      console.error('[App] Error loading metadata after onboarding:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks(true); // Force refresh - bypass cache
    setRefreshing(false);
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFormSubmit = async (taskData) => {
    try {
      console.log('[Index] handleFormSubmit called with:', taskData);
      if (editingTask) {
        console.log('[Index] Updating task:', editingTask.id);
        await updateTaskInStore(editingTask.id, taskData);
      } else {
        console.log('[Index] Adding new task');
        const taskId = await addTaskToStore(taskData);
        console.log('[Index] Task added with ID:', taskId);
      }
      setEditingTask(null);
      setShowForm(false);
    } catch (error) {
      console.error('[App] Error submitting task form:', error);
      Alert.alert('Błąd',
        error.message || 'Nie udało się zapisać zadania. Spróbuj ponownie.',
        [{ text: 'OK' }]
      );
      throw error; // Re-throw to let TaskForm handle it
    }
  };

  const handleDelete = async (id) => {
    try {
      // Skonfiguruj animację układu przed usunięciem - pozwoli na płynne przesunięcie pozostałych elementów
      LayoutAnimation.configureNext({
        duration: 250,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
      
      // Usuń zadanie - potwierdzenie jest już w TaskItem
      await deleteTask(id);
      notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('[App] Error deleting task:', error);
      // Błąd już został obsłużony w TaskItem (przywrócenie widoku)
      // Nie pokazujemy Alert - błąd jest już obsłużony wizualnie
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleTask(id);
    } catch (error) {
      console.error('[App] Error toggling task:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować zadania. Spróbuj ponownie.', [{ text: 'OK' }]);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const activeTasks = useMemo(() => {
    console.log('[Index] Calculating activeTasks, total tasks:', tasks.length);
    console.log('[Index] Tasks sample:', tasks.slice(0, 2).map(t => ({ id: t.id, title: t.title, completed: t.completed, completedType: typeof t.completed })));
    const filtered = tasks.filter(task => {
      const isNotCompleted = !task.completed;
      console.log('[Index] Task', task.id, 'completed:', task.completed, 'type:', typeof task.completed, 'filtered:', isNotCompleted);
      return isNotCompleted;
    });
    console.log('[Index] Active tasks after filter:', filtered.length);
    const result = filtered.slice(0, 5);
    console.log('[Index] Active tasks after slice:', result.length);
    return result;
  }, [tasks]);

  const completedTasks = useMemo(() => {
    const filtered = tasks.filter(task => task.completed);
    return filtered.slice(0, 5);
  }, [tasks]);

  const completedTasksCount = useMemo(
    () => tasks.filter(task => task.completed).length,
    [tasks]
  );

  const displayedTasks = useMemo(() => {
    return taskFilter === 'active' ? activeTasks : completedTasks;
  }, [taskFilter, activeTasks, completedTasks]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={loadingAnimatedStyle}>
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 4px 12px rgba(139, 111, 71, 0.1)',
              elevation: 8,
            }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
            </View>
            <Text style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: getFontWeight('bold'),
              textAlign: 'center',
              fontFamily: getFontFamily('bold', 'display'),
            }}>
              Planer
            </Text>
            <Text style={{
              color: colors.textSecondary,
              fontSize: 17,
              marginTop: 12,
              textAlign: 'center',
              fontFamily: getFontFamily('normal', 'text'),
            }}>
              Ładowanie zadań...
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + (insets.bottom || 0) }} // Space for glass menu (88px) + extra padding (32px)
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View style={contentAnimatedStyle}>
          <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              boxShadow: '0 2px 8px rgba(139, 111, 71, 0.05)',
              elevation: 4,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 34,
                    fontWeight: getFontWeight('bold'),
                    color: colors.text,
                    marginBottom: 8,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    {userName ? `Witaj, ${userName}!` : 'Planer'}
                  </Text>
                  <Text style={{
                    fontSize: 17,
                    color: colors.textSecondary,
                    lineHeight: 24,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Zarządzaj zadaniami i planuj swój dzień z łatwością
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <StatCard
                  label="Aktywne"
                  value={tasks.length - completedTasksCount}
                  backgroundColor={colors.activeBg}
                  borderColor={colors.active}
                  onPress={() => setTaskFilter('active')}
                />
                <StatCard
                  label="Zrealizowane"
                  value={completedTasksCount}
                  backgroundColor={colors.completedBg}
                  borderColor={colors.completed}
                  onPress={() => setTaskFilter('completed')}
                />
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{
                fontSize: 22,
                fontWeight: getFontWeight('bold'),
                color: colors.text,
                fontFamily: getFontFamily('bold', 'display'),
              }}>
                Ostatnie zadania
              </Text>
              <Pressable
                onPress={() => router.push('/tasks')}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Text style={{
                  fontSize: 17,
                  fontWeight: getFontWeight('600'),
                  color: colors.primary,
                  marginRight: 4,
                  fontFamily: getFontFamily('600', 'text'),
                }}>
                  Zobacz wszystkie
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {displayedTasks.length > 0 ? (
              <View>
                {displayedTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggle(task.id)}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                    index={index}
                  />
                ))}
              </View>
            ) : (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 64,
                paddingHorizontal: 24,
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
              }}>
                <Ionicons 
                  name={taskFilter === 'active' ? "checkmark-circle-outline" : "stats-chart-outline"} 
                  size={64} 
                  color={colors.textTertiary} 
                />
                <Text style={{
                  fontSize: 20,
                  fontWeight: getFontWeight('600'),
                  color: colors.text,
                  marginTop: 16,
                  fontFamily: getFontFamily('600', 'display'),
                }}>
                  {taskFilter === 'active' ? 'Wszystko gotowe!' : 'Brak zrealizowanych zadań'}
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 22,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  {taskFilter === 'active' 
                    ? 'Dodaj pierwsze zadanie i zacznij tworzyć swoją idealną rutynę dnia.'
                    : 'Zakończ zadanie, aby pojawiło się tutaj.'}
                </Text>
              </View>
            )}

            <View style={{
              marginTop: 32,
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 2px 8px rgba(139, 111, 71, 0.05)',
              elevation: 4,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 22,
                fontWeight: getFontWeight('bold'),
                color: colors.text,
                marginBottom: 16,
                fontFamily: getFontFamily('bold', 'display'),
              }}>
                Szybkie akcje
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => router.push('/tasks')}
                  onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.activeBg,
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: colors.active,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="list" size={24} color={colors.primary} />
                  </View>
                  <Text style={{
                    fontSize: 17,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    marginBottom: 4,
                    fontFamily: getFontFamily('600', 'display'),
                  }}>
                    Zadania
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Przejdź do listy
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => router.push('/calendar')}
                  onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.completedBg,
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: colors.completed,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="calendar" size={24} color={colors.primary} />
                  </View>
                  <Text style={{
                    fontSize: 17,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    marginBottom: 4,
                    fontFamily: getFontFamily('600', 'display'),
                  }}>
                    Kalendarz
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Zobacz harmonogram
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <TaskForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
      />

      <OnboardingScreen
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </View>
  );
}








