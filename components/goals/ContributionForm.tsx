import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import type { Goal } from '../../lib/db/queries';

interface ContributionFormProps {
  goal: Goal;
  onSubmit: (amount: number) => void;
}

export function ContributionForm({ goal, onSubmit }: ContributionFormProps) {
  const [amount, setAmount] = useState('');
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;

  const isValid = amount && parseFloat(amount) > 0 && parseFloat(amount) <= remaining;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(parseFloat(amount));
  };

  return (
    <View style={styles.container}>
      {/* Goal Summary Card */}
      <View style={styles.goalInfo}>
        <View style={styles.goalHeaderRow}>
          <View style={styles.goalEmojiContainer}>
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          </View>
          <View style={styles.goalTextContainer}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalProgressText}>
              {formatCurrency(goal.savedAmount)} saved of {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar inside summary */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={styles.remainingText}>{formatCurrency(remaining)} remaining to reach goal</Text>
      </View>

      {/* Amount Input */}
      <Text style={styles.fieldLabel}>CONTRIBUTION AMOUNT (BDT)</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
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
        <Text style={styles.submitButtonText}>Add Funds</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  
  // Goal Summary Card
  goalInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalEmoji: {
    fontSize: 22,
  },
  goalTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  goalProgressText: {
    fontSize: 13,
    color: '#64748B',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16A34A',
    textAlign: 'right',
  },

  // Input Field
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
    marginBottom: 24,
  },
  textInput: {
    fontSize: 18,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '500',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
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
