import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionsApi } from '@/lib/api';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function ChefSubscriptionsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchSubs(); }, []);

  const fetchSubs = async () => {
    if (!profile?.id) return;
    // Get ALL subs for this chef (active + pending)
    const { data } = await subscriptionsApi.getByChef(profile.id);
    setSubs(data || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubs();
    setRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    await subscriptionsApi.toggle(id, true);
    showToast('Subscription approved! ✅', 'success');
    fetchSubs();
  };

  const handleReject = (id: string) => {
    crossAlert('Reject Subscription', 'Are you sure you want to reject this subscription request?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        await subscriptionsApi.cancel(id);
        showToast('Subscription rejected', 'info');
        fetchSubs();
      }},
    ]);
  };

  const handlePause = async (id: string) => {
    await subscriptionsApi.toggle(id, false);
    showToast('Subscription paused', 'info');
    fetchSubs();
  };

  // Separate pending (is_active=false) from active
  const pendingSubs = subs.filter(s => !s.is_active);
  const activeSubs = subs.filter(s => s.is_active);

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>📋 Subscriptions</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={[styles.statCard, { backgroundColor: '#dcfce7', flex: 1 }]}>
            <Text style={{ color: '#166534', fontSize: 28, fontWeight: '800' }}>{activeSubs.length}</Text>
            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7', flex: 1 }]}>
            <Text style={{ color: '#92400e', fontSize: 28, fontWeight: '800' }}>{pendingSubs.length}</Text>
            <Text style={{ color: '#b45309', fontSize: 12, fontWeight: '600' }}>Pending</Text>
          </View>
        </View>

        {/* Pending Requests */}
        {pendingSubs.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.onBackground }]}>⏳ Pending Requests</Text>
            {pendingSubs.map((sub) => (
              <View key={sub.id} style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderLeftColor: '#f59e0b', ...shadows.sm }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AvatarImage uri={sub.customer?.profile_photo_url} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15 }}>{sub.customer?.full_name}</Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>wants to subscribe</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.detailItem}>
                    <Ionicons name="restaurant" size={14} color={colors.primary} />
                    <Text style={{ color: colors.onSurface, fontSize: 13, marginLeft: 4 }}>{sub.item_title}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="repeat" size={14} color={colors.primary} />
                    <Text style={{ color: colors.onSurface, fontSize: 13, marginLeft: 4 }}>{sub.frequency}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="today" size={14} color={colors.primary} />
                    <Text style={{ color: colors.onSurface, fontSize: 13, marginLeft: 4 }}>{sub.preferred_day}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="layers" size={14} color={colors.primary} />
                    <Text style={{ color: colors.onSurface, fontSize: 13, marginLeft: 4 }}>{sub.quantity}x · {sub.price} DA</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a', flex: 1 }]}
                    onPress={() => handleApprove(sub.id)}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#dc2626', flex: 1 }]}
                    onPress={() => handleReject(sub.id)}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Active Subscribers */}
        {activeSubs.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.onBackground }]}>✅ Active Subscribers</Text>
            {activeSubs.map((sub) => (
              <View key={sub.id} style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderLeftColor: '#16a34a', ...shadows.sm }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <AvatarImage uri={sub.customer?.profile_photo_url} size={32} />
                  <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15, flex: 1 }}>{sub.customer?.full_name}</Text>
                  <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: '#166534', fontSize: 11, fontWeight: '700' }}>Active</Text>
                  </View>
                </View>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                  {sub.item_title} · {sub.quantity}x · {sub.frequency} · {sub.preferred_day}
                </Text>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14, marginTop: 4 }}>
                  {sub.price} DA / delivery
                </Text>
                <TouchableOpacity
                  onPress={() => handlePause(sub.id)}
                  style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#f59e0b' }}
                >
                  <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>Pause</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {subs.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No subscribers yet</Text>
            <Text style={{ color: colors.outline, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
              Customers can subscribe from your profile for recurring orders
            </Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  statCard: {
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  card: {
    padding: 16, borderRadius: 14, marginBottom: 12, borderLeftWidth: 4,
  },
  detailRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 10, borderRadius: 10,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10,
  },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
