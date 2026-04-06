import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '../../lib/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    ...styles.button,
    ...(variant === 'primary' && styles.primaryButton),
    ...(variant === 'secondary' && styles.secondaryButton),
    ...(variant === 'ghost' && styles.ghostButton),
    ...(isDisabled && styles.disabledButton),
  };

  const labelStyle: TextStyle = {
    ...styles.label,
    ...(variant !== 'primary' && styles.secondaryLabel),
    ...(variant === 'ghost' && styles.ghostLabel),
    ...(isDisabled && styles.disabledLabel),
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : COLORS.accent} />
      ) : (
        <Text style={[labelStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryButton: {
    backgroundColor: COLORS.accentLight,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryLabel: {
    color: COLORS.accent,
  },
  ghostLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  disabledLabel: {
    color: COLORS.textSecondary,
  },
});
