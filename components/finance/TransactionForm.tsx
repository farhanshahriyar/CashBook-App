import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { COLORS, TRANSACTION_CATEGORIES, CATEGORY_COLORS } from '../../lib/constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import type { Transaction } from '../../lib/db/queries';

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: { type: 'income' | 'expense'; amount: number; category: string; note: string; date: string }) => void;
}

export function TransactionForm({ transaction, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [note, setNote] = useState(transaction?.note ?? '');
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().split('T')[0]);

  const isValid = amount && parseFloat(amount) > 0 && category;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      note: note.trim(),
      date,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Type Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabel}>
          <Text style={styles.labelText}>Type</Text>
        </View>
        <View style={styles.toggleContainer}>
          <View
            style={[
              styles.toggleOption,
              type === 'expense' && styles.toggleOptionActiveExpense,
              type === 'expense' && { backgroundColor: COLORS.expense, borderColor: COLORS.expense },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                type === 'expense' && styles.toggleTextActive,
              ]}
            >
              Expense
            </Text>
          </View>
          <View
            style={[
              styles.toggleOption,
              type === 'income' && { backgroundColor: COLORS.income, borderColor: COLORS.income },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                type === 'income' && styles.toggleTextActive,
              ]}
            >
              Income
            </Text>
          </View>
          <View style={[styles.toggleSlider, type === 'income' ? styles.toggleSliderIncome : {}]} />
        </View>
      </View>

      {/* Amount */}
      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        returnKeyType="next"
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {TRANSACTION_CATEGORIES.map((cat) => (
          <View key={cat} style={styles.categoryChip}>
            <Badge
              label={cat}
              type="category"
              style={[
                styles.categoryItem,
                category === cat && { borderWidth: 2, borderColor: CATEGORY_COLORS[cat] || COLORS.accent },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Note */}
      <Input
        label="Note (optional)"
        placeholder="What was this for?"
        value={note}
        onChangeText={setNote}
        returnKeyType="next"
        multiline
      />

      {/* Date */}
      <Input
        label="Date"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        returnKeyType="done"
      />

      <Button
        title={transaction ? 'Update Transaction' : 'Add Transaction'}
        onPress={handleSubmit}
        disabled={!isValid}
        variant="primary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  toggleSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
  },
  toggleSliderIncome: {
    left: '50%',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleOptionActiveExpense: {
    zIndex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  categoryItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
  },
});
