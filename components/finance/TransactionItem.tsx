import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import type { Transaction } from '../../lib/db/queries';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

// Simple map to match category string to an emoji and background color
const iconMap: Record<string, { emoji: string; color: string }> = {
  Food: { emoji: '☕', color: '#FEF3C7' },
  Transport: { emoji: '🚗', color: '#DBEAFE' },
  Shopping: { emoji: '🛍️', color: '#F3E8FF' },
  Bills: { emoji: '📄', color: '#FCE7F3' },
  Entertainment: { emoji: '🎬', color: '#FFEDD5' },
  Health: { emoji: '🏥', color: '#E0F2FE' },
  Education: { emoji: '📚', color: '#DCFCE7' },
  Salary: { emoji: '💰', color: '#DCFCE7' },
  Freelance: { emoji: '💻', color: '#F3E8FF' },
  Other: { emoji: '📦', color: '#F1F5F9' },
};

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(transaction.id),
        },
      ]
    );
  };

  const getIconProps = (category: string) => {
    return iconMap[category] || iconMap.Other;
  };

  const iconProps = getIconProps(transaction.category);
  const title = transaction.note || transaction.category;
  const subtitle = transaction.note ? transaction.category : '';

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleDelete}
      onPress={() => onEdit?.(transaction)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconProps.color }]}>
        <Text style={styles.iconEmoji}>{iconProps.emoji}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      <Text
        style={[
          styles.amount,
          { color: transaction.type === 'income' ? COLORS.income : COLORS.expense },
        ]}
      >
        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
