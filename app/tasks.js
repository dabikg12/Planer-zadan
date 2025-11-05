import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  AnimatedView,
} from '../utils/animationHelpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import useAppStore from '../store/useAppStore.js';
import { useScreenTransition } from '../utils/useScreenTransition';

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
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { colors } from '../utils/colors';

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { tasks, loadTasks, deleteTask, toggleTask, addTask: addTaskToStore, updateTask: updateTaskInStore } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFilter, setTaskFilter] = useState('active'); // 'active' lub 'completed'
  const scrollViewRef = useRef(null);
  const historySectionRef = useRef(null);
  const [historySectionY, setHistorySectionY] = useState(0);
  
  // Animacja przejścia między ekranami
  const transitionStyle = useScreenTransition();

  // Pobierz szerokość ekranu przed stworzeniem gestu (nie można w worklecie)
  const screenWidth = useMemo(() => Dimensions.get('window').width, []);

  // Swipe gesture dla zmiany zakładek
  const swipeGesture = useMemo(() => {
    if (Platform.OS === 'web' || !Gesture) return null;
    
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-20, 20])
      .onEnd((event) => {
        const { translationX, velocityX } = event;
        
        if (Math.abs(translationX) > screenWidth * 0.25 || Math.abs(velocityX) > 500) {
          if (translationX > 0 || velocityX > 0) {
            // Swipe w prawo → poprzednia zakładka
            router.push('/');
          } else {
            // Swipe w lewo → następna zakładka
            router.push('/calendar');
          }
          impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
  }, [router, screenWidth]);

  // Ładuj zadania tylko przy pierwszym zamontowaniu, nie przy każdym focus
  // Użyj useRef aby śledzić czy już załadowaliśmy dane
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadTasks();
    }
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
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
      console.error('[Tasks] Error submitting task form:', error);
      Alert.alert(
        'Błąd',
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
      // Przewiń listę do góry po usunięciu zadania, aby pokazać aktywne zadania
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        });
      }, 300); // Czekamy na zakończenie animacji usuwania i odświeżenie listy
    } catch (error) {
      console.error('[Tasks] Error deleting task:', error);
      // Błąd już został obsłużony w TaskItem (przywrócenie widoku)
      // Nie pokazujemy Alert - błąd jest już obsłużony wizualnie
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleTask(id);
    } catch (error) {
      console.error('[Tasks] Error toggling task:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować zadania. Spróbuj ponownie.', [{ text: 'OK' }]);
    }
  };

  const completedTasks = useMemo(
    () => tasks.filter(task => task.completed),
    [tasks]
  );
  const activeTasks = useMemo(
    () => tasks.filter(task => !task.completed),
    [tasks]
  );

  // Ostatnie zadania - ostatnie 5 zadań aktywnych lub zrealizowanych
  const recentActiveTasks = useMemo(
    () => activeTasks.slice(0, 5),
    [activeTasks]
  );
  const recentCompletedTasks = useMemo(
    () => completedTasks.slice(0, 5),
    [completedTasks]
  );

  const displayedRecentTasks = useMemo(() => {
    return taskFilter === 'active' ? recentActiveTasks : recentCompletedTasks;
  }, [taskFilter, recentActiveTasks, recentCompletedTasks]);


  const Wrapper = swipeGesture && GestureDetector ? GestureDetector : View;
  const wrapperProps = swipeGesture && GestureDetector ? { gesture: swipeGesture } : {};

  return (
    <Wrapper {...wrapperProps} style={{ flex: 1 }}>
      <AnimatedView style={[{ flex: 1, backgroundColor: colors.background }, transitionStyle]}>
      <StatusBar style="light" />
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[{ flex: 1 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 32 + insets.top, paddingBottom: 120 + insets.bottom }} // Space for notch + glass menu (88px) + extra padding (32px)
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View>
          {/* Nagłówek z kartami statystyk */}
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
                    Moje zadania
                  </Text>
                  <Text style={{
                    fontSize: 17,
                    color: colors.textSecondary,
                    lineHeight: 24,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Organizuj zadania według priorytetów i kontroluj postęp
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: colors.activeBg,
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: colors.active,
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: getFontWeight('600'),
                    color: colors.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 8,
                    fontFamily: getFontFamily('600', 'text'),
                  }}>
                    Aktywne
                  </Text>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: getFontWeight('bold'),
                    color: colors.text,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    {activeTasks.length}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Przewiń do sekcji z zrealizowanymi zadaniami
                    setTimeout(() => {
                      if (historySectionRef.current && scrollViewRef.current) {
                        historySectionRef.current.measure((x, y, width, height, pageX, pageY) => {
                          scrollViewRef.current?.scrollTo({
                            y: y - 20,
                            animated: true,
                          });
                        });
                      } else if (historySectionY > 0) {
                        scrollViewRef.current?.scrollTo({
                          y: historySectionY - 20,
                          animated: true,
                        });
                      } else {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }
                    }, 100);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.completedBg,
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: colors.completed,
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
                    Zrealizowane
                  </Text>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: getFontWeight('bold'),
                    color: colors.text,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    {completedTasks.length}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Sekcja Ostatnie zadania */}
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => {
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTaskFilter('active');
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: taskFilter === 'active' ? colors.activeBg : 'transparent',
                    borderWidth: 1,
                    borderColor: taskFilter === 'active' ? colors.active : colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: getFontWeight('600'),
                    color: taskFilter === 'active' ? colors.primary : colors.textSecondary,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Aktywne
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTaskFilter('completed');
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: taskFilter === 'completed' ? colors.completedBg : 'transparent',
                    borderWidth: 1,
                    borderColor: taskFilter === 'completed' ? colors.completed : colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: getFontWeight('600'),
                    color: taskFilter === 'completed' ? colors.primary : colors.textSecondary,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Zrealizowane
                  </Text>
                </Pressable>
              </View>
            </View>

            {displayedRecentTasks.length > 0 ? (
              <View>
                {displayedRecentTasks.map((task, index) => (
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
                paddingVertical: 48,
                paddingHorizontal: 24,
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
              }}>
                <Ionicons 
                  name={taskFilter === 'active' ? "checkmark-circle-outline" : "stats-chart-outline"} 
                  size={58} 
                  color={colors.textTertiary} 
                />
                <Text style={{
                  fontSize: 20,
                  fontWeight: getFontWeight('600'),
                  color: colors.text,
                  marginTop: 16,
                  fontFamily: getFontFamily('bold', 'display'),
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
          </View>

          {/* Sekcja Szybkie akcje */}
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <View style={{
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
                  onPress={() => {
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/');
                  }}
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
                    <Ionicons name="home" size={24} color={colors.primary} />
                  </View>
                  <Text style={{
                    fontSize: 17,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    marginBottom: 4,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    Strona główna
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Powrót do planera
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/calendar');
                  }}
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
                    fontFamily: getFontFamily('bold', 'display'),
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

          {/* Sekcja Wszystkie aktywne zadania */}
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            {activeTasks.length > 0 ? (
              <View style={{ marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: getFontWeight('bold'),
                    color: colors.text,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    Wszystkie aktywne zadania
                  </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.activeBg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.active,
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.active,
                  marginRight: 6,
                }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: getFontWeight('600'),
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  W trakcie
                </Text>
              </View>
            </View>

                  {activeTasks.map((task, index) => (
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
                  marginBottom: 32,
                }}>
                  <Ionicons name="checkmark-circle-outline" size={64} color={colors.textTertiary} />
                  <Text style={{
                    fontSize: 20,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    marginTop: 16,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    Brak zadań oczekujących
                  </Text>
                  <Text style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 8,
                    lineHeight: 22,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    Wszystko zrealizowane! Dodaj nowe cele, by utrzymać tempo.
                  </Text>
                </View>
              )}
          </View>

          {/* Sekcja Historia */}
          <View 
            ref={historySectionRef} 
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setHistorySectionY(y);
            }}
            style={{ paddingHorizontal: 20, marginTop: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{
                fontSize: 22,
                fontWeight: getFontWeight('bold'),
                color: colors.text,
                fontFamily: getFontFamily('bold', 'display'),
              }}>
                Historia
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.completedBg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.completed,
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.completed,
                  marginRight: 6,
                }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: getFontWeight('600'),
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  Sukcesy
                </Text>
              </View>
            </View>

            {completedTasks.length > 0 ? (
              completedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggle(task.id)}
                  onEdit={() => handleEdit(task)}
                  onDelete={() => handleDelete(task.id)}
                  index={index}
                />
              ))
            ) : (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
                paddingHorizontal: 24,
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
              }}>
                <Ionicons name="stats-chart-outline" size={58} color={colors.textTertiary} />
                <Text style={{
                  fontSize: 20,
                  fontWeight: getFontWeight('600'),
                  color: colors.text,
                  marginTop: 16,
                  fontFamily: getFontFamily('bold', 'display'),
                }}>
                  Brak ukończonych zadań
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 22,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  Zakończ zadanie, aby pojawiło się w historii sukcesów.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      <TaskForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
      />
      </AnimatedView>
    </Wrapper>
  );
}

