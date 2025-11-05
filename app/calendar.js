import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
  Modal,
  Dimensions,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

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
// Warunkowy import reanimated - użyj animationHelpers zamiast bezpośredniego importu
import {
  Animated,
} from '../utils/animationHelpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import useAppStore from '../store/useAppStore.js';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { colors, priorityColors } from '../utils/colors';
import { parseDueDate, formatDateLocal } from '../utils/dateHelpers';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tasks, loadTasks, deleteTask, toggleTask, addTask: addTaskToStore, updateTask: updateTaskInStore } = useAppStore();
  // Ustaw dzisiejszą datę jako domyślnie wybraną
  const [selectedDate, setSelectedDate] = useState(() => formatDateLocal(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const scrollViewRef = useRef(null);

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
            router.push('/tasks');
          } else {
            // Swipe w lewo → następna zakładka (nie ma dalej)
            // Zostaw puste - nie ma następnej zakładki
          }
          impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
  }, [router, screenWidth]);

  // Memoizuj dzisiejszą datę - oblicz tylko raz, nie przy każdym renderze dnia
  const todayString = useMemo(() => formatDateLocal(new Date()), []);

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

  const handleDayPress = (day) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(day.dateString);
  };

  const handleAddTaskForDate = (date) => {
    setEditingTask(null);
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleFormSubmit = async (taskData) => {
    try {
        if (editingTask) {
          await updateTaskInStore(editingTask.id, taskData);
        } else {
          const finalTaskData = {
            ...taskData,
            dueDate: taskData.dueDate || selectedDate,
          };
          await addTaskToStore(finalTaskData);
        }
        setEditingTask(null);
    } catch (error) {
      console.error('[Calendar] Error submitting task form:', error);
      Alert.alert(
        'Błąd',
        error.message || 'Nie udało się zapisać zadania. Spróbuj ponownie.',
        [{ text: 'OK' }]
      );
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
      console.error('[Calendar] Error deleting task:', error);
      // Błąd już został obsłużony w TaskItem (przywrócenie widoku)
      // Nie pokazujemy Alert - błąd jest już obsłużony wizualnie
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleTask(id);
    } catch (error) {
      console.error('[Calendar] Error toggling task:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować zadania. Spróbuj ponownie.', [{ text: 'OK' }]);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  // Zadania bez daty - można przypisać do wybranej daty
  const tasksWithoutDate = useMemo(() => {
    return tasks.filter((task) => {
      // Tylko aktywne zadania bez daty
      if (task.completed) {
        return false;
      }
      const date = parseDueDate(task.dueDate);
      return !date;
    });
  }, [tasks]);

  const handleAddFromList = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (tasksWithoutDate.length === 0) {
      Alert.alert(
        'Brak zadań',
        'Nie ma żadnych zadań bez przypisanej daty. Dodaj najpierw zadanie na liście zadań.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowTaskListModal(true);
  };

  const handleAssignTaskToDate = async (taskId) => {
    try {
      impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateTaskInStore(taskId, { dueDate: selectedDate });
      setShowTaskListModal(false);
      notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Calendar] Error assigning task to date:', error);
      Alert.alert('Błąd', 'Nie udało się przypisać zadania do daty. Spróbuj ponownie.', [{ text: 'OK' }]);
    }
  };

  const markedDates = useMemo(() => {
    const marks = {};

    tasks.forEach((task) => {
      const date = parseDueDate(task.dueDate);
      if (!date) {
        return;
      }

      const dateKey = formatDateLocal(date);
      if (!dateKey) {
        return;
      }
      if (!marks[dateKey]) {
        marks[dateKey] = { dots: [] };
      }

      marks[dateKey].dots.push({
        color: priorityColors[task.priority] || colors.textTertiary,
      });
    });

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

    return tasks.filter((task) => {
      const date = parseDueDate(task.dueDate);
      if (!date) {
        return false;
      }

      const taskDateKey = formatDateLocal(date);
      return taskDateKey === selectedDate;
    });
  }, [tasks, selectedDate]);


  const Wrapper = swipeGesture && GestureDetector ? GestureDetector : View;
  const wrapperProps = swipeGesture && GestureDetector ? { gesture: swipeGesture } : {};

  // Niestandardowy komponent dnia - kropki POD przyciskiem, nie wewnątrz
  // Działa zarówno na web jak i mobile
  // Używamy useCallback aby uniknąć tworzenia nowej funkcji przy każdym renderze
  const renderDayComponent = useCallback(({ date, state, marking, onPress }) => {
    if (!date || !date.dateString) {
      return <View style={{ flex: 1, minHeight: 50 }} />;
    }
    
    const dateKey = date.dateString;
    const isSelected = selectedDate === dateKey;
    const isToday = dateKey === todayString;
    const isDisabled = state === 'disabled';
    
    // Pobierz kropki z markedDates dla tego dnia
    const dayMarking = marking || markedDates[dateKey];
    const hasDots = dayMarking && dayMarking.dots && dayMarking.dots.length > 0;
    
    return (
      <View style={{ 
        alignItems: 'center', 
        justifyContent: 'center',
        alignSelf: 'center',
        minHeight: 36,
        overflow: 'visible',
        position: 'relative',
      }}>
        {/* Przycisk z numerem dnia - osobny komponent */}
        <Pressable
          onPress={() => {
            if (!isDisabled && onPress) {
              onPress(date);
            }
          }}
          disabled={isDisabled}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isSelected ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: getFontWeight('600'),
            color: isDisabled 
              ? colors.border 
              : isSelected 
                ? '#FFFFFF' 
                : (isToday ? colors.primary : colors.text),
            fontFamily: getFontFamily('600', 'text'),
          }}>
            {date.day}
          </Text>
        </Pressable>
        
        {/* Kropki wyświetlane POD przyciskiem - pozycjonowane absolutnie, nie zajmują miejsca */}
        {hasDots && !isDisabled && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            pointerEvents: 'none',
          }}>
            {dayMarking.dots.slice(0, 3).map((dot, index) => (
              <View
                key={`dot-${dateKey}-${index}`}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: dot.color || colors.primaryLight,
                  marginLeft: index === 0 ? 0 : 1.5,
                  marginRight: index === dayMarking.dots.slice(0, 3).length - 1 ? 0 : 1.5,
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, [selectedDate, todayString, markedDates]);

  return (
    <Wrapper {...wrapperProps} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, paddingTop: 32 + insets.top, paddingHorizontal: 20 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          boxShadow: '0 2px 8px rgba(139, 111, 71, 0.05)',
          elevation: 4,
        }}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="multi-dot"
            firstDayOfWeek={1}
            dayComponent={renderDayComponent}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textTertiary,
              selectedDayBackgroundColor: 'transparent',
              selectedDayTextColor: colors.text,
              todayTextColor: colors.primary,
              todayBackgroundColor: 'transparent',
              dayTextColor: colors.text,
              textDisabledColor: colors.border,
            dotColor: 'transparent',
            selectedDotColor: 'transparent',
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
            style={{
              borderRadius: 16,
            }}
            renderArrow={(direction) => (
              <Ionicons 
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} 
                size={24} 
                color={colors.primary} 
              />
            )}
          />
        </View>

        {selectedDate ? (
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} // Space for glass menu (88px) + extra padding (32px)
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 24 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: getFontWeight('bold'),
                    color: colors.text,
                    fontFamily: getFontFamily('bold', 'display'),
                  }}>
                    Zadania na {selectedDate}
                  </Text>
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
                <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
                <Text style={{
                  fontSize: 20,
                  fontWeight: getFontWeight('600'),
                  color: colors.text,
                  marginTop: 16,
                  fontFamily: getFontFamily('600', 'display'),
                }}>
                  Brak zadań na ten dzień
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 22,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  Dodaj zadanie, aby wypełnić harmonogram i zyskać więcej kontroli.
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 24, width: '100%' }}>
                  <Pressable
                    onPress={() => handleAddTaskForDate(selectedDate)}
                    onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: 52,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text 
                      numberOfLines={2}
                      style={{
                        color: '#FFFFFF',
                        fontSize: 17,
                        fontWeight: getFontWeight('600'),
                        fontFamily: getFontFamily('600', 'text'),
                        textAlign: 'center',
                        lineHeight: 22,
                      }}>
                      Utwórz zadanie
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddFromList}
                    onPressIn={() => impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: 52,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderRadius: 16,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <Ionicons name="list-outline" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text 
                      numberOfLines={1}
                      style={{
                        color: '#FFFFFF',
                        fontSize: 17,
                        fontWeight: getFontWeight('600'),
                        fontFamily: getFontFamily('600', 'text'),
                        flexShrink: 1,
                      }}>
                      Z listy
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingBottom: 48,
          }}>
            <Ionicons name="calendar-outline" size={72} color={colors.textTertiary} />
            <Text style={{
              fontSize: 22,
              fontWeight: getFontWeight('600'),
              color: colors.text,
              marginTop: 16,
              fontFamily: getFontFamily('600', 'display'),
            }}>
              Wybierz datę
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
              fontFamily: getFontFamily('600', 'text'),
            }}>
              Kliknij na dzień w kalendarzu, aby zobaczyć powiązane zadania i dodać nowe.
            </Text>
          </View>
        )}
      </View>

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

      {/* Modal z listą zadań bez daty */}
      <Modal
        visible={showTaskListModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTaskListModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowTaskListModal(false)}
          />
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 40 + insets.bottom,
            maxHeight: '80%',
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 28,
                  fontWeight: getFontWeight('bold'),
                  color: colors.text,
                  marginBottom: 4,
                  fontFamily: getFontFamily('bold', 'display'),
                }}>
                  Dodaj zadanie z listy
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  Wybierz zadanie bez daty, aby przypisać je do {selectedDate}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowTaskListModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  backgroundColor: colors.completedBg,
                }}
              >
                <Ionicons name="close" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>

            {tasksWithoutDate.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 400 }}
              >
                {tasksWithoutDate.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => handleAssignTaskToDate(task.id)}
                    style={{
                      backgroundColor: colors.completedBg,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 17,
                          fontWeight: getFontWeight('600'),
                          color: colors.text,
                          marginBottom: 4,
                          fontFamily: getFontFamily('600', 'text'),
                        }}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text style={{
                            fontSize: 15,
                            color: colors.textSecondary,
                            marginTop: 4,
                            fontFamily: getFontFamily('normal', 'text'),
                          }}>
                            {task.description}
                          </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <View style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: task.priority === 'high' ? '#3A2626' : task.priority === 'medium' ? '#3A2F1F' : '#2A3A2A',
                            borderWidth: 1,
                            borderColor: task.priority === 'high' ? '#5A3636' : task.priority === 'medium' ? '#5A4A2F' : '#4A5A4A',
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: getFontWeight('600'),
                              textTransform: 'uppercase',
                              color: task.priority === 'high' ? '#FF6B6B' : task.priority === 'medium' ? '#FFA726' : '#66BB6A',
                              fontFamily: getFontFamily('600', 'text'),
                            }}>
                              {task.priority === 'high' ? 'Wysoki' : task.priority === 'medium' ? 'Średni' : 'Niski'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={{ marginLeft: 12 }} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}>
                <Ionicons name="list-outline" size={64} color={colors.textTertiary} />
                <Text style={{
                  fontSize: 20,
                  fontWeight: getFontWeight('600'),
                  color: colors.text,
                  marginTop: 16,
                  fontFamily: getFontFamily('600', 'display'),
                }}>
                  Brak zadań bez daty
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  fontFamily: getFontFamily('normal', 'text'),
                }}>
                  Wszystkie zadania mają już przypisaną datę lub zostały ukończone.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      </View>
    </Wrapper>
  );
}

