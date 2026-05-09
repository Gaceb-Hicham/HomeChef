import { useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Rounded, Shadows } from '@/constants/theme';
import { useThemeStore } from '@/stores/themeStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  // Determine effective scheme
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return {
    colors,
    typography: Typography,
    spacing: Spacing,
    rounded: Rounded,
    shadows: isDark
      ? {
          sm: { ...Shadows.sm, shadowColor: 'rgba(0, 0, 0, 0.3)' },
          md: { ...Shadows.md, shadowColor: 'rgba(0, 0, 0, 0.4)' },
          lg: { ...Shadows.lg, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        }
      : Shadows,
    isDark,
  };
}

export type ThemeColors = typeof Colors.light;
