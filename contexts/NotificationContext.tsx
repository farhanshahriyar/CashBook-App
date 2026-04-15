import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermission,
  hasNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleWeeklyReport,
  cancelWeeklyReport,
} from '../lib/notifications';

// ─── AsyncStorage keys ────────────────────────────────────────────────────────
const PUSH_PREF_KEY = '@cashbook/notif_push_enabled';
const WEEKLY_PREF_KEY = '@cashbook/notif_weekly_enabled';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NotificationContextType {
  /** Whether the OS has granted notification permission */
  hasPermission: boolean;
  /** Whether the daily reminder is enabled */
  pushEnabled: boolean;
  /** Enable/disable the daily reminder (persisted) */
  setPushEnabled: (value: boolean) => Promise<void>;
  /** Whether the weekly report notification is enabled */
  weeklyEnabled: boolean;
  /** Enable/disable the weekly report (persisted) */
  setWeeklyEnabled: (value: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [pushEnabled, _setPushEnabled] = useState(false);
  const [weeklyEnabled, _setWeeklyEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ── Bootstrap: request permission + hydrate persisted prefs ──────────────
  useEffect(() => {
    (async () => {
      // Request permission once on first launch
      const granted = await requestNotificationPermission();
      setHasPermission(granted);

      // Load persisted preferences
      const [pushPref, weeklyPref] = await Promise.all([
        AsyncStorage.getItem(PUSH_PREF_KEY),
        AsyncStorage.getItem(WEEKLY_PREF_KEY),
      ]);

      const pushVal = pushPref === 'true';
      const weeklyVal = weeklyPref === 'true';

      _setPushEnabled(pushVal);
      _setWeeklyEnabled(weeklyVal);

      // Re-schedule if they were on (in case of app reinstall or permission re-grant)
      if (granted && pushVal) {
        await scheduleDailyReminder();
      }
      if (granted && weeklyVal) {
        await scheduleWeeklyReport();
      }

      setLoaded(true);
    })();
  }, []);

  // ── Toggle daily reminder ─────────────────────────────────────────────────
  const setPushEnabled = useCallback(async (value: boolean) => {
    // If turning on, make sure we have permission
    if (value) {
      const currentPerm = await hasNotificationPermission();
      if (!currentPerm) {
        const granted = await requestNotificationPermission();
        setHasPermission(granted);
        if (!granted) return; // user denied — bail out silently
      }
      await scheduleDailyReminder();
    } else {
      await cancelDailyReminder();
    }

    _setPushEnabled(value);
    await AsyncStorage.setItem(PUSH_PREF_KEY, String(value));
  }, []);

  // ── Toggle weekly report ──────────────────────────────────────────────────
  const setWeeklyEnabled = useCallback(async (value: boolean) => {
    if (value) {
      const currentPerm = await hasNotificationPermission();
      if (!currentPerm) {
        const granted = await requestNotificationPermission();
        setHasPermission(granted);
        if (!granted) return;
      }
      await scheduleWeeklyReport();
    } else {
      await cancelWeeklyReport();
    }

    _setWeeklyEnabled(value);
    await AsyncStorage.setItem(WEEKLY_PREF_KEY, String(value));
  }, []);

  if (!loaded) return <>{children}</>;

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        pushEnabled,
        setPushEnabled,
        weeklyEnabled,
        setWeeklyEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return ctx;
}
