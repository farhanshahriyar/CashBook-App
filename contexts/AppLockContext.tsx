import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const LOCK_ENABLED_KEY = 'cashbook_biometric_enabled';

interface AppLockState {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  biometricType: LocalAuthentication.AuthenticationType;
  isEnrolled: boolean;
}

interface AppLockContextType extends AppLockState {
  authenticate: () => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppLockState>({
    isLocked: true,
    isBiometricEnabled: false,
    biometricType: LocalAuthentication.AuthenticationType.NONE,
    isEnrolled: false,
  });

  const checkEnrollment = useCallback(async () => {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = enrolled && types.length > 0;
    const biometricType = isEnrolled && types.length > 0 ? types[0] : LocalAuthentication.AuthenticationType.NONE;
    setState((prev) => ({
      ...prev,
      isEnrolled,
      biometricType,
      isLocked: false,
    }));
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LOCK_ENABLED_KEY);
      const enabled = stored === 'true';
      await checkEnrollment();
      if (enabled) {
        const result = await authenticate();
        if (!result) {
          setState((prev) => ({ ...prev, isLocked: true }));
        }
      }
    })();
  }, [checkEnrollment]);

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
