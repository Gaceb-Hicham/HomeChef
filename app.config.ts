import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HomeChef',
  slug: 'HomeChef',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'homechef',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#8d4b00',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.homechef.app',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'HomeChef needs your location to show you nearby home chefs.',
      NSCameraUsageDescription: 'HomeChef needs camera access to take photos of your dishes.',
      NSPhotoLibraryUsageDescription: 'HomeChef needs photo library access to upload dish photos.',
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '',
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#8d4b00',
    },
    edgeToEdgeEnabled: true,
    package: 'com.homechef.app',
    versionCode: 1,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '',
      },
    },
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
    name: 'HomeChef - Homemade Food Marketplace',
    description: 'Order fresh homemade dishes from talented local chefs in your neighborhood.',
    themeColor: '#8d4b00',
    backgroundColor: '#FEFBF6',
    lang: 'en',
  },

  plugins: [
    'expo-router',
    'expo-location',
    [
      '@stripe/stripe-react-native',
      {
        merchantIdentifier: 'merchant.com.homechef',
        enableGooglePay: true,
      },
    ],
    'expo-localization',
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: 'your-eas-project-id',
    },
  },

  updates: {
    url: 'https://u.expo.dev/your-eas-project-id',
  },

  runtimeVersion: {
    policy: 'appVersion',
  },
});
