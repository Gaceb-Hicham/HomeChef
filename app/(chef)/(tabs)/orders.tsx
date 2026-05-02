import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const MOCK = [
  { id: '1', customer: 'Ali K.', dish: 'Couscous Royal', qty: 2, status: 'received', time: '2m ago', price: 1700 },
  { id: '2', customer: 'Nour S.', dish: 'Baklava Box', qty: 1, status: 'preparing', time: '15m ago', price: 450 },
  { id: '3', customer: 'Riad M.', dish: 'Couscous Royal', qty: 3, status: 'ready', time: '30m ago', price: 2550 },
  { id: '4', customer: 'Lina B.', dish: 'Grilled Chicken', qty: 1, status: 'delivered', time: '1h ago', price: 750 },
];

const FILTERS = ['All', 'Received', 'Preparing', 'Ready', 'Delivered'];
const STATUS_MAP: Record<string, { color: string; bg: string; next?: string; nextLabel?: string }> = {
  received: { color: '#0369a1', bg: '#e0f2fe', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { color: '#b45309', bg: '#fef3c7', next: 'ready', nextLabel: 'Mark Ready' },
  ready: { color: '#7c3aed', bg: '#ede9fe', next: 'out_for_delivery', nextLabel: 'Out for Delivery' },
  out_for_delivery: { color: '#0284c7', bg: '#e0f2fe', next: 'delivered', nextLabel: 'Delivered' },
  delivered: { color: '#15803d', bg: '#dcfce7' },
};

export default function ChefOrdersScreen() {
  const { colors, shadows } = useTheme();
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState(MOCK);

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase());

  const updateStatus = (id: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <ScreenWrapper>
      <Text style={[styles.title, { color: colors.onBackground }]}>Orders</Text>
      {/* Filters */}
      <FlatList data={FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(i) => i}
        contentContainerStyle={{ gap: 8, marginBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setFilter(item)}
            style={[styles.chip, { backgroundColor: filter === item ? colors.primary : colors.surfaceContainerLow, borderColor: filter === item ? colors.primary : colors.outlineVariant }]}>
            <Text style={{ color: filter === item ? colors.onPrimary : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList data={filtered} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 12, fontSize: 15 }}>No orders</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sc = STATUS_MAP[item.status] || STATUS_MAP.delivered;
          return (
            <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.custName, { color: colors.onSurface }]}>{item.customer}</Text>
                  <Text style={[styles.dishText, { color: colors.onSurfaceVariant }]}>{item.dish} x{item.qty}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.priceText, { color: colors.primary }]}>{item.price} DA</Text>
                  <Text style={[styles.timeText, { color: colors.outline }]}>{item.time}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{item.status.replace('_', ' ')}</Text>
                </View>
                {sc.next && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => updateStatus(item.id, sc.next!)}>
                    <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: '600' }}>{sc.nextLabel}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  card: { padding: 16, borderRadius: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  custName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  dishText: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginTop: 2 },
  priceText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700' },
  timeText: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
});
