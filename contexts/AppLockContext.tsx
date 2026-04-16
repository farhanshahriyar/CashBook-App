import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
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
      fallbackLabel: 'Enter PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
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
