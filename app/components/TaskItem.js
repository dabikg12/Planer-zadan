import { memo, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { impactAsync, notificationAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';

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
    color: '#C4A484',
    bgColor: '#F0E6D2',
    borderColor: '#E8DDD1',
  },
  medium: {
    label: 'Średni',
    color: '#A0826D',
    bgColor: '#F5F1E8',
    borderColor: '#E8DDD1',
  },
  low: {
    label: 'Niski',
    color: '#8B6F47',
    bgColor: '#FAF7F3',
    borderColor: '#E8DDD1',
  },
};

const getPriorityConfig = (priority) =>
  priorityConfig[priority] || priorityConfig.medium;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TaskItem({ task, onToggle, onEdit, onDelete, index = 0 }) {
  const priority = useMemo(
    () => getPriorityConfig(task.priority),
    [task.priority]
  );
  const scale = useSharedValue(1);
  const checkmarkScale = useSharedValue(task.completed ? 1 : 0);
  const checkmarkRotation = useSharedValue(task.completed ? 1 : 0);
  const opacity = useSharedValue(0);
  const cardTranslate = useSharedValue(30);

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

  // Entrance animation
  useEffect(() => {
    cardTranslate.value = withDelay(index * 50, withSpring(0, { damping: 15, stiffness: 100 }));
    opacity.value = withDelay(index * 50, withSpring(1, { damping: 15 }));
  }, []);

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

  const handleDelete = () => {
    // Animacja usuwania - zmniejszamy wysokość i opacity
    opacity.value = withTiming(0, { duration: 200 });
    cardTranslate.value = withTiming(300, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => {
      onDelete();
    }, 200);
  };

  const handleEdit = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit();
  };

  return (
    <AnimatedPressable
      style={[animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleToggle}
    >
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
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
                    fontWeight: '600',
                    color: task.completed ? colors.textTertiary : colors.text,
                    textDecorationLine: task.completed ? 'line-through' : 'none',
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                      fontSize: 11,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: priority.color,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
                    <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: colors.textSecondary,
                      marginLeft: 6,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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
              onPress={handleDelete}
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
      </View>
    </AnimatedPressable>
  );
}

export default memo(TaskItem);