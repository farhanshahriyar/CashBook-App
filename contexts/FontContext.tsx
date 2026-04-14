import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontFamily =
  | 'Inter'
  | 'Roboto'
  | 'OpenSans'
  | 'Montserrat'
  | 'Poppins'
  | 'Lato'
  | 'Raleway';

export interface FontOption {
  key: FontFamily;
  label: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: 'Inter', label: 'Inter' },
  { key: 'Roboto', label: 'Roboto' },
  { key: 'OpenSans', label: 'Open Sans' },
  { key: 'Montserrat', label: 'Montserrat' },
  { key: 'Poppins', label: 'Poppins' },
  { key: 'Lato', label: 'Lato' },
  { key: 'Raleway', label: 'Raleway' },
];

// Maps each font family + weight to the correct loaded font name
export const FONT_WEIGHT_MAPS: Record<FontFamily, Record<string, string>> = {
  Inter: {
    '300': 'Inter-Light',
    '400': 'Inter-Regular',
    'normal': 'Inter-Regular',
    '500': 'Inter-Medium',
    '600': 'Inter-SemiBold',
    '700': 'Inter-Bold',
    'bold': 'Inter-Bold',
    '800': 'Inter-ExtraBold',
    '900': 'Inter-Black',
  },
  Roboto: {
    '300': 'Roboto-Light',
    '400': 'Roboto-Regular',
    'normal': 'Roboto-Regular',
    '500': 'Roboto-Medium',
    '600': 'Roboto-Bold',
    '700': 'Roboto-Bold',
    'bold': 'Roboto-Bold',
    '800': 'Roboto-Black',
    '900': 'Roboto-Black',
  },
  OpenSans: {
    '300': 'OpenSans-Light',
    '400': 'OpenSans-Regular',
    'normal': 'OpenSans-Regular',
    '500': 'OpenSans-Medium',
    '600': 'OpenSans-SemiBold',
    '700': 'OpenSans-Bold',
    'bold': 'OpenSans-Bold',
    '800': 'OpenSans-ExtraBold',
    '900': 'OpenSans-ExtraBold',
  },
  Montserrat: {
    '300': 'Montserrat-Light',
    '400': 'Montserrat-Regular',
    'normal': 'Montserrat-Regular',
    '500': 'Montserrat-Medium',
    '600': 'Montserrat-SemiBold',
    '700': 'Montserrat-Bold',
    'bold': 'Montserrat-Bold',
    '800': 'Montserrat-ExtraBold',
    '900': 'Montserrat-Black',
  },
  Poppins: {
    '300': 'Poppins-Light',
    '400': 'Poppins-Regular',
    'normal': 'Poppins-Regular',
    '500': 'Poppins-Medium',
    '600': 'Poppins-SemiBold',
    '700': 'Poppins-Bold',
    'bold': 'Poppins-Bold',
    '800': 'Poppins-ExtraBold',
    '900': 'Poppins-Black',
  },
  Lato: {
    '300': 'Lato-Light',
    '400': 'Lato-Regular',
    'normal': 'Lato-Regular',
    '500': 'Lato-Regular',
    '600': 'Lato-Bold',
    '700': 'Lato-Bold',
    'bold': 'Lato-Bold',
    '800': 'Lato-Black',
    '900': 'Lato-Black',
  },
  Raleway: {
    '300': 'Raleway-Light',
    '400': 'Raleway-Regular',
    'normal': 'Raleway-Regular',
    '500': 'Raleway-Medium',
    '600': 'Raleway-SemiBold',
    '700': 'Raleway-Bold',
    'bold': 'Raleway-Bold',
    '800': 'Raleway-ExtraBold',
    '900': 'Raleway-Black',
  },
};

const FONT_STORAGE_KEY = '@cashbook_selected_font';

interface FontContextType {
  selectedFont: FontFamily;
  setSelectedFont: (font: FontFamily) => Promise<void>;
  isLoading: boolean;
}

const FontContext = createContext<FontContextType | null>(null);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [selectedFont, setFont] = useState<FontFamily>('Inter');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFont() {
      try {
        const stored = await AsyncStorage.getItem(FONT_STORAGE_KEY);
        if (stored && FONT_OPTIONS.some((f) => f.key === stored)) {
          setFont(stored as FontFamily);
        }
      } catch (error) {
        console.error('Failed to load font preference:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFont();
  }, []);

  const setSelectedFont = useCallback(async (font: FontFamily) => {
    try {
      await AsyncStorage.setItem(FONT_STORAGE_KEY, font);
      setFont(font);
    } catch (error) {
      console.error('Failed to save font preference:', error);
    }
  }, []);

  return (
    <FontContext.Provider value={{ selectedFont, setSelectedFont, isLoading }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
