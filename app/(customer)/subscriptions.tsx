import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionsApi } from '@/lib/api';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => { fetchSubs(); }, []);

  const fetchSubs = async () => {
    if (!profile?.id) return;
    const { data } = await subscriptionsApi.getByCustomer(profile.id);
    setSubs(data || []);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await subscriptionsApi.toggle(id, !currentActive);
    showToast(currentActive ? 'Subscription paused' : 'Subscription resumed!', currentActive ? 'info' : 'success');
    fetchSubs();
  };

  const handleCancel = (id: string) => {
    crossAlert('Cancel Subscription', 'Are you sure? You won\'t receive this recurring order anymore.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: async () => {
        await subscriptionsApi.cancel(id);
        showToast('Subscription cancelled', 'info');
        fetchSubs();
      }},
    ]);
  };

  const activeSubs = subs.filter(s => s.is_active);
  const pausedSubs = subs.filter(s => !s.is_active);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>🔁 Subscriptions</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={{ color: colors.onSurfaceVariant, marginBottom: 20, lineHeight: 20 }}>
          Subscribe to your favorite chefs for weekly or biweekly automatic orders with loyalty discounts!
        </Text>

        {subs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No subscriptions yet</Text>
            <Text style={{ color: colors.outline, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Visit a chef's profile and subscribe to their weekly dishes
            </Text>
          </View>
        ) : (
          <>
            {activeSubs.length > 0 && (
              <>
                <Text style={[styles.section, { color: colors.onBackground }]}>Active ({activeSubs.length})</Text>
                {activeSubs.map((sub) => (
                  <View key={sub.id} style={[styles.subCard, { backgroundColor: colors.surfaceContainerLowest, borderLeftColor: '#16a34a', ...shadows.sm }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{sub.item_title}</Text>
                      <View style={[styles.activeBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                      from {sub.chef?.full_name || 'Chef'} {sub.chef?.chef_profiles?.kitchen_name ? `(${sub.chef.chef_profiles.kitchen_name})` : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                      <View style={styles.infoChip}><Ionicons name="calendar" size={12} color={colors.outline} /><Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>Every {sub.preferred_day}</Text></View>
                      <View style={styles.infoChip}><Ionicons name="repeat" size={12} color={colors.outline} /><Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>{sub.frequency}</Text></View>
                      <View style={styles.infoChip}><Ionicons name="cube" size={12} color={colors.outline} /><Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>x{sub.quantity}</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 17 }}>{sub.price} DA</Text>
                      {sub.discount_percentage > 0 && (
                        <View style={[styles.discountBadge, { backgroundColor: '#fef3c7' }]}>
                          <Text style={{ color: '#b45309', fontSize: 11, fontWeight: '700' }}>-{sub.discount_percentage}% loyalty</Text>
                        </View>
                      )}
                    </View>
                    {sub.next_order_date && (
                      <Text style={{ color: colors.outline, fontSize: 12, marginTop: 6 }}>Next order: {sub.next_order_date}</Text>
                    )}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TouchableOpacity style={[styles.subBtn, { backgroundColor: '#fef3c7' }]} onPress={() => handleToggle(sub.id, true)}>
                        <Ionicons name="pause" size={14} color="#b45309" /><Text style={{ color: '#b45309', fontWeight: '600', marginLeft: 4 }}>Pause</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.subBtn, { backgroundColor: '#fce4ec' }]} onPress={() => handleCancel(sub.id)}>
                        <Ionicons name="close" size={14} color="#dc2626" /><Text style={{ color: '#dc2626', fontWeight: '600', marginLeft: 4 }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {pausedSubs.length > 0 && (
              <>
                <Text style={[styles.section, { color: colors.onBackground }]}>Paused ({pausedSubs.length})</Text>
                {pausedSubs.map((sub) => (
                  <View key={sub.id} style={[styles.subCard, { backgroundColor: colors.surfaceContainerLowest, borderLeftColor: colors.outline, ...shadows.sm, opacity: 0.7 }]}>
                    <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{sub.item_title}</Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>from {sub.chef?.full_name}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity style={[styles.subBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleToggle(sub.id, false)}>
                        <Ionicons name="play" size={14} color="#16a34a" /><Text style={{ color: '#16a34a', fontWeight: '600', marginLeft: 4 }}>Resume</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.subBtn, { backgroundColor: '#fce4ec' }]} onPress={() => handleCancel(sub.id)}>
                        <Ionicons name="trash" size={14} color="#dc2626" /><Text style={{ color: '#dc2626', fontWeight: '600', marginLeft: 4 }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  subCard: { padding: 18, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center' },
  discountBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  subBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
