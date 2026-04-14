import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  fullName: string;
  designation: string;
  occupation: string;
}

interface UserContextType {
  profile: UserProfile | null;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  saveProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const PROFILE_STORAGE_KEY = '@cashbook_user_profile';
const ONBOARDING_COMPLETED_KEY = '@cashbook_onboarding_completed';

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [storedProfile, onboardingStatus] = await Promise.all([
          AsyncStorage.getItem(PROFILE_STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
        ]);

        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
        
        if (onboardingStatus === 'true') {
          setHasCompletedOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        hasCompletedOnboarding,
        isLoading,
        saveProfile,
        completeOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
