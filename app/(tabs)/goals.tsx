import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
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

  const handleGoalSubmit = (data: { title: string; targetAmount: number; savedAmount: number; emoji: string }) => {
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
      <View style={[tw`px-5 pt-4 pb-1`, Platform.OS === 'android' && { paddingTop: 48 }]}>
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
          <View style={tw`bg-white rounded-3xl p-5 shadow-sm mb-6`}>
            <Text style={tw`text-slate-500 text-sm mb-2 font-medium`}>Total Saved</Text>
            <View style={tw`flex-row items-baseline mb-4`}>
              <Text style={tw`text-4xl font-extrabold text-slate-900`}>৳{totalSaved.toFixed(0)}</Text>
              <Text style={tw`text-lg text-slate-400 ml-2`}>/ ৳{totalTarget.toFixed(0)}</Text>
            </View>

            <View style={tw`w-full bg-slate-100 h-3 rounded-full mb-3 overflow-hidden`}>
              <View
                style={[
                  tw`h-full bg-[#16A34A] rounded-full`,
                  { width: `${Math.min(totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0, 100)}%` },
                ]}
              />
            </View>

            <Text style={tw`text-slate-400 text-xs`}>
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% of all goals reached
            </Text>
          </View>

          {/* Goal Cards */}
          {goals.map((goal, index) => {
            const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

            const colors = ['bg-orange-100', 'bg-green-100', 'bg-red-100', 'bg-blue-100'];
            const barColors = ['bg-orange-400', 'bg-[#16A34A]', 'bg-red-400', 'bg-blue-400'];
            const textColors = ['text-orange-500', 'text-[#16A34A]', 'text-red-500', 'text-blue-500'];
            const colorIdx = index % colors.length;

            return (
              <View key={goal.id} style={tw`bg-white rounded-[28px] p-5 mb-5 border border-slate-100 shadow-sm`}>
                {/* Card Header */}
                <View style={tw`flex-row items-start justify-between mb-6`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <View style={tw`w-14 h-14 rounded-[18px] items-center justify-center ${colors[colorIdx]} shadow-sm`}>
                      <Text style={tw`text-2xl`}>{goal.emoji || '🎯'}</Text>
                    </View>
                    <View style={tw`ml-4 flex-1`}>
                      <Text style={tw`text-lg font-extrabold text-slate-900 mb-0.5`}>{goal.title}</Text>
                      {remaining > 0 ? (
                        <Text style={tw`text-sm font-semibold text-slate-500`}>
                          ৳{remaining.toFixed(0)} remaining
                        </Text>
                      ) : (
                        <Text style={tw`text-sm font-bold text-[#16A34A]`}>Goal Achieved! 🎉</Text>
                      )}
                    </View>
                  </View>

                  {/* Edit & Delete Actions */}
                  <View style={tw`flex-row gap-2 ml-2 mt-1`}>
                    <TouchableOpacity 
                      onPress={() => openEdit(goal)}
                      style={tw`w-9 h-9 rounded-full bg-slate-50 border border-slate-100 items-center justify-center`}
                    >
                      <Ionicons name="pencil" size={16} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => removeGoal(goal.id)}
                      style={tw`w-9 h-9 rounded-full bg-red-50 border border-red-100 items-center justify-center`}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Details */}
                <View style={tw`flex-row justify-between items-end mb-2.5`}>
                  <View>
                    <Text style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider mb-1`}>Progress</Text>
                    <View style={tw`flex-row items-baseline`}>
                      <Text style={tw`text-2xl font-black text-slate-800`}>৳{goal.savedAmount.toFixed(0)}</Text>
                      <Text style={tw`text-sm font-bold text-slate-400 ml-1`}>/ ৳{goal.targetAmount.toFixed(0)}</Text>
                    </View>
                  </View>
                  <View style={tw`px-3 py-1.5 rounded-full ${colors[colorIdx]}`}>
                    <Text style={tw`text-sm font-black ${textColors[colorIdx]}`}>{progress.toFixed(0)}%</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={tw`w-full bg-slate-100 h-3.5 rounded-full mb-5 overflow-hidden`}>
                  <View
                    style={[
                      tw`h-full rounded-full ${barColors[colorIdx]}`,
                      { width: `${Math.min(progress, 100)}%` },
                    ]}
                  />
                </View>

                {/* Add Funds Button */}
                {remaining > 0 && (
                  <TouchableOpacity
                    onPress={() => openContribute(goal)}
                    style={tw`w-full flex-row items-center justify-center py-3.5 bg-[#F0FDF4] rounded-2xl border border-green-100`}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={20} color="#16A34A" style={tw`mr-2`} />
                    <Text style={tw`font-bold text-[15px] text-[#16A34A]`}>Add Funds</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Shared Modal */}
      <AppModal visible={mode !== ModalMode.NONE} onClose={closeModal} title={modalTitle}>
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
