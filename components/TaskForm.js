import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Keyboard,
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
} from '../utils/animationHelpers';
import { impactAsync, notificationAsync } from '../utils/haptics';
import * as Haptics from 'expo-haptics';
import { getFontFamily, getFontWeight } from '../utils/fontHelpers';
import { colors, priorities } from '../utils/colors';
import { inputStyles, HIT_SLOP, HIT_SLOP_LARGE } from '../utils/inputStyles';

// Import gestur handler dla mobilnych
const isWeb = Platform.OS === 'web';
let Gesture = null;
let GestureDetector = null;

if (!isWeb) {
  const gestureModule = require('react-native-gesture-handler');
  Gesture = gestureModule.Gesture;
  GestureDetector = gestureModule.GestureDetector;
}

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
        style={[
          inputStyles.priorityButton,
          {
            backgroundColor: isActive ? item.bgColor : colors.card,
            borderColor: isActive ? (item.borderColor || item.color) : colors.border,
          }
        ]}
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

// Import DateTimePicker
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function TaskForm({ visible, onClose, onSubmit, initialTask = null, initialDate = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const timeInputRef = useRef(null);
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
      setTime(initialTask.time || '');
      if (initialTask.dueDate) {
        const date = new Date(initialTask.dueDate);
        if (!isNaN(date.getTime())) {
          setDueDate(date);
        } else {
          setDueDate(null);
        }
      } else {
        setDueDate(null);
      }
    } else {
      resetForm();
      // Set initial date when form opens and no task is being edited
      if (visible && initialDate) {
        // Parse date string (YYYY-MM-DD) as local date, not UTC
        const [year, month, day] = initialDate.split('-').map(Number);
        if (year && month && day) {
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            setDueDate(date);
          }
        }
      }
    }
  }, [initialTask, visible, initialDate]);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(null);
    setTime('');
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

    // Validate time format if provided
    let normalizedTime = time.trim();
    if (normalizedTime) {
      // Validate HH:MM format
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(normalizedTime)) {
        notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    } else {
      normalizedTime = null;
    }

    console.log('[TaskForm] Submitting task with data:', {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: formatDateLocal(dueDate),
      time: normalizedTime,
    });
    
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: formatDateLocal(dueDate),
      time: normalizedTime,
    });

    console.log('[TaskForm] Task submitted successfully');
    notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    onClose();
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
          easing: Easing.in(Easing.quad),
        });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleClose)();
      } else if (scrollOffset.value <= 0) {
        // Snap back to original position only if at top
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.quad),
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={Platform.OS === 'ios'}
      >
        <Animated.View
          style={[
            backdropStyle,
            { position: 'absolute', inset: 0, backgroundColor: colors.black, zIndex: 1 }
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
              style={inputStyles.closeButton}
              hitSlop={HIT_SLOP_LARGE}
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
              <View style={inputStyles.container}>
                <TextInput
                  placeholder="Wpisz tytuł zadania"
                  value={title}
                  onChangeText={setTitle}
                  style={inputStyles.input}
                  placeholderTextColor={colors.textTertiary}
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
              <View style={inputStyles.container}>
                <TextInput
                  placeholder="Dodaj dodatkowe informacje"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  style={[inputStyles.input, { minHeight: 100 }]}
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
                Data
              </Text>
              <View style={inputStyles.container}>
                <TextInput
                  placeholder="YYYY-MM-DD (np. 2025-01-31)"
                  value={dueDate ? formatDateLocal(dueDate) : ''}
                  onFocus={() => {
                    if (Platform.OS !== 'web') {
                      setShowDatePicker(true);
                      impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
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
                  style={inputStyles.input}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  editable={true}
                  showSoftInputOnFocus={Platform.OS !== 'web' ? false : true}
                />
                {dueDate ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setDueDate(null);
                      impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      padding: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    hitSlop={HIT_SLOP_LARGE}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                ) : (
                  <Ionicons name="calendar-outline" size={22} color={colors.primary} />
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
                Godzina
              </Text>
              <Pressable
                style={inputStyles.container}
                onPress={() => {
                  if (timeInputRef.current) {
                    timeInputRef.current.focus();
                  }
                }}
              >
                <TextInput
                  ref={timeInputRef}
                  placeholder="HH:MM (np. 14:30)"
                  value={time}
                  onChangeText={(text) => {
                    // Allow only digits and colon, max 5 characters
                    let formatted = text.replace(/[^\d:]/g, '');
                    // Auto-format: add colon after 2 digits
                    if (formatted.length === 2 && !formatted.includes(':')) {
                      formatted = formatted + ':';
                    }
                    // Limit to HH:MM format (24h format)
                    if (formatted.length > 5) {
                      formatted = formatted.substring(0, 5);
                    }
                    setTime(formatted);
                    // Validate on change
                    if (formatted.length === 5) {
                      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                      if (timeRegex.test(formatted)) {
                        impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }
                  }}
                  style={inputStyles.input}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  maxLength={5}
                  editable={true}
                />
                {time ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setTime('');
                      impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      padding: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    hitSlop={HIT_SLOP_LARGE}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                ) : (
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                )}
              </Pressable>
              <Text style={{
                fontSize: 14,
                color: colors.textTertiary,
                marginTop: 8,
                fontFamily: getFontFamily('normal', 'text'),
              }}>
                Format: GG:MM (opcjonalne)
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
            style={[inputStyles.buttonPrimary, { marginTop: 16, cursor: Platform.OS === 'web' ? 'pointer' : 'default' }]}
            accessibilityRole="button"
            accessibilityLabel={initialTask ? 'Zapisz zmiany' : 'Dodaj zadanie'}
            hitSlop={HIT_SLOP_LARGE}
            disabled={false}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} style={{ pointerEvents: 'none' }} />
            <Text style={{
              color: colors.white,
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

        {/* Date Picker dla Android */}
        {showDatePicker && Platform.OS === 'android' && DateTimePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === 'set' && date) {
                setDueDate(date);
                impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            minimumDate={initialTask ? null : new Date()}
            locale="pl_PL"
            textColor={colors.text}
            accentColor={colors.primary}
          />
        )}

        {/* Date Picker dla iOS w modalu */}
        {Platform.OS === 'ios' && showDatePicker && DateTimePicker && (
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.overlay,
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowDatePicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
              }}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: getFontWeight('600'),
                    color: colors.text,
                    fontFamily: getFontFamily('600', 'text'),
                  }}
                >
                  Wybierz datę
                </Text>
                <Pressable
                  onPress={() => {
                    setShowDatePicker(false);
                    impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: getFontWeight('600'),
                      color: colors.primary,
                      fontFamily: getFontFamily('600', 'text'),
                    }}
                  >
                    Gotowe
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    setDueDate(date);
                  }
                }}
                minimumDate={initialTask ? null : new Date()}
                locale="pl_PL"
                textColor={colors.text}
                accentColor={colors.primary}
              />
            </View>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}