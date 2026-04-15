import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Expo Go detection ────────────────────────────────────────────────────────
// expo-notifications runs DevicePushTokenAutoRegistration.fx.js as a module-level
// side effect the moment it is imported. In Expo Go SDK 53+ this crashes with:
//   "Android Push notifications functionality was removed from Expo Go"
// Using a conditional require means the module (and ALL its side effects) never
// loads when the app is running inside Expo Go. Notifications will be silently
// disabled in Expo Go and fully functional in development builds / production.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');
let N: NotificationsModule | null = null;

if (!IS_EXPO_GO && Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  N = require('expo-notifications') as NotificationsModule;

  // Show the alert, sound, and badge when a notification arrives while the app is open
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Storage keys ────────────────────────────────────────────────────────────
const DAILY_NOTIF_ID_KEY  = '@cashbook/daily_reminder_id';
const WEEKLY_NOTIF_ID_KEY = '@cashbook/weekly_report_id';
const BUDGET_ALERT_LAST_KEY = '@cashbook/budget_alert_last_sent';

// ─── Constants ───────────────────────────────────────────────────────────────
/** 24-hour cooldown between budget alert notifications (in ms) */
const BUDGET_ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// ─── Permission ───────────────────────────────────────────────────────────────
/**
 * Requests notification permission from the OS.
 * Returns true if permission was granted (always false in Expo Go).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Returns true if notification permission is currently granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  return status === 'granted';
}

// ─── Daily Reminder ───────────────────────────────────────────────────────────
/**
 * Schedules a repeating daily notification at the specified hour and minute.
 * Cancels any previously scheduled daily reminder first.
 *
 * @param hour   Hour in 24h format (default 20 → 8 PM)
 * @param minute Minute (default 0)
 */
export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
  if (!N) return;
  await cancelDailyReminder();

  const id = await N.scheduleNotificationAsync({
    content: {
      title: '📒 CashBook Reminder',
      body: "Don't forget to log today's transactions! 💰",
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(DAILY_NOTIF_ID_KEY, id);
}

/**
 * Cancels the previously scheduled daily reminder.
 */
export async function cancelDailyReminder(): Promise<void> {
  if (!N) return;
  const id = await AsyncStorage.getItem(DAILY_NOTIF_ID_KEY);
  if (id) {
    await N.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(DAILY_NOTIF_ID_KEY);
  }
}

// ─── Weekly Report ────────────────────────────────────────────────────────────
/**
 * Schedules a repeating weekly notification (default: Monday 9 AM).
 * Cancels any previously scheduled weekly report first.
 *
 * @param weekday Weekday index (1=Mon … 7=Sun, default 1)
 * @param hour    Hour in 24h format (default 9)
 * @param minute  Minute (default 0)
 */
export async function scheduleWeeklyReport(weekday = 1, hour = 9, minute = 0): Promise<void> {
  if (!N) return;
  await cancelWeeklyReport();

  const id = await N.scheduleNotificationAsync({
    content: {
      title: '📊 Weekly Financial Summary',
      body: 'Your weekly financial summary is ready! Tap to review your spending. 📈',
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(WEEKLY_NOTIF_ID_KEY, id);
}

/**
 * Cancels the previously scheduled weekly report.
 */
export async function cancelWeeklyReport(): Promise<void> {
  if (!N) return;
  const id = await AsyncStorage.getItem(WEEKLY_NOTIF_ID_KEY);
  if (id) {
    await N.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(WEEKLY_NOTIF_ID_KEY);
  }
}

// ─── Instant Notifications ───────────────────────────────────────────────────
/**
 * Fires an immediate local notification when a goal hits a milestone.
 *
 * @param goalTitle The name of the saving goal
 * @param percent   50 or 100
 */
export async function sendGoalMilestoneNotification(
  goalTitle: string,
  percent: 50 | 100,
): Promise<void> {
  if (!N) return;
  const is100 = percent === 100;
  await N.scheduleNotificationAsync({
    content: {
      title: is100 ? '🏆 Goal Achieved!' : '🎉 Halfway There!',
      body: is100
        ? `Amazing! You've reached your "${goalTitle}" goal! Time to celebrate! 🎊`
        : `You're 50% of the way to your "${goalTitle}" goal! Keep it up! 💪`,
      sound: true,
    },
    trigger: null, // fire immediately
  });
}

/**
 * Fires an immediate local notification when monthly expenses exceed a threshold.
 * Throttled to at most once every 24 hours to prevent notification spam.
 *
 * @param percent The percentage of income that has been spent (e.g. 80)
 */
export async function sendBudgetAlertNotification(percent: number): Promise<void> {
  if (!N) return;

  // ── Throttle: skip if already fired within the last 24 hours ─────────────
  const lastSentStr = await AsyncStorage.getItem(BUDGET_ALERT_LAST_KEY);
  if (lastSentStr) {
    const lastSent = parseInt(lastSentStr, 10);
    if (!isNaN(lastSent) && Date.now() - lastSent < BUDGET_ALERT_COOLDOWN_MS) {
      return; // still within cooldown window — skip silently
    }
  }

  await N.scheduleNotificationAsync({
    content: {
      title: '⚠️ Budget Alert',
      body: `You've used ${percent.toFixed(0)}% of your monthly income. Consider slowing down on expenses!`,
      sound: true,
    },
    trigger: null, // fire immediately
  });

  // Stamp the current time so the next crossing within 24h is suppressed
  await AsyncStorage.setItem(BUDGET_ALERT_LAST_KEY, String(Date.now()));
}
