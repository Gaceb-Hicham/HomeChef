import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function ChefTabLayout() {
  const { colors, shadows } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.outline,
      tabBarStyle: {
        backgroundColor: colors.surfaceContainerLowest,
        borderTopColor: colors.outlineVariant, borderTopWidth: 0.5,
        height: 88, paddingBottom: 28, paddingTop: 10, ...shadows.sm,
      },
      tabBarLabelStyle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="dashboard" options={{
        title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
      }} />
      <Tabs.Screen name="orders" options={{
        title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
      }} />
      <Tabs.Screen name="earnings" options={{
        title: 'Earnings', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
