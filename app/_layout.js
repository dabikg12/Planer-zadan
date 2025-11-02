// Warunkowy import gesture-handler tylko dla mobilnych platform
import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, Animated } from 'react-native';
if (Platform.OS !== 'web') {
  require("react-native-gesture-handler");
}

let GestureHandlerRootView = View;
if (Platform.OS !== 'web') {
  GestureHandlerRootView = require("react-native-gesture-handler").GestureHandlerRootView;
}

// Warunkowy import SafeAreaProvider dla web
let SafeAreaProvider;
if (Platform.OS !== 'web') {
  const SafeAreaContext = require("react-native-safe-area-context");
  SafeAreaProvider = SafeAreaContext.SafeAreaProvider;
  // Sprawdź czy to faktycznie komponent (funkcja lub klasa)
  if (typeof SafeAreaProvider !== 'function') {
    SafeAreaProvider = View;
  }
} else {
  // Na webie używamy View jako wrapper (SafeAreaProvider nie działa dobrze na web)
  SafeAreaProvider = ({ children, ...props }) => <View style={{ flex: 1 }} {...props}>{children}</View>;
}

import '../global.css';
import TabNavigator from '../components/TabNavigator';
import AppLoader from '../components/AppLoader';
import WelcomeModal from '../components/WelcomeModal';
import useAppStore from '../store/useAppStore';
import { createFadeInPulseAnimation } from '../utils/commonAnimations';
import { colors } from '../utils/colors';

export default function RootLayout() {
  const { isAppInitialized, isAppInitializing, initializeApp, shouldShowWelcomeModal } = useAppStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [isLoaderExiting, setIsLoaderExiting] = useState(false);
  const loaderStartTimeRef = React.useRef(Date.now());
  const minLoaderDuration = 1500; // Minimum 1.5 sekundy (wliczając animacje)
  const exitAnimationDuration = 400; // Czas animacji zamykania
  
  // Animacja pulsowania dla TabNavigator przy pierwszym pojawieniu
  const tabNavigatorScale = useRef(new Animated.Value(0.95)).current;
  const tabNavigatorOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  // Ustaw wartości początkowe dla animacji
  useEffect(() => {
    tabNavigatorOpacity.setValue(0);
    tabNavigatorScale.setValue(0.95);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rozpocznij inicjalizację aplikacji przy starcie
  useEffect(() => {
    loaderStartTimeRef.current = Date.now();
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initializeApp jest stabilną funkcją ze store

  // Rozpocznij animację zamykania loadera po zakończeniu inicjalizacji
  // Zapewnij, że loader trwa minimum 4 sekundy (wliczając animacje)
  useEffect(() => {
    if (isAppInitialized && !isAppInitializing && showLoader && !isLoaderExiting) {
      const elapsed = Date.now() - loaderStartTimeRef.current;
      const remainingTime = minLoaderDuration - elapsed - exitAnimationDuration;
      
      // Jeśli minęło mniej niż wymagany czas, poczekaj
      if (remainingTime > 0) {
        const timer = setTimeout(() => {
          setIsLoaderExiting(true);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      } else {
        // Jeśli minęło już wystarczająco czasu, rozpocznij animację od razu
        setIsLoaderExiting(true);
      }
    }
  }, [isAppInitialized, isAppInitializing, showLoader, isLoaderExiting, exitAnimationDuration]);

  // Animacja pojawienia się TabNavigator (pulsowanie)
  useEffect(() => {
    if (!showLoader && !hasAnimated.current) {
      hasAnimated.current = true;
      
      // Animacja pulsowania: fade-in + scale z lekkim efektem pulsowania
      const animation = createFadeInPulseAnimation(
        tabNavigatorOpacity,
        tabNavigatorScale
      );
      animation.start();
    }
  }, [showLoader, tabNavigatorScale, tabNavigatorOpacity]);

  // Obsługa zakończenia animacji zamykania loadera
  const handleLoaderExitComplete = React.useCallback(() => {
    setShowLoader(false);
    // Pokaż modal powitalny zaraz po zakończeniu animacji loadera
    if (shouldShowWelcomeModal) {
      setShowWelcomeModal(true);
    }
  }, [shouldShowWelcomeModal]);

  const handleWelcomeComplete = React.useCallback(() => {
    setShowWelcomeModal(false);
    // Oznacz w store że modal został zamknięty
    useAppStore.setState({ shouldShowWelcomeModal: false });
  }, []);

  if (showLoader) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background, pointerEvents: 'auto' }}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
          <AppLoader isExiting={isLoaderExiting} onExitComplete={handleLoaderExitComplete} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background, pointerEvents: 'auto' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            opacity: tabNavigatorOpacity,
          }}
        >
          <TabNavigator />
        </Animated.View>
        <WelcomeModal
          visible={showWelcomeModal}
          onComplete={handleWelcomeComplete}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

