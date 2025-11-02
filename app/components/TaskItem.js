import { memo, useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from '../../utils/animationHelpers';
import { impactAsync, notificationAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { getFontFamily, getFontWeight } from '../../utils/fontHelpers';

// Color palette - brown/beige theme
const colors = {
  primary: '#8B6F47',
  primaryLight: '#A0826D',
  accent: '#C4A484',
  text: '#2A1F15',
  textSecondary: '#6B5238',
  textTertiary: '#A0826D',
  border: '#E8DDD1',
  card: '#FEFCFB',
  background: '#F5F1E8',
  completed: '#A0826D',
  completedBg: '#E8DDD1',
};

const priorityConfig = {
  high: {
    label: 'Wysoki',
    color: '#D32F2F',
    bgColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  medium: {
    label: 'Średni',
    color: '#F57C00',
    bgColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  low: {
    label: 'Niski',
    color: '#388E3C',
    bgColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
};

const getPriorityConfig = (priority) =>
  priorityConfig[priority] || priorityConfig.medium;

function TaskItem({ task, onToggle, onEdit, onDelete, index = 0 }) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const priority = useMemo(
    () => getPriorityConfig(task.priority),
    [task.priority]
  );
  const scale = useSharedValue(1);
  const checkmarkScale = useSharedValue(0);
  const checkmarkRotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const cardTranslate = useSharedValue(0);

  // Sync shared values with task.completed prop
  // Initialize immediately on mount to avoid flash
  useEffect(() => {
    const initialValue = task.completed ? 1 : 0;
    checkmarkScale.value = initialValue;
    checkmarkRotation.value = initialValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Update when task.completed changes
  useEffect(() => {
    if (task.completed) {
      checkmarkScale.value = 1;
      checkmarkRotation.value = 1;
    } else {
      checkmarkScale.value = 0;
      checkmarkRotation.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.completed]);

  const formattedDate = useMemo(() => {
    if (!task.dueDate) {
      return null;
    }

    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [task.dueDate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: cardTranslate.value }
    ],
    opacity: opacity.value,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkmarkScale.value },
      { rotate: `${checkmarkRotation.value * 360}deg` }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleToggle = () => {
    if (!task.completed) {
      checkmarkScale.value = withSequence(
        withSpring(1.2, { damping: 12 }),
        withSpring(1, { damping: 12 })
      );
      checkmarkRotation.value = withSpring(1, { damping: 12 });
      notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      checkmarkScale.value = withSpring(0, { damping: 12 });
      checkmarkRotation.value = withSpring(0, { damping: 12 });
      impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  };

  const handleDeletePress = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Zamknij tryb potwierdzania natychmiast
    setIsConfirmingDelete(false);
    
    // Natychmiastowe usuwanie - animacja znikania
    opacity.value = withTiming(0, { duration: 200 });
    cardTranslate.value = withTiming(300, { duration: 200 });
    
    // Wywołaj onDelete i poczekaj na zakończenie
    try {
      await onDelete();
    } catch (error) {
      // Jeśli błąd, przywróć widok zadania
      console.error('[TaskItem] Error deleting task:', error);
      opacity.value = withTiming(1, { duration: 200 });
      cardTranslate.value = withTiming(0, { duration: 200 });
    }
  };

  const handleCancelDelete = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsConfirmingDelete(false);
  };

  const handleEdit = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit();
  };

  return (
    <Animated.Pressable
      style={[animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleToggle}
      disabled={isConfirmingDelete}
    >
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isConfirmingDelete ? '#D32F2F' : colors.border,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {isConfirmingDelete ? (
          <View style={{ flexDirection: 'column', gap: 12 }}>
            <Text style={{
              fontSize: 17,
              fontWeight: getFontWeight('600'),
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8,
              fontFamily: getFontFamily('600', 'text'),
            }}>
              Usunąć to zadanie?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={handleCancelDelete}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: colors.completedBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: getFontWeight('600'),
                  color: colors.text,
                  fontFamily: getFontFamily('600', 'text'),
                }}>
                  Anuluj
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: '#D32F2F',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: getFontWeight('600'),
                  color: '#FFFFFF',
                  fontFamily: getFontFamily('600', 'text'),
                }}>
                  Usuń
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Pressable
              onPress={handleToggle}
              style={{ flexDirection: 'row', flex: 1, alignItems: 'flex-start' }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={{ marginRight: 16, marginTop: 2 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: task.completed ? colors.completed : colors.card,
                    borderColor: task.completed ? colors.completed : colors.border,
                  }}
                >
                  <Animated.View style={checkmarkStyle}>
                    {task.completed && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </Animated.View>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: getFontWeight('600'),
                      color: task.completed ? colors.textTertiary : colors.text,
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                      fontFamily: getFontFamily('600', 'text'),
                      flex: 1,
                    }}
                  >
                    {task.title}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: priority.bgColor,
                      borderWidth: 1,
                      borderColor: priority.borderColor,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: getFontWeight('600'),
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: priority.color,
                        fontFamily: getFontFamily('600', 'text'),
                      }}
                    >
                      {priority.label}
                    </Text>
                  </View>
                </View>

                {task.description ? (
                  <Text style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    marginTop: 8,
                    lineHeight: 20,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}>
                    {task.description}
                  </Text>
                ) : null}

                {formattedDate ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.completedBg,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                      <Text style={{
                        fontSize: 13,
                        fontWeight: getFontWeight('500'),
                        color: colors.textSecondary,
                        marginLeft: 6,
                        fontFamily: getFontFamily('500', 'text'),
                      }}>
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </Pressable>

            <View style={{ flexDirection: 'row', marginLeft: 12 }}>
              <Pressable
                onPress={handleEdit}
                style={{
                  padding: 10,
                  backgroundColor: colors.completedBg,
                  borderRadius: 12,
                  marginRight: 8,
                }}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={handleDeletePress}
                style={{
                  padding: 10,
                  backgroundColor: '#FFEBEE',
                  borderRadius: 12,
                }}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Animated.Pressable>
  );
}

export default memo(TaskItem);