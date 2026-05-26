import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input, PostImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { prepRequestsApi } from '@/lib/api';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Rejected', 'Countered'];
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#b45309' },
  accepted: { bg: '#dcfce7', text: '#16a34a' },
  rejected: { bg: '#fce4ec', text: '#c62828' },
  countered: { bg: '#e0e7ff', text: '#4338ca' },
};

export default function PrepRequestsManagementScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDate, setCounterDate] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    if (!profile?.id) return;
    const { data } = await prepRequestsApi.getByChef(profile.id);
    setRequests(data || []);
  };

  const filtered = activeTab === 'All' ? requests : requests.filter(r => r.status === activeTab.toLowerCase());

  const handleAccept = async (id: string) => {
    const { error } = await prepRequestsApi.respond(id, { status: 'accepted', chef_response_note: responseNote || undefined });
    if (error) { infoAlert('Error', error); } else { showToast('Request accepted!', 'success'); setRespondingId(null); setResponseNote(''); fetchRequests(); }
  };

  const handleReject = async (id: string) => {
    const { error } = await prepRequestsApi.respond(id, { status: 'rejected', chef_response_note: responseNote || undefined });
    if (error) { infoAlert('Error', error); } else { showToast('Request rejected', 'info'); setRespondingId(null); setResponseNote(''); fetchRequests(); }
  };

  const handleCounter = async (id: string) => {
    if (!counterPrice && !counterDate) { infoAlert('Error', 'Enter a counter price or date'); return; }
    const { error } = await prepRequestsApi.respond(id, {
      status: 'countered',
      chef_response_note: responseNote || undefined,
      counter_price: counterPrice ? parseInt(counterPrice) : undefined,
      counter_date: counterDate || undefined,
    });
    if (error) { infoAlert('Error', error); } else { showToast('Counter-offer sent!', 'success'); setRespondingId(null); setResponseNote(''); setCounterPrice(''); setCounterDate(''); fetchRequests(); }
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Prep Requests</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{requests.filter(r => r.status === 'pending').length}</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, maxHeight: 44 }}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
            style={[styles.tab, { backgroundColor: activeTab === tab ? colors.primary : colors.surfaceContainerLow }]}>
            <Text style={{ color: activeTab === tab ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13 }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, marginTop: 12 }}>No requests</Text>
          </View>
        ) : (
          filtered.map((req) => {
            const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
            const isResponding = respondingId === req.id;
            return (
              <View key={req.id} style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm, overflow: 'hidden' }]}>
                {/* Dish photo */}
                {req.menu_item?.photos?.[0] && (
                  <PostImage photos={req.menu_item.photos} height={100} borderRadius={0} showCarousel={false}
                    style={{ marginHorizontal: -16, marginTop: -16, marginBottom: 12 }} />
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{req.menu_item?.title || 'Dish'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={{ color: sc.text, fontSize: 11, fontWeight: '700' }}>{req.status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="person" size={14} color={colors.outline} />
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{req.customer?.full_name || 'Customer'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={styles.detailChip}><Ionicons name="calendar-outline" size={12} color={colors.outline} /><Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>{new Date(req.requested_date).toLocaleDateString()}</Text></View>
                  <View style={styles.detailChip}><Ionicons name="cube-outline" size={12} color={colors.outline} /><Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>x{req.quantity}</Text></View>
                  <View style={styles.detailChip}><Ionicons name="cash-outline" size={12} color={colors.outline} /><Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>{req.offered_price} DA</Text></View>
                </View>
                {req.note && <Text style={{ color: colors.outline, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>"{req.note}"</Text>}

                {req.status === 'pending' && (
                  <>
                    {isResponding ? (
                      <View style={[styles.responseForm, { borderTopColor: colors.outlineVariant }]}>
                        <TextInput style={[styles.responseInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
                          placeholder="Note to customer (optional)" placeholderTextColor={colors.outline}
                          value={responseNote} onChangeText={setResponseNote} />
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                          <TextInput style={[styles.counterInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
                            placeholder="Counter price (DA)" placeholderTextColor={colors.outline} keyboardType="numeric"
                            value={counterPrice} onChangeText={setCounterPrice} />
                        </View>
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>Counter date</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {[
                            { label: 'Tomorrow', days: 1 },
                            { label: '+2 days', days: 2 },
                            { label: '+3 days', days: 3 },
                            { label: '+5 days', days: 5 },
                            { label: '+7 days', days: 7 },
                          ].map(opt => {
                            const d = new Date(); d.setDate(d.getDate() + opt.days);
                            const iso = d.toISOString().split('T')[0];
                            return (
                              <TouchableOpacity key={opt.days} onPress={() => setCounterDate(iso)}
                                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, marginRight: 8,
                                  backgroundColor: counterDate === iso ? colors.primary : colors.surfaceContainerLow }}>
                                <Text style={{ color: counterDate === iso ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 12 }}>{opt.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => handleAccept(req.id)}>
                            <Ionicons name="checkmark" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4338ca' }]} onPress={() => handleCounter(req.id)}>
                            <Ionicons name="swap-horizontal" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Counter</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => handleReject(req.id)}>
                            <Ionicons name="close" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.respondBtn, { backgroundColor: colors.primary }]} onPress={() => setRespondingId(req.id)}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Respond</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700', flex: 1, marginLeft: 12 },
  countBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  card: { padding: 16, borderRadius: 16, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  detailChip: { flexDirection: 'row', alignItems: 'center' },
  responseForm: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  responseInput: { padding: 10, borderRadius: 10, fontSize: 13 },
  counterInput: { flex: 1, padding: 10, borderRadius: 10, fontSize: 13 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  respondBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
