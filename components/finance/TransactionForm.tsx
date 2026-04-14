import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, TRANSACTION_CATEGORIES, CATEGORY_COLORS } from '../../lib/constants';
import type { Transaction } from '../../lib/db/queries';

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    note: string;
    date: string;
  }) => void;
}

export function TransactionForm({ transaction, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '');
  const [title, setTitle] = useState(transaction?.note ?? '');
  const [category, setCategory] = useState(transaction?.category ?? TRANSACTION_CATEGORIES[0]);
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const isValid = amount && parseFloat(amount) > 0 && category;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      note: title.trim() || category,
      date: transaction?.date ?? today,
    });
  };

  const displayAmount = amount ? parseFloat(amount).toFixed(2) : '0.00';

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Expense / Income Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setType('expense')}
          style={[
            styles.toggleBtn,
            styles.toggleBtnLeft,
            type === 'expense' && styles.toggleBtnActiveExpense,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.toggleBtnText,
              type === 'expense' && styles.toggleBtnTextActiveExpense,
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setType('income')}
          style={[
            styles.toggleBtn,
            styles.toggleBtnRight,
            type === 'income' && styles.toggleBtnActiveIncome,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.toggleBtnText,
              type === 'income' && styles.toggleBtnTextActiveIncome,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Display */}
      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <Text style={[styles.currencySymbol, amount ? styles.currencySymbolActive : null]}>৳</Text>
          <TextInput
            style={[styles.amountInput, !amount && styles.amountPlaceholder]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#CBD5E1"
            returnKeyType="done"
            caretHidden={false}
          />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Title Field */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>TITLE</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What was this for?"
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Category Field */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {TRANSACTION_CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            const catColor = CATEGORY_COLORS[cat] || COLORS.textSecondary;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    borderColor: catColor,
                    borderWidth: 2,
                    backgroundColor: catColor + '10',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && { color: catColor, fontWeight: '600' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Note Field */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
        <View style={[styles.inputContainer, styles.noteContainer]}>
          <TextInput
            style={[styles.textInput, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isValid && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>
          {transaction
            ? 'Update Transaction'
            : type === 'expense'
              ? 'Add Expense'
              : 'Add Income'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 28,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 24,
  },
  toggleBtnLeft: {},
  toggleBtnRight: {},
  toggleBtnActiveExpense: {
    backgroundColor: '#FEE2E2',
  },
  toggleBtnActiveIncome: {
    backgroundColor: '#DCFCE7',
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleBtnTextActiveExpense: {
    color: '#EF4444',
  },
  toggleBtnTextActiveIncome: {
    color: '#16A34A',
  },

  // Amount
  amountSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 26,
    fontWeight: '400',
    color: '#CBD5E1',
    marginRight: 8,
  },
  currencySymbolActive: {
    color: '#94A3B8',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.text,
    minWidth: 80,
    textAlign: 'left',
    padding: 0,
    includeFontPadding: false,
  },
  amountPlaceholder: {
    color: '#CBD5E1',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },

  // Fields
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  textInput: {
    fontSize: 15,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteContainer: {
    minHeight: 90,
  },
  noteInput: {
    minHeight: 80,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Submit
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
