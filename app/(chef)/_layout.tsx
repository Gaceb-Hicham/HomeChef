import { Stack } from 'expo-router';

export default function ChefLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ presentation: 'card' }} />
      <Stack.Screen name="create-post" options={{ presentation: 'modal' }} />
      <Stack.Screen name="archive" options={{ presentation: 'card' }} />
      <Stack.Screen name="manage-post" options={{ presentation: 'card' }} />
      <Stack.Screen name="prep-menu" options={{ presentation: 'card' }} />
      <Stack.Screen name="prep-requests" options={{ presentation: 'card' }} />
      <Stack.Screen name="specialties" options={{ presentation: 'card' }} />
      <Stack.Screen name="flash-sale" options={{ presentation: 'card' }} />
      <Stack.Screen name="teaser" options={{ presentation: 'card' }} />
      <Stack.Screen name="reviews" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="chat" options={{ presentation: 'card' }} />
    </Stack>
  );
}
