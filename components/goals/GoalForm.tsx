import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, GOAL_EMOJIS } from '../../lib/constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Goal } from '../../lib/db/queries';

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: { title: string; targetAmount: number; emoji: string }) => void;
}

export function GoalForm({ goal, onSubmit }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');

  const isValid = title.trim().length > 0 && targetAmount && parseFloat(targetAmount) > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      title: title.trim(),
      targetAmount: parseFloat(targetAmount),
      emoji,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Emoji Picker */}
      <Text style={styles.label}>Icon</Text>
      <View style={styles.emojiGrid}>
        {GOAL_EMOJIS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[
              styles.emojiItem,
              emoji === e && styles.emojiItemSelected,
            ]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Input
        label="Goal Title"
        placeholder="e.g., New Phone, Vacation"
        value={title}
        onChangeText={setTitle}
        returnKeyType="next"
      />

      {/* Target Amount */}
      <Input
        label="Target Amount"
        placeholder="0.00"
        value={targetAmount}
        onChangeText={setTargetAmount}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />

      <Button
        title={goal ? 'Update Goal' : 'Create Goal'}
        onPress={handleSubmit}
        disabled={!isValid}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emojiItemSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  emojiText: {
    fontSize: 20,
  },
});
