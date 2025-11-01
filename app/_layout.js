import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import '../global.css';
import { Tabs } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

function TabNavigator() {
  const insets = useSafeAreaInsets();

  // Color palette - brown/beige theme
  const colors = {
    primary: '#8B6F47',
    inactive: '#A0826D',
    background: '#FEFCFB',
    border: '#E8DDD1',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 49 + (insets.bottom || 0),
          paddingBottom: insets.bottom || 0,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(254, 252, 251, 0.95)' : colors.background,
          elevation: 0,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Strona glowna',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            tabBarLabel: 'Glowna',
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
        <Tabs.Screen
          name="components/TaskForm"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="components/TaskItem"
          options={{
            href: null, // Hide from tab bar
          }}
        />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TabNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
  );
}

