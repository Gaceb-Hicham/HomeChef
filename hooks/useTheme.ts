import { useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Rounded, Shadows } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return {
    colors,
    typography: Typography,
    spacing: Spacing,
    rounded: Rounded,
    shadows: Shadows,
    isDark,
  };
}

export type ThemeColors = typeof Colors.light;
