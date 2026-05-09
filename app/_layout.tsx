import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { initializePayments } from '@/lib/payments';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';

// Initialize i18n (side-effect import)
import '@/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setSession, fetchProfile, setIsLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'NotoSerif-Regular': require('@expo-google-fonts/noto-serif/400Regular/NotoSerif_400Regular.ttf'),
    'NotoSerif-Bold': require('@expo-google-fonts/noto-serif/700Bold/NotoSerif_700Bold.ttf'),
    'PlusJakartaSans-Regular': require('@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'),
    'PlusJakartaSans-SemiBold': require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
  });

  useEffect(() => {
    // Listen for auth state changes (including OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile();

        // Auto-navigate after OAuth sign-in (Google redirect)
        if (event === 'SIGNED_IN') {
          const profile = useAuthStore.getState().profile;
          const inAuthGroup = segments[0] === '(auth)';
          // Only navigate if user is still on auth screens
          if (inAuthGroup || !segments[0]) {
            setTimeout(() => {
              if (profile?.role === 'chef') {
                router.replace('/(chef)/(tabs)/dashboard');
              } else {
                router.replace('/(customer)/(tabs)/home');
              }
            }, 300);
          }
        }
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
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(chef)" options={{ headerShown: false }} />
        </Stack>
      </ToastProvider>
    </ErrorBoundary>
  );
}

