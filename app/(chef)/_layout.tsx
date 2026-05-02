import { Stack } from 'expo-router';

export default function ChefLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ presentation: 'card' }} />
      <Stack.Screen name="create-post" options={{ presentation: 'modal' }} />
      <Stack.Screen name="archive" options={{ presentation: 'card' }} />
    </Stack>
  );
}
