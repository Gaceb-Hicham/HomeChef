import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  safeArea?: boolean;
  backgroundColor?: string;
}

export function ScreenWrapper({
  children,
  style,
  padded = true,
  safeArea = true,
  backgroundColor,
}: ScreenWrapperProps) {
  const { colors, spacing, isDark } = useTheme();
  const bgColor = backgroundColor || colors.background;

  const content = (
    <View
      style={[
        { flex: 1, backgroundColor: bgColor },
        padded && { paddingHorizontal: spacing.xl },
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}
