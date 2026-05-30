import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input, DateTimePicker } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { specialtiesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function PreOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ specialtyId: string; chefId: string; title: string; priceMin: string; priceMax: string; prepTime: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Minimum date = tomorrow + prep time
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + Math.max(1, Math.ceil(parseInt(params.prepTime || '24') / 24)));

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    const month = new Date().toISOString().slice(0, 7);
    const { data } = await specialtiesApi.getAvailability(params.chefId || '', month);
    const unavailable = (data || []).filter((d: any) => !d.is_available).map((d: any) => d.date);
    setUnavailableDates(unavailable);
  };

  const handleSubmit = async () => {
    if (!profile?.id) { infoAlert('Error', 'Please log in'); return; }
    if (!selectedDate) { infoAlert('Error', 'Please select a date'); return; }
    if (!selectedTime) { infoAlert('Error', 'Please select a time'); return; }

    setIsLoading(true);
    const scheduledTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    const { error } = await supabase.from('orders').insert({
      order_type: 'preorder',
      customer_id: profile.id,
      chef_id: params.chefId,
      post_id: null,
      reference_id: params.specialtyId,
      quantity: parseInt(quantity) || 1,
      unit_price: parseInt(params.priceMin || '0'),
      total_price: parseInt(params.priceMin || '0') * (parseInt(quantity) || 1),
      customer_note: note || null,
      delivery_type: 'delivery',
      delivery_address: `${profile.area || ''}, ${profile.city || ''}`,
      payment_method: 'cash',
      payment_status: 'pending',
      order_status: 'received',
      scheduled_time: scheduledTime,
    });

    setIsLoading(false);
    if (error) {
      infoAlert('Error', error.message);
    } else {
      showToast('Pre-order submitted!', 'success');
      router.replace('/(customer)/order-confirmation');
    }
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en', { weekday: 'short' });
  };

  const getDayNum = (dateStr: string) => new Date(dateStr).getDate();

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Pre-Order</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Specialty Info */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{params.title || 'Specialty'}</Text>
          <View style={styles.priceRange}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>
              {params.priceMin} — {params.priceMax} DA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time" size={14} color={colors.outline} />
              <Text style={{ color: colors.outline, fontSize: 13 }}>~{params.prepTime || 24}h prep time</Text>
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <Text style={[styles.section, { color: colors.onBackground }]}>📅 Select Date & Time</Text>
        <DateTimePicker
          date={selectedDate}
          time={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          showTime
          minDate={minDate}
          label="Delivery date & time"
        />

        {/* Quantity */}
        <Text style={[styles.section, { color: colors.onBackground }]}>🔢 Quantity</Text>
        <View style={[styles.qtyRow, { backgroundColor: colors.surfaceContainerLow }]}>
          <TouchableOpacity onPress={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}>
            <Ionicons name="remove-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: colors.onSurface }]}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(String(parseInt(quantity) + 1))}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <Text style={[styles.section, { color: colors.onBackground }]}>📝 Special Instructions</Text>
        <Input
          label=""
          placeholder="e.g. For a birthday party, no nuts..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Estimated Total</Text>
          <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>
            {parseInt(params.priceMin || '0') * parseInt(quantity || '1')} DA
          </Text>
          <Text style={{ color: colors.outline, fontSize: 12, marginTop: 4 }}>Final price confirmed by chef</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={{ paddingVertical: 16 }}>
        <Button title="Submit Pre-Order" onPress={handleSubmit} loading={isLoading} size="lg" />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  card: { padding: 18, borderRadius: 16, marginBottom: 24 },
  cardTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  priceRange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateChip: { width: 56, height: 74, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10, gap: 2 },
  dayName: { fontSize: 11, fontWeight: '600' },
  dayNum: { fontSize: 20, fontWeight: '700' },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  timeSlot: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, paddingVertical: 14, borderRadius: 14, marginBottom: 24 },
  qtyText: { fontSize: 28, fontWeight: '700', minWidth: 50, textAlign: 'center' },
  summaryCard: { alignItems: 'center', padding: 24, borderRadius: 16, marginBottom: 8 },
  summaryLabel: { fontSize: 14, marginBottom: 6 },
});
