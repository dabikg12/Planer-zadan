import { useEffect, useMemo, useState } from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import useAppStore from '../store/useAppStore.js';
import { initDatabase } from '../db/database';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';

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
const StatCard = ({ label, value, backgroundColor, borderColor }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
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
          fontWeight: '600',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: colors.text,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
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
  const { tasks, loadTasks, deleteTask, toggleTask } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const heroOpacity = useSharedValue(0);
  const heroTranslate = useSharedValue(30);
  const cardsOpacity = useSharedValue(0);
  const cardsTranslate = useSharedValue(40);
  const fabScale = useSharedValue(0);
  const fabRotation = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (!initialized) {
      heroOpacity.value = withSpring(0.3, { damping: 15 });
      return;
    }

    // Staggered entrance animations
    heroOpacity.value = withDelay(150, withSpring(1, { damping: 15, stiffness: 100 }));
    heroTranslate.value = withDelay(150, withSpring(0, { damping: 15, stiffness: 100 }));
    cardsOpacity.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 100 }));
    cardsTranslate.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 100 }));
    fabScale.value = withDelay(450, withSequence(
      withSpring(0, { damping: 12 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    ));
    
    // Shimmer effect
    shimmer.value = withDelay(600, withTiming(1, { duration: 2000 }));
  }, [initialized]);

  useEffect(() => {
    const interval = setInterval(() => {
      shimmer.value = withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    console.log('[App] Starting initialization...');
    try {
      console.log('[App] Step 1: Initializing database...');
      // Najpierw zainicjalizuj bazę danych
      await initDatabase();
      console.log('[App] Step 2: Database initialized, loading tasks...');
      
      // Następnie wczytaj zadania (po inicjalizacji bazy)
      await loadTasks();
      console.log('[App] Step 3: Tasks loaded');
      
      console.log('[App] Initialization complete, setting initialized to true');
      setInitialized(true);
    } catch (error) {
      console.error('[App] Error initializing app:', error);
      console.error('[App] Error stack:', error.stack);
      console.warn('[App] Continuing despite error');
      setInitialized(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAdd = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabRotation.value = withSequence(
      withSpring(45, { damping: 12 }),
      withSpring(0, { damping: 12 })
    );
    setEditingTask(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (taskData) => {
    if (editingTask) {
      await useAppStore.getState().updateTask(editingTask.id, taskData);
    } else {
      await useAppStore.getState().addTask(taskData);
    }
    await loadTasks();
    setEditingTask(null);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Usuń zadanie',
      'Czy na pewno chcesz usunąć to zadanie?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
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
            
            // Usuń zadanie - LayoutAnimation automatycznie animuje zmiany w układzie
            await deleteTask(id);
            await loadTasks(); // Odśwież zadania aby upewnić się, że lista jest aktualna
            notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleToggle = async (id) => {
    await toggleTask(id);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const activeTasks = useMemo(
    () => tasks.filter(task => !task.completed).slice(0, 5),
    [tasks]
  );

  const completedTasksCount = useMemo(
    () => tasks.filter(task => task.completed).length,
    [tasks]
  );

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslate.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` }
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: withTiming(heroOpacity.value, { duration: 300 }) }],
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
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
            </View>
            <Text style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
            }}>
              Flineo Planer
            </Text>
            <Text style={{
              color: colors.textSecondary,
              fontSize: 17,
              marginTop: 12,
              textAlign: 'center',
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
        contentContainerStyle={{ paddingBottom: 145 + (insets.bottom || 0) }} // Space for FAB (56px) + position (69px) + extra padding (20px)
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View style={heroAnimatedStyle}>
          <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 34,
                    fontWeight: 'bold',
                    color: colors.text,
                    marginBottom: 8,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
                  }}>
                    Flineo Planer
                  </Text>
                  <Text style={{
                    fontSize: 17,
                    color: colors.textSecondary,
                    lineHeight: 24,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                />
                <StatCard
                  label="Zrealizowane"
                  value={completedTasksCount}
                  backgroundColor={colors.completedBg}
                  borderColor={colors.completed}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={cardsAnimatedStyle}>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: colors.text,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
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
                  fontWeight: '600',
                  color: colors.primary,
                  marginRight: 4,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                }}>
                  Zobacz wszystkie
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {activeTasks.length > 0 ? (
              <View>
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
              }}>
                <Animated.View style={shimmerStyle}>
                  <Ionicons name="checkmark-circle-outline" size={64} color={colors.textTertiary} />
                </Animated.View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: 16,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
                }}>
                  Wszystko gotowe!
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 22,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                }}>
                  Dodaj pierwsze zadanie i zacznij tworzyć swoją idealną rutynę dnia.
                </Text>
              </View>
            )}

            <View style={{
              marginTop: 32,
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 4,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 16,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
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
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 4,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
                  }}>
                    Zadania
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 4,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
                  }}>
                    Kalendarz
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                  }}>
                    Zobacz harmonogram
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[
          fabAnimatedStyle,
          {
            position: 'absolute',
            bottom: 69 + insets.bottom, // 20px padding + 49px tab bar height
            right: 20,
          },
        ]}
      >
        <Pressable
          onPress={handleAdd}
          onPressIn={() => {
            fabScale.value = withSpring(0.9, { damping: 15 });
            impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onPressOut={() => {
            fabScale.value = withSpring(1, { damping: 15 });
          }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

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
  );
}