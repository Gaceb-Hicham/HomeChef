import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore } from '@/stores/ordersStore';
import { useChefProfileStore } from '@/stores/appStores';
import { useRealtimeChefOrders } from '@/hooks/useRealtime';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';



export default function DashboardScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { chefOrders, fetchChefOrders, dailyEarnings, weeklyEarnings, fetchEarnings, handleNewChefOrder } = useOrdersStore();
  const { chefProfile, fetchProfile, toggleKitchen } = useChefProfileStore();

  // Subscribe to real-time incoming orders
  useRealtimeChefOrders(profile?.id || '', (order) => {
    handleNewChefOrder(order);
    Alert.alert('🔔 New Order!', `You have a new order`, [{ text: 'View', onPress: () => router.push('/(chef)/(tabs)/orders') }]);
  });

  // Fetch data on mount
  useEffect(() => {
    if (profile?.id) {
      fetchChefOrders(profile.id);
      fetchEarnings(profile.id);
      fetchProfile(profile.id);
    }
  }, [profile?.id]);

  const handleToggleKitchen = useCallback(async () => {
    if (!profile?.id) return;
    const newState = !chefProfile?.is_open;
    await toggleKitchen(profile.id, newState);
  }, [profile?.id, chefProfile?.is_open]);

  // Build stats
  const todayOrders = chefOrders.filter((o) => {
    const today = new Date().toISOString().split('T')[0];
    return o.created_at?.startsWith(today);
  });

  const pendingOrders = chefOrders.filter((o) =>
    ['received', 'preparing', 'ready'].includes(o.order_status)
  );

  const stats = [
    { label: "Today's Orders", value: todayOrders.length.toString(), icon: 'receipt', color: '#0369a1', bg: '#e0f2fe' },
    { label: "Today's Revenue", value: dailyEarnings ? `${dailyEarnings.total.toLocaleString()} DA` : '0 DA', icon: 'wallet', color: '#15803d', bg: '#dcfce7' },
    { label: 'Pending', value: pendingOrders.length.toString(), icon: 'time', color: '#b45309', bg: '#fef3c7' },
    { label: 'Avg Rating', value: chefProfile?.rating_average ? `${chefProfile.rating_average} ⭐` : '- ⭐', icon: 'star', color: '#7c3aed', bg: '#ede9fe' },
  ];

  // Use real orders only
  const recentOrders = chefOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.customer?.full_name || 'Customer',
      dish: o.post?.title || 'Order',
      qty: o.quantity,
      order_status: o.order_status,
      time: getTimeAgo(o.created_at),
    }));

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.onSurfaceVariant }]}>Welcome back</Text>
            <Text style={[styles.name, { color: colors.onBackground }]}>
              {profile?.full_name || 'Chef'} 👨‍🍳
            </Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={() => router.push('/(customer)/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Kitchen status banner */}
        <TouchableOpacity
          onPress={handleToggleKitchen}
          style={[styles.banner, { backgroundColor: chefProfile?.is_open !== false ? colors.primaryFixed : '#fee2e2' }]}
        >
          <View style={[styles.bannerDot, { backgroundColor: chefProfile?.is_open !== false ? '#22c55e' : '#ef4444' }]} />
          <Text style={[styles.bannerText, { color: chefProfile?.is_open !== false ? colors.primary : '#dc2626' }]}>
            Your kitchen is {chefProfile?.is_open !== false ? 'open' : 'closed'}
          </Text>
          <Text style={{ color: chefProfile?.is_open !== false ? colors.primary : '#dc2626', fontSize: 13, fontWeight: '600' }}>
            {chefProfile?.is_open !== false ? 'Close' : 'Open'}
          </Text>
        </TouchableOpacity>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Post CTA */}
        <Button title="📝  Post Today's Special" onPress={() => router.push('/(chef)/create-post')} size="lg" />

        {/* Recent orders */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(chef)/(tabs)/orders')}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>View all</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.map((order: any) => (
          <View key={order.id} style={[styles.orderRow, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.orderAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.orderCustomer, { color: colors.onSurface }]}>{order.customer}</Text>
              <Text style={[styles.orderDish, { color: colors.onSurfaceVariant }]}>{order.dish} x{order.qty}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.miniStatus, {
                backgroundColor: order.order_status === 'received' ? '#e0f2fe' : order.order_status === 'preparing' ? '#fef3c7' : '#dcfce7',
              }]}>
                <Text style={[styles.miniStatusText, {
                  color: order.order_status === 'received' ? '#0369a1' : order.order_status === 'preparing' ? '#b45309' : '#15803d',
                }]}>{order.order_status}</Text>
              </View>
              <Text style={[styles.orderTime, { color: colors.outline }]}>{order.time}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  greeting: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, marginBottom: 2 },
  name: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 20, gap: 8 },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  bannerText: { flex: 1, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', padding: 16, borderRadius: 16 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, fontWeight: '700' },
  statLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600' },
  orderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, gap: 12 },
  orderAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  orderCustomer: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  orderDish: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  miniStatusText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  orderTime: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 4 },
});
