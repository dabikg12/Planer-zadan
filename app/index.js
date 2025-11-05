import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  RefreshControl,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  LayoutAnimation,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
} from '../utils/animationHelpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import useAppStore from '../store/useAppStore.js';

// Gesture handler dla swipe
let GestureDetector, Gesture;
if (Platform.OS !== 'web') {
  try {
    const gestureHandler = require('react-native-gesture-handler');
    GestureDetector = gestureHandler.GestureDetector;
    Gesture = gestureHandler.Gesture;
  } catch (e) {
    console.warn('react-native-gesture-handler not available');
  }
}
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import StatCard from '../components/StatCard';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { colors } from '../utils/colors';
import { formatDateLocal, parseDueDate } from '../utils/dateHelpers';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { tasks, loadTasks, deleteTask, toggleTask, addTask: addTaskToStore, updateTask: updateTaskInStore, loadMetadata, metadata } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFilter, setTaskFilter] = useState('active'); // 'active' lub 'completed'

  const scrollViewRef = useRef(null);

  // Pobierz szerokość ekranu przed stworzeniem gestu (nie można w worklecie)
  const screenWidth = useMemo(() => Dimensions.get('window').width, []);

  // Swipe gesture dla zmiany zakładek
  const swipeGesture = useMemo(() => {
    if (Platform.OS === 'web' || !Gesture) return null;
    
    return Gesture.Pan()
      .activeOffsetX([-10, 10]) // Wymaga min 10px przesunięcia
      .failOffsetY([-20, 20]) // Ignoruj jeśli przesunięcie pionowe > 20px
      .onEnd((event) => {
        const { translationX, velocityX } = event;
        
        // Jeśli przesunięcie wystarczająco duże lub szybkie
        if (Math.abs(translationX) > screenWidth * 0.25 || Math.abs(velocityX) > 500) {
          if (translationX > 0 || velocityX > 0) {
            // Swipe w prawo → idź do poprzedniej zakładki (nie ma, to pierwsza)
            // Zostaw puste - nie ma poprzedniej zakładki dla index
          } else {
            // Swipe w lewo → idź do następnej zakładki
            router.push('/tasks');
          }
          impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
  }, [router, screenWidth]);

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

  // Memoizuj dzisiejszą datę - oblicz tylko raz i odświeżaj raz dziennie
  const todayString = useMemo(() => formatDateLocal(new Date()), []);

  // Funkcja pomocnicza do sprawdzania czy zadanie jest na dzisiaj lub bez daty
  // Używamy useCallback aby uniknąć tworzenia nowej funkcji przy każdym renderze
  const isTaskForToday = useCallback((task) => {
    // Zadanie bez daty jest zawsze wyświetlane
    if (!task.dueDate) {
      return true;
    }

    // Użyj parseDueDate zamiast ręcznego parsowania
    const taskDate = parseDueDate(task.dueDate);
    if (!taskDate) {
      return false;
    }

    // Porównaj sformatowane daty - szybsze niż startsWith na stringu
    const taskDateString = formatDateLocal(taskDate);
    return taskDateString === todayString;
  }, [todayString]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFormSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await updateTaskInStore(editingTask.id, taskData);
      } else {
        await addTaskToStore(taskData);
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
    const filtered = tasks.filter(task => {
      return !task.completed && isTaskForToday(task);
    });
    return filtered.slice(0, 5);
  }, [tasks, isTaskForToday]);

  const completedTasks = useMemo(() => {
    const filtered = tasks.filter(task => task.completed && isTaskForToday(task));
    return filtered.slice(0, 5);
  }, [tasks, isTaskForToday]);

  const displayedTasks = useMemo(() => {
    return taskFilter === 'active' ? activeTasks : completedTasks;
  }, [taskFilter, activeTasks, completedTasks]);


  // Renderuj główny widok natychmiast, bez ekranu ładowania
  // Ekran ładowania może powodować białe mignięcie przy przełączaniu zakładek
  // Dane są już załadowane przez store w _layout.js podczas inicjalizacji aplikacji

  const Wrapper = swipeGesture && GestureDetector ? GestureDetector : View;
  const wrapperProps = swipeGesture && GestureDetector ? { gesture: swipeGesture } : {};

  return (
    <Wrapper {...wrapperProps} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 32 + insets.top, paddingBottom: 120 + (insets.bottom || 0) }} // Space for notch + glass menu (88px) + extra padding (32px)
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
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
                    Zadania na dziś
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
                  value={activeTasks.length}
                  backgroundColor={colors.activeBg}
                  borderColor={colors.active}
                  onPress={() => setTaskFilter('active')}
                />
                <StatCard
                  label="Zrealizowane"
                  value={completedTasks.length}
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
      </View>
    </Wrapper>
  );
}








