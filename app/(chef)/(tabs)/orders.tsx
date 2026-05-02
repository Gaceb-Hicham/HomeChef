import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore } from '@/stores/ordersStore';
import { ScreenWrapper, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const STATUS_TABS = ['All', 'received', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const STATUS_FLOW: Record<string, string> = {
  received: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  received: { bg: '#e0f2fe', text: '#0369a1' },
  preparing: { bg: '#fef3c7', text: '#b45309' },
  ready: { bg: '#dcfce7', text: '#15803d' },
  out_for_delivery: { bg: '#ede9fe', text: '#7c3aed' },
  delivered: { bg: '#d1fae5', text: '#065f46' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

const MOCK_ORDERS = [
  { id: '1', customer: { full_name: 'Ali K.', phone: '0550123456' }, post: { title: 'Couscous Royal', photos: [] }, quantity: 2, total_price: 1700, order_status: 'received', delivery_type: 'delivery', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: '2', customer: { full_name: 'Nour S.', phone: '0551234567' }, post: { title: 'Baklava Box', photos: [] }, quantity: 1, total_price: 450, order_status: 'preparing', delivery_type: 'pickup', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: '3', customer: { full_name: 'Riad M.', phone: '0552345678' }, post: { title: 'Couscous Royal', photos: [] }, quantity: 3, total_price: 2550, order_status: 'ready', delivery_type: 'delivery', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '4', customer: { full_name: 'Yasmine A.', phone: '0553456789' }, post: { title: 'Tajine Zitoune', photos: [] }, quantity: 1, total_price: 700, order_status: 'delivered', delivery_type: 'pickup', created_at: new Date(Date.now() - 7200000).toISOString() },
];

export default function ChefOrdersScreen() {
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { chefOrders, fetchChefOrders, updateOrderStatus, isLoading } = useOrdersStore();
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (profile?.id) fetchChefOrders(profile.id);
  }, [profile?.id]);

  const orders = chefOrders.length > 0 ? chefOrders : MOCK_ORDERS;
  const filtered = activeTab === 'All' ? orders : orders.filter((o: any) => o.order_status === activeTab);

  const handleAdvanceStatus = useCallback(async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;

    const { error } = await updateOrderStatus(orderId, nextStatus);
    if (error) {
      Alert.alert('Error', error);
    }
  }, []);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const renderOrder = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.order_status] || STATUS_COLORS.received;
    const nextStatus = STATUS_FLOW[item.order_status];
    const nextLabel = nextStatus ? `Mark as ${nextStatus.replace(/_/g, ' ')}` : null;

    return (
      <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.customerName, { color: colors.onSurface }]}>
              {item.customer?.full_name || 'Customer'}
            </Text>
            <Text style={[styles.dishName, { color: colors.onSurfaceVariant }]}>
              {item.post?.title || 'Order'} × {item.quantity}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.order_status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={[styles.cardMid, { borderColor: colors.outlineVariant }]}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 14 }}>{item.total_price} DA</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name={item.delivery_type === 'delivery' ? 'bicycle' : 'storefront'} size={16} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, textTransform: 'capitalize' }}>{item.delivery_type}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 13 }}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </View>

        {nextLabel && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleAdvanceStatus(item.id, item.order_status)}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 13 }}>{nextLabel}</Text>
            </TouchableOpacity>
            {item.customer?.phone && (
              <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: colors.outlineVariant }]}>
                <Ionicons name="call-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 }}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Orders</Text>
      </View>

      {/* Status tabs */}
      <FlatList data={STATUS_TABS} horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setActiveTab(item)}
            style={[styles.tab, { backgroundColor: activeTab === item ? colors.primary : colors.surfaceContainerLow, borderColor: activeTab === item ? colors.primary : colors.outlineVariant }]}>
            <Text style={{ color: activeTab === item ? colors.onPrimary : colors.onSurfaceVariant, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
              {item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(i) => i}
      />

      {/* Orders list */}
      <FlatList data={filtered} renderItem={renderOrder} keyExtractor={(i: any) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 8, fontSize: 15 }}>No orders in this category</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700' },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  card: { borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  customerName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  dishName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardMid: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 10, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnOutline: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
