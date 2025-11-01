import { useEffect, useMemo, useState, useRef } from 'react';
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
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import useAppStore from '../store/useAppStore.js';
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

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loadTasks, deleteTask, toggleTask } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const scrollViewRef = useRef(null);

  const heroOpacity = useSharedValue(0);
  const heroTranslate = useSharedValue(24);
  const listOpacity = useSharedValue(0);
  const fabScale = useSharedValue(0);
  const fabRotation = useSharedValue(0);

  useEffect(() => {
    loadTasks();
    heroOpacity.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 100 }));
    heroTranslate.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }));
    listOpacity.value = withDelay(250, withSpring(1, { damping: 15, stiffness: 100 }));
    fabScale.value = withDelay(350, withSequence(
      withSpring(0, { damping: 12 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    ));
  }, []);

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
            // Przewiń listę do góry po usunięciu zadania, aby pokazać aktywne zadania
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({
                y: 0,
                animated: true,
              });
            }, 300); // Czekamy na zakończenie animacji usuwania i odświeżenie listy
          },
        },
      ]
    );
  };

  const handleToggle = async (id) => {
    await toggleTask(id);
  };

  const completedTasks = useMemo(
    () => tasks.filter(task => task.completed),
    [tasks]
  );
  const activeTasks = useMemo(
    () => tasks.filter(task => !task.completed),
    [tasks]
  );

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` }
    ],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <Animated.View style={heroAnimatedStyle}>
        <View style={{ paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 }}>
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
                  Moje zadania
                </Text>
                <Text style={{
                  fontSize: 17,
                  color: colors.textSecondary,
                  lineHeight: 24,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                  fontWeight: '600',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                }}>
                  Aktywne
                </Text>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: colors.text,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
                }}>
                  {activeTasks.length}
                </Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: colors.completedBg,
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.completed,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                }}>
                  Zrealizowane
                </Text>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: colors.text,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
                }}>
                  {completedTasks.length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={[{ flex: 1, paddingHorizontal: 20 }, listAnimatedStyle]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 145 + insets.bottom }} // Space for FAB (56px) + position (69px) + extra padding (20px)
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {activeTasks.length > 0 ? (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: colors.text,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
              }}>
                Aktywne zadania
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
                  fontWeight: '600',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
              fontWeight: '600',
              color: colors.text,
              marginTop: 16,
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
            }}>
              Brak zadań oczekujących
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
            }}>
              Wszystko zrealizowane! Dodaj nowe cele, by utrzymać tempo.
            </Text>
          </View>
        )}

        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: colors.text,
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
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
                fontWeight: '600',
                color: colors.primary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                fontWeight: '600',
                color: colors.text,
                marginTop: 16,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
              }}>
                Brak ukończonych zadań
              </Text>
              <Text style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 22,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Zakończ zadanie, aby pojawiło się w historii sukcesów.
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

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