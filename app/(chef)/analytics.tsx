import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { analyticsApi } from '@/lib/api';

const SCREEN_W = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [recentDays, setRecentDays] = useState<any[]>([]);
  const [repeatCustomers, setRepeatCustomers] = useState(0);

  useEffect(() => { if (profile?.id) loadAnalytics(); }, [profile?.id]);

  const loadAnalytics = async () => {
    const chefId = profile?.id;
    if (!chefId) return;

    const { data, error } = await analyticsApi.getChefAnalytics(chefId);
    if (data) {
      setTotalOrders(data.totalOrders);
      setTotalRevenue(data.totalRevenue);
      setAvgRating(data.avgRating);
      setTotalReviews(data.totalReviews);
      setRepeatCustomers(data.repeatCustomers);
      setBestSellers(data.bestSellers);
      setRecentDays(data.recentDays);
    }
  };

  const maxRevenue = Math.max(...recentDays.map(d => d.revenue), 1);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>📊 Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'receipt', label: 'Total Orders', value: totalOrders, bg: '#dbeafe', color: '#1d4ed8' },
            { icon: 'cash', label: 'Revenue', value: `${totalRevenue} DA`, bg: '#dcfce7', color: '#166534' },
            { icon: 'star', label: 'Rating', value: avgRating ? `${Number(avgRating).toFixed(1)} ⭐` : '—', bg: '#fef3c7', color: '#92400e' },
            { icon: 'people', label: 'Repeat Customers', value: repeatCustomers, bg: '#ede9fe', color: '#7c3aed' },
          ].map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              <Text style={{ color: stat.color, fontSize: 22, fontWeight: '800', marginTop: 6 }}>{stat.value}</Text>
              <Text style={{ color: stat.color, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <Text style={[styles.section, { color: colors.onBackground }]}>📈 Last 7 Days Revenue</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <View style={styles.chartBars}>
            {recentDays.map((day, i) => {
              const barHeight = maxRevenue > 0 ? (day.revenue / maxRevenue) * 120 : 0;
              const dayLabel = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                    {day.revenue > 0 ? `${day.revenue}` : ''}
                  </Text>
                  <View style={[styles.bar, { height: Math.max(barHeight, 4), backgroundColor: colors.primary, opacity: day.revenue > 0 ? 1 : 0.2 }]} />
                  <Text style={{ color: colors.outline, fontSize: 10, marginTop: 4, fontWeight: '600' }}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Best Sellers */}
        <Text style={[styles.section, { color: colors.onBackground }]}>🏆 Best Sellers</Text>
        {bestSellers.length > 0 ? bestSellers.map((dish, i) => (
          <View key={dish.title} style={[styles.sellerRow, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.rank, { backgroundColor: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#fff7ed' }]}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: i === 0 ? '#b45309' : i === 1 ? '#475569' : '#c2410c' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>{dish.title}</Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{dish.count} orders · {dish.revenue} DA</Text>
            </View>
          </View>
        )) : (
          <Text style={{ color: colors.outline, fontSize: 13, textAlign: 'center', padding: 20 }}>No orders yet</Text>
        )}

        {/* Reviews Summary */}
        <Text style={[styles.section, { color: colors.onBackground }]}>⭐ Reviews</Text>
        <View style={[styles.reviewSummary, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: 42, fontWeight: '800' }}>{avgRating ? Number(avgRating).toFixed(1) : '—'}</Text>
            <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons key={s} name={s <= Math.round(avgRating) ? 'star' : 'star-outline'} size={18} color="#f59e0b" />
              ))}
            </View>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>{totalReviews} reviews</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12, marginTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', padding: 16, borderRadius: 14, alignItems: 'center' },
  chartCard: { padding: 16, borderRadius: 14 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 24, borderRadius: 6 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  rank: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewSummary: { padding: 24, borderRadius: 14, alignItems: 'center' },
});
