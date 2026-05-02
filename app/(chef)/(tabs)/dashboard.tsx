import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const QUICK_ORDERS = [
  { id: '1', customer: 'Ali K.', dish: 'Couscous Royal', qty: 2, status: 'received', time: '2 min ago' },
  { id: '2', customer: 'Nour S.', dish: 'Baklava Box', qty: 1, status: 'preparing', time: '15 min ago' },
  { id: '3', customer: 'Riad M.', dish: 'Couscous Royal', qty: 3, status: 'ready', time: '30 min ago' },
];

export default function DashboardScreen() {
  const { colors, shadows, spacing } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const stats = [
    { label: "Today's Orders", value: '12', icon: 'receipt', color: '#0369a1', bg: '#e0f2fe' },
    { label: "Today's Revenue", value: '8,450 DA', icon: 'wallet', color: '#15803d', bg: '#dcfce7' },
    { label: 'Pending', value: '3', icon: 'time', color: '#b45309', bg: '#fef3c7' },
    { label: 'Avg Rating', value: '4.8 ⭐', icon: 'star', color: '#7c3aed', bg: '#ede9fe' },
  ];

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
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Status banner */}
        <View style={[styles.banner, { backgroundColor: colors.primaryFixed }]}>
          <View style={[styles.bannerDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.bannerText, { color: colors.primary }]}>Your kitchen is open</Text>
          <TouchableOpacity><Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Close</Text></TouchableOpacity>
        </View>

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
          <TouchableOpacity><Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>View all</Text></TouchableOpacity>
        </View>

        {QUICK_ORDERS.map((order) => (
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
                backgroundColor: order.status === 'received' ? '#e0f2fe' : order.status === 'preparing' ? '#fef3c7' : '#dcfce7',
              }]}>
                <Text style={[styles.miniStatusText, {
                  color: order.status === 'received' ? '#0369a1' : order.status === 'preparing' ? '#b45309' : '#15803d',
                }]}>{order.status}</Text>
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
