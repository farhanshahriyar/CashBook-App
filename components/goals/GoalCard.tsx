import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import type { Goal } from '../../lib/db/queries';

interface GoalCardProps {
  goal: Goal;
  onContribute?: (id: string) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
}

export function GoalCard({ goal, onContribute, onEdit, onDelete }: GoalCardProps) {
  const progress = Math.min(goal.savedAmount / goal.targetAmount, 1);
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const percentage = Math.round(progress * 100);

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(goal.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{goal.emoji}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.title} numberOfLines={1}>{goal.title}</Text>
          <Text style={styles.subtitle}>
            {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
          </Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(goal)}
              style={styles.actionButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionText, { color: COLORS.expense }]}>X</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${percentage}%` },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.percentage}>{percentage}%</Text>
          {remaining > 0 && (
            <Text style={styles.remaining}>{formatCurrency(remaining)} left</Text>
          )}
        </View>
      </View>

      {percentage < 100 && (
        <Button
          title="Add Contribution"
          onPress={() => onContribute?.(goal.id)}
          variant="secondary"
        />
      )}

      {percentage >= 100 && (
        <View style={styles.completed}>
          <Text style={styles.completedText}>Goal completed!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  headerRight: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  remaining: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  completed: {
    backgroundColor: COLORS.incomeLight,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.income,
  },
});
