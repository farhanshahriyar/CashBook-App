import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GOAL_EMOJIS } from '../../lib/constants';
import type { Goal } from '../../lib/db/queries';

// Helper function to calculate a date that is X months in the future,
// handling month-end dates by clamping to the last day of the month.
function getSafeDeadlineDate(monthsToAdd: number): Date {
  const date = new Date();
  const targetMonth = date.getMonth() + monthsToAdd;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const lastDay = new Date(targetYear, month + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDay);
  return new Date(targetYear, month, day);
}

const DEADLINE_OPTIONS = [
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
  { label: '90d', days: 90 },
  { label: '6mo', days: 180 },
  { label: '1yr', days: 365 },
];

const GOAL_COLORS = [
  '#16A34A', // green
  '#22C55E', // light green
  '#F59E0B', // amber
  '#EF4444', // red
  '#DC2626', // dark red
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#EC4899', // pink
];

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: { title: string; targetAmount: number; savedAmount: number; emoji: string; color: string }) => void;
}

export function GoalForm({ goal, onSubmit }: GoalFormProps) {
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');
  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '');
  const [startingAmount, setStartingAmount] = useState(goal?.savedAmount?.toString() ?? '0');
  const [selectedDeadline, setSelectedDeadline] = useState(90);
  const [selectedColor, setSelectedColor] = useState(goal?.color ?? GOAL_COLORS[0]);

  const isValid = title.trim().length > 0 && targetAmount && parseFloat(targetAmount) > 0;

  // Calculate target date based on deadline (convert days to months for month arithmetic)
  const months = Math.round(selectedDeadline / 30);
  const targetDate = getSafeDeadlineDate(months);
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      title: title.trim(),
      targetAmount: parseFloat(targetAmount),
      // When editing, preserve the current savedAmount from DB to avoid overwriting contributions
      savedAmount: goal ? goal.savedAmount : (parseFloat(startingAmount) || 0),
      emoji,
      color: selectedColor,
    });
  };

  const isEditing = !!goal;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Emoji Picker */}
      <Text style={styles.fieldLabel}>PICK AN EMOJI</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emojiRow}
        style={styles.emojiScrollArea}
      >
        {GOAL_EMOJIS.slice(0, 15).map((e) => (
          <TouchableOpacity
            key={e}
            style={[
              styles.emojiItem,
              emoji === e && styles.emojiItemSelected,
            ]}
            onPress={() => setEmoji(e)}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Goal Name */}
      <Text style={styles.fieldLabel}>GOAL NAME</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. New Laptop"
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="next"
        />
      </View>

      {/* Target Amount */}
      <Text style={styles.fieldLabel}>TARGET AMOUNT (BDT)</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="0"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          returnKeyType="next"
        />
      </View>

      {/* Starting Amount — hidden in edit mode to prevent overwriting contribution progress */}
      {!isEditing && (
        <>
          <Text style={styles.fieldLabel}>STARTING AMOUNT (BDT)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={startingAmount}
              onChangeText={setStartingAmount}
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </>
      )}

      {/* Deadline */}
      <Text style={styles.fieldLabel}>DEADLINE</Text>
      <View style={styles.deadlineRow}>
        {DEADLINE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.days}
            style={[
              styles.deadlineChip,
              selectedDeadline === opt.days && styles.deadlineChipActive,
            ]}
            onPress={() => setSelectedDeadline(opt.days)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.deadlineChipText,
                selectedDeadline === opt.days && styles.deadlineChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.targetDateText}>Target date: {formattedDate}</Text>

      {/* Color Picker */}
      <Text style={styles.fieldLabel}>COLOR</Text>
      <View style={styles.colorRow}>
        {GOAL_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              { backgroundColor: color },
              selectedColor === color && styles.colorCircleSelected,
            ]}
            onPress={() => setSelectedColor(color)}
            activeOpacity={0.7}
          >
            {selectedColor === color && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: selectedColor },
          !isValid && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>
          {goal ? 'Update Goal' : 'Create Goal'}
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
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Labels
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },

  // Emoji
  emojiScrollArea: {
    marginHorizontal: -20, // Negative margin to allow full-width bleeding during scrolling
    paddingHorizontal: 20, // Padding to start/end points aligned with other content
    marginBottom: 18,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 40, // Extra padding at end for full width scroll area
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  emojiItemSelected: {
    backgroundColor: '#DCFCE7', // Light green
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  emojiText: {
    fontSize: 20,
  },

  // Inputs
  inputContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    marginBottom: 14,
  },
  textInput: {
    fontSize: 15,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  // Deadline
  deadlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  deadlineChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  deadlineChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  deadlineChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deadlineChipTextActive: {
    color: '#FFFFFF',
  },
  targetDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 18,
    marginTop: 2,
  },

  // Color
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Submit
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
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
