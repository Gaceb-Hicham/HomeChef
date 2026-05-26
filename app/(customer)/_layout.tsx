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
      <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="help" options={{ presentation: 'card' }} />
      <Stack.Screen name="about" options={{ presentation: 'card' }} />
      <Stack.Screen name="addresses" options={{ presentation: 'card' }} />
      <Stack.Screen name="chat" options={{ presentation: 'card' }} />
      <Stack.Screen name="prep-request" options={{ presentation: 'card' }} />
      <Stack.Screen name="prep-request-detail/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="preorder" options={{ presentation: 'card' }} />
      <Stack.Screen name="group-orders" options={{ presentation: 'card' }} />
      <Stack.Screen name="subscriptions" options={{ presentation: 'card' }} />
      <Stack.Screen name="dispute" options={{ presentation: 'card' }} />
      <Stack.Screen name="explore-map" options={{ presentation: 'card' }} />
      <Stack.Screen name="order-confirmation" options={{ presentation: 'card' }} />
    </Stack>
  );
}
