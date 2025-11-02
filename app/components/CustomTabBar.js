import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import {
  Animated,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from '../../utils/animationHelpers';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Kolory - ciemne menu z brązowymi akcentami
const colors = {
  menuBg: '#2A1F15', // Ciemny brąz - tło menu
  menuBgLight: '#3A2F25', // Jaśniejszy ciemny brąz
  primary: '#8B6F47', // Brązowy akcent - aktywna zakładka i FAB
  primaryLight: '#A0826D',
  iconActive: '#C4A484', // Jasny brąz dla aktywnej ikony
  iconInactive: '#6B5238', // Ciemniejszy brąz dla nieaktywnych ikon
  textActive: '#C4A484',
  textInactive: '#8B6F47',
  border: '#3A2F25',
  card: '#FEFCFB',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Komponent pojedynczej zakładki
const TabButton = ({ route, index, isFocused, onPress, onLongPress, iconName }) => {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedColor = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0.7, { duration: 200 }),
    };
  });

  return (
    <AnimatedPressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15 });
        iconScale.value = withSpring(0.9, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
        iconScale.value = withSpring(1, { damping: 15 });
      }}
      style={[styles.tabButton, animatedContainerStyle]}
    >
      {/* Ikona */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle, animatedColor]}>
        <Ionicons
          name={iconName}
          size={26}
          color={isFocused ? colors.iconActive : colors.iconInactive}
        />
      </Animated.View>
    </AnimatedPressable>
  );
};

// Floating Action Button
const AddTaskButton = ({ onPress }) => {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
      }}
      style={styles.fab}
    >
      <View style={styles.fabContainer}>
        <View style={styles.fabIconContainer}>
          <Ionicons name="add" size={36} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const handleAddTask = () => {
    // Sprawdź aktualnie aktywny ekran
    const activeRoute = state.routes[state.index];
    const activeTabName = activeRoute?.name || 'index';
    
    // Nawiguj do aktywnego ekranu z parametrem otwierającym formularz
    // Jeśli już jesteśmy na tym ekranie, użyj navigate z parametrem
    navigation.navigate(activeTabName, { openForm: true });
  };

  // Hardcoded 3 zakładki
  const tabs = [
    { name: 'index', icon: 'home', iconOutline: 'home-outline' },
    { name: 'tasks', icon: 'list', iconOutline: 'list-outline' },
    { name: 'calendar', icon: 'calendar', iconOutline: 'calendar-outline' },
  ];

  // Znajdź aktywną zakładkę
  const activeRoute = state.routes[state.index];
  const activeTabName = activeRoute?.name || 'index';

  return (
    <View style={styles.container}>
      <View style={styles.menuWrapper}>
        {/* Menu z 3 przyciskami - efekt szkła z mocnym rozmyciem */}
        <View style={styles.shadowContainer}>
          <BlurView
            intensity={250}
            tint="dark"
            style={styles.blurContainer}
          >
            <View style={styles.menuCard}>
              <LinearGradient
                colors={['rgba(42, 31, 21, 0.3)', 'rgba(58, 47, 37, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.tabBar}>
                {tabs.map((tab) => {
                  const isFocused = activeTabName === tab.name;
                  const route = state.routes.find((r) => r.name === tab.name);
                  
                  if (!route) return null;

                  const onPress = () => {
                    if (!isFocused) {
                      navigation.navigate(tab.name);
                    }
                  };

                  const onLongPress = () => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                  };

                  return (
                    <TabButton
                      key={tab.name}
                      route={{ name: tab.name }}
                      index={tabs.indexOf(tab)}
                      isFocused={isFocused}
                      onPress={onPress}
                      onLongPress={onLongPress}
                      iconName={isFocused ? tab.icon : tab.iconOutline}
                    />
                  );
                })}
              </View>
            </LinearGradient>
          </View>
          </BlurView>
        </View>

        {/* Floating Action Button */}
        <AddTaskButton onPress={handleAddTask} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  menuWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    width: '98%',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  shadowContainer: {
    flex: 1,
    borderRadius: 32,
    minWidth: 0,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '100%',
  },
  menuCard: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  gradientCard: {
    borderRadius: 32,
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
    minHeight: 56,
    maxWidth: '33.33%',
  },
  iconContainer: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fab: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: 'hidden',
    borderWidth: 0,
    flexShrink: 0,
    // Cień dla iOS
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // Cień dla Android
    elevation: 8,
    // Cień dla Web
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(139, 111, 71, 0.25)',
    }),
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 41,
  },
  fabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
