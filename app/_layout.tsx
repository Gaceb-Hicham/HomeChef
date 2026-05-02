import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { initializePayments } from '@/lib/payments';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Initialize i18n (side-effect import)
import '@/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setSession, fetchProfile, setIsLoading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    'NotoSerif-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'NotoSerif-Bold': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'PlusJakartaSans-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile();
      }
      setIsLoading(false);
    });

    // Initialize payments
    initializePayments();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(chef)" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}

