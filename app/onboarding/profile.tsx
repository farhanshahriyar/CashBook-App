import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
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
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!designation.trim()) newErrors.designation = 'Designation is required';
    if (!occupation.trim()) newErrors.occupation = 'Occupation is required';

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

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={tw`flex-grow px-6 pt-12 pb-8`}>
          
          <View style={tw`mb-10 items-center mt-8`}>
            <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6 shadow-sm`}>
              <Ionicons name="person-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={tw`text-3xl font-extrabold text-slate-900 text-center mb-2`}>Personal Profile</Text>
            <Text style={tw`text-slate-500 text-base text-center px-4 leading-relaxed`}>
              Let's set up your profile so CashBook feels like yours.
            </Text>
          </View>

          <View style={tw`flex-1`}>
            {/* Full Name */}
            <View style={tw`mb-5`}>
              <Text style={tw`text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 ml-1`}>Full Name</Text>
              <TextInput
                style={[
                  tw`bg-white px-5 py-4 rounded-2xl text-base border shadow-sm`,
                  errors.fullName ? tw`border-red-400` : tw`border-slate-100`,
                  { color: COLORS.text }
                ]}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors(prev => ({...prev, fullName: ''}));
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.fullName && <Text style={tw`text-red-500 text-xs font-medium ml-2 mt-1.5`}>{errors.fullName}</Text>}
            </View>

            {/* Designation */}
            <View style={tw`mb-5`}>
              <Text style={tw`text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 ml-1`}>Designation</Text>
              <TextInput
                style={[
                  tw`bg-white px-5 py-4 rounded-2xl text-base border shadow-sm`,
                  errors.designation ? tw`border-red-400` : tw`border-slate-100`,
                  { color: COLORS.text }
                ]}
                placeholder="e.g. Software Engineer"
                placeholderTextColor="#94A3B8"
                value={designation}
                onChangeText={(text) => {
                  setDesignation(text);
                  if (errors.designation) setErrors(prev => ({...prev, designation: ''}));
                }}
                autoCapitalize="words"
              />
              {errors.designation && <Text style={tw`text-red-500 text-xs font-medium ml-2 mt-1.5`}>{errors.designation}</Text>}
            </View>

            {/* Occupation */}
            <View style={tw`mb-8`}>
              <Text style={tw`text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 ml-1`}>Occupation</Text>
              <TextInput
                style={[
                  tw`bg-white px-5 py-4 rounded-2xl text-base border shadow-sm`,
                  errors.occupation ? tw`border-red-400` : tw`border-slate-100`,
                  { color: COLORS.text }
                ]}
                placeholder="e.g. Full-time, Freelancer"
                placeholderTextColor="#94A3B8"
                value={occupation}
                onChangeText={(text) => {
                  setOccupation(text);
                  if (errors.occupation) setErrors(prev => ({...prev, occupation: ''}));
                }}
                autoCapitalize="words"
              />
              {errors.occupation && <Text style={tw`text-red-500 text-xs font-medium ml-2 mt-1.5`}>{errors.occupation}</Text>}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleNext}
            style={tw`w-full bg-[#16A34A] py-4 rounded-2xl shadow-md shadow-green-200 mt-4`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-center text-white font-bold text-lg`}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
