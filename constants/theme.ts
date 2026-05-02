/**
 * HomeChef Design System — "Artisan Hearth"
 * Extracted from Stitch project: HomeChef Artisan Marketplace
 *
 * Color palette: Saffron primary + Terracotta secondary + warm cream surfaces
 * Typography: Noto Serif (headlines) + Plus Jakarta Sans (body/labels)
 * Spacing: 8px base grid
 */

export const Colors = {
  light: {
    // Primary — Saffron
    primary: '#8d4b00',
    primaryContainer: '#b15f00',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#fffbff',
    inversePrimary: '#ffb77d',

    // Secondary — Terracotta
    secondary: '#a53c19',
    secondaryContainer: '#fb7b54',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#6b1a00',

    // Tertiary — Deep Terracotta
    tertiary: '#904821',
    tertiaryContainer: '#af5f36',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#fffbff',

    // Error
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',

    // Surface / Background — Warm Cream
    background: '#f8f9ff',
    surface: '#f8f9ff',
    surfaceDim: '#d0dbed',
    surfaceBright: '#f8f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#eff4ff',
    surfaceContainer: '#e6eeff',
    surfaceContainerHigh: '#dee9fc',
    surfaceContainerHighest: '#d9e3f6',
    surfaceVariant: '#d9e3f6',

    // On Surface
    onBackground: '#121c2a',
    onSurface: '#121c2a',
    onSurfaceVariant: '#554336',
    inverseSurface: '#27313f',
    inverseOnSurface: '#eaf1ff',

    // Outline
    outline: '#887364',
    outlineVariant: '#dbc2b0',

    // Tint
    surfaceTint: '#904d00',

    // Fixed
    primaryFixed: '#ffdcc3',
    primaryFixedDim: '#ffb77d',
    secondaryFixed: '#ffdbd1',
    secondaryFixedDim: '#ffb59f',
    tertiaryFixed: '#ffdbcc',
    tertiaryFixedDim: '#ffb693',
  },

  dark: {
    // Primary
    primary: '#ffb77d',
    primaryContainer: '#6e3900',
    onPrimary: '#4d2600',
    onPrimaryContainer: '#ffdcc3',
    inversePrimary: '#8d4b00',

    // Secondary
    secondary: '#ffb59f',
    secondaryContainer: '#842503',
    onSecondary: '#5c1900',
    onSecondaryContainer: '#ffdbd1',

    // Tertiary
    tertiary: '#ffb693',
    tertiaryContainer: '#76330d',
    onTertiary: '#562000',
    onTertiaryContainer: '#ffdbcc',

    // Error
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    onErrorContainer: '#ffdad6',

    // Surface
    background: '#121c2a',
    surface: '#121c2a',
    surfaceDim: '#121c2a',
    surfaceBright: '#384456',
    surfaceContainerLowest: '#0d1620',
    surfaceContainerLow: '#1a2534',
    surfaceContainer: '#1e2938',
    surfaceContainerHigh: '#293443',
    surfaceContainerHighest: '#343f4e',
    surfaceVariant: '#554336',

    // On Surface
    onBackground: '#e0e2ef',
    onSurface: '#e0e2ef',
    onSurfaceVariant: '#dbc2b0',
    inverseSurface: '#e0e2ef',
    inverseOnSurface: '#27313f',

    // Outline
    outline: '#a48e7f',
    outlineVariant: '#554336',

    // Tint
    surfaceTint: '#ffb77d',

    // Fixed
    primaryFixed: '#ffdcc3',
    primaryFixedDim: '#ffb77d',
    secondaryFixed: '#ffdbd1',
    secondaryFixedDim: '#ffb59f',
    tertiaryFixed: '#ffdbcc',
    tertiaryFixedDim: '#ffb693',
  },
};

export const Typography = {
  headline: {
    fontFamily: 'NotoSerif',
    h1: { fontSize: 48, fontWeight: '700' as const, lineHeight: 57.6, letterSpacing: -0.96 },
    h2: { fontSize: 36, fontWeight: '600' as const, lineHeight: 45 },
    h3: { fontSize: 28, fontWeight: '600' as const, lineHeight: 36.4 },
  },
  body: {
    fontFamily: 'PlusJakartaSans',
    lg: { fontSize: 18, fontWeight: '400' as const, lineHeight: 28.8 },
    md: { fontSize: 16, fontWeight: '400' as const, lineHeight: 25.6 },
    sm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22.4 },
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    lg: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22.4, letterSpacing: 0.16 },
    md: { fontSize: 14, fontWeight: '600' as const, lineHeight: 19.6, letterSpacing: 0.14 },
    sm: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16.8 },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  gutter: 24,
  margin: 32,
  base: 8,
};

export const Rounded = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: 'rgba(120, 53, 15, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(120, 53, 15, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(120, 53, 15, 0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
};
