import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import { Card } from '../ui/Card';

interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthLabel: string;
}

export function BalanceCard({ balance, monthlyIncome, monthlyExpense, monthLabel }: BalanceCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={[styles.balance, { color: balance >= 0 ? COLORS.income : COLORS.expense }]}>
        {formatCurrency(balance)}
      </Text>
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={[styles.subLabel, styles.incomeLabel]}>Income</Text>
          <Text style={styles.subValue}>{formatCurrency(monthlyIncome)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          <Text style={[styles.subLabel, styles.expenseLabel]}>Expenses</Text>
          <Text style={styles.subValue}>{formatCurrency(monthlyExpense)}</Text>
        </View>
      </View>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  balance: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  incomeLabel: {
    color: COLORS.income,
  },
  expenseLabel: {
    color: COLORS.expense,
  },
  subValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  monthLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
