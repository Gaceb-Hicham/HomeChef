import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const VALUES = [2400, 1800, 3200, 2800, 4500, 3900, 2100];
const MAX = Math.max(...VALUES);

export default function EarningsScreen() {
  const { colors, shadows } = useTheme();

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Earnings</Text>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'This Week', value: '20,700 DA', icon: 'trending-up', color: '#15803d', bg: '#dcfce7' },
            { label: 'This Month', value: '85,200 DA', icon: 'calendar', color: '#0369a1', bg: '#e0f2fe' },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={[styles.summaryIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.chartTitle, { color: colors.onBackground }]}>Daily Revenue</Text>
          <View style={styles.barChart}>
            {DAYS.map((day, i) => (
              <View key={day} style={styles.barCol}>
                <View style={[styles.bar, {
                  height: (VALUES[i] / MAX) * 120,
                  backgroundColor: i === new Date().getDay() - 1 ? colors.primary : colors.primaryFixedDim,
                  borderRadius: 6,
                }]} />
                <Text style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>{day}</Text>
                <Text style={[styles.barValue, { color: colors.outline }]}>{(VALUES[i] / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>

        {/* All-time */}
        <View style={[styles.allTime, { backgroundColor: colors.primaryFixed, ...shadows.sm }]}>
          <Ionicons name="trophy" size={28} color={colors.primary} />
          <View style={{ marginLeft: 14 }}>
            <Text style={[styles.allTimeValue, { color: colors.primary }]}>342,500 DA</Text>
            <Text style={[styles.allTimeLabel, { color: colors.onSurfaceVariant }]}>All-time earnings · 423 orders</Text>
          </View>
        </View>

        {/* Withdrawal */}
        <Button title="Request Withdrawal" onPress={() => {}} variant="outline" size="lg"
          icon={<Ionicons name="download-outline" size={18} color={colors.primary} />}
          style={{ marginTop: 16 }} />
        
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginTop: 8, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  chartCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  chartTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 24, marginBottom: 6 },
  barLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  barValue: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 9, marginTop: 2 },
  allTime: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16 },
  allTimeValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, fontWeight: '700' },
  allTimeLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
});
