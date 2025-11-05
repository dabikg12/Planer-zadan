import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from './CustomTabBar';
import { colors } from '../utils/colors';

// Konfiguracja react-native-screens dla natywnych animacji
let enableScreens;
try {
  enableScreens = require('react-native-screens').enableScreens;
  if (enableScreens) {
    enableScreens(true);
  }
} catch (e) {
  // Fallback jeśli react-native-screens nie jest dostępny
}

export default function TabNavigator() {
  useEffect(() => {
    // Włącz natywne ekrany przy montowaniu
    if (enableScreens) {
      enableScreens(true);
    }
  }, []);

  // Konfiguracja animacji przejścia - użyjemy opcji react-native-screens
  const screenOptions = {
    headerShown: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
    sceneStyle: {
      backgroundColor: colors.background,
    },
    // Włącz animacje przejścia
    animationEnabled: true,
    // Dla iOS: horizontal slide (slide z prawej)
    // Dla Android: vertical slide (slide z dołu)
    animationTypeForReplace: Platform.OS === 'ios' ? 'push' : 'pop',
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={screenOptions}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Strona główna',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Główna',
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Zadania',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          tabBarLabel: 'Zadania',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalendarz',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          tabBarLabel: 'Kalendarz',
        }}
      />
    </Tabs>
  );
}

