import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useOrdersStore } from '@/stores/ordersStore';
import { useRealtimeOrder } from '@/hooks/useRealtime';
import { MapView } from '@/components/MapView';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';

const STEPS = [
  { key: 'received', label: 'Order Received', icon: 'receipt-outline', desc: 'Your order has been confirmed' },
  { key: 'preparing', label: 'Preparing', icon: 'flame-outline', desc: 'Chef is preparing your food' },
  { key: 'ready', label: 'Ready', icon: 'checkmark-circle-outline', desc: 'Your order is ready' },
  { key: 'out_for_delivery', label: 'On the Way', icon: 'bicycle-outline', desc: 'Your food is being delivered' },
  { key: 'delivered', label: 'Delivered', icon: 'home-outline', desc: 'Enjoy your meal!' },
];

export default function TrackOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, shadows } = useTheme();
  const { currentOrder, fetchOrderById } = useOrdersStore();
  const [status, setStatus] = useState('preparing');
  const { t } = useLanguage();

  // Fetch order details
  useEffect(() => {
    if (id) fetchOrderById(id);
  }, [id]);

  // Subscribe to realtime updates
  useRealtimeOrder(id || '', (newStatus) => {
    setStatus(newStatus);
  });

  // Sync status from fetched order
  useEffect(() => {
    if (currentOrder?.order_status) {
      setStatus(currentOrder.order_status);
    }
  }, [currentOrder?.order_status]);

  const currentStepIdx = STEPS.findIndex((s) => s.key === status);

  const getETA = () => {
    switch (status) {
      case 'received': return '25-35 min';
      case 'preparing': return '15-25 min';
      case 'ready': return '5-15 min';
      case 'out_for_delivery': return '5-10 min';
      case 'delivered': return 'Delivered ✓';
      default: return '--';
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>{t('tracking.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* ETA card */}
        <View style={[styles.etaCard, { backgroundColor: colors.primaryFixed }]}>
          <Ionicons name="time-outline" size={22} color={colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.etaLabel, { color: colors.onSurfaceVariant }]}>{t('tracking.eta')}</Text>
            <Text style={[styles.etaValue, { color: colors.primary }]}>{getETA()}</Text>
          </View>
          {status === 'out_for_delivery' && (
            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.liveDot, { backgroundColor: '#22c55e' }]} />
              <Text style={{ color: '#15803d', fontSize: 12, fontWeight: '700' }}>{t('tracking.live')}</Text>
            </View>
          )}
        </View>

        {/* Live map */}
        <MapView
          height={200}
          chefLocation={{ latitude: 36.7548, longitude: 3.0578, name: currentOrder?.chef?.full_name || 'Chef' }}
          customerLocation={{ latitude: 36.7538, longitude: 3.0588 }}
          deliveryLocation={status === 'out_for_delivery' ? { latitude: 36.7543, longitude: 3.0583 } : undefined}
          showRoute={status === 'out_for_delivery'}
        />

        {/* Status stepper */}
        <View style={[styles.stepperCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}>
          {STEPS.map((step, idx) => {
            const isComplete = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <View key={step.key}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, {
                    backgroundColor: isComplete ? colors.primary : colors.surfaceContainerHigh,
                    borderColor: isComplete ? colors.primary : colors.outlineVariant,
                  }]}>
                    {isComplete ? (
                      <Ionicons name={isCurrent ? step.icon as any : 'checkmark'} size={16} color={colors.onPrimary} />
                    ) : (
                      <Ionicons name={step.icon as any} size={16} color={colors.outline} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.stepLabel, { color: isComplete ? colors.onSurface : colors.outline }]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.stepDesc, { color: isComplete ? colors.onSurfaceVariant : colors.outline }]}>
                      {step.desc}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: colors.primaryFixed }]}>
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>{t('tracking.now')}</Text>
                    </View>
                  )}
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { borderLeftColor: isComplete && idx < currentStepIdx ? colors.primary : colors.outlineVariant }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Order info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.infoTitle, { color: colors.onBackground }]}>Order Details</Text>

          <View style={styles.infoRow}>
            <Ionicons name="restaurant-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={[styles.infoValue, { color: colors.onSurface }]}>
              {currentOrder?.post?.title || 'Order item'} × {currentOrder?.quantity || 1}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={[styles.infoValue, { color: colors.onSurface }]}>
              {currentOrder?.chef?.full_name || 'Chef'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' }]}>
              {currentOrder?.total_price || 0} DA
            </Text>
          </View>
        </View>

        {/* Contact chef */}
        <TouchableOpacity
          onPress={() => {
            const phone = currentOrder?.chef?.phone;
            if (phone) Linking.openURL(`tel:${phone}`);
          }}
          style={[styles.contactBtn, { borderColor: colors.primary }]}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15, marginLeft: 8 }}>{t('tracking.contact_chef')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  etaCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 16 },
  etaLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 },
  etaValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, fontWeight: '700' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  mapPlaceholder: { height: 160, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepperCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  stepDesc: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 1 },
  stepLine: { borderLeftWidth: 2, height: 24, marginLeft: 17, marginVertical: 4 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  infoCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  infoTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoValue: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5 },
});
