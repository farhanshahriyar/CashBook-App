import { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceProvider } from '../contexts/FinanceContext';
import { AppLockProvider, useAppLock } from '../contexts/AppLockContext';
import { UserProvider } from '../contexts/UserContext';
import { LockScreen } from '../components/ui/LockScreen';
import { COLORS } from '../lib/constants';
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
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding the splash screen so we can wait for fonts
SplashScreen.preventAutoHideAsync();

// Font weight to Inter family mapping
const INTER_WEIGHT_MAP: Record<string, string> = {
  '300': 'Inter-Light',
  '400': 'Inter-Regular',
  'normal': 'Inter-Regular',
  '500': 'Inter-Medium',
  '600': 'Inter-SemiBold',
  '700': 'Inter-Bold',
  'bold': 'Inter-Bold',
  '800': 'Inter-ExtraBold',
  '900': 'Inter-Black',
};

// Override default Text rendering to use Inter font globally
function setDefaultFont() {
  const oldTextRender = (Text as any).render;
  if (oldTextRender) {
    (Text as any).render = function (...args: any[]) {
      const origin = oldTextRender.call(this, ...args);
      const flatStyle = origin.props?.style;
      const weight = flatStyle?.fontWeight || '400';
      const fontFamily = INTER_WEIGHT_MAP[weight] || 'Inter-Regular';

      return {
        ...origin,
        props: {
          ...origin.props,
          style: [{ fontFamily }, flatStyle],
        },
      };
    };
  }

  // Also apply to TextInput
  const oldInputRender = (TextInput as any).render;
  if (oldInputRender) {
    (TextInput as any).render = function (...args: any[]) {
      const origin = oldInputRender.call(this, ...args);
      const flatStyle = origin.props?.style;
      const weight = flatStyle?.fontWeight || '400';
      const fontFamily = INTER_WEIGHT_MAP[weight] || 'Inter-Regular';

      return {
        ...origin,
        props: {
          ...origin.props,
          style: [{ fontFamily }, flatStyle],
        },
      };
    };
  }
}

function AppContent() {
  const { isLocked } = useAppLock();
  const segments = useSegments();
  
  // Don't show lock screen when on the splash screen (index) or onboarding
  const isSplashRoot = segments.length === 0 || segments[0] === 'index';
  const isOnboarding = segments[0] === 'onboarding';
  
  const showLock = isLocked && !isSplashRoot && !isOnboarding;

  return (
    <>
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
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setDefaultFont();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppLockProvider>
        <UserProvider>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </UserProvider>
      </AppLockProvider>
    </SafeAreaProvider>
  );
}

