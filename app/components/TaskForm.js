import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  Animated,
} from '../../utils/animationHelpers';
import { impactAsync, notificationAsync } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { getFontFamily, getFontWeight } from '../../utils/fontHelpers';

// Warunkowy import gestur handler tylko dla mobilnych
const isWeb = Platform.OS === 'web';
let Gesture = null;
let GestureDetector = null;

if (!isWeb) {
  try {
    const gestureModule = require('react-native-gesture-handler');
    Gesture = gestureModule.Gesture;
    GestureDetector = gestureModule.GestureDetector;
  } catch (error) {
    console.warn('[TaskForm] Gesture handler not available:', error);
  }
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
  activeBg: '#F0E6D2',
  completedBg: '#E8DDD1',
};

const priorities = [
  { value: 'low', label: 'Niski', color: '#388E3C', bgColor: '#E8F5E9', borderColor: '#66BB6A' },
  { value: 'medium', label: 'Średni', color: '#F57C00', bgColor: '#FFF3E0', borderColor: '#FF9800' },
  { value: 'high', label: 'Wysoki', color: '#D32F2F', bgColor: '#FFEBEE', borderColor: '#EF5350' },
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
          borderColor: isActive ? (item.borderColor || item.color) : colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              fontWeight: getFontWeight('600'),
              fontSize: 15,
              color: isActive ? item.color : colors.textTertiary,
              fontFamily: getFontFamily('600', 'text'),
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
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.85;
  const DRAG_THRESHOLD = 100; // px to drag before closing
  const translateY = useSharedValue(modalHeight);
  const opacity = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Tło pojawia się od razu, modal też jest od razu na miejscu (bez animacji wyjeżdżania)
      translateY.value = 0;
      opacity.value = 1;
      scrollOffset.value = 0;
      impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Przy zamykaniu - szybka animacja fade out
      translateY.value = 0;
      opacity.value = withTiming(0, { duration: 150 });
      scrollOffset.value = 0;
    }
  }, [visible, modalHeight]);

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

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(null);
  }, []);

  // Convert Date to YYYY-MM-DD format using local timezone
  const formatDateLocal = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    console.log('[TaskForm] handleSubmit called, title:', title);
    
    if (!title.trim()) {
      console.log('[TaskForm] Title is empty, showing error');
      notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      console.log('[TaskForm] Submitting task with data:', {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: formatDateLocal(dueDate),
      });
      
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: formatDateLocal(dueDate),
      });

      console.log('[TaskForm] Task submitted successfully');
      notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      onClose();
    } catch (error) {
      console.error('[TaskForm] Error submitting task:', error);
      notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Don't close form on error, let user try again
    }
  };

  const handleFormClose = useCallback(() => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isWeb) {
      // Na webie - zamknij natychmiast bez animacji
      resetForm();
      onClose();
    } else {
      // Na mobile - użyj animacji
      translateY.value = withTiming(modalHeight, {
        duration: 250,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(resetForm)();
          runOnJS(onClose)();
        }
      });
    }
  }, [modalHeight, resetForm, onClose]);

  const handlePriorityChange = (value) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPriority(value);
  };

  const handleClose = () => {
    onClose();
  };

  const startY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset?.y || 0;
    },
  });

  // Gesture tylko dla mobilnych platform
  const panGesture = !isWeb && Gesture ? Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow dragging down if ScrollView is at the top (offset === 0)
      if (event.translationY > 0 && scrollOffset.value <= 0) {
        translateY.value = startY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      // Only close if ScrollView is at top
      if (scrollOffset.value <= 0 && event.translationY > DRAG_THRESHOLD) {
        // Close modal if dragged past threshold
        translateY.value = withTiming(modalHeight, {
          duration: 250,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleClose)();
      } else if (scrollOffset.value <= 0) {
        // Snap back to original position only if at top
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    }) : null;

  // Modal zawsze na miejscu (bez animacji wyjeżdżania), tylko fade tła
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 0 }], // Zawsze na miejscu, bez wyjeżdżania
  }));

  // Tło pojawia się od razu i znika z fade out
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }));

  const modalMaxHeight = screenHeight * 0.85; // 85% wysokości ekranu
  // Oblicz wysokość ScrollView: modalMaxHeight - nagłówek (~100px) - przycisk (~70px) - padding (~64px)
  const scrollViewHeight = Math.max(300, modalMaxHeight - 234);

  // Debug log dla Android
  useEffect(() => {
    if (visible && Platform.OS === 'android') {
      console.log('[TaskForm] Modal opened - screenHeight:', screenHeight, 'modalMaxHeight:', modalMaxHeight, 'scrollViewHeight:', scrollViewHeight);
    }
  }, [visible, screenHeight, modalMaxHeight, scrollViewHeight]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleFormClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Animated.View
          style={[
            backdropStyle,
            { position: 'absolute', inset: 0, backgroundColor: '#000000', zIndex: 1 }
          ]}
          pointerEvents={visible ? "auto" : "none"}
        >
          <Pressable 
            style={{ flex: 1 }} 
            onPress={handleFormClose}
          />
        </Animated.View>
        {visible && (
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
                  boxShadow: '0 -4px 16px rgba(139, 111, 71, 0.1)',
                  elevation: 16,
                  maxHeight: modalMaxHeight,
                  width: '100%',
                  position: 'absolute',
                  bottom: 0,
                  overflow: 'hidden',
                  zIndex: 2,
                },
              ]}
            >
          {isWeb || !GestureDetector ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 12,
              marginTop: -8,
              marginBottom: 12,
            }}>
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
              }} />
            </View>
          ) : (
            <GestureDetector gesture={panGesture}>
              <View style={{
                alignItems: 'center',
                paddingVertical: 12,
                marginTop: -8,
                marginBottom: 12,
              }}>
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.border,
                  borderRadius: 2,
                }} />
              </View>
            </GestureDetector>
          )}
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 28,
                fontWeight: getFontWeight('bold'),
                color: colors.text,
                marginBottom: 4,
                fontFamily: getFontFamily('bold', 'display'),
              }}>
                {initialTask ? 'Edytuj zadanie' : 'Nowe zadanie'}
              </Text>
              <Text style={{
                fontSize: 15,
                color: colors.textSecondary,
                fontFamily: getFontFamily('normal', 'text'),
              }}>
                Dodaj szczegóły i zapisz zadanie
              </Text>
            </View>
            <Pressable
              onPress={handleFormClose}
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

          <Animated.ScrollView
            style={{ 
              height: scrollViewHeight,
            }}
            contentContainerStyle={{ 
              paddingBottom: 8,
              flexGrow: 1,
            }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'android'}
            bounces={false}
            removeClippedSubviews={false}
          >
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: getFontWeight('600'),
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                fontFamily: getFontFamily('600', 'text'),
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
                    fontFamily: getFontFamily('normal', 'text'),
                  }}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  textContentType="none"
                  autoCapitalize="sentences"
                  autoCorrect={true}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: getFontWeight('600'),
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                fontFamily: getFontFamily('600', 'text'),
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
                    fontFamily: getFontFamily('normal', 'text'),
                  }}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: getFontWeight('600'),
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                fontFamily: getFontFamily('600', 'text'),
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
                fontSize: 14,
                fontWeight: getFontWeight('600'),
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
                fontFamily: getFontFamily('600', 'text'),
              }}>
                Data
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.completedBg,
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 8,
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
                    flex: 1,
                    fontSize: 17,
                    color: colors.text,
                    fontFamily: getFontFamily('normal', 'text'),
                  }}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                {dueDate && (
                  <Pressable
                    onPress={() => {
                      setDueDate(null);
                      impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      padding: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              <Text style={{
                fontSize: 14,
                color: colors.textTertiary,
                marginTop: 8,
                fontFamily: getFontFamily('normal', 'text'),
              }}>
                Format: RRRR-MM-DD
              </Text>
            </View>
          </Animated.ScrollView>

          <Pressable
            onPress={() => {
              console.log('[TaskForm] Button clicked!');
              handleSubmit();
            }}
            onPressIn={() => {
              console.log('[TaskForm] Button press in');
              impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={{
              marginTop: 16,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              backgroundColor: colors.primary,
              boxShadow: '0 4px 8px rgba(139, 111, 71, 0.3)',
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minHeight: 56,
            }}
            accessibilityRole="button"
            accessibilityLabel={initialTask ? 'Zapisz zmiany' : 'Dodaj zadanie'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={false}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ pointerEvents: 'none' }} />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: getFontWeight('600'),
              marginLeft: 8,
              fontFamily: getFontFamily('600', 'text'),
              pointerEvents: 'none',
            }}>
              {initialTask ? 'Zapisz zmiany' : 'Dodaj zadanie'}
            </Text>
          </Pressable>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}