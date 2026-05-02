import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="offer/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="chef/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
      <Stack.Screen name="track/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="review/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="saved" options={{ presentation: 'card' }} />
    </Stack>
  );
}
