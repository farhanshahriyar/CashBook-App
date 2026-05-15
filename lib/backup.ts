import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Goal,
  getAllTransactions,
  getAllGoals,
  bulkInsertTransactions,
  bulkInsertGoals,
  clearAllData,
} from './db/queries';
import type { UserProfile } from '../contexts/UserContext';

// ─── Schema ─────────────────────────────────────────────────────────────────

const BACKUP_VERSION = 1;

export interface BackupPreferences {
  userProfile: UserProfile | null;
  onboardingCompleted: boolean;
  biometricEnabled: boolean;
  selectedFont: string;
  pushEnabled: boolean;
  weeklyEnabled: boolean;
}

export interface CashBookBackup {
  version: number;
  exportedAt: string;
  data: {
    transactions: Transaction[];
    goals: Goal[];
    preferences: BackupPreferences;
  };
}

// ─── AsyncStorage Keys ──────────────────────────────────────────────────────

const AS_KEYS = {
  profile: '@cashbook_user_profile',
  onboarding: '@cashbook_onboarding_completed',
  biometric: 'cashbook_biometric_enabled',
  font: '@cashbook_selected_font',
  push: '@cashbook/notif_push_enabled',
  weekly: '@cashbook/notif_weekly_enabled',
} as const;

// ─── Export ─────────────────────────────────────────────────────────────────

/**
 * Reads all local data and writes a `.json` backup file to the cache directory.
 * Returns the file URI ready for sharing.
 */
export async function exportBackup(): Promise<string> {
  // 1. Read SQLite tables
  const [transactions, goals] = await Promise.all([
    getAllTransactions(),
    getAllGoals(),
  ]);

  // 2. Read AsyncStorage preferences
  const [profileStr, onboarding, biometric, font, push, weekly] =
    await Promise.all([
      AsyncStorage.getItem(AS_KEYS.profile),
      AsyncStorage.getItem(AS_KEYS.onboarding),
      AsyncStorage.getItem(AS_KEYS.biometric),
      AsyncStorage.getItem(AS_KEYS.font),
      AsyncStorage.getItem(AS_KEYS.push),
      AsyncStorage.getItem(AS_KEYS.weekly),
    ]);

  const preferences: BackupPreferences = {
    userProfile: profileStr ? JSON.parse(profileStr) : null,
    onboardingCompleted: onboarding === 'true',
    biometricEnabled: biometric === 'true',
    selectedFont: font || 'Inter',
    pushEnabled: push === 'true',
    weeklyEnabled: weekly === 'true',
  };

  // 3. Build the backup payload
  const backup: CashBookBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      goals,
      preferences,
    },
  };

  // 4. Write to cache directory using the new File API
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `cashbook_backup_${timestamp}.json`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));

  return file.uri;
}

// ─── Read Import File ───────────────────────────────────────────────────────

/**
 * Reads a JSON backup file from a given URI and returns the parsed content.
 */
export async function readBackupFile(fileUri: string): Promise<unknown> {
  const file = new File(fileUri);
  const content = await file.text();
  return JSON.parse(content);
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validates raw parsed JSON against the CashBookBackup schema.
 * Throws a human-readable error message on failure.
 */
export function validateBackup(json: unknown): CashBookBackup {
  if (!json || typeof json !== 'object') {
    throw new Error('The selected file does not contain valid backup data.');
  }

  const obj = json as Record<string, unknown>;

  // Version check
  if (typeof obj.version !== 'number' || obj.version < 1) {
    throw new Error('Unrecognised backup version. The file may be corrupted.');
  }

  if (obj.version > BACKUP_VERSION) {
    throw new Error(
      `This backup was created by a newer version of CashBook (v${obj.version}). Please update the app first.`
    );
  }

  if (typeof obj.exportedAt !== 'string') {
    throw new Error('Missing export timestamp. The file may be corrupted.');
  }

  // Data envelope
  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('Missing data section. The file may be corrupted.');
  }

  const data = obj.data as Record<string, unknown>;

  // Transactions
  if (!Array.isArray(data.transactions)) {
    throw new Error('Missing or invalid transactions data.');
  }
  for (const tx of data.transactions) {
    if (
      typeof tx !== 'object' ||
      !tx ||
      typeof (tx as Transaction).id !== 'string' ||
      typeof (tx as Transaction).type !== 'string' ||
      !['income', 'expense'].includes((tx as Transaction).type) ||
      typeof (tx as Transaction).amount !== 'number' ||
      typeof (tx as Transaction).category !== 'string' ||
      typeof (tx as Transaction).date !== 'string'
    ) {
      throw new Error(
        'One or more transactions in the backup file are invalid.'
      );
    }
  }

  // Goals
  if (!Array.isArray(data.goals)) {
    throw new Error('Missing or invalid goals data.');
  }
  for (const g of data.goals) {
    if (
      typeof g !== 'object' ||
      !g ||
      typeof (g as Goal).id !== 'string' ||
      typeof (g as Goal).title !== 'string' ||
      typeof (g as Goal).targetAmount !== 'number' ||
      typeof (g as Goal).savedAmount !== 'number'
    ) {
      throw new Error('One or more goals in the backup file are invalid.');
    }
  }

  // Preferences
  if (!data.preferences || typeof data.preferences !== 'object') {
    throw new Error('Missing preferences data.');
  }

  return json as CashBookBackup;
}

// ─── Import ─────────────────────────────────────────────────────────────────

/**
 * Replaces all local data with the contents of a validated backup.
 */
export async function importBackup(backup: CashBookBackup): Promise<void> {
  const { transactions, goals, preferences } = backup.data;

  // 1. Clear existing SQLite data
  await clearAllData();

  // 2. Bulk-insert backed-up rows
  await bulkInsertTransactions(transactions);
  await bulkInsertGoals(goals);

  // 3. Restore AsyncStorage preferences
  const writes: [string, string][] = [];

  if (preferences.userProfile) {
    writes.push([AS_KEYS.profile, JSON.stringify(preferences.userProfile)]);
  } else {
    await AsyncStorage.removeItem(AS_KEYS.profile);
  }

  writes.push([
    AS_KEYS.onboarding,
    String(preferences.onboardingCompleted),
  ]);
  writes.push([AS_KEYS.biometric, String(preferences.biometricEnabled)]);
  writes.push([AS_KEYS.font, preferences.selectedFont || 'Inter']);
  writes.push([AS_KEYS.push, String(preferences.pushEnabled)]);
  writes.push([AS_KEYS.weekly, String(preferences.weeklyEnabled)]);

  await AsyncStorage.multiSet(writes);
}
