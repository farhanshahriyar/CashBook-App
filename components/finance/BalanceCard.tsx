import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';

interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthLabel?: string;
}

export function BalanceCard({ balance, monthlyIncome, monthlyExpense }: BalanceCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.balance}>
        {formatCurrency(balance)}
      </Text>
      
      <View style={styles.row}>
        {/* Income Card */}
        <View style={styles.statsCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="arrow-down-outline" size={16} color={COLORS.white} />
          </View>
          <View style={styles.statsTextContainer}>
            <Text style={styles.subLabel}>Income</Text>
            <Text style={styles.subValue}>{formatCurrency(monthlyIncome)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Expenses Card */}
        <View style={styles.statsCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="arrow-up-outline" size={16} color={COLORS.white} />
          </View>
          <View style={styles.statsTextContainer}>
            <Text style={styles.subLabel}>Expenses</Text>
            <Text style={styles.subValue}>{formatCurrency(monthlyExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  balance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 32,
    letterSpacing: -1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.overlay,
    borderRadius: 20,
    width: '100%',
  },
  statsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsTextContainer: {
    flex: 1,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  subLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
