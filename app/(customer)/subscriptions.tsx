import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, PostImage, DateTimePicker } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionsApi, prepMenuApi } from '@/lib/api';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { chefId, chefName } = useLocalSearchParams<{ chefId?: string; chefName?: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(!!chefId);

  // Chef menu items for selection
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Creation form
  const [formFreq, setFormFreq] = useState<'weekly' | 'biweekly'>('weekly');
  const [formDay, setFormDay] = useState('Monday');
  const [formQty, setFormQty] = useState(1);
  const [deliveryTime, setDeliveryTime] = useState('12:00');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchSubs(); }, []);

  useEffect(() => {
    if (chefId) loadChefMenu(chefId);
  }, [chefId]);

  const fetchSubs = async () => {
    if (!profile?.id) return;
    const { data } = await subscriptionsApi.getByCustomer(profile.id);
    setSubs(data || []);
  };

  const loadChefMenu = async (cid: string) => {
    const { data } = await prepMenuApi.getByChef(cid);
    setMenuItems((data || []).filter((i: any) => i.is_active));
  };

  const discount = formFreq === 'weekly' ? 5 : 3;
  const priceAfterDiscount = selectedItem
    ? Math.round(selectedItem.base_price * formQty * (1 - discount / 100))
    : 0;

  const handleCreate = async () => {
    if (!profile?.id) return;
    if (!selectedItem) { infoAlert('Error', 'Please select a dish'); return; }

    const targetChefId = chefId;
    if (!targetChefId) { infoAlert('Error', 'No chef selected.'); return; }

    setIsCreating(true);
    const today = new Date();
    const dayIndex = DAYS.indexOf(formDay);
    const currentDay = (today.getDay() + 6) % 7;
    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + daysUntil);

    const { error } = await subscriptionsApi.create({
      customer_id: profile.id,
      chef_id: targetChefId,
      item_title: selectedItem.title,
      frequency: formFreq,
      preferred_day: formDay.toLowerCase(),
      quantity: formQty,
      price: selectedItem.base_price * formQty,
      discount_percentage: discount,
      next_order_date: nextDate.toISOString().split('T')[0],
      delivery_time: deliveryTime,
      status: 'pending_approval',
    });
    setIsCreating(false);

    if (error) {
      infoAlert('Error', error);
    } else {
      showToast('Request sent to chef for approval! ✅', 'success');
      setShowForm(false);
      setSelectedItem(null);
      setFormQty(1);
      fetchSubs();
    }
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

  const pendingSubs = subs.filter(s => s.status === 'pending_approval');
  const activeSubs = subs.filter(s => s.is_active && s.status !== 'pending_approval');
  const pausedSubs = subs.filter(s => !s.is_active && s.status !== 'pending_approval');

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>🔁 Subscriptions</Text>
          {chefId ? (
            <TouchableOpacity onPress={() => setShowForm(!showForm)}>
              <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
            </TouchableOpacity>
          ) : <View style={{ width: 28 }} />}
        </View>

        <Text style={{ color: colors.onSurfaceVariant, marginBottom: 20, lineHeight: 20 }}>
          Subscribe to your favorite chefs for weekly or biweekly automatic orders with loyalty discounts!
        </Text>

        {/* Creation Form */}
        {showForm && chefId && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={[styles.formTitle, { color: colors.onBackground }]}>
              Subscribe to {chefName || 'Chef'}
            </Text>

            {/* Step 1: Select a dish */}
            <Text style={[styles.stepLabel, { color: colors.primary }]}>
              <Ionicons name="restaurant" size={14} /> Step 1 — Choose a dish
            </Text>
            {menuItems.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {menuItems.map((item: any) => (
                  <TouchableOpacity key={item.id} onPress={() => setSelectedItem(item)}
                    style={[styles.menuCard, {
                      backgroundColor: selectedItem?.id === item.id ? colors.primaryContainer : colors.surfaceContainerLow,
                      borderColor: selectedItem?.id === item.id ? colors.primary : 'transparent',
                      borderWidth: selectedItem?.id === item.id ? 2 : 0,
                    }]}>
                    {item.photos?.[0] ? (
                      <PostImage photos={item.photos} height={70} borderRadius={10} showCarousel={false} />
                    ) : (
                      <View style={[styles.menuPlaceholder, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <Text style={{ fontSize: 24 }}>🍽️</Text>
                      </View>
                    )}
                    <Text numberOfLines={1} style={{ color: colors.onSurface, fontWeight: '700', fontSize: 13, marginTop: 6 }}>{item.title}</Text>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{item.base_price} DA</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 16, alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: colors.outline, fontSize: 13 }}>This chef has no menu items yet</Text>
              </View>
            )}

            {selectedItem && (
              <>
                {/* Selected dish info */}
                <View style={[styles.selectedInfo, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: 14, marginLeft: 8, flex: 1 }}>
                    {selectedItem.title} — {selectedItem.base_price} DA
                  </Text>
                </View>

                {/* Step 2: Frequency */}
                <Text style={[styles.stepLabel, { color: colors.primary, marginTop: 16 }]}>
                  <Ionicons name="repeat" size={14} /> Step 2 — Frequency
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  {(['weekly', 'biweekly'] as const).map(f => (
                    <TouchableOpacity key={f} onPress={() => setFormFreq(f)}
                      style={[styles.freqChip, { backgroundColor: formFreq === f ? colors.primary : colors.surfaceContainerLow }]}>
                      <Ionicons name={f === 'weekly' ? 'calendar' : 'calendar-outline'} size={16}
                        color={formFreq === f ? '#fff' : colors.onSurface} />
                      <Text style={{ color: formFreq === f ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13, marginLeft: 6 }}>
                        {f === 'weekly' ? 'Weekly (5% off)' : 'Biweekly (3% off)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Step 3: Preferred Day */}
                <Text style={[styles.stepLabel, { color: colors.primary }]}>
                  <Ionicons name="today" size={14} /> Step 3 — Delivery day
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {DAYS.map(day => (
                    <TouchableOpacity key={day} onPress={() => setFormDay(day)}
                      style={[styles.dayChip, { backgroundColor: formDay === day ? colors.primary : colors.surfaceContainerLow }]}>
                      <Text style={{ color: formDay === day ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 12 }}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Step 4: Quantity */}
                <Text style={[styles.stepLabel, { color: colors.primary }]}>
                  <Ionicons name="cube" size={14} /> Step 4 — Quantity
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <TouchableOpacity onPress={() => setFormQty(Math.max(1, formQty - 1))}>
                    <Ionicons name="remove-circle" size={36} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 28 }}>{formQty}</Text>
                  <TouchableOpacity onPress={() => setFormQty(formQty + 1)}>
                    <Ionicons name="add-circle" size={36} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Step 5: Delivery Time */}
                <Text style={[styles.stepLabel, { color: colors.primary }]}>
                  <Ionicons name="time" size={14} /> Step 5 — Delivery time
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {['10:00', '11:00', '12:00', '13:00', '14:00', '16:00', '18:00', '20:00'].map(t => (
                    <TouchableOpacity key={t} onPress={() => setDeliveryTime(t)}
                      style={[styles.dayChip, { backgroundColor: deliveryTime === t ? colors.primary : colors.surfaceContainerLow }]}>
                      <Ionicons name="time-outline" size={13} color={deliveryTime === t ? '#fff' : colors.onSurface} />
                      <Text style={{ color: deliveryTime === t ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 12, marginLeft: 4 }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Price Summary */}
                <View style={[styles.priceSummary, { backgroundColor: '#dcfce7' }]}>
                  <View>
                    <Text style={{ color: '#166534', fontSize: 12, fontWeight: '600' }}>Per delivery</Text>
                    <Text style={{ color: '#166534', fontSize: 22, fontWeight: '800' }}>{priceAfterDiscount} DA</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#16a34a', fontSize: 11, textDecorationLine: 'line-through' }}>
                      {selectedItem.base_price * formQty} DA
                    </Text>
                    <View style={{ backgroundColor: '#bbf7d0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 }}>
                      <Text style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>-{discount}% loyalty</Text>
                    </View>
                  </View>
                </View>

                {/* Payment info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#eff6ff', borderRadius: 10 }}>
                  <Ionicons name="information-circle" size={18} color="#2563eb" />
                  <Text style={{ color: '#1e40af', fontSize: 12, flex: 1, lineHeight: 17 }}>
                    Payment is collected on each delivery. Chef must approve before subscription starts.
                  </Text>
                </View>

                <Button title="Request Subscription ✅" onPress={handleCreate} loading={isCreating} size="lg" style={{ marginTop: 16 }} />
              </>
            )}
          </View>
        )}

        {/* No chef context - show hint */}
        {!chefId && subs.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No subscriptions yet</Text>
            <Text style={{ color: colors.outline, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
              Visit a chef's profile and tap "Subscribe" to set up recurring orders
            </Text>
          </View>
        )}

        {/* Pending Approval */}
        {pendingSubs.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.onBackground }]}>⏳ Waiting for Approval ({pendingSubs.length})</Text>
            {pendingSubs.map((sub) => (
              <View key={sub.id} style={[styles.subCard, { backgroundColor: colors.surfaceContainerLowest, borderLeftColor: '#f59e0b', ...shadows.sm }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{sub.item_title}</Text>
                  <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: '#b45309', fontSize: 11, fontWeight: '700' }}>Pending</Text>
                  </View>
                </View>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                  {sub.frequency} · {sub.quantity}x · {sub.preferred_day} · {sub.delivery_time || '—'}
                </Text>
                <Text style={{ color: colors.outline, fontSize: 12, marginTop: 4 }}>
                  Chef will review and approve your request
                </Text>
                <TouchableOpacity onPress={() => handleCancel(sub.id)}
                  style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#dc2626' }}>
                  <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>Cancel Request</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Existing Subs */}
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
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  formCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  formTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 14 },
  stepLabel: { fontWeight: '700', fontSize: 13, marginBottom: 10 },
  menuCard: { width: 120, padding: 8, borderRadius: 14, marginRight: 10 },
  menuPlaceholder: { height: 70, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  freqChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  dayChip: { width: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  priceSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14 },
  subCard: { padding: 18, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center' },
  discountBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  subBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
