import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import { useAppLock } from '../../contexts/AppLockContext';
import tw from '../../lib/tw';
import { COLORS } from '../../lib/constants';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const { setBiometricEnabled, authenticate } = useAppLock();
  
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [bType, setBType] = useState<'fingerprint' | 'face' | 'none'>('none');

  useEffect(() => {
    async function checkSupport() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        setIsSupported(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBType('fingerprint');
        } else {
          setBType('fingerprint'); // Fallback
        }
      } else {
        setIsSupported(false);
      }
    }
    checkSupport();
  }, []);

  const handleFinish = async (enableLock: boolean) => {
    if (enableLock) {
      // Prompt them to authenticate right now to confirm they want it enabled
      const result = await authenticate();
      if (!result) {
        // Did not authenticate successfully, don't enable layout
        return;
      }
    }

    await setBiometricEnabled(enableLock);
    await completeOnboarding();
    
    // Redirect to app
    router.replace('/(tabs)/dashboard');
  };

  if (isSupported === null) {
    return (
      <View style={tw`flex-1 bg-[#F8FAFC] justify-center items-center`}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If no hardware/enrollment, they just skip this phase
  if (!isSupported) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
        <StatusBar style="dark" />
        <View style={tw`flex-1 px-6 justify-center items-center pb-12`}>
          <View style={tw`w-24 h-24 bg-slate-100 rounded-full items-center justify-center mb-8 shadow-sm`}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={tw`text-3xl font-extrabold text-slate-900 text-center mb-4`}>You're all set!</Text>
          <Text style={tw`text-slate-500 text-base text-center px-4 leading-relaxed mb-10`}>
            Biometric security is not enrolled on this device. You can set it up in your phone settings later.
          </Text>

          <TouchableOpacity
            onPress={() => handleFinish(false)}
            style={tw`w-full bg-[#16A34A] py-4 rounded-2xl shadow-md shadow-green-200`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-center text-white font-bold text-lg`}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const iconName = bType === 'face' ? 'scan-outline' : 'finger-print-outline';
  const displayType = bType === 'face' ? 'Face ID' : 'Fingerprint';

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />
      <View style={tw`flex-1 px-6 pt-16 pb-8`}>
        <View style={tw`flex-1 justify-center items-center mt-[-60px]`}>
          <View style={tw`w-24 h-24 bg-green-100 rounded-[32px] items-center justify-center mb-8 shadow-sm`}>
            <Ionicons name={iconName} size={48} color={COLORS.primary} />
          </View>
          <Text style={tw`text-3xl font-extrabold text-slate-900 text-center mb-4`}>Secure Your App</Text>
          <Text style={tw`text-slate-500 text-base text-center px-4 leading-relaxed mb-12`}>
            Would you like to use {displayType} to lock CashBook? This adds an extra layer of privacy to your financial data.
          </Text>

          <View style={tw`w-full gap-4`}>
            <TouchableOpacity
              onPress={() => handleFinish(true)}
              style={tw`w-full bg-[#16A34A] py-4 rounded-2xl shadow-md shadow-green-200`}
              activeOpacity={0.8}
            >
              <Text style={tw`text-center text-white font-bold text-lg`}>Enable {displayType}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFinish(false)}
              style={tw`w-full bg-white border border-slate-200 py-4 rounded-2xl`}
              activeOpacity={0.8}
            >
              <Text style={tw`text-center text-slate-600 font-bold text-lg`}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
