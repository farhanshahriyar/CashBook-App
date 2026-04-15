import { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet as RNStyleSheet } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceProvider } from '../contexts/FinanceContext';
import { AppLockProvider, useAppLock } from '../contexts/AppLockContext';
import { UserProvider } from '../contexts/UserContext';
import { FontProvider, useFont, FONT_WEIGHT_MAPS } from '../contexts/FontContext';
import { LockScreen } from '../components/ui/LockScreen';
import { COLORS } from '../lib/constants';

// Inter
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';

// Roboto (subdirectory imports to avoid barrel pulling in broken italic ttf refs)
import { Roboto_300Light } from '@expo-google-fonts/roboto/300Light';
import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular';
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import { Roboto_900Black } from '@expo-google-fonts/roboto/900Black';

// Open Sans
import { OpenSans_300Light } from '@expo-google-fonts/open-sans/300Light';
import { OpenSans_400Regular } from '@expo-google-fonts/open-sans/400Regular';
import { OpenSans_500Medium } from '@expo-google-fonts/open-sans/500Medium';
import { OpenSans_600SemiBold } from '@expo-google-fonts/open-sans/600SemiBold';
import { OpenSans_700Bold } from '@expo-google-fonts/open-sans/700Bold';
import { OpenSans_800ExtraBold } from '@expo-google-fonts/open-sans/800ExtraBold';

// Montserrat
import { Montserrat_300Light } from '@expo-google-fonts/montserrat/300Light';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';

// Poppins
import { Poppins_300Light } from '@expo-google-fonts/poppins/300Light';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { Poppins_900Black } from '@expo-google-fonts/poppins/900Black';

// Lato
import { Lato_300Light } from '@expo-google-fonts/lato/300Light';
import { Lato_400Regular } from '@expo-google-fonts/lato/400Regular';
import { Lato_700Bold } from '@expo-google-fonts/lato/700Bold';
import { Lato_900Black } from '@expo-google-fonts/lato/900Black';

// Raleway
import { Raleway_300Light } from '@expo-google-fonts/raleway/300Light';
import { Raleway_400Regular } from '@expo-google-fonts/raleway/400Regular';
import { Raleway_500Medium } from '@expo-google-fonts/raleway/500Medium';
import { Raleway_600SemiBold } from '@expo-google-fonts/raleway/600SemiBold';
import { Raleway_700Bold } from '@expo-google-fonts/raleway/700Bold';
import { Raleway_800ExtraBold } from '@expo-google-fonts/raleway/800ExtraBold';
import { Raleway_900Black } from '@expo-google-fonts/raleway/900Black';

import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding the splash screen so we can wait for fonts
SplashScreen.preventAutoHideAsync();

// Override default Text/TextInput rendering to use the selected font
// Store original renderers ONCE at module level
const originalTextRender = (Text as any).render;
const originalInputRender = (TextInput as any).render;

// This will hold the current weight map
let currentWeightMap: Record<string, string> = FONT_WEIGHT_MAPS['Inter']; // default

// Patched render function for Text
const patchedTextRender = function (...args: any[]) {
  const origin = originalTextRender.call(this, ...args);
  const rawStyle = origin.props?.style;
  const flat = RNStyleSheet.flatten(rawStyle) || {};
  const weight = flat.fontWeight || '400';
  const resolvedFont = currentWeightMap[weight] || currentWeightMap['400'];

  return {
    ...origin,
    props: {
      ...origin.props,
      style: [{ fontFamily: resolvedFont }, rawStyle],
    },
  };
};

// Patched render function for TextInput
const patchedInputRender = function (...args: any[]) {
  const origin = originalInputRender.call(this, ...args);
  const rawStyle = origin.props?.style;
  const flat = RNStyleSheet.flatten(rawStyle) || {};
  const weight = flat.fontWeight || '400';
  const resolvedFont = currentWeightMap[weight] || currentWeightMap['400'];

  return {
    ...origin,
    props: {
      ...origin.props,
      style: [{ fontFamily: resolvedFont }, rawStyle],
    },
  };
};

// Apply the patches once
(Text as any).render = patchedTextRender;
(TextInput as any).render = patchedInputRender;

function applyGlobalFont(weightMap: Record<string, string>) {
  currentWeightMap = weightMap;
}

function AppContent() {
  const { isLocked } = useAppLock();
  const { selectedFont } = useFont();
  const segments = useSegments();

  // Update weight map synchronously during render so the key-forced remount
  // picks up the new font immediately (useEffect runs AFTER render, too late)
  const weightMap = FONT_WEIGHT_MAPS[selectedFont];
  if (weightMap && currentWeightMap !== weightMap) {
    currentWeightMap = weightMap;
  }

  // Don't show lock screen when on the splash screen (index) or onboarding
  const isSplashRoot = segments.length === 0 || segments[0] === 'index';
  const isOnboarding = segments[0] === 'onboarding';

  const showLock = isLocked && !isSplashRoot && !isOnboarding;

  // key={selectedFont} forces React to fully unmount + remount the tree
  // so every Text/TextInput picks up the new font immediately
  return (
    <View key={selectedFont} style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {showLock && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <LockScreen />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Inter
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
    // Roboto
    'Roboto-Light': Roboto_300Light,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto-Black': Roboto_900Black,
    // Open Sans
    'OpenSans-Light': OpenSans_300Light,
    'OpenSans-Regular': OpenSans_400Regular,
    'OpenSans-Medium': OpenSans_500Medium,
    'OpenSans-SemiBold': OpenSans_600SemiBold,
    'OpenSans-Bold': OpenSans_700Bold,
    'OpenSans-ExtraBold': OpenSans_800ExtraBold,
    // Montserrat
    'Montserrat-Light': Montserrat_300Light,
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat-ExtraBold': Montserrat_800ExtraBold,
    'Montserrat-Black': Montserrat_900Black,
    // Poppins
    'Poppins-Light': Poppins_300Light,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
    'Poppins-Black': Poppins_900Black,
    // Lato
    'Lato-Light': Lato_300Light,
    'Lato-Regular': Lato_400Regular,
    'Lato-Bold': Lato_700Bold,
    'Lato-Black': Lato_900Black,
    // Raleway
    'Raleway-Light': Raleway_300Light,
    'Raleway-Regular': Raleway_400Regular,
    'Raleway-Medium': Raleway_500Medium,
    'Raleway-SemiBold': Raleway_600SemiBold,
    'Raleway-Bold': Raleway_700Bold,
    'Raleway-ExtraBold': Raleway_800ExtraBold,
    'Raleway-Black': Raleway_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppLockProvider>
        <FontProvider>
          <UserProvider>
            <FinanceProvider>
              <AppContent />
            </FinanceProvider>
          </UserProvider>
        </FontProvider>
      </AppLockProvider>
    </SafeAreaProvider>
  );
}
