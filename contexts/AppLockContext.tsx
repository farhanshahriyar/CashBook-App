import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const LOCK_ENABLED_KEY = 'cashbook_biometric_enabled';

type BiometricTypeString = 'fingerprint' | 'face' | 'unknown' | 'none';

interface AppLockState {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  biometricType: BiometricTypeString;
  isEnrolled: boolean;
  isReady: boolean;
}

interface AppLockContextType extends AppLockState {
  authenticate: () => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

function authTypeToString(type: LocalAuthentication.AuthenticationType): BiometricTypeString {
  if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'face';
  if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'fingerprint';
  if (type === LocalAuthentication.AuthenticationType.IRIS) return 'fingerprint';
  return 'none';
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppLockState>({
    isLocked: false, // Start unlocked — we'll lock if needed after checking
    isBiometricEnabled: false,
    biometricType: 'none',
    isEnrolled: false,
    isReady: false,
  });

  const authenticate = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock CashBook',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow PIN/passcode fallback to prevent permanent lockout
    });
    if (result.success) {
      setState((prev) => ({ ...prev, isLocked: false }));
    }
    return result.success;
  }, []);

  useEffect(() => {
    (async () => {
      // 1. Check hardware & enrollment
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = enrolled && types.length > 0;
      const biometricType = isEnrolled ? authTypeToString(types[0]) : 'none';

      // 2. Check if user previously enabled biometric lock
      const stored = await AsyncStorage.getItem(LOCK_ENABLED_KEY);
      const biometricEnabled = stored === 'true';

      if (biometricEnabled && isEnrolled) {
        // Lock the app and prompt for auth
        setState({
          isLocked: true,
          isBiometricEnabled: true,
          biometricType,
          isEnrolled,
          isReady: true,
        });
        // Auto-prompt authentication
        const result = await authenticate();
        if (!result) {
          // Stay locked — user can tap "Unlock" button later
          setState((prev) => ({ ...prev, isLocked: true }));
        }
      } else if (biometricEnabled && !isEnrolled) {
        // Edge case: user had biometric enabled but removed enrollment from device settings.
        // Auto-disable the lock and let them in — they can re-enable after re-enrolling.
        await AsyncStorage.setItem(LOCK_ENABLED_KEY, 'false');
        setState({
          isLocked: false,
          isBiometricEnabled: false,
          biometricType,
          isEnrolled,
          isReady: true,
        });
      } else {
        // No lock needed
        setState({
          isLocked: false,
          isBiometricEnabled: biometricEnabled,
          biometricType,
          isEnrolled,
          isReady: true,
        });
      }
    })();
  }, [authenticate]);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Re-check enrollment at toggle time — user may have removed biometrics
      // from device settings while the app was open
      const currentlyEnrolled = await LocalAuthentication.isEnrolledAsync();
      const currentTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const nowEnrolled = currentlyEnrolled && currentTypes.length > 0;

      // Update state with fresh enrollment info
      setState((prev) => ({
        ...prev,
        isEnrolled: nowEnrolled,
        biometricType: nowEnrolled ? authTypeToString(currentTypes[0]) : 'none',
      }));

      if (!nowEnrolled) {
        Alert.alert(
          'Biometrics Not Set Up',
          'Please enroll your fingerprints or face in your device settings to enable this feature.'
        );
        return;
      }
    }

    await AsyncStorage.setItem(LOCK_ENABLED_KEY, String(enabled));
    setState((prev) => ({ ...prev, isBiometricEnabled: enabled }));
    if (!enabled) {
      setState((prev) => ({ ...prev, isLocked: false }));
    }
  }, []);

  return (
    <AppLockContext.Provider
      value={{
        ...state,
        authenticate,
        setBiometricEnabled,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock(): AppLockContextType {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within AppLockProvider');
  }
  return context;
}
