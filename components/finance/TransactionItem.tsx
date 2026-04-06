import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/format';
import { Badge } from '../ui/Badge';
import type { Transaction } from '../../lib/db/queries';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

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

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleDelete}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Badge label={transaction.category} type="category" />
        {transaction.note ? (
          <Text style={styles.note} numberOfLines={1}>{transaction.note}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: transaction.type === 'income' ? COLORS.income : COLORS.expense },
          ]}
        >
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(transaction)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  note: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  editButton: {
    marginLeft: 8,
    padding: 6,
  },
  editText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
});
