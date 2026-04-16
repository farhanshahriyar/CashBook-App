import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../contexts/FinanceContext';
import { AppModal } from '../../components/ui/Modal';
import { TransactionForm } from '../../components/finance/TransactionForm';
import { CATEGORY_COLORS, CATEGORY_ICONS, COLORS } from '../../lib/constants';
import type { Transaction } from '../../lib/db/queries';
import tw from '../../lib/tw';

type FilterType = 'All' | 'Income' | 'Expense';

enum ModalMode {
  NONE,
  CREATE,
  EDIT,
}

export default function TransactionsScreen() {
  const { transactions, addTransaction, editTransaction, removeTransaction } = useFinance();
  const [filter, setFilter] = useState<FilterType>('All');
  const [mode, setMode] = useState<ModalMode>(ModalMode.NONE);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const filtered = transactions.filter(tx => {
      if (filter === 'Income') return tx.type === 'income';
      if (filter === 'Expense') return tx.type === 'expense';
      return true;
    });

    const groups: { [key: string]: typeof transactions } = {};
    filtered.forEach(tx => {
      const dateObj = new Date(tx.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
      const key = `${dayName}, ${monthDay}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions, filter]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const openCreate = () => {
    setSelectedTx(null);
    setMode(ModalMode.CREATE);
  };

  const openEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setMode(ModalMode.EDIT);
  };

  const closeModal = () => {
    setSelectedTx(null);
    setMode(ModalMode.NONE);
  };

  const handleSubmit = (data: { type: 'income' | 'expense'; amount: number; category: string; note: string; date: string }) => {
    if (mode === ModalMode.EDIT && selectedTx) {
      editTransaction({ ...data, id: selectedTx.id });
    } else {
      addTransaction(data);
    }
    closeModal();
  };

  const getCategoryConfig = (category: string) => {
    const icon = CATEGORY_ICONS[category] || 'ellipsis-horizontal-outline';
    const color = CATEGORY_COLORS[category] || '#64748B';

    // Create lighter background tint
    const bgMap: Record<string, string> = {
      'Food & Drink': 'bg-amber-100',
      Transport: 'bg-blue-100',
      Entertainment: 'bg-pink-100',
      Shopping: 'bg-violet-100',
      Housing: 'bg-indigo-100',
      Health: 'bg-cyan-100',
      Education: 'bg-emerald-100',
      Other: 'bg-slate-100',
    };
    const bg = bgMap[category] || 'bg-slate-100';

    return { icon, color, bg };
  };

  const modalTitle = mode === ModalMode.CREATE ? 'Add Transaction' : 'Edit Transaction';

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[tw`flex-row justify-between items-center px-5 pt-4 pb-3`, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <Text style={tw`text-3xl font-bold text-slate-900`}>Transactions</Text>
        <TouchableOpacity
          onPress={openCreate}
          style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center`}
        >
          <Ionicons name="add" size={24} color="#16A34A" />
        </TouchableOpacity>
      </View>

      {/* Summary Pills */}
      <View style={tw`flex-row px-5 mb-3`}>
        <View style={tw`bg-green-100 px-3 py-1.5 rounded-xl flex-row items-center mr-3`}>
          <Ionicons name="arrow-down" size={14} color="#16A34A" />
          <Text style={tw`text-green-700 font-semibold ml-1 text-sm`}>+৳{totalIncome.toFixed(0)}</Text>
        </View>
        <View style={tw`bg-red-100 px-3 py-1.5 rounded-xl flex-row items-center`}>
          <Ionicons name="arrow-up" size={14} color="#DC2626" />
          <Text style={tw`text-red-700 font-semibold ml-1 text-sm`}>-৳{totalExpense.toFixed(0)}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={tw`flex-row px-5 mb-4`}>
        {(['All', 'Income', 'Expense'] as FilterType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={tw`px-5 py-2 rounded-full mr-3 ${filter === tab ? 'bg-[#16A34A]' : 'bg-slate-100'}`}
          >
            <Text style={tw`font-semibold ${filter === tab ? 'text-white' : 'text-slate-600'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <ScrollView style={tw`flex-1 px-5`} contentContainerStyle={tw`pb-24`} showsVerticalScrollIndicator={false}>
        {groupedTransactions.map(([dateKey, dayTransactions]) => (
          <View key={dateKey} style={tw`mb-6`}>
            <Text style={tw`text-slate-500 font-bold text-xs mb-3 tracking-wider uppercase`}>
              {dateKey}
            </Text>
            <View style={tw`bg-white rounded-3xl pt-2 pb-2 pl-3 pr-3 shadow-sm`}>
              {dayTransactions.map((tx, index) => {
                const isIncome = tx.type === 'income';
                const conf = getCategoryConfig(tx.category);
                return (
                  <View
                    key={tx.id}
                    style={tw`flex-row items-center py-3 ${index !== dayTransactions.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <View style={tw`w-12 h-12 rounded-full items-center justify-center ${isIncome ? 'bg-green-100' : conf.bg}`}>
                      <Ionicons
                        name={(isIncome ? 'trending-up-outline' : conf.icon) as any}
                        size={20}
                        color={isIncome ? '#16A34A' : conf.color}
                      />
                    </View>

                    <View style={tw`flex-1 ml-4 justify-center`}>
                      <Text style={tw`text-[16px] font-semibold text-slate-900 pb-0.5`}>
                        {tx.note || tx.category}
                      </Text>
                      <Text style={tw`text-[13px] text-slate-500`}>
                        {isIncome ? 'Income' : tx.category}
                      </Text>
                    </View>

                    {/* Edit & Delete Actions */}
                    <View style={tw`flex-row items-center gap-3 mr-3`}>
                      <TouchableOpacity onPress={() => openEdit(tx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeTransaction(tx.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>

                    <Text style={tw`text-[16px] font-bold ${isIncome ? 'text-[#16A34A]' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}৳{tx.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        {groupedTransactions.length === 0 && (
          <View style={tw`items-center justify-center py-20`}>
            <Text style={tw`text-slate-400 text-base`}>No transactions found.</Text>
          </View>
        )}
      </ScrollView>

      {/* Form Modal */}
      <AppModal visible={mode !== ModalMode.NONE} onClose={closeModal} title={modalTitle}>
        <TransactionForm
          transaction={mode === ModalMode.EDIT ? selectedTx ?? undefined : undefined}
          onSubmit={handleSubmit}
        />
      </AppModal>
    </SafeAreaView>
  );
}
