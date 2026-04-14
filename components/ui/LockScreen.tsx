import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppLock } from '../../contexts/AppLockContext';
import tw from '../../lib/tw';
import { COLORS } from '../../lib/constants';

export function LockScreen() {
  const { authenticate, biometricType } = useAppLock();

  const iconName = biometricType === 'face' ? 'scan-outline' : 'finger-print-outline';

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />
      <View style={tw`flex-1 justify-center items-center px-6`}>
        <View style={tw`w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6`}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.primary} />
        </View>
        
        <Text style={tw`text-2xl font-extrabold text-slate-900 mb-2`}>App Locked</Text>
        <Text style={tw`text-slate-500 text-center mb-10`}>
          Please authenticate to view your financial data
        </Text>

        <TouchableOpacity
          onPress={authenticate}
          style={tw`w-full bg-[#16A34A] py-4 rounded-2xl flex-row justify-center items-center`}
          activeOpacity={0.8}
        >
          <Ionicons name={iconName} size={24} color="#fff" style={tw`mr-3`} />
          <Text style={tw`text-white font-bold text-lg`}>Unlock CashBook</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
