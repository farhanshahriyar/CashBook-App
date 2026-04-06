import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Goal } from '../../lib/db/queries';

interface ContributionFormProps {
  goal: Goal;
  onSubmit: (amount: number) => void;
}

export function ContributionForm({ goal, onSubmit }: ContributionFormProps) {
  const [amount, setAmount] = useState('');
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

  const isValid = amount && parseFloat(amount) > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(parseFloat(amount));
  };

  return (
    <View>
      <View style={styles.goalInfo}>
        <Text style={styles.goalEmoji}>{goal.emoji}</Text>
        <View>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalProgress}>
            {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}
          </Text>
        </View>
      </View>

      <Text style={styles.remaining}>{formatCurrency(remaining)} remaining</Text>

      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />

      <Button
        title="Contribute"
        onPress={handleSubmit}
        disabled={!isValid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  goalProgress: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  remaining: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
    marginBottom: 16,
  },
});
