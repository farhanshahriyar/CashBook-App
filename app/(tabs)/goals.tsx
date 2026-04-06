import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFinance } from '../../contexts/FinanceContext';
import { GoalCard } from '../../components/goals/GoalCard';
import { GoalForm } from '../../components/goals/GoalForm';
import { ContributionForm } from '../../components/goals/ContributionForm';
import { COLORS } from '../../lib/constants';
import { AppModal } from '../../components/ui/Modal';
import type { Goal } from '../../lib/db/queries';

enum ModalMode {
  NONE,
  CREATE,
  EDIT,
  CONTRIBUTE,
}

export default function GoalsScreen() {
  const { goals, addGoal, editGoal, removeGoal, contributeGoal } = useFinance();
  const [mode, setMode] = useState<ModalMode>(ModalMode.NONE);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const openCreate = () => {
    setSelectedGoal(null);
    setMode(ModalMode.CREATE);
  };

  const openEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setMode(ModalMode.EDIT);
  };

  const openContribute = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      setSelectedGoal(goal);
      setMode(ModalMode.CONTRIBUTE);
    }
  };

  const closeModal = () => {
    setSelectedGoal(null);
    setMode(ModalMode.NONE);
  };

  const handleGoalSubmit = (data: { title: string; targetAmount: number; emoji: string }) => {
    if (mode === ModalMode.EDIT && selectedGoal) {
      editGoal({
        ...data,
        id: selectedGoal.id,
        savedAmount: selectedGoal.savedAmount,
      });
    } else {
      addGoal({ ...data, savedAmount: 0 });
    }
    closeModal();
  };

  const handleContributeSubmit = (amount: number) => {
    if (selectedGoal) {
      contributeGoal(selectedGoal.id, amount);
      closeModal();
    }
  };

  const modalTitle = mode === ModalMode.CREATE
    ? 'New Goal'
    : mode === ModalMode.EDIT
    ? 'Edit Goal'
    : 'Add Contribution';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.goalsList}>
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Create your first savings goal</Text>
          </View>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onContribute={openContribute}
              onEdit={openEdit}
              onDelete={removeGoal}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <AppModal
        visible={mode !== ModalMode.NONE}
        onClose={closeModal}
        title={modalTitle}
      >
        {mode === ModalMode.CONTRIBUTE && selectedGoal ? (
          <ContributionForm goal={selectedGoal} onSubmit={handleContributeSubmit} />
        ) : (
          <GoalForm
            goal={mode === ModalMode.EDIT ? selectedGoal ?? undefined : undefined}
            onSubmit={handleGoalSubmit}
          />
        )}
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  goalsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 108,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 28,
  },
});
