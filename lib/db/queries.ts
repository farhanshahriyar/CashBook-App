import { getDatabase } from './sqlite';
import { getMonthRange } from '../format';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  emoji: string;
  color: string;
}

// ─── Transactions ───────────────────────────────────────

export async function insertTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
  const db = await getDatabase();
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  await db.runAsync(
    'INSERT INTO transactions (id, type, amount, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
    [id, tx.type, tx.amount, tx.category, tx.note, tx.date]
  );
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE transactions SET type = ?, amount = ?, category = ?, note = ?, date = ? WHERE id = ?',
    [tx.type, tx.amount, tx.category, tx.note, tx.date, tx.id]
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, id DESC'
  );
}

export async function getTransactionsByMonth(
  monthKey: string
): Promise<Transaction[]> {
  const db = await getDatabase();
  const { start, end } = getMonthRange(monthKey);
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC, id DESC',
    [start, end]
  );
}

// ─── Goals ──────────────────────────────────────────────

export async function insertGoal(goal: Omit<Goal, 'id'>): Promise<void> {
  const db = await getDatabase();
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  await db.runAsync(
    'INSERT INTO goals (id, title, targetAmount, savedAmount, emoji, color) VALUES (?, ?, ?, ?, ?, ?)',
    [id, goal.title, goal.targetAmount, goal.savedAmount, goal.emoji, goal.color]
  );
}

export async function updateGoal(goal: Goal): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE goals SET title = ?, targetAmount = ?, savedAmount = ?, emoji = ?, color = ? WHERE id = ?',
    [goal.title, goal.targetAmount, goal.savedAmount, goal.emoji, goal.color, goal.id]
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}

export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  return db.getAllAsync<Goal>('SELECT * FROM goals');
}

export async function contributeToGoal(
  id: string,
  amount: number
): Promise<void> {
  const db = await getDatabase();
  // Clamp savedAmount to never exceed targetAmount at the DB level
  await db.runAsync(
    'UPDATE goals SET savedAmount = MIN(savedAmount + ?, targetAmount) WHERE id = ?',
    [amount, id]
  );
}

// ─── Dashboard ──────────────────────────────────────────

export async function getTotalBalance(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ balance: number }>(
    `SELECT COALESCE(
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0
    ) as balance FROM transactions`
  );
  return result?.balance ?? 0;
}

export async function getMonthlyTotals(
  monthKey: string
): Promise<{ income: number; expense: number }> {
  const db = await getDatabase();
  const { start, end } = getMonthRange(monthKey);
  const result = await db.getFirstAsync<{
    income: number;
    expense: number;
  }>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions WHERE date BETWEEN ? AND ?`,
    [start, end]
  );
  return {
    income: result?.income ?? 0,
    expense: result?.expense ?? 0,
  };
}



// ─── Bulk Insert (for backup restore) ───────────────────

export async function bulkInsertTransactions(txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const tx of txs) {
      await db.runAsync(
        'INSERT OR REPLACE INTO transactions (id, type, amount, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
        [tx.id, tx.type, tx.amount, tx.category, tx.note || '', tx.date]
      );
    }
  });
}

export async function bulkInsertGoals(goals: Goal[]): Promise<void> {
  if (goals.length === 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const g of goals) {
      await db.runAsync(
        'INSERT OR REPLACE INTO goals (id, title, targetAmount, savedAmount, emoji, color) VALUES (?, ?, ?, ?, ?, ?)',
        [g.id, g.title, g.targetAmount, g.savedAmount, g.emoji, g.color]
      );
    }
  });
}

// ─── Clear All Data ─────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM transactions; DELETE FROM goals;');
}
