import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Alert,
  RefreshControl,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  LayoutAnimation,
  UIManager,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Konfiguracja polskiej lokalizacji kalendarza
LocaleConfig.locales['pl'] = {
  monthNames: [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień'
  ],
  monthNamesShort: [
    'Sty',
    'Lut',
    'Mar',
    'Kwi',
    'Maj',
    'Cze',
    'Lip',
    'Sie',
    'Wrz',
    'Paź',
    'Lis',
    'Gru'
  ],
  dayNames: [
    'Niedziela',
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota'
  ],
  dayNamesShort: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'],
  today: 'Dzisiaj'
};

LocaleConfig.defaultLocale = 'pl';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import useAppStore from '../store/useAppStore.js';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const parseDueDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match.map(Number);
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    // Fallback for other date formats
    const normalized = value.length > 10 ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Convert Date to YYYY-MM-DD format using local timezone
const formatDateLocal = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Cache for date parsing to avoid repeated calculations
const dateCache = new Map();

// Optimized date parsing with cache
const parseDueDateCached = (value) => {
  if (!value) return null;
  
  const cacheKey = typeof value === 'string' ? value : JSON.stringify(value);
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey);
  }
  
  const result = parseDueDate(value);
  if (result && dateCache.size < 1000) { // Limit cache size
    dateCache.set(cacheKey, result);
  }
  return result;
};

