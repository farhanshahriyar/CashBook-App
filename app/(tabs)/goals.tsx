import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../contexts/FinanceContext';
import { AppModal } from '../../components/ui/Modal';
import { GoalForm } from '../../components/goals/GoalForm';
import { ContributionForm } from '../../components/goals/ContributionForm';
import type { Goal } from '../../lib/db/queries';
import tw from 'twrnc';

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
  const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

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

  const handleGoalSubmit = (data: { title: string; targetAmount: number; emoji: string }) => {
    if (mode === ModalMode.EDIT && selectedGoal) {
      editGoal({ ...data, id: selectedGoal.id, savedAmount: selectedGoal.savedAmount });
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
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={tw`flex-row justify-between items-center px-6 py-3 mt-2`}>
        <Text style={tw`text-3xl font-bold text-slate-900`}>Saving Goals</Text>
        <TouchableOpacity 
          onPress={openCreate}
          style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center`}
        >
          <Ionicons name="add" size={24} color="#16A34A" />
        </TouchableOpacity>
      </View>
      <Text style={tw`text-slate-500 text-sm px-6 mb-6 mt-1`}>{goals.length} active goals</Text>

      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        
        {/* Total Summary Card */}
        <View style={tw`bg-white rounded-3xl p-5 shadow-sm mb-6`}>
          <Text style={tw`text-slate-500 text-sm mb-2 font-medium`}>Total Saved</Text>
          <View style={tw`flex-row items-baseline mb-4`}>
            <Text style={tw`text-4xl font-extrabold text-slate-900`}>৳{totalSaved.toFixed(0)}</Text>
            <Text style={tw`text-lg text-slate-400 ml-2`}>/ ৳{totalTarget.toFixed(0)}</Text>
          </View>
          
          <View style={tw`w-full bg-slate-100 h-3 rounded-full mb-3 overflow-hidden`}>
            <View style={[tw`h-full bg-slate-300 rounded-full`, { width: `${Math.min(globalProgress, 100)}%` }]} />
          </View>
          
          <Text style={tw`text-slate-400 text-xs`}>
            {globalProgress.toFixed(0)}% of all goals reached
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
            <View key={goal.id} style={tw`bg-white rounded-3xl p-5 shadow-sm mb-4`}>
              {/* Card Header Top */}
              <View style={tw`flex-row items-start justify-between mb-4`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-14 h-14 rounded-full items-center justify-center ${colors[colorIdx]}`}>
                    <Text style={tw`text-2xl`}>{goal.emoji || '🎯'}</Text>
                  </View>
                  <View style={tw`ml-4 flex-1 mt-1`}>
                    <Text style={tw`text-[17px] font-bold text-slate-900`}>{goal.title}</Text>
                    <Text style={tw`text-xs text-slate-500 mt-1`}>30 days left</Text> 
                  </View>
                </View>

                {/* Edit & Delete Actions */}
                <View style={tw`flex-row space-x-3 ml-2 mt-2`}>
                  <TouchableOpacity onPress={() => openEdit(goal)}>
                    <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeGoal(goal.id)}>
                    <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress Values */}
              <View style={tw`flex-row justify-between items-baseline mb-3 mt-1`}>
                <View style={tw`flex-row items-baseline`}>
                  <Text style={tw`text-2xl font-bold text-slate-900`}>৳{goal.savedAmount.toFixed(0)}</Text>
                  <Text style={tw`text-slate-400 ml-1 font-medium`}>/ ৳{goal.targetAmount.toFixed(0)}</Text>
                </View>
                <Text style={tw`font-bold ${textColors[colorIdx]}`}>{progress.toFixed(0)}%</Text>
              </View>

              {/* Progress Bar */}
              <View style={tw`w-full bg-slate-100 h-2.5 rounded-full mb-4 overflow-hidden`}>
                <View style={[tw`h-full rounded-full ${barColors[colorIdx]}`, { width: `${Math.min(progress, 100)}%` }]} />
              </View>

              {/* Bottom Row */}
              <View style={tw`flex-row justify-between items-center mt-2`}>
                <Text style={tw`text-slate-400 text-[13px]`}>৳{remaining.toFixed(0)} to go</Text>
                <TouchableOpacity 
                  onPress={() => openContribute(goal)}
                  style={tw`px-4 py-2 bg-green-50 rounded-full`}
                >
                  <Text style={tw`font-semibold text-[13px] text-[#16A34A]`}>+ Add Funds</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        <View style={tw`h-20`} />
      </ScrollView>

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
