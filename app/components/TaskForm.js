import { useState, useEffect } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { impactAsync, notificationAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';

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
  activeBg: '#F0E6D2',
  completedBg: '#E8DDD1',
};

const priorities = [
  { value: 'low', label: 'Niski', color: colors.primary, bgColor: colors.completedBg },
  { value: 'medium', label: 'Średni', color: colors.primaryLight, bgColor: colors.activeBg },
  { value: 'high', label: 'Wysoki', color: colors.accent, bgColor: colors.activeBg },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PriorityButton = ({ item, isActive, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[{ flex: 1 }, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
    >
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: isActive ? item.bgColor : colors.card,
          borderColor: isActive ? item.color : colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 15,
              color: isActive ? item.color : colors.textTertiary,
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
            }}
          >
            {item.label}
          </Text>
          {isActive && (
            <Ionicons name="checkmark-circle" size={20} color={item.color} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default function TaskForm({ visible, onClose, onSubmit, initialTask = null, initialDate = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);
  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 100 });
      impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      translateY.value = withSpring(500, { damping: 20 });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0.95, { damping: 20 });
    }
  }, [visible]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority || 'medium');
      if (initialTask.dueDate) {
        try {
          const date = new Date(initialTask.dueDate);
          if (!isNaN(date.getTime())) {
            setDueDate(date);
          } else {
            setDueDate(null);
          }
        } catch {
          setDueDate(null);
        }
      } else {
        setDueDate(null);
      }
    } else {
      resetForm();
      // Set initial date when form opens and no task is being edited
      if (visible && initialDate) {
        try {
          // Parse date string (YYYY-MM-DD) as local date, not UTC
          const [year, month, day] = initialDate.split('-').map(Number);
          if (year && month && day) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              setDueDate(date);
            }
          }
        } catch {
          // Ignore invalid dates
        }
      }
    }
  }, [initialTask, visible, initialDate]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(null);
  };

  // Convert Date to YYYY-MM-DD format using local timezone
  const formatDateLocal = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: formatDateLocal(dueDate),
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetForm();
    onClose();
  };

  const handlePriorityChange = (value) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPriority(value);
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Animated.View
          style={[backdropStyle, { position: 'absolute', inset: 0, backgroundColor: '#000000' }]}
        />
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
        <Animated.View
          style={[
            animatedModalStyle,
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 40,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 16,
            },
          ]}
        >
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24,
          }} />
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 4,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
              }}>
                {initialTask ? 'Edytuj zadanie' : 'Nowe zadanie'}
              </Text>
              <Text style={{
                fontSize: 15,
                color: colors.textSecondary,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Dodaj szczegóły i zapisz zadanie
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                backgroundColor: colors.completedBg,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Tytuł *
              </Text>
              <View style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.completedBg,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  placeholder="Wpisz tytuł zadania"
                  value={title}
                  onChangeText={setTitle}
                  style={{
                    fontSize: 17,
                    color: colors.text,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                  }}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Opis
              </Text>
              <View style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.completedBg,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  placeholder="Dodaj dodatkowe informacje"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  style={{
                    fontSize: 17,
                    color: colors.text,
                    minHeight: 100,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                  }}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Priorytet
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {priorities.map((item) => (
                  <PriorityButton
                    key={item.value}
                    item={item}
                    isActive={priority === item.value}
                    onPress={() => handlePriorityChange(item.value)}
                  />
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Data
              </Text>
              <View style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.completedBg,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  placeholder="YYYY-MM-DD (np. 2025-01-31)"
                  value={dueDate ? formatDateLocal(dueDate) : ''}
                  onChangeText={(text) => {
                    if (text === '') {
                      setDueDate(null);
                      return;
                    }
                    const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    if (dateMatch) {
                      const date = new Date(text + 'T12:00:00');
                      if (!isNaN(date.getTime())) {
                        setDueDate(date);
                        impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }
                  }}
                  style={{
                    fontSize: 17,
                    color: colors.text,
                    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
                  }}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <Text style={{
                fontSize: 13,
                color: colors.textTertiary,
                marginTop: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                Format: RRRR-MM-DD
              </Text>
            </View>
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            style={{
              marginTop: 16,
              borderRadius: 16,
              paddingVertical: 16,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '600',
                marginLeft: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
              }}>
                {initialTask ? 'Zapisz zmiany' : 'Dodaj zadanie'}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}