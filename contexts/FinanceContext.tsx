import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import {
  Transaction,
  Goal,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  getAllTransactions,
  insertGoal,
  updateGoal,
  deleteGoal,
  getAllGoals,
  contributeToGoal,
  getTotalBalance,
  getMonthlyTotals,
} from '../lib/db/queries';
import { getMonthKey } from '../lib/format';
import {
  sendGoalMilestoneNotification,
  sendBudgetAlertNotification,
} from '../lib/notifications';

interface FinanceState {
  transactions: Transaction[];
  goals: Goal[];
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  loading: boolean;
}

interface FinanceContextType extends FinanceState {
  refresh: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  editTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  editGoal: (goal: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  contributeGoal: (id: string, amount: number) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    goals: [],
    balance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const [transactions, goals, balance, monthTotals] = await Promise.all([
        getAllTransactions(),
        getAllGoals(),
        getTotalBalance(),
        getMonthlyTotals(getMonthKey()),
      ]);
      setState({
        transactions,
        goals,
        balance,
        monthlyIncome: monthTotals.income,
        monthlyExpense: monthTotals.expense,
        loading: false,
      });
    } catch (err) {
      console.error('FinanceContext refresh error:', err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>) => {
      await insertTransaction(tx);
      await refresh();

      // ── Budget alert: fire when monthly expenses exceed 80% of income ───
      if (tx.type === 'expense') {
        try {
          const monthTotals = await getMonthlyTotals(getMonthKey());
          if (monthTotals.income > 0) {
            const ratio = (monthTotals.expense / monthTotals.income) * 100;
            // Alert at 80% — only once per crossing (check if previous ratio was below)
            if (ratio >= 80 && ratio < 120) {
              await sendBudgetAlertNotification(ratio);
            }
          }
        } catch (_) {
          // Notification errors must never crash finance operations
        }
      }
    },
    [refresh]
  );

  const editTransaction = useCallback(
    async (tx: Transaction) => {
      await updateTransaction(tx);
      await refresh();
    },
    [refresh]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
      await refresh();
    },
    [refresh]
  );

  const addGoal = useCallback(
    async (goal: Omit<Goal, 'id'>) => {
      await insertGoal(goal);
      await refresh();
    },
    [refresh]
  );

  const editGoal = useCallback(
    async (goal: Goal) => {
      await updateGoal(goal);
      await refresh();
    },
    [refresh]
  );

  const removeGoal = useCallback(
    async (id: string) => {
      await deleteGoal(id);
      await refresh();
    },
    [refresh]
  );

  const contributeGoal = useCallback(
    async (id: string, amount: number) => {
      // Snapshot goal BEFORE contribution to detect milestone crossings
      const goalsBefore = await getAllGoals();
      const goalBefore = goalsBefore.find((g) => g.id === id);

      await contributeToGoal(id, amount);
      await refresh();

      // ── Goal milestone notifications ────────────────────────────────────
      if (goalBefore && goalBefore.targetAmount > 0) {
        const goalsAfter = await getAllGoals();
        const goalAfter = goalsAfter.find((g) => g.id === id);
        if (goalAfter) {
          const prevPct = (goalBefore.savedAmount / goalBefore.targetAmount) * 100;
          const newPct = (goalAfter.savedAmount / goalAfter.targetAmount) * 100;

          try {
            if (newPct >= 100 && prevPct < 100) {
              await sendGoalMilestoneNotification(goalAfter.title, 100);
            } else if (newPct >= 50 && prevPct < 50) {
              await sendGoalMilestoneNotification(goalAfter.title, 50);
            }
          } catch (_) {
            // Notification errors must never crash finance operations
          }
        }
      }
    },
    [refresh]
  );

  return (
    <FinanceContext.Provider
      value={{
        ...state,
        refresh,
        addTransaction,
        editTransaction,
        removeTransaction,
        addGoal,
        editGoal,
        removeGoal,
        contributeGoal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
}
