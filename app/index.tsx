import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';
import tw from '../lib/tw';

export default function SplashScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = useUser();
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    // 5 second delay as requested
    const timer = setTimeout(() => {
      setTimerDone(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timerDone && !isLoading) {
      if (hasCompletedOnboarding) {
        // AppLockContext handles biometric check globally inside _layout or on mount.
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/onboarding/profile');
      }
    }
  }, [timerDone, isLoading, hasCompletedOnboarding, router]);

  return (
    <View style={tw`flex-1 bg-[#16A34A] justify-center items-center`}>
      <StatusBar style="light" hidden />
      <Text style={tw`text-white text-5xl font-black tracking-widest`}>CashBook</Text>
    </View>
  );
}
