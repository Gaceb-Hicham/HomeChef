import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword,
  style,
  ...props
}: InputProps) {
  const { colors, rounded, spacing } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.outlineVariant;

  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans-SemiBold',
            fontSize: 14,
            fontWeight: '600',
            color: colors.onSurface,
            marginBottom: spacing.sm,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: rounded.lg,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: spacing.lg,
          minHeight: 52,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.onSurfaceVariant}
            style={{ marginRight: spacing.sm }}
          />
        )}

        <TextInput
          style={[
            {
              flex: 1,
              fontFamily: 'PlusJakartaSans-Regular',
              fontSize: 15,
              color: colors.onSurface,
              paddingVertical: 14,
            },
            style,
          ]}
          placeholderTextColor={colors.outline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans-Regular',
            fontSize: 12,
            color: colors.error,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}

      {hint && !error && (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans-Regular',
            fontSize: 12,
            color: colors.onSurfaceVariant,
            marginTop: 4,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}
