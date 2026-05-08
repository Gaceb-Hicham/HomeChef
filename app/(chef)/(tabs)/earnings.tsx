import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore } from '@/stores/ordersStore';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

const { width } = Dimensions.get('window');

export default function EarningsScreen() {
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { dailyEarnings, weeklyEarnings, monthlyEarnings, fetchEarnings } = useOrdersStore();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    if (profile?.id) fetchEarnings(profile.id);
  }, [profile?.id]);

  const currentEarnings = period === 'day' ? dailyEarnings : period === 'week' ? weeklyEarnings : monthlyEarnings;
  const total = currentEarnings?.total || 0;
  const count = currentEarnings?.count || 0;

  // Generate chart bars (7 bars for visual)
  const chartData = (() => {
    if (currentEarnings?.orders && currentEarnings.orders.length > 0) {
      const groups: Record<string, number> = {};
      currentEarnings.orders.forEach((o) => {
        const day = new Date(o.created_at).toLocaleDateString('en', { weekday: 'short' });
        groups[day] = (groups[day] || 0) + o.total_price;
      });
      return Object.entries(groups).map(([label, value]) => ({ label, value }));
    }
    return [
      { label: 'Mon', value: 0 }, { label: 'Tue', value: 0 },
      { label: 'Wed', value: 0 }, { label: 'Thu', value: 0 },
      { label: 'Fri', value: 0 }, { label: 'Sat', value: 0 },
      { label: 'Sun', value: 0 },
    ];
  })();

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);

  const stats = [
    { label: 'Total Revenue', value: `${total.toLocaleString()} DA`, icon: 'wallet', color: '#15803d', bg: '#dcfce7' },
    { label: 'Orders Completed', value: count.toString(), icon: 'receipt', color: '#0369a1', bg: '#e0f2fe' },
    { label: 'Avg per Order', value: count > 0 ? `${Math.round(total / count)} DA` : '-- DA', icon: 'trending-up', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Payout Status', value: 'Pending', icon: 'card', color: '#b45309', bg: '#fef3c7' },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Earnings</Text>

        {/* Period selector */}
        <View style={[styles.periodRow, { backgroundColor: colors.surfaceContainerLow }]}>
          {(['day', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}
              style={[styles.periodTab, { backgroundColor: period === p ? colors.primary : 'transparent' }]}>
              <Text style={{ color: period === p ? colors.onPrimary : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>
                {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main earnings card */}
        <View style={[styles.mainCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.mainLabel, { color: colors.onPrimary }]}>
            {period === 'day' ? "Today's" : period === 'week' ? 'Weekly' : 'Monthly'} Earnings
          </Text>
          <Text style={[styles.mainValue, { color: colors.onPrimary }]}>{total.toLocaleString()} DA</Text>
          <Text style={[styles.mainSub, { color: colors.onPrimary }]}>{count} orders completed</Text>
        </View>

        {/* Bar chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}>
          <Text style={[styles.chartTitle, { color: colors.onBackground }]}>Revenue Breakdown</Text>
          <View style={styles.chartBars}>
            {chartData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <View style={[styles.barFill, {
                    backgroundColor: colors.primary,
                    height: `${Math.max(8, (d.value / maxVal) * 100)}%`,
                  }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>{d.label}</Text>
                <Text style={[styles.barValue, { color: colors.outline }]}>{(d.value / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Withdrawal CTA */}
        <TouchableOpacity style={[styles.withdrawBtn, { borderColor: colors.primary }]}
          onPress={() => infoAlert('Request Payout', total > 0 ? `You have ${total.toLocaleString()} DA available for payout. This feature will be available soon.` : 'No earnings available for payout yet.')}>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Request Payout</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  periodRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 },
  periodTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  mainCard: { borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' },
  mainLabel: { fontSize: 13, fontWeight: '600', opacity: 0.85 },
  mainValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 36, fontWeight: '800', marginVertical: 4 },
  mainSub: { fontSize: 13, opacity: 0.8 },
  chartCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  chartTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', height: 140, gap: 6 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '80%', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  barValue: { fontSize: 9, marginTop: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', padding: 14, borderRadius: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, fontWeight: '700' },
  statLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 2 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5 },
});
