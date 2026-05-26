import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionsApi } from '@/lib/api';
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

  // Creation form
  const [formTitle, setFormTitle] = useState('');
  const [formFreq, setFormFreq] = useState<'weekly' | 'biweekly'>('weekly');
  const [formDay, setFormDay] = useState('Monday');
  const [formQty, setFormQty] = useState('1');
  const [formPrice, setFormPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchSubs(); }, []);

  const fetchSubs = async () => {
    if (!profile?.id) return;
    const { data } = await subscriptionsApi.getByCustomer(profile.id);
    setSubs(data || []);
  };

  const handleCreate = async () => {
    if (!profile?.id) return;
    if (!formTitle.trim()) { infoAlert('Error', 'Item title is required'); return; }
    if (!formPrice || parseInt(formPrice) <= 0) { infoAlert('Error', 'Price is required'); return; }

    const targetChefId = chefId;
    if (!targetChefId) { infoAlert('Error', 'No chef selected. Visit a chef profile to subscribe.'); return; }

    setIsCreating(true);
    // Calculate next order date
    const today = new Date();
    const dayIndex = DAYS.indexOf(formDay);
    const currentDay = (today.getDay() + 6) % 7; // Monday=0
    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + daysUntil);

    const { error } = await subscriptionsApi.create({
      customer_id: profile.id,
      chef_id: targetChefId,
      item_title: formTitle.trim(),
      frequency: formFreq,
      preferred_day: formDay.toLowerCase(),
      quantity: parseInt(formQty) || 1,
      price: parseInt(formPrice),
      discount_percentage: formFreq === 'weekly' ? 5 : 3,
      next_order_date: nextDate.toISOString().split('T')[0],
    });
    setIsCreating(false);

    if (error) {
      infoAlert('Error', error);
    } else {
      showToast('Subscribed successfully! 🎉', 'success');
      setShowForm(false);
      setFormTitle('');
      setFormPrice('');
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

  const activeSubs = subs.filter(s => s.is_active);
  const pausedSubs = subs.filter(s => !s.is_active);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>🔁 Subscriptions</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.onSurfaceVariant, marginBottom: 20, lineHeight: 20 }}>
          Subscribe to your favorite chefs for weekly or biweekly automatic orders with loyalty discounts!
        </Text>

        {/* Creation Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={[styles.formTitle, { color: colors.onBackground }]}>
              New Subscription {chefName ? `from ${chefName}` : ''}
            </Text>

            <Input label="Dish/Item Name" value={formTitle} onChangeText={setFormTitle}
              icon="restaurant-outline" placeholder="e.g. Weekly Couscous" />
            <View style={{ height: 10 }} />
            <Input label="Price per Order (DA)" value={formPrice} onChangeText={setFormPrice}
              icon="cash-outline" keyboardType="numeric" placeholder="e.g. 800" />
            <View style={{ height: 10 }} />

            {/* Frequency */}
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginBottom: 8, marginTop: 4 }}>Frequency</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {(['weekly', 'biweekly'] as const).map(f => (
                <TouchableOpacity key={f} onPress={() => setFormFreq(f)}
                  style={[styles.chip, { backgroundColor: formFreq === f ? colors.primary : colors.surfaceContainerLow }]}>
                  <Text style={{ color: formFreq === f ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13 }}>
                    {f === 'weekly' ? 'Weekly (5% off)' : 'Biweekly (3% off)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preferred Day */}
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginBottom: 8 }}>Preferred Day</Text>
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

            {/* Quantity */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600' }}>Quantity</Text>
              <TouchableOpacity onPress={() => setFormQty(String(Math.max(1, parseInt(formQty) - 1)))}>
                <Ionicons name="remove-circle" size={30} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 22 }}>{formQty}</Text>
              <TouchableOpacity onPress={() => setFormQty(String(parseInt(formQty) + 1))}>
                <Ionicons name="add-circle" size={30} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Button title="Subscribe 🔔" onPress={handleCreate} loading={isCreating} size="lg" />
          </View>
        )}

        {/* Existing Subs */}
        {subs.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No subscriptions yet</Text>
            <Text style={{ color: colors.outline, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Visit a chef's profile and tap "Subscribe"
            </Text>
          </View>
        ) : (
          <>
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
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  dayChip: { width: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  subCard: { padding: 18, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center' },
  discountBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  subBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
