import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useAnimatedStyle, 
  useSharedValue, 
  Animated,
  AnimatedView,
} from '../utils/animationHelpers';
import { 
  animateMenuFlash,
  animateIconPress,
} from '../utils/commonAnimations';
import { colors, priorityColors } from '../utils/colors';
import { FROST_NOISE_SOURCE } from '../utils/frostNoise';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '../store/useAppStore';

// Komponent pojedynczej zakładki
const TabButton = ({ isFocused, onPress, onLongPress, iconName }) => {
  const iconScale = useSharedValue(1);
  
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Animacja ikony przy kliknięciu
    animateIconPress(iconScale, 0.7, { duration: 300 });
    onPress();
    // Powrót do normalnej skali po krótkim czasie
    setTimeout(() => {
      animateIconPress(iconScale, 1, { duration: 300 });
    }, 300);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <View style={styles.iconContainer}>
        {isFocused && (
          <View style={styles.activeTabIndicator}>
            <BlurView
              intensity={20}
              tint="light"
              style={styles.indicatorBlur}
            />
          </View>
        )}
        <AnimatedView style={iconAnimatedStyle}>
          <Ionicons
            name={iconName}
            size={26}
            color={isFocused ? colors.accent : colors.white}
            style={styles.icon}
          />
        </AnimatedView>
      </View>
    </Pressable>
  );
};

// Floating Action Button
const AddTaskButton = ({ onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={styles.fab}
    >
      <View style={styles.fabContainer}>
        <Ionicons name="add" size={36} color={colors.white} />
      </View>
    </Pressable>
  );
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { setCurrentTabIndex } = useAppStore();
  const menuFlash = useSharedValue(0);
  const prevActiveTab = useRef(state.index);

  const AnimatedBlurView = Animated.createAnimatedComponent
    ? Animated.createAnimatedComponent(BlurView)
    : BlurView;
  const AnimatedNoiseImage = Animated.createAnimatedComponent
    ? Animated.createAnimatedComponent(Image)
    : Image;

  // Wykryj zmianę zakładki i dodaj błysk + aktualizuj store
  useEffect(() => {
    if (prevActiveTab.current !== state.index) {
      // Delikatny błysk przy zmianie zakładki
      animateMenuFlash(menuFlash, { maxOpacity: 0.4, riseDuration: 100, fallDuration: 200 });
      // Aktualizuj store z aktualnym indeksem zakładki
      setCurrentTabIndex(state.index);
      prevActiveTab.current = state.index;
    }
  }, [state.index, menuFlash, setCurrentTabIndex]);

  // Animowane style dla błysku
  const flashStyle = useAnimatedStyle(() => ({
    opacity: menuFlash.value,
  }));

  const handleAddTask = () => {
    const activeRoute = state.routes[state.index];
    const activeTabName = activeRoute?.name || 'index';
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

  // Funkcja do nawigacji
  const handleTabPress = (tabName) => {
    const route = state.routes.find((r) => r.name === tabName);
    if (!route || activeTabName === tabName) return;
    
    const descriptor = descriptors[route.key];
    if (descriptor?.navigation) {
      descriptor.navigation.navigate(route.name);
    } else {
      navigation.navigate(route.name);
    }
  };

  const MenuContent = () => {
    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isFocused = activeTabName === tab.name;
          return (
            <TabButton
              key={tab.name}
              isFocused={isFocused}
              onPress={() => handleTabPress(tab.name)}
              onLongPress={() => handleTabPress(tab.name)}
              iconName={isFocused ? tab.icon : tab.iconOutline}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12) }]}>
      <View style={styles.menuWrapper}>
        {/* Menu z efektem blur */}
        <View style={styles.shadowContainer}>
          {/* Content na wierzchu bez blur */}
          <View style={styles.contentOverlay}>
            <MenuContent />
          </View>
          {/* Blur jako background */}
          <AnimatedBlurView
            tint="light"
            intensity={10}
            style={styles.blurContainer}
          >
            <View style={styles.borderWrapper}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.2)',
                  'rgba(255, 255, 255, 0.35)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientCard}
              >
                {/* Błysk przy zmianie zakładki */}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.flashOverlay, flashStyle]}
                />
              </LinearGradient>
            </View>
          </AnimatedBlurView>
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
    position: 'relative',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    }),
  },
  contentOverlay: {
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  borderWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: colors.accentTransparent,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  gradientCard: {
    borderRadius: 32,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.whiteTransparent,
    zIndex: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 56,
    maxWidth: '33.33%',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: 26, // Wysokość ikony
  },
  icon: {
    zIndex: 1,
  },
  activeTabIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    width: '66.67%',
    height: 40,
    borderRadius: 50,
    backgroundColor: 'rgba(102, 187, 106, 0.1)',
    overflow: 'hidden',
    top: '50%',
    marginTop: -20, // -50% wysokości wskaźnika, aby wyśrodkować względem ikony
    left: '50%',
    marginLeft: '-33.33%', // -50% szerokości wskaźnika
  },
  indicatorBlur: {
    width: '100%',
    height: '100%',
  },
  fab: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: 'hidden',
    flexShrink: 0,
    shadowColor: colors.shadowColorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
});
