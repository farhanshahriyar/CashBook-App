import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFinance } from '../../contexts/FinanceContext';
import { BalanceCard } from '../../components/finance/BalanceCard';
import { TransactionItem } from '../../components/finance/TransactionItem';
import { COLORS } from '../../lib/constants';
import { formatMonth } from '../../lib/format';

export default function DashboardScreen() {
  const { balance, monthlyIncome, monthlyExpense, transactions, loading } = useFinance();
  const recentTransactions = transactions.slice(0, 5);
  const monthLabel = formatMonth(new Date().toISOString());

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Your Finances</Text>
        </View>

        <BalanceCard
          balance={balance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          monthLabel={monthLabel}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.length === 0 ? (
            <Text style={styles.empty}>No transactions yet</Text>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  empty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
