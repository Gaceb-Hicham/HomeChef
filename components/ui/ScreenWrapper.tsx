import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

const MAX_WIDTH = 480;

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  safeArea?: boolean;
  backgroundColor?: string;
  /** Set to true to allow full-width on desktop (e.g. for pages with their own layout) */
  fullWidth?: boolean;
}

export function ScreenWrapper({
  children,
  style,
  padded = true,
  safeArea = true,
  backgroundColor,
  fullWidth = false,
}: ScreenWrapperProps) {
  const { colors, spacing, isDark } = useTheme();
  const bgColor = backgroundColor || colors.background;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > MAX_WIDTH;

  const innerContent = (
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

  // On desktop web, center content in a phone-sized column with soft shadow
  const wrappedContent = (isDesktop && !fullWidth) ? (
    <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLow, alignItems: 'center' }}>
      <View style={{
        flex: 1,
        width: MAX_WIDTH,
        maxWidth: MAX_WIDTH,
        backgroundColor: bgColor,
        // Soft elevation shadow on sides
        ...(Platform.OS === 'web' ? {
          boxShadow: '0 0 30px rgba(0,0,0,0.08)',
        } as any : {}),
      }}>
        {innerContent}
      </View>
    </View>
  ) : innerContent;

  if (safeArea) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDesktop && !fullWidth ? colors.surfaceContainerLow : bgColor }}>
        {wrappedContent}
      </SafeAreaView>
    );
  }

  return wrappedContent;
}
