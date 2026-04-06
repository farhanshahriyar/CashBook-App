import React, { useState, useMemo } from 'react';
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
import { TransactionForm } from '../../components/finance/TransactionForm';
import tw from 'twrnc';

type FilterType = 'All' | 'Income' | 'Expense';

export default function TransactionsScreen() {
  const { transactions, addTransaction } = useFinance();
  const [filter, setFilter] = useState<FilterType>('All');
  const [modalVisible, setModalVisible] = useState(false);

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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food & drink':
      case 'food':
        return { name: 'fast-food-outline', bg: 'bg-orange-100', color: '#D97706' };
      case 'transport':
      case 'transportation':
        return { name: 'navigate-outline', bg: 'bg-indigo-100', color: '#4F46E5' };
      case 'entertainment':
        return { name: 'headset-outline', bg: 'bg-pink-100', color: '#DB2777' };
      default:
        return { name: 'trending-up-outline', bg: 'bg-teal-100', color: '#0D9488' };
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={tw`flex-row justify-between items-center px-6 pt-4 pb-2 mt-4`}>
        <Text style={tw`text-3xl font-bold text-slate-900`}>Transactions</Text>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center`}
        >
          <Ionicons name="add" size={24} color="#16A34A" />
        </TouchableOpacity>
      </View>

      {/* Summary Pills */}
      <View style={tw`flex-row px-6 mb-4 mt-2`}>
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
      <View style={tw`flex-row px-6 mb-6 mt-2`}>
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
      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        {groupedTransactions.map(([dateKey, dayTransactions]) => (
          <View key={dateKey} style={tw`mb-6`}>
            <Text style={tw`text-slate-500 font-bold text-xs mb-3 px-2 tracking-wider uppercase`}>
              {dateKey}
            </Text>
            <View style={tw`bg-white rounded-3xl pt-2 pb-2 pl-3 pr-3 shadow-sm`}>
              {dayTransactions.map((tx, index) => {
                const iconConf = getCategoryIcon(tx.category);
                const isIncome = tx.type === 'income';
                return (
                  <View 
                    key={tx.id} 
                    style={tw`flex-row items-center py-3 ${index !== dayTransactions.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <View style={tw`w-12 h-12 rounded-full items-center justify-center ${isIncome ? 'bg-green-100' : iconConf.bg}`}>
                      <Ionicons name={isIncome ? 'trending-up-outline' : iconConf.name as any} size={20} color={isIncome ? '#16A34A' : iconConf.color} />
                    </View>
                    
                    <View style={tw`flex-1 ml-4 justify-center`}>
                      <Text style={tw`text-[16px] font-semibold text-slate-900 pb-0.5`}>{tx.note || tx.category}</Text>
                      <Text style={tw`text-[13px] text-slate-500`}>{isIncome ? 'Income' : tx.category}</Text>
                    </View>
                    
                    <Text style={tw`text-[16px] font-bold ${isIncome ? 'text-[#16A34A]' : 'text-red-700'}`}>
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
            <Text style={tw`text-slate-400`}>No transactions found.</Text>
          </View>
        )}
      </ScrollView>

      {/* Form Modal */}
      <AppModal visible={modalVisible} onClose={() => setModalVisible(false)} title="New Transaction">
        <TransactionForm
          onSubmit={(data) => {
            addTransaction(data);
            setModalVisible(false);
          }}
        />
      </AppModal>
    </SafeAreaView>
  );
}
