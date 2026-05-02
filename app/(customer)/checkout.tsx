import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/stores/cartStore';
import { useOrdersStore } from '@/stores/ordersStore';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const TIME_SLOTS = ['12:00 - 12:30', '12:30 - 13:00', '13:00 - 13:30', '13:30 - 14:00'];

export default function CheckoutScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { items, getSubtotal, getTotal, clearCart, getItemsByChef } = useCartStore();
  const { placeOrder, isLoading: orderLoading } = useOrdersStore();
  const profile = useAuthStore((s) => s.profile);

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const deliveryFee = deliveryType === 'delivery' ? 100 : 0;

  const handlePlaceOrder = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'Please log in to place an order');
      return;
    }

    setIsLoading(true);

    // Group items by chef and create separate orders
    const itemsByChef = getItemsByChef();
    const orderPromises = Object.entries(itemsByChef).map(async ([chefId, chefItems]) => {
      for (const item of chefItems) {
        const order = {
          customer_id: profile.id,
          chef_id: chefId,
          post_id: item.postId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          customer_note: note || null,
          delivery_type: deliveryType,
          delivery_address: deliveryType === 'delivery' ? '123 Rue Didouche Mourad, Algiers' : null,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
          order_status: 'received',
          scheduled_time: null,
        };

        const { error } = await placeOrder(order);
        if (error) throw new Error(error);
      }
    });

    try {
      await Promise.all(orderPromises);
      setIsLoading(false);
      clearCart();
      Alert.alert('🎉 Order Placed!', 'Your order has been confirmed. Track it in My Orders.', [
        { text: 'View Orders', onPress: () => router.replace('/(customer)/(tabs)/orders') },
      ]);
    } catch (e: any) {
      setIsLoading(false);
      Alert.alert('Order Failed', e.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Delivery type */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Delivery Method</Text>
        <View style={styles.typeRow}>
          {(['delivery', 'pickup'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setDeliveryType(t)}
              style={[styles.typeCard, { backgroundColor: deliveryType === t ? colors.primaryFixed : colors.surfaceContainerLow, borderColor: deliveryType === t ? colors.primary : colors.outlineVariant }]}>
              <Ionicons name={t === 'delivery' ? 'bicycle' : 'storefront'} size={24} color={deliveryType === t ? colors.primary : colors.outline} />
              <Text style={{ color: deliveryType === t ? colors.primary : colors.onSurfaceVariant, fontSize: 14, fontWeight: '600', marginTop: 6 }}>
                {t === 'delivery' ? 'Delivery' : 'Pickup'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Address */}
        {deliveryType === 'delivery' && (
          <>
            <Text style={[styles.section, { color: colors.onBackground }]}>Delivery Address</Text>
            <TouchableOpacity style={[styles.addressCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant, ...shadows.sm }]}>
              <Ionicons name="location" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.addressLabel, { color: colors.onSurface }]}>Home</Text>
                <Text style={[styles.addressText, { color: colors.onSurfaceVariant }]}>
                  {profile?.city ? `${profile.area || ''}, ${profile.city}` : '123 Rue Didouche Mourad, Algiers'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
          </>
        )}

        {/* Time slot */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Time Slot</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)}
              style={[styles.slotChip, { backgroundColor: selectedSlot === slot ? colors.primary : colors.surfaceContainerLow, borderColor: selectedSlot === slot ? colors.primary : colors.outlineVariant }]}>
              <Ionicons name="time-outline" size={14} color={selectedSlot === slot ? colors.onPrimary : colors.outline} />
              <Text style={{ color: selectedSlot === slot ? colors.onPrimary : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Payment */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Payment Method</Text>
        <View style={styles.typeRow}>
          {(['card', 'cash'] as const).map((m) => (
            <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)}
              style={[styles.typeCard, { backgroundColor: paymentMethod === m ? colors.primaryFixed : colors.surfaceContainerLow, borderColor: paymentMethod === m ? colors.primary : colors.outlineVariant }]}>
              <Ionicons name={m === 'card' ? 'card' : 'cash'} size={24} color={paymentMethod === m ? colors.primary : colors.outline} />
              <Text style={{ color: paymentMethod === m ? colors.primary : colors.onSurfaceVariant, fontSize: 14, fontWeight: '600', marginTop: 6 }}>
                {m === 'card' ? 'Card' : 'Cash'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Input label="Note for Chef (optional)" placeholder="Any special requests..."
          value={note} onChangeText={setNote} multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: 'top' }} />

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.summaryTitle, { color: colors.onBackground }]}>Order Summary</Text>
          {items.map((i) => (
            <View key={i.postId} style={styles.sumRow}>
              <Text style={[styles.sumItem, { color: colors.onSurfaceVariant }]}>{i.title} x{i.quantity}</Text>
              <Text style={[styles.sumPrice, { color: colors.onSurface }]}>{i.price * i.quantity} DA</Text>
            </View>
          ))}
          {deliveryFee > 0 && (
            <View style={styles.sumRow}>
              <Text style={[styles.sumItem, { color: colors.onSurfaceVariant }]}>Delivery fee</Text>
              <Text style={[styles.sumPrice, { color: colors.onSurface }]}>{deliveryFee} DA</Text>
            </View>
          )}
          <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 10, marginTop: 6 }]}>
            <Text style={[styles.totalLabel, { color: colors.onBackground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{getTotal() + deliveryFee} DA</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingVertical: 16 }}>
        <Button title="Place Order" onPress={handlePlaceOrder} loading={isLoading || orderLoading} size="lg" />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5 },
  addressCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  addressLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  addressText: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginTop: 2 },
  slotChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  summary: { padding: 20, borderRadius: 16, marginBottom: 8 },
  summaryTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sumItem: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14 },
  sumPrice: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  totalLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, fontWeight: '700' },
  totalValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700' },
});
