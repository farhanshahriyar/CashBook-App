import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import tw from '../../lib/tw';
import { COLORS } from '../../lib/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { saveProfile } = useUser();
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = async () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Required';
    if (!designation.trim()) newErrors.designation = 'Required';
    if (!occupation.trim()) newErrors.occupation = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save profile to context/storage
    await saveProfile({
      fullName: fullName.trim(),
      designation: designation.trim(),
      occupation: occupation.trim(),
    });

    // Navigate to biometric setup
    router.push('/onboarding/biometric');
  };

  const isFormValid = fullName.trim().length > 0 && designation.trim().length > 0 && occupation.trim().length > 0;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={tw`flex-1 px-6 pt-6 pb-8`}>

          {/* Header with Back Arrow */}
          <TouchableOpacity
            style={tw`mb-8 self-start`}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow`}>
            {/* Title */}
            <Text style={tw`text-3xl font-bold text-slate-900 mb-8 leading-tight tracking-tight`}>
              Set up your profile to{'\n'}continue
            </Text>

            {/* Inputs Section */}
            <View style={tw`gap-4`}>
              <View>
                <TextInput
                  style={[
                    tw`bg-[#F3F4F6] px-5 py-4 rounded-xl text-base`,
                    errors.fullName ? tw`border border-red-400` : null,
                    { color: COLORS.text, selectionColor: '#16A34A' }
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View>
                <TextInput
                  style={[
                    tw`bg-[#F3F4F6] px-5 py-4 rounded-xl text-base`,
                    errors.designation ? tw`border border-red-400` : null,
                    { color: COLORS.text, selectionColor: '#16A34A' }
                  ]}
                  placeholder="Designation"
                  placeholderTextColor="#9CA3AF"
                  value={designation}
                  onChangeText={(text) => {
                    setDesignation(text);
                    if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
                  }}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <TextInput
                  style={[
                    tw`bg-[#F3F4F6] px-5 py-4 rounded-xl text-base`,
                    errors.occupation ? tw`border border-red-400` : null,
                    { color: COLORS.text, selectionColor: '#16A34A' }
                  ]}
                  placeholder="Occupation"
                  placeholderTextColor="#9CA3AF"
                  value={occupation}
                  onChangeText={(text) => {
                    setOccupation(text);
                    if (errors.occupation) setErrors(prev => ({ ...prev, occupation: '' }));
                  }}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Area */}
          <View style={tw`mt-auto pt-4`}>
            <TouchableOpacity
              onPress={handleNext}
              disabled={!isFormValid}
              style={[
                tw`w-full py-4 rounded-xl mb-4`,
                isFormValid ? tw`bg-[#16A34A]` : tw`bg-[#D1D5DB]` // matching disabled grey
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                tw`text-center font-bold text-lg`,
                isFormValid ? tw`text-white` : tw`text-white/80`
              ]}>
                Confirm
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity activeOpacity={0.7} style={tw`py-2`}>
              <Text style={tw`text-center text-slate-700 font-semibold text-sm`}>
                Continue with phone
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
