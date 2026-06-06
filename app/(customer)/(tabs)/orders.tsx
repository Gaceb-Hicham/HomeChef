import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore } from '@/stores/ordersStore';
import { ScreenWrapper, PostImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { crossAlert } from '@/lib/crossAlert';
import { ORDER_STATUS, ACTIVE_ORDER_STATUSES } from '@/lib/constants';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  received: { bg: '#e0f2fe', text: '#0369a1', icon: 'receipt' },
  preparing: { bg: '#fef3c7', text: '#b45309', icon: 'flame' },
  ready: { bg: '#dcfce7', text: '#15803d', icon: 'checkmark-circle' },
  out_for_delivery: { bg: '#ede9fe', text: '#7c3aed', icon: 'bicycle' },
  delivered: { bg: '#d1fae5', text: '#065f46', icon: 'checkmark-done' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', icon: 'close-circle' },
};



export default function OrdersScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { activeOrders, pastOrders, fetchCustomerOrders, updateOrderStatus, isLoading } = useOrdersStore();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (!profile?.id) return;
    setRefreshing(true);
    await fetchCustomerOrders(profile.id);
    setRefreshing(false);
  };

  useEffect(() => {
    if (profile?.id) fetchCustomerOrders(profile.id);
  }, [profile?.id]);

  // Use real data only
  const active = activeOrders;
  const past = pastOrders;
  const data = tab === 'active' ? active : past;

  const getTimeLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderOrder = ({ item }: { item: any }) => {
    const sc = STATUS_COLORS[item.order_status] || STATUS_COLORS.received;

    return (
      <TouchableOpacity
        onPress={() => {
          if (ACTIVE_ORDER_STATUSES.includes(item.order_status)) {
            router.push(`/(customer)/track/${item.id}`);
          }
        }}
        style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
        <View style={styles.cardRow}>
          <PostImage photos={item.post?.photos} height={52} borderRadius={14} fallbackSize={28} style={{ width: 52 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.post?.title} × {item.quantity}</Text>
            <Text style={[styles.cardChef, { color: colors.onSurfaceVariant }]}>by {item.chef?.full_name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.total_price} DA</Text>
            <Text style={[styles.cardDate, { color: colors.outline }]}>{getTimeLabel(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon as any} size={14} color={sc.text} />
            <Text style={[styles.statusText, { color: sc.text }]}>{item.order_status.replace(/_/g, ' ')}</Text>
          </View>
          <View style={[styles.deliveryBadge, { backgroundColor: colors.surfaceContainerLow }]}>
            <Ionicons name={item.delivery_type === 'delivery' ? 'bicycle' : 'storefront'} size={12} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, textTransform: 'capitalize' }}>{item.delivery_type}</Text>
          </View>
          {tab === 'active' && item.order_status === ORDER_STATUS.RECEIVED && (
            <TouchableOpacity
              onPress={() => {
                crossAlert('Cancel Order', 'Are you sure you want to cancel this order?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    await updateOrderStatus(item.id, ORDER_STATUS.CANCELLED);
                    if (profile?.id) fetchCustomerOrders(profile.id);
                  }},
                ]);
              }}
              style={[styles.cancelBtn, { borderColor: '#dc2626' }]}>
              <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
              <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: '600', marginLeft: 3 }}>Cancel</Text>
            </TouchableOpacity>
          )}
          {tab === 'active' && item.order_status !== ORDER_STATUS.RECEIVED && (
            <Ionicons name="chevron-forward" size={18} color={colors.outline} style={{ marginLeft: 'auto' }} />
          )}
          {tab === 'past' && !item.review && item.order_status === ORDER_STATUS.DELIVERED && (
            <TouchableOpacity
              onPress={() => router.push(`/(customer)/review/${item.id}`)}
              style={[styles.reviewBtn, { borderColor: colors.primary }]}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{t('orders.leave_review')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 }}>
        <Text style={[styles.title, { color: colors.onBackground }]}>{t('orders.title')}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { paddingHorizontal: 20, marginBottom: 16 }]}>
        {(['active', 'past'] as const).map((tabKey) => (
          <TouchableOpacity key={tabKey} onPress={() => setTab(tabKey)}
            style={[styles.tab, { borderBottomColor: tab === tabKey ? colors.primary : 'transparent' }]}>
            <Text style={[styles.tabText, { color: tab === tabKey ? colors.primary : colors.onSurfaceVariant }]}>
              {tabKey === 'active' ? `${t('orders.active')} (${active.length})` : `${t('orders.past')} (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={data} renderItem={renderOrder} keyExtractor={(i: any) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 8, fontSize: 15 }}>
              {tab === 'active' ? t('orders.no_active') : t('orders.no_past')}
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 20 },
  tab: { paddingBottom: 8, borderBottomWidth: 2.5 },
  tabText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardImg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  cardChef: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, fontWeight: '700' },
  cardDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reviewBtn: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  cancelBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
});