// Styles using StyleSheet for better performance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarInner: {
    borderRadius: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  emptyStateIcon: {
    fontSize: 72,
    color: colors.textTertiary,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyTasksIcon: {
    fontSize: 64,
    color: colors.textTertiary,
  },
  emptyTasksTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  emptyTasksText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  addFirstTaskButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  addFirstTaskText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
  },
  fab: {
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
  },
});

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loadTasks, deleteTask, toggleTask } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const scrollViewRef = useRef(null);
  
  // Use shared value for screen height to avoid recalculations in gesture handler
  const screenHeightRef = useRef(Dimensions.get('window').height);
  const screenHeight = useSharedValue(screenHeightRef.current);

  const contentOpacity = useSharedValue(0);
  const fabScale = useSharedValue(0);
  const fabRotation = useSharedValue(0);
  
  // Bottom sheet position: 0 = collapsed (at bottom), negative = expanded (covering calendar)
  const bottomSheetTranslateY = useSharedValue(0);
  const bottomSheetHeight = useSharedValue(0);
  const isSheetExpanded = useSharedValue(false);
  const startTranslateY = useSharedValue(0);
  const maxExpandOffset = useSharedValue(-(screenHeightRef.current * 0.75));

  useEffect(() => {
    loadTasks();
    contentOpacity.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 100 }));
    fabScale.value = withDelay(200, withSequence(
      withSpring(0, { damping: 12 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    ));
  }, []);

  // Update screen height on dimension change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      screenHeightRef.current = window.height;
      screenHeight.value = window.height;
      maxExpandOffset.value = -(window.height * 0.75);
    });
    return () => subscription?.remove();
  }, []);

  // Reset bottom sheet position when date changes
  useEffect(() => {
    if (selectedDate) {
      bottomSheetTranslateY.value = withSpring(0);
      isSheetExpanded.value = false;
    }
  }, [selectedDate]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [loadTasks]);

  const handleDayPress = useCallback((day) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(day.dateString);
  }, []);

  const handleAddTaskForDate = useCallback((date) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabRotation.value = withSequence(
      withSpring(45, { damping: 12 }),
      withSpring(0, { damping: 12 })
    );
    setEditingTask(null);
    setSelectedDate(date);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (taskData) => {
    if (editingTask) {
      await useAppStore.getState().updateTask(editingTask.id, taskData);
    } else {
      const finalTaskData = {
        ...taskData,
        dueDate: taskData.dueDate || selectedDate,
      };
      await useAppStore.getState().addTask(finalTaskData);
    }
    await loadTasks();
    setEditingTask(null);
  }, [editingTask, selectedDate, loadTasks]);

  const handleDelete = useCallback((id) => {
    Alert.alert(
      'Usuń zadanie',
      'Czy na pewno chcesz usunąć to zadanie?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
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
            
            await deleteTask(id);
            await loadTasks();
            notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [deleteTask, loadTasks]);

  const handleToggle = useCallback(async (id) => {
    await toggleTask(id);
  }, [toggleTask]);

  const handleEdit = useCallback((task) => {
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const markedDates = useMemo(() => {
    const marks = {};
    const priorityColors = {
      high: colors.accent,
      medium: colors.primaryLight,
      low: colors.primary,
    };

    // Optimized: use cached date parsing
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const date = parseDueDateCached(task.dueDate);
      if (!date) continue;

      const dateKey = formatDateLocal(date);
      if (!dateKey) continue;
      
      if (!marks[dateKey]) {
        marks[dateKey] = { dots: [] };
      }

      marks[dateKey].dots.push({
        color: priorityColors[task.priority] || colors.textTertiary,
      });
    }

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marks;
  }, [tasks, selectedDate]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    const result = [];
    // Optimized: use cached date parsing and early return
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const date = parseDueDateCached(task.dueDate);
      if (!date) continue;

      const taskDateKey = formatDateLocal(date);
      if (taskDateKey === selectedDate) {
        result.push(task);
      }
    }
    return result;
  }, [tasks, selectedDate]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` }
    ],
  }));

  // Gesture handler for bottom sheet dragging - optimized with pre-calculated values
  const panGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      startTranslateY.value = bottomSheetTranslateY.value;
      runOnJS(impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      // Only allow dragging if moving upward (negative translationY)
      // This prevents conflicts with ScrollView scrolling
      if (event.translationY < 0 || bottomSheetTranslateY.value < 0) {
        const newTranslateY = startTranslateY.value + event.translationY;
        // Use pre-calculated maxExpandOffset instead of recalculating
        bottomSheetTranslateY.value = Math.max(maxExpandOffset.value, Math.min(0, newTranslateY));
      }
    })
    .onEnd((event) => {
      // Snap to collapsed or expanded based on velocity and position
      const threshold = -150; // If dragged more than 150px up, expand
      const velocityThreshold = -500; // Fast upward swipe expands
      
      const currentTranslate = bottomSheetTranslateY.value;
      
      if (currentTranslate < threshold || event.velocityY < velocityThreshold) {
        // Expand - move sheet up to cover calendar
        bottomSheetTranslateY.value = withSpring(maxExpandOffset.value, {
          damping: 20,
          stiffness: 90,
        });
        isSheetExpanded.value = true;
        runOnJS(impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Collapse - return to bottom
        bottomSheetTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
        isSheetExpanded.value = false;
        runOnJS(impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    }), []);

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bottomSheetTranslateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View style={[{ flex: 1, paddingTop: Math.max(insets.top, 20) }, styles.contentContainer, contentAnimatedStyle]}>
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="multi-dot"
            firstDayOfWeek={1}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textTertiary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.border,
              dotColor: colors.primary,
              selectedDotColor: '#FFFFFF',
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              indicatorColor: colors.primary,
              textDayFontWeight: '600',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
            }}
            enableSwipeMonths
            style={styles.calendarInner}
          />
        </View>

        {!selectedDate && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={72} color={colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>
              Wybierz datę
            </Text>
            <Text style={styles.emptyStateText}>
              Kliknij na dzień w kalendarzu, aby zobaczyć powiązane zadania i dodać nowe.
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Draggable Bottom Sheet for Tasks */}
      {selectedDate && (
        <Animated.View
          style={[
            bottomSheetAnimatedStyle,
            styles.bottomSheet,
            { paddingBottom: insets.bottom },
          ]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            bottomSheetHeight.value = height;
          }}
        >
          {/* Drag Handle */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
          </GestureDetector>

          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 145 + insets.bottom }}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {selectedDateTasks.length > 0 ? (
              <View style={{ paddingBottom: 32 }}>
                <View style={styles.tasksHeader}>
                  <Text style={styles.tasksTitle}>
                    Zadania na {selectedDate}
                  </Text>
                  <Pressable
                    onPress={() => handleAddTaskForDate(selectedDate)}
                    onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={styles.addButton}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>
                      Dodaj
                    </Text>
                  </Pressable>
                </View>

                {selectedDateTasks.map((task, index) => (
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
              <View style={styles.emptyTasksContainer}>
                <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyTasksTitle}>
                  Brak zadań na ten dzień
                </Text>
                <Text style={styles.emptyTasksText}>
                  Dodaj zadanie, aby wypełnić harmonogram i zyskać więcej kontroli.
                </Text>
                <Pressable
                  onPress={() => handleAddTaskForDate(selectedDate)}
                  onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  style={styles.addFirstTaskButton}
                >
                  <Text style={styles.addFirstTaskText}>
                    Dodaj pierwsze zadanie
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {selectedDate && (
        <Animated.View
          style={[
            fabAnimatedStyle,
            styles.fabContainer,
            { bottom: 69 + insets.bottom },
          ]}
        >
          <Pressable
            onPress={() => handleAddTaskForDate(selectedDate)}
            onPressIn={() => {
              fabScale.value = withSpring(0.9, { damping: 15 });
              impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            onPressOut={() => {
              fabScale.value = withSpring(1, { damping: 15 });
            }}
            style={styles.fab}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}

      <TaskForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
        initialDate={selectedDate}
      />
    </View>
  );
}