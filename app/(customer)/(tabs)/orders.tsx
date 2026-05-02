import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const MOCK_ORDERS = [
  { id: '1', title: 'Couscous Royal', chef: 'Sarah K.', status: 'preparing', price: 850, date: 'Today', emoji: '🍲' },
  { id: '2', title: 'Baklava Box', chef: 'Ahmed M.', status: 'delivered', price: 450, date: 'Yesterday', emoji: '🍰' },
  { id: '3', title: 'Grilled Chicken', chef: 'Karim B.', status: 'delivered', price: 750, date: '28 Apr', emoji: '🍗', reviewed: true },
];

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  received: { color: '#0369a1', bg: '#e0f2fe', label: 'Received' },
  preparing: { color: '#b45309', bg: '#fef3c7', label: 'Preparing' },
  ready: { color: '#7c3aed', bg: '#ede9fe', label: 'Ready' },
  out_for_delivery: { color: '#0284c7', bg: '#e0f2fe', label: 'On the way' },
  delivered: { color: '#15803d', bg: '#dcfce7', label: 'Delivered' },
  cancelled: { color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
};

export default function OrdersScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const activeOrders = MOCK_ORDERS.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = MOCK_ORDERS.filter((o) => ['delivered', 'cancelled'].includes(o.status));
  const data = tab === 'active' ? activeOrders : pastOrders;

  return (
    <ScreenWrapper>
      <Text style={[styles.title, { color: colors.onBackground }]}>My Orders</Text>
      {/* Tab switcher */}
      <View style={[styles.tabs, { backgroundColor: colors.surfaceContainerLow }]}>
        {(['active', 'past'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.outline }]}>
              {t === 'active' ? 'Active' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={data} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8 }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No {tab} orders</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sc = statusConfig[item.status];
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
              onPress={() => router.push(`/(customer)/track/${item.id}`)}>
              <View style={[styles.cardImg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.title}</Text>
                <Text style={[styles.cardChef, { color: colors.onSurfaceVariant }]}>{item.chef} · {item.date}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} DA</Text>
                {item.status === 'delivered' && !(item as any).reviewed && (
                  <TouchableOpacity onPress={() => router.push(`/(customer)/review/${item.id}`)}
                    style={[styles.reviewBtn, { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 15, marginTop: 12 },
  card: { flexDirection: 'row', padding: 14, borderRadius: 16, marginBottom: 10, gap: 12, alignItems: 'center' },
  cardImg: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  cardChef: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  statusText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600' },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700' },
  reviewBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
});
