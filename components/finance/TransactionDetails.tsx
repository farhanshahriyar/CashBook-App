import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/constants';
import type { Transaction } from '../../lib/db/queries';
import tw from '../../lib/tw';

export function TransactionDetails({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income';
  const icon = isIncome
    ? 'trending-up-outline'
    : (CATEGORY_ICONS[tx.category] || 'ellipsis-horizontal-outline');
  const iconColor = isIncome
    ? '#16A34A'
    : (CATEGORY_COLORS[tx.category] || '#64748B');
  
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
  const iconBg = isIncome ? 'bg-green-100' : (bgMap[tx.category] || 'bg-slate-100');

  const dateObj = new Date(tx.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const title = tx.note?.split('\n')[0] || 'No title provided';
  const customNote = tx.note?.split('\n').slice(1).join('\n') || 'No additional note';

  return (
    <View style={tw`p-5 pt-8 items-center`}>
      <View style={tw`w-20 h-20 rounded-full items-center justify-center mb-4 ${iconBg}`}>
        <Ionicons name={icon as any} size={40} color={iconColor} />
      </View>
      <Text style={tw`text-base font-medium text-slate-500 mb-1`}>{isIncome ? 'Income' : tx.category}</Text>
      <Text style={tw`text-4xl font-bold mb-8 ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
        {isIncome ? '+' : '-'}৳{tx.amount.toFixed(2)}
      </Text>

      <View style={tw`w-full bg-slate-50 rounded-2xl p-5 border border-slate-100`}>
        <View style={tw`flex-row justify-between mb-4`}>
          <Text style={tw`text-slate-500 font-medium`}>Date</Text>
          <Text style={tw`text-slate-900 font-bold`}>{formattedDate}</Text>
        </View>
        <View style={tw`h-[1px] bg-slate-200 mb-4`} />
        <View style={tw`flex-row justify-between mb-4`}>
          <Text style={tw`text-slate-500 font-medium`}>Title</Text>
          <Text style={tw`text-slate-900 font-bold max-w-[60%] text-right`}>{title}</Text>
        </View>
        <View style={tw`h-[1px] bg-slate-200 mb-4`} />
        <View style={tw`flex-row justify-between mb-4`}>
          <Text style={tw`text-slate-500 font-medium`}>Category</Text>
          <Text style={tw`text-slate-900 font-bold`}>{tx.category}</Text>
        </View>
        <View style={tw`h-[1px] bg-slate-200 mb-4`} />
        <View style={tw`flex-col`}>
          <Text style={tw`text-slate-500 font-medium mb-2`}>Note</Text>
          <Text style={tw`text-slate-700 leading-relaxed`}>{customNote}</Text>
        </View>
      </View>
    </View>
  );
}
