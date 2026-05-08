import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { profile, isDemoMode } = useAuthStore();

  // If demo mode or logged in, go to the correct dashboard
  if (profile && (isDemoMode || profile.id)) {
    if (profile.role === 'chef') {
      return <Redirect href="/(chef)/(tabs)/dashboard" />;
    }
    return <Redirect href="/(customer)/(tabs)/home" />;
  }

  // Otherwise go to login
  return <Redirect href="/(auth)/login" />;
}
