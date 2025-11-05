import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { 
  useAnimatedStyle, 
  useSharedValue, 
  Animated,
  AnimatedView,
} from '../utils/animationHelpers';
import { 
  animateIconPress,
} from '../utils/commonAnimations';
import { colors } from '../utils/colors';
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
    animateIconPress(iconScale, 0.7, { duration: 300 });
    onPress();
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
      {isFocused && (
        <View style={styles.activeTabIndicator}>
          <BlurView
            intensity={20}
            tint="light"
            style={styles.indicatorBlur}
          />
        </View>
      )}
      <View style={styles.iconContainer}>
        <AnimatedView style={iconAnimatedStyle}>
          <Ionicons
            name={iconName}
            size={22}
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
        <Ionicons name="add" size={22} color={colors.white} />
      </View>
    </Pressable>
  );
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { setCurrentTabIndex } = useAppStore();
  const prevActiveTab = useRef(state.index);

  // Wykryj zmianę zakładki i aktualizuj store
  useEffect(() => {
    if (prevActiveTab.current !== state.index) {
      setCurrentTabIndex(state.index);
      prevActiveTab.current = state.index;
    }
  }, [state.index, setCurrentTabIndex]);

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

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12) }]}>
      <View style={styles.menuWrapper}>
        {/* Menu */}
        <View style={styles.menuWrapperInner}>
          {/* Nakładka obramowania */}
          <View style={styles.borderOverlay} />
          <View style={styles.menuContainer}>
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
          </View>
        </View>

        {/* Floating Action Button */}
        <View style={styles.fabWrapper}>
          {/* Nakładka obramowania dla FAB */}
          <View style={styles.fabBorderOverlay} />
          <AddTaskButton onPress={handleAddTask} />
        </View>
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
    gap: 24,
    width: '98%',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  menuWrapperInner: {
    flex: 1,
    position: 'relative',
  },
  borderOverlay: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    pointerEvents: 'none',
    zIndex: 1,
  },
  menuContainer: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 28,
    maxWidth: '33.33%',
    position: 'relative',
    overflow: 'visible',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: 22,
  },
  icon: {
    zIndex: 1,
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: '-33.33%',
    width: '66.67%',
    borderRadius: 50,
    backgroundColor: 'rgba(249, 249, 249, 0.16)',
    overflow: 'hidden',
  },
  indicatorBlur: {
    width: '100%',
    height: '100%',
  },
  fabWrapper: {
    width: 48,
    height: 48,
    position: 'relative',
    flexShrink: 0,
  },
  fabBorderOverlay: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    pointerEvents: 'none',
    zIndex: 1,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    flexShrink: 0,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
  },
});
