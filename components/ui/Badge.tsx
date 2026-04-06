import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, CATEGORY_COLORS } from '../../lib/constants';

interface BadgeProps {
  label: string;
  type?: 'income' | 'expense' | 'category';
  style?: ViewStyle;
}

export function Badge({ label, type = 'category', style }: BadgeProps) {
  const containerStyle: ViewStyle = {
    ...styles.badge,
    ...(type === 'income' && styles.incomeBadge),
    ...(type === 'expense' && styles.expenseBadge),
    ...(type === 'category' && {
      backgroundColor: (CATEGORY_COLORS[label] || COLORS.textSecondary) + '18',
    }),
  };

  const textStyle = {
    ...styles.text,
    ...(type === 'income' && styles.incomeText),
    ...(type === 'expense' && styles.expenseText),
    ...(type === 'category' && {
      color: CATEGORY_COLORS[label] || COLORS.textSecondary,
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  incomeBadge: {
    backgroundColor: COLORS.incomeLight,
  },
  expenseBadge: {
    backgroundColor: COLORS.expenseLight,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  incomeText: {
    color: COLORS.income,
  },
  expenseText: {
    color: COLORS.expense,
  },
});
