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
    isLocked: true,
    isBiometricEnabled: false,
    biometricType: 'none',
    isEnrolled: false,
  });

  const checkEnrollment = useCallback(async () => {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = enrolled && types.length > 0;
    const biometricType = isEnrolled ? authTypeToString(types[0]) : 'none';
    setState((prev) => ({
      ...prev,
      isEnrolled,
      biometricType,
      isLocked: false,
    }));
  }, []);

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
      const stored = await AsyncStorage.getItem(LOCK_ENABLED_KEY);
      const enabled = stored === 'true';
      await checkEnrollment();
      if (enabled && state.isEnrolled) {
        const result = await authenticate();
        if (!result) {
          setState((prev) => ({ ...prev, isLocked: true }));
        }
      }
    })();
  }, [checkEnrollment, authenticate]);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(LOCK_ENABLED_KEY, String(enabled));
    setState((prev) => ({ ...prev, isBiometricEnabled: enabled }));
    if (enabled && state.isEnrolled) {
      const result = await authenticate();
      if (!result) {
        setState((prev) => ({ ...prev, isLocked: true }));
      }
    } else if (!enabled) {
      setState((prev) => ({ ...prev, isLocked: false }));
    }
  }, [authenticate, state.isEnrolled]);

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
