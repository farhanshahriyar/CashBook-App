import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = SQLite.openDatabaseAsync('cashbook.db', {
    enableChangeListener: true,
  }).then(async (database) => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        note TEXT DEFAULT '',
        date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        savedAmount REAL NOT NULL DEFAULT 0,
        emoji TEXT DEFAULT '🎯',
        color TEXT NOT NULL DEFAULT '#6C63FF'
      );
    `);
    // Migration: add color column if it doesn't exist (for existing databases)
    try {
      await database.execAsync(`
        ALTER TABLE goals ADD COLUMN color TEXT NOT NULL DEFAULT '#6C63FF';
      `);
    } catch (e) {
      // Column likely already exists, ignore error
      console.log('Color column already exists or migration failed:', e);
    }

    return database;
  });

  return dbPromise;
}
