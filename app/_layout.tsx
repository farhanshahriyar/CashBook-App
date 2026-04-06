import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceProvider } from '../contexts/FinanceContext';
import { AppLockProvider } from '../contexts/AppLockContext';
import { COLORS } from '../lib/constants';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppLockProvider>
        <FinanceProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </FinanceProvider>
      </AppLockProvider>
    </SafeAreaProvider>
  );
}
