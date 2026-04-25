import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../contexts/FinanceContext';
import { AppModal } from '../../components/ui/Modal';
import { GoalForm } from '../../components/goals/GoalForm';
import { ContributionForm } from '../../components/goals/ContributionForm';
import type { Goal } from '../../lib/db/queries';
import tw from '../../lib/tw';

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

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const openCreate = () => {
    setSelectedGoal(null);
    setMode(ModalMode.CREATE);
  };

  const openEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setMode(ModalMode.EDIT);
  };

  const openContribute = (goal: Goal) => {
    setSelectedGoal(goal);
    setMode(ModalMode.CONTRIBUTE);
  };

  const closeModal = () => {
    setSelectedGoal(null);
    setMode(ModalMode.NONE);
  };

  const confirmDelete = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeGoal(goal.id),
        },
      ]
    );
  };

  const handleGoalSubmit = (data: { title: string; targetAmount: number; savedAmount: number; emoji: string; color: string }) => {
    if (mode === ModalMode.EDIT && selectedGoal) {
      editGoal({ ...data, id: selectedGoal.id });
    } else {
      addGoal(data);
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
    ? 'New Saving Goal'
    : mode === ModalMode.EDIT
    ? 'Edit Goal'
    : 'Add Contribution';

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={tw`px-5 pt-4 pb-1`}>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={tw`text-3xl font-bold text-slate-900`}>Saving Goals</Text>
          <TouchableOpacity
            onPress={openCreate}
            style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center`}
          >
            <Ionicons name="add" size={24} color="#16A34A" />
          </TouchableOpacity>
        </View>
        <Text style={tw`text-slate-500 text-sm mt-1`}>{goals.length} active goals</Text>
      </View>

      {goals.length === 0 ? (
        /* Empty State */
        <View style={tw`flex-1 items-center justify-center px-10`}>
          <View style={tw`w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-5`}>
            <Ionicons name="flag-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={tw`text-xl font-bold text-slate-900 mb-2`}>No saving goals yet</Text>
          <Text style={tw`text-slate-500 text-center text-sm mb-6`}>
            Set a goal to start saving
          </Text>
          <TouchableOpacity
            onPress={openCreate}
            style={tw`bg-[#16A34A] px-8 py-3.5 rounded-full`}
          >
            <Text style={tw`text-white font-bold text-base`}>Create First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1 px-5 mt-4`}
          contentContainerStyle={tw`pb-24`}
          showsVerticalScrollIndicator={false}
        >
          {/* Total Summary Card */}
          <View style={tw`bg-white rounded-[24px] p-6 shadow-sm mb-6 border border-slate-50`}>
            <Text style={tw`text-slate-500 text-[15px] mb-2 font-medium`}>Total Saved</Text>
            <View style={tw`flex-row items-baseline mb-5`}>
              <Text style={tw`text-[38px] font-black text-slate-900 tracking-tight`}>৳{totalSaved.toFixed(0)}</Text>
              <Text style={tw`text-xl text-slate-500 font-medium ml-2`}>/ ৳{totalTarget.toFixed(0)}</Text>
            </View>
            <View style={tw`w-full bg-[#f1f5f9] h-2.5 rounded-full mb-3 overflow-hidden`}>
              <View
                style={[
                  tw`h-full bg-slate-800 rounded-full`,
                  { width: `${Math.min(totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0, 100)}%` },
                ]}
              />
            </View>
            <Text style={tw`text-slate-500 text-[13.5px] font-medium`}>
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% of all goals reached
            </Text>
          </View>

          {/* Goal Cards */}
          {goals.map((goal, index) => {
            const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

            const themeStyles = [
              { bg: 'bg-orange-50', text: 'text-orange-500', bar: 'bg-orange-500' },
              { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-600' },
              { bg: 'bg-rose-50', text: 'text-rose-500', bar: 'bg-rose-500' },
              { bg: 'bg-blue-50', text: 'text-blue-500', bar: 'bg-blue-500' },
            ];
            const theme = themeStyles[index % themeStyles.length];

            return (
              <View key={goal.id} style={tw`bg-white rounded-[24px] p-5 mb-4 border border-slate-50 shadow-sm`}>
                {/* Card Header */}
                <View style={tw`flex-row items-start justify-between mb-5`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <View style={tw`w-12 h-12 rounded-full items-center justify-center ${theme.bg}`}>
                      <Text style={tw`text-[22px]`}>{goal.emoji || '🎯'}</Text>
                    </View>
                    <View style={tw`ml-3 flex-1`}>
                      <Text style={tw`text-[17px] font-bold text-slate-900 mb-[2px]`}>{goal.title}</Text>
                      <Text style={tw`text-[13px] font-medium text-slate-500`}>Ongoing target</Text>
                    </View>
                  </View>

                  {/* Edit & Delete Actions */}
                  <View style={tw`flex-row gap-3 ml-2 pt-1`}>
                    <TouchableOpacity onPress={() => openEdit(goal)}>
                      <Ionicons name="pencil-outline" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(goal)}>
                      <Ionicons name="trash-outline" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Details */}
                <View style={tw`flex-row justify-between items-baseline mb-3`}>
                  <View style={tw`flex-row items-baseline`}>
                    <Text style={tw`text-[24px] font-bold text-slate-900 tracking-tight`}>৳{goal.savedAmount.toFixed(0)}</Text>
                    <Text style={tw`text-[15px] font-medium text-slate-400 ml-1.5`}>/ ৳{goal.targetAmount.toFixed(0)}</Text>
                  </View>
                  <Text style={tw`text-[16px] font-extrabold ${theme.text}`}>{progress.toFixed(0)}%</Text>
                </View>

                {/* Progress Bar */}
                <View style={tw`w-full bg-[#f1f5f9] h-2.5 rounded-full mb-4 overflow-hidden`}>
                  <View
                    style={[
                      tw`h-full rounded-full ${theme.bar}`,
                      { width: `${Math.min(progress, 100)}%` },
                    ]}
                  />
                </View>

                {/* Footer */}
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[14px] text-slate-400 font-medium`}>
                    ৳{remaining.toFixed(0)} to go
                  </Text>
                  {remaining > 0 ? (
                    <TouchableOpacity
                      onPress={() => openContribute(goal)}
                      style={tw`px-4 py-2 rounded-full ${theme.bg}`}
                    >
                      <Text style={tw`font-bold text-[13.5px] ${theme.text}`}>+ Add Funds</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={tw`px-4 py-2 rounded-full bg-green-50`}>
                      <Text style={tw`font-bold text-[13.5px] text-green-600`}>Goal Achieved</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Shared Modal */}
      <AppModal visible={mode !== ModalMode.NONE} onClose={closeModal} title={modalTitle}>
        {mode === ModalMode.CONTRIBUTE && selectedGoal ? (
          <ContributionForm goal={selectedGoal} onSubmit={handleContributeSubmit} />
        ) : (mode === ModalMode.CREATE || mode === ModalMode.EDIT) ? (
          <GoalForm
            key={mode === ModalMode.EDIT ? `edit-${selectedGoal?.id}` : 'create'}
            goal={mode === ModalMode.EDIT ? selectedGoal ?? undefined : undefined}
            onSubmit={handleGoalSubmit}
          />
        ) : null}
      </AppModal>
    </SafeAreaView>
  );
}
