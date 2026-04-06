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
      await contributeToGoal(id, amount);
      await refresh();
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
