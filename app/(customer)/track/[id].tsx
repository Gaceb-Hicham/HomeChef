import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  { key: 'received', label: 'Order Received', icon: 'checkmark-circle', time: '12:05 PM' },
  { key: 'preparing', label: 'Preparing', icon: 'flame', time: '12:15 PM' },
  { key: 'ready', label: 'Ready', icon: 'bag-check', time: '' },
  { key: 'out_for_delivery', label: 'On the Way', icon: 'bicycle', time: '' },
  { key: 'delivered', label: 'Delivered', icon: 'home', time: '' },
];

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const currentStep = 1; // 0-indexed: "preparing"

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Track Order</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Order info */}
      <View style={[styles.orderCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
        <View style={[styles.orderIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Text style={{ fontSize: 32 }}>🍲</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.orderTitle, { color: colors.onSurface }]}>Couscous Royal</Text>
          <Text style={[styles.orderSub, { color: colors.onSurfaceVariant }]}>Sarah K. · 2 items · 1,700 DA</Text>
        </View>
        <View style={[styles.orderBadge, { backgroundColor: '#fef3c7' }]}>
          <Text style={{ color: '#b45309', fontSize: 11, fontWeight: '600' }}>Preparing</Text>
        </View>
      </View>

      {/* ETA */}
      <View style={[styles.etaCard, { backgroundColor: colors.primaryFixed }]}>
        <Ionicons name="time" size={24} color={colors.primary} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.etaLabel, { color: colors.onSurfaceVariant }]}>Estimated delivery</Text>
          <Text style={[styles.etaTime, { color: colors.primary }]}>12:45 - 13:00 PM</Text>
        </View>
      </View>

      {/* Status stepper */}
      <View style={styles.stepper}>
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentStep;
          const isActive = idx === currentStep;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepDot, {
                  backgroundColor: isDone ? colors.primary : colors.surfaceContainerHigh,
                  borderColor: isDone ? colors.primary : colors.outlineVariant,
                }]}>
                  {isDone && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: isDone ? colors.primary : colors.outlineVariant }]} />
                )}
              </View>
              <View style={[styles.stepContent, isActive && { backgroundColor: colors.primaryFixed, borderRadius: 12, padding: 12, marginLeft: 8 }]}>
                <Text style={[styles.stepLabel, { color: isDone ? colors.onSurface : colors.outline, fontWeight: isActive ? '700' : '400' }]}>
                  {step.label}
                </Text>
                {step.time ? (
                  <Text style={[styles.stepTime, { color: colors.outline }]}>{step.time}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Map placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Ionicons name="map" size={40} color={colors.outline} />
        <Text style={{ color: colors.outline, marginTop: 8, fontSize: 13 }}>Live map tracking</Text>
      </View>

      {/* Contact chef */}
      <TouchableOpacity style={[styles.contactBtn, { borderColor: colors.outlineVariant }]}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15, marginLeft: 8 }}>Contact Chef</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  orderCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 14, gap: 12 },
  orderIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  orderTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600' },
  orderSub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginTop: 2 },
  orderBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  etaCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 24 },
  etaLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 },
  etaTime: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700' },
  stepper: { marginBottom: 24 },
  stepRow: { flexDirection: 'row', minHeight: 52 },
  stepLeft: { width: 30, alignItems: 'center' },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 2, flex: 1, marginVertical: 2 },
  stepContent: { flex: 1, justifyContent: 'center', paddingLeft: 12 },
  stepLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
  stepTime: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  mapPlaceholder: { height: 140, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
});
