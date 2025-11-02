// Warunkowy import gesture-handler tylko dla mobilnych platform
import React from 'react';
import { Platform, View } from 'react-native';
if (Platform.OS !== 'web') {
  require("react-native-gesture-handler");
}

let GestureHandlerRootView = View;
if (Platform.OS !== 'web') {
  try {
    GestureHandlerRootView = require("react-native-gesture-handler").GestureHandlerRootView;
  } catch (e) {
    // Fallback do View jeśli nie można załadować
  }
}

// Warunkowy import SafeAreaProvider dla web
let SafeAreaProvider;
if (Platform.OS !== 'web') {
  try {
    const SafeAreaContext = require("react-native-safe-area-context");
    SafeAreaProvider = SafeAreaContext.SafeAreaProvider;
    // Sprawdź czy to faktycznie komponent (funkcja lub klasa)
    if (typeof SafeAreaProvider !== 'function') {
      SafeAreaProvider = View;
    }
  } catch (e) {
    // Fallback do View jeśli nie można załadować
    SafeAreaProvider = View;
  }
} else {
  // Na webie używamy View jako wrapper (SafeAreaProvider nie działa dobrze na web)
  SafeAreaProvider = ({ children, ...props }) => <View style={{ flex: 1 }} {...props}>{children}</View>;
}

import '../global.css';
import { Tabs } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from './components/CustomTabBar';

const queryClient = new QueryClient();

function TabNavigator() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, pointerEvents: 'auto' }}>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TabNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
  );
}

