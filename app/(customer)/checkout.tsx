import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/stores/cartStore';
import { useOrdersStore } from '@/stores/ordersStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/Toast';

/**
 * Generates 30-minute time slots from now until the deadline.
 * If the deadline has passed or is too close, returns a "ASAP" slot.
 */
function generateTimeSlots(deadlineStr?: string | null): string[] {
  const now = new Date();
  const slots: string[] = [];

  // Earliest order can be ready: round up to next 30-min mark + 30 min prep
  const startMinutes = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 30) * 30;

  // Default deadline: 3 hours from now if none provided
  let deadlineMinutes: number;
  if (deadlineStr) {
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) {
      deadlineMinutes = startMinutes + 180;
    } else {
      deadlineMinutes = deadline.getHours() * 60 + deadline.getMinutes();
    }
  } else {
    deadlineMinutes = startMinutes + 180;
  }

  // Generate 30-min slots
  for (let m = startMinutes; m + 30 <= deadlineMinutes && slots.length < 8; m += 30) {
    const startH = Math.floor(m / 60);
    const startM = m % 60;
    const endH = Math.floor((m + 30) / 60);
    const endM = (m + 30) % 60;
    const fmt = (h: number, min: number) => `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    slots.push(`${fmt(startH, startM)} - ${fmt(endH, endM)}`);
  }

  // Always provide at least one fallback
  if (slots.length === 0) {
    slots.push('ASAP');
  }

  return slots;
}

/**
 * Estimates delivery time based on chef's delivery radius.
 * Uses a simple formula: base 15min + 3min per km of radius.
 */
function estimateDeliveryTime(radiusKm: number): string {
  const baseMins = 15;
  const perKmMins = 3;
  const minTime = baseMins + Math.round(radiusKm * perKmMins * 0.5);
  const maxTime = baseMins + Math.round(radiusKm * perKmMins);
  return `${minTime}-${maxTime} min`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { items, getSubtotal, getTotal, clearCart, getItemsByChef } = useCartStore();
  const { placeOrder, isLoading: orderLoading } = useOrdersStore();
  const profile = useAuthStore((s) => s.profile);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState('');

  // Dynamic data from chef/post
  const [chefDeliveryRadius, setChefDeliveryRadius] = useState(5);
  const [postDeadline, setPostDeadline] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load chef profile + post data for dynamic time calculations
  useEffect(() => {
    const loadChefData = async () => {
      if (items.length === 0) return;

      // Get the first item's post to find the chef and deadline
      const firstItem = items[0];
      try {
        // Fetch the post's deadline
        const { data: postData } = await supabase
          .from('daily_posts')
          .select('order_deadline, chef_id')
          .eq('id', firstItem.postId)
          .single();

        if (postData) {
          setPostDeadline(postData.order_deadline);

          // Fetch the chef's delivery radius
          const { data: chefData } = await supabase
            .from('chef_profiles')
            .select('delivery_radius_km')
            .eq('user_id', postData.chef_id)
            .single();

          if (chefData?.delivery_radius_km) {
            setChefDeliveryRadius(chefData.delivery_radius_km);
          }
        }
      } catch (e) {
        // Fall back to defaults
      }
      setDataLoaded(true);
    };

    loadChefData();
  }, [items]);

  useEffect(() => {
    if (profile) {
      setAddress(profile.area && profile.city ? `${profile.area}, ${profile.city}` : '');
    }
  }, [profile]);

  // Dynamic time slots based on post deadline
  const timeSlots = useMemo(() => generateTimeSlots(postDeadline), [postDeadline]);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Set default slot when slots are generated
  useEffect(() => {
    if (timeSlots.length > 0 && !selectedSlot) {
      setSelectedSlot(timeSlots[0]);
    }
  }, [timeSlots]);

  // Dynamic delivery estimate based on chef's radius
  const deliveryFee = deliveryType === 'delivery' ? 100 : 0;
  const estimatedTime = deliveryType === 'delivery'
    ? estimateDeliveryTime(chefDeliveryRadius)
    : '~15 min';

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'HOMECHEF10') {
      const disc = Math.round(getSubtotal() * 0.1);
      setPromoDiscount(disc);
      setPromoApplied('10% off applied!');
    } else if (code === 'WELCOME50') {
      setPromoDiscount(50);
      setPromoApplied('50 DA off applied!');
    } else if (code === 'FREEDEL') {
      setPromoDiscount(deliveryFee);
      setPromoApplied('Free delivery applied!');
    } else {
      setPromoDiscount(0);
      setPromoApplied('Invalid code');
    }
  };

  const finalTotal = Math.max(0, getTotal() + deliveryFee - promoDiscount);

  const handlePlaceOrder = async () => {
    if (!profile?.id) {
      infoAlert('Error', 'Please log in to place an order');
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
          delivery_address: deliveryType === 'delivery' ? (address || `${profile.area || ''}, ${profile.city || ''}`) : null,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
          order_status: 'received',
          scheduled_time: selectedSlot !== 'ASAP' ? selectedSlot : null,
        };

        const { error } = await placeOrder(order);
        if (error) throw new Error(error);
      }
    });

    try {
      await Promise.all(orderPromises);
      setIsLoading(false);
      clearCart();
      showToast(t('checkout.order_placed'), 'success', 4000);
      router.replace('/(customer)/(tabs)/orders');
    } catch (e: any) {
      setIsLoading(false);
      infoAlert('Order Failed', e.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>{t('checkout.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Delivery type */}
        <Text style={[styles.section, { color: colors.onBackground }]}>{t('checkout.delivery_method')}</Text>
        <View style={styles.typeRow}>
          {(['delivery', 'pickup'] as const).map((dtype) => (
            <TouchableOpacity key={dtype} onPress={() => setDeliveryType(dtype)}
              style={[styles.typeCard, { backgroundColor: deliveryType === dtype ? colors.primaryFixed : colors.surfaceContainerLow, borderColor: deliveryType === dtype ? colors.primary : colors.outlineVariant }]}>
              <Ionicons name={dtype === 'delivery' ? 'bicycle' : 'storefront'} size={24} color={deliveryType === dtype ? colors.primary : colors.outline} />
              <Text style={{ color: deliveryType === dtype ? colors.primary : colors.onSurfaceVariant, fontSize: 14, fontWeight: '600', marginTop: 6 }}>
                {dtype === 'delivery' ? t('checkout.delivery') : t('checkout.pickup')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Address */}
        {deliveryType === 'delivery' && (
          <>
            <Text style={[styles.section, { color: colors.onBackground }]}>{t('checkout.address')}</Text>
            <TouchableOpacity style={[styles.addressCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant, ...shadows.sm }]}
              onPress={() => setShowAddressInput(!showAddressInput)}>
              <Ionicons name="location" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.addressLabel, { color: colors.onSurface }]}>{t('checkout.address')}</Text>
                <Text style={[styles.addressText, { color: colors.onSurfaceVariant }]}>
                  {address || 'Tap to enter your address'}
                </Text>
              </View>
              <Ionicons name="create-outline" size={18} color={colors.outline} />
            </TouchableOpacity>
            {showAddressInput && (
              <Input label="" placeholder="e.g. 123 Rue Didouche Mourad, Algiers"
                value={address} onChangeText={setAddress} icon="location-outline" />
            )}
          </>
        )}

        {/* Dynamic time slot */}
        <Text style={[styles.section, { color: colors.onBackground }]}>{t('checkout.time_slot')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20, alignItems: 'center' }}>
          {timeSlots.map((slot) => (
            <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)}
              style={[styles.slotChip, { backgroundColor: selectedSlot === slot ? colors.primary : colors.surfaceContainerLow, borderColor: selectedSlot === slot ? colors.primary : colors.outlineVariant }]}>
              <Ionicons name={slot === 'ASAP' ? 'flash' : 'time-outline'} size={14} color={selectedSlot === slot ? colors.onPrimary : colors.outline} />
              <Text style={{ color: selectedSlot === slot ? colors.onPrimary : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Payment */}
        <Text style={[styles.section, { color: colors.onBackground }]}>{t('checkout.payment')}</Text>
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
        <Input label={t('checkout.note')} placeholder={t('checkout.note_placeholder')}
          value={note} onChangeText={setNote} multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: 'top' }} />

        {/* Promo Code */}
        <Text style={[styles.section, { color: colors.onBackground }]}>🏷️ Promo Code</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
          <View style={{ flex: 1 }}>
            <Input label="" placeholder="e.g. HOMECHEF10"
              value={promoCode} onChangeText={setPromoCode} icon="pricetag-outline" />
          </View>
          <TouchableOpacity onPress={applyPromo}
            style={[styles.promoBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 13 }}>Apply</Text>
          </TouchableOpacity>
        </View>
        {promoApplied ? (
          <Text style={{ color: promoDiscount > 0 ? '#16a34a' : colors.error, fontSize: 13, fontWeight: '600', marginBottom: 16 }}>
            {promoDiscount > 0 ? '✅' : '❌'} {promoApplied}
          </Text>
        ) : null}

        {/* Dynamic Estimated Time */}
        <View style={[styles.timeCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Ionicons name="timer-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 14 }}>Estimated {deliveryType === 'delivery' ? 'Delivery' : 'Ready'} Time</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16, marginTop: 2 }}>{estimatedTime}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
        </View>

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.summaryTitle, { color: colors.onBackground }]}>{t('checkout.summary')}</Text>
          {items.map((i) => (
            <View key={i.postId} style={styles.sumRow}>
              <Text style={[styles.sumItem, { color: colors.onSurfaceVariant }]}>{i.title} x{i.quantity}</Text>
              <Text style={[styles.sumPrice, { color: colors.onSurface }]}>{i.price * i.quantity} DA</Text>
            </View>
          ))}
          {deliveryFee > 0 && (
            <View style={styles.sumRow}>
              <Text style={[styles.sumItem, { color: colors.onSurfaceVariant }]}>{t('cart.delivery_fee')}</Text>
              <Text style={[styles.sumPrice, { color: colors.onSurface }]}>{deliveryFee} DA</Text>
            </View>
          )}
          {promoDiscount > 0 && (
            <View style={styles.sumRow}>
              <Text style={[styles.sumItem, { color: '#16a34a' }]}>🏷️ Promo Discount</Text>
              <Text style={[styles.sumPrice, { color: '#16a34a' }]}>-{promoDiscount} DA</Text>
            </View>
          )}
          <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 10, marginTop: 6 }]}>
            <Text style={[styles.totalLabel, { color: colors.onBackground }]}>{t('cart.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{finalTotal} DA</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingVertical: 16 }}>
        <Button title={t('checkout.place_order')} onPress={handlePlaceOrder} loading={isLoading || orderLoading} size="lg" />
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
  promoBtn: { height: 50, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  timeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 20 },
});
