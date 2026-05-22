import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/Toast';
import { infoAlert } from '@/lib/crossAlert';
import { prepRequestsApi } from '@/lib/api';

export default function PrepRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId: string; chefId: string; title: string; photo: string; basePrice: string; negotiable: string; minQty: string; minNotice: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState(params.minQty || '1');
  const [price, setPrice] = useState(params.basePrice || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isNegotiable = params.negotiable === 'true';
  const minNoticeHours = parseInt(params.minNotice || '24');

  const handleSubmit = async () => {
    if (!profile?.id) { infoAlert('Error', 'Please log in'); return; }
    if (!date) { infoAlert('Error', 'Please select a date'); return; }

    // Validate minimum notice
    const requestedDate = new Date(`${date}T${time || '12:00'}`);
    const minDate = new Date(Date.now() + minNoticeHours * 60 * 60 * 1000);
    if (requestedDate < minDate) {
      infoAlert('Too Soon', `This dish requires at least ${minNoticeHours} hours notice.`);
      return;
    }

    setIsLoading(true);
    const { error } = await prepRequestsApi.create({
      customer_id: profile.id,
      chef_id: params.chefId,
      menu_item_id: params.itemId,
      requested_date: requestedDate.toISOString(),
      quantity: parseInt(quantity) || 1,
      offered_price: parseInt(price) || parseInt(params.basePrice || '0'),
      note: note || null,
    });

    setIsLoading(false);
    if (error) {
      infoAlert('Error', error);
    } else {
      showToast('Request sent to chef!', 'success');
      router.back();
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Preparation Request</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Selected Item */}
        <View style={[styles.itemCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <View style={[styles.itemPhoto, { backgroundColor: colors.surfaceContainerLow }]}>
            <Ionicons name="restaurant" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{params.title || 'Dish'}</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16, marginTop: 4 }}>
              {params.basePrice} DA
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <View style={styles.tagChip}>
                <Ionicons name="time-outline" size={12} color={colors.outline} />
                <Text style={{ color: colors.outline, fontSize: 11 }}>{minNoticeHours}h notice</Text>
              </View>
              {isNegotiable && (
                <View style={[styles.tagChip, { backgroundColor: '#dcfce7' }]}>
                  <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '600' }}>Negotiable</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <Text style={[styles.section, { color: colors.onBackground }]}>📅 When do you want it?</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
              icon="calendar-outline"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Time"
              placeholder="HH:MM"
              value={time}
              onChangeText={setTime}
              icon="time-outline"
            />
          </View>
        </View>

        {/* Quantity */}
        <Text style={[styles.section, { color: colors.onBackground }]}>🔢 Quantity</Text>
        <View style={[styles.qtyRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}>
            <Ionicons name="remove-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: colors.onSurface }]}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(String(parseInt(quantity) + 1))}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Price */}
        <Text style={[styles.section, { color: colors.onBackground }]}>💰 Your Offer</Text>
        <Input
          label=""
          placeholder={`Base price: ${params.basePrice} DA`}
          value={price}
          onChangeText={setPrice}
          icon="cash-outline"
          keyboardType="numeric"
          editable={isNegotiable}
        />
        {!isNegotiable && (
          <Text style={{ color: colors.outline, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
            Price is fixed by the chef
          </Text>
        )}

        {/* Special Instructions */}
        <Text style={[styles.section, { color: colors.onBackground }]}>📝 Special Instructions</Text>
        <Input
          label=""
          placeholder="e.g. No sugar, extra spicy, for 5 people..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.summaryTitle, { color: colors.onBackground }]}>Request Summary</Text>
          <View style={styles.sumRow}>
            <Text style={{ color: colors.onSurfaceVariant }}>Dish</Text>
            <Text style={{ color: colors.onSurface, fontWeight: '600' }}>{params.title}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={{ color: colors.onSurfaceVariant }}>Date</Text>
            <Text style={{ color: colors.onSurface, fontWeight: '600' }}>{date || '—'} {time}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={{ color: colors.onSurfaceVariant }}>Quantity</Text>
            <Text style={{ color: colors.onSurface, fontWeight: '600' }}>{quantity}</Text>
          </View>
          <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 10, marginTop: 6 }]}>
            <Text style={{ color: colors.onBackground, fontWeight: '700', fontSize: 16 }}>Total</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>
              {(parseInt(price || params.basePrice || '0') * parseInt(quantity || '1'))} DA
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={{ paddingVertical: 16 }}>
        <Button title="Submit Request" onPress={handleSubmit} loading={isLoading} size="lg" />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 24 },
  itemPhoto: { width: 70, height: 70, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, fontWeight: '700' },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  qtyText: { fontSize: 28, fontWeight: '700', minWidth: 50, textAlign: 'center' },
  summary: { padding: 20, borderRadius: 16, marginBottom: 8 },
  summaryTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
});
